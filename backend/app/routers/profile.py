from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import GuestUser, UserSwipe, SavedMeme
from app.schemas import ProfileResponse, MatchResponse, ProfileUpdateRequest
from app.routers.session import get_current_user
from app.services.matching import find_matches
from typing import List

router = APIRouter(prefix="/profile", tags=["Profile"])

@router.get("", response_model=ProfileResponse)
async def get_profile(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    # Total likes
    result = await db.execute(
        select(func.count()).where(UserSwipe.user_id == user.id, UserSwipe.action == 'like')
    )
    total_likes = result.scalar() or 0
    
    # Total dislikes
    result = await db.execute(
        select(func.count()).where(UserSwipe.user_id == user.id, UserSwipe.action == 'dislike')
    )
    total_dislikes = result.scalar() or 0
    
    # Total saves
    result = await db.execute(
        select(func.count()).where(SavedMeme.user_id == user.id)
    )
    total_saves = result.scalar() or 0
    
    total_swipes = total_likes + total_dislikes
    like_ratio = (total_likes / total_swipes) if total_swipes > 0 else 0.0
    
    return ProfileResponse(
        user_id=user.id,
        nickname=user.nickname,
        is_guest=user.is_guest,
        username=user.username,
        email=user.email,
        bio=user.bio,
        avatar_url=user.avatar_url,
        total_swipes=total_swipes,
        total_likes=total_likes,
        total_dislikes=total_dislikes,
        total_saves=total_saves,
        like_ratio=like_ratio,
        created_at=user.created_at
    )

@router.patch("", response_model=ProfileResponse)
@router.put("", response_model=ProfileResponse)
async def update_profile(
    req: ProfileUpdateRequest,
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    if req.nickname is not None:
        trimmed_name = req.nickname.strip()
        if len(trimmed_name) < 2 or len(trimmed_name) > 30:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Nickname must be between 2 and 30 characters."
            )
        user.nickname = trimmed_name

    if req.bio is not None:
        trimmed_bio = req.bio.strip()
        if len(trimmed_bio) > 300:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Bio cannot exceed 300 characters."
            )
        user.bio = trimmed_bio if trimmed_bio else None

    if req.avatar_url is not None:
        trimmed_avatar = req.avatar_url.strip()
        user.avatar_url = trimmed_avatar if trimmed_avatar else None

    await db.commit()
    await db.refresh(user)

    # Return full updated profile response
    return await get_profile(db=db, user=user)

@router.get("/matches", response_model=List[MatchResponse])
async def get_matches(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    matches = await find_matches(db, user.id, min_likes=10, top_n=10, threshold=0.1)
    return matches
