from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete
from sqlalchemy.exc import IntegrityError
from app.database import get_db
from app.models import Meme, UserSwipe, SavedMeme, GuestUser
from app.schemas import MemeResponse, SwipeRequest, SavedMemeResponse
from app.routers.session import get_current_user
from app.services.meme_seeder import fetch_fresh_memes
from typing import List, Dict, Any
import uuid

router = APIRouter(prefix="/memes", tags=["Memes"])

@router.get("/feed", response_model=List[MemeResponse])
async def get_feed(
    count: int = 20,
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    swiped_subquery = select(UserSwipe.meme_id).where(UserSwipe.user_id == user.id)
    
    query = (
        select(Meme)
        .where(Meme.id.not_in(swiped_subquery))
        .order_by(func.random())
        .limit(count)
    )
    
    result = await db.execute(query)
    memes = list(result.scalars().all())
    
    # If the user has fewer unswiped memes than requested (running low),
    # automatically fetch fresh memes from Reddit in the background!
    if len(memes) < count:
        try:
            new_added = await fetch_fresh_memes(db, batch_size=50)
            if new_added > 0:
                # Re-query feed to include newly fetched memes
                fresh_result = await db.execute(query)
                memes = list(fresh_result.scalars().all())
        except Exception as e:
            print(f"Auto-fetch failed during get_feed: {e}")
            
    return memes

@router.post("/refill")
async def refill_memes(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
) -> Dict[str, Any]:
    """Manually fetch fresh memes from multiple subreddits."""
    inserted = await fetch_fresh_memes(db, batch_size=50)
    return {
        "success": True,
        "new_memes_added": inserted,
        "message": f"Successfully ingested {inserted} fresh memes!"
    }

@router.post("/reset-dislikes")
async def reset_dislikes(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
) -> Dict[str, Any]:
    """Reset only dislike actions so user can re-swipe on memes they previously skipped."""
    result = await db.execute(
        delete(UserSwipe).where(
            and_(UserSwipe.user_id == user.id, UserSwipe.action == "dislike")
        )
    )
    await db.commit()
    return {
        "success": True,
        "reset_count": result.rowcount,
        "message": f"Reshuffled {result.rowcount} skipped memes!"
    }

@router.post("/{meme_id}/swipe", response_model=MemeResponse)
async def swipe_meme(
    meme_id: uuid.UUID,
    swipe: SwipeRequest,
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    result = await db.execute(select(Meme).where(Meme.id == meme_id))
    meme = result.scalars().first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
        
    user_swipe = UserSwipe(user_id=user.id, meme_id=meme.id, action=swipe.action)
    db.add(user_swipe)
    
    if swipe.action == "like":
        meme.likes_count += 1
    else:
        meme.dislikes_count += 1
        
    try:
        await db.commit()
        await db.refresh(meme)
        return meme
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Already swiped this meme")

@router.post("/{meme_id}/save", response_model=SavedMemeResponse)
async def save_meme(
    meme_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    result = await db.execute(select(Meme).where(Meme.id == meme_id))
    meme = result.scalars().first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
        
    saved_meme = SavedMeme(user_id=user.id, meme_id=meme.id)
    db.add(saved_meme)
    
    try:
        await db.commit()
        await db.refresh(saved_meme)
        return SavedMemeResponse(id=saved_meme.id, meme=meme, saved_at=saved_meme.created_at)
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=409, detail="Meme already saved")

@router.delete("/{meme_id}/save", status_code=status.HTTP_204_NO_CONTENT)
async def unsave_meme(
    meme_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    result = await db.execute(
        select(SavedMeme)
        .where(and_(SavedMeme.user_id == user.id, SavedMeme.meme_id == meme_id))
    )
    saved_meme = result.scalars().first()
    if not saved_meme:
        raise HTTPException(status_code=404, detail="Saved meme not found")
        
    await db.delete(saved_meme)
    await db.commit()
    return None

@router.get("/saved", response_model=List[SavedMemeResponse])
async def get_saved_memes(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    from sqlalchemy.orm import selectinload
    query = (
        select(SavedMeme)
        .options(selectinload(SavedMeme.meme))
        .where(SavedMeme.user_id == user.id)
        .order_by(SavedMeme.created_at.desc())
    )
    result = await db.execute(query)
    items = result.scalars().all()
    
    return [SavedMemeResponse(id=sm.id, meme=sm.meme, saved_at=sm.created_at) for sm in items]
