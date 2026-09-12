from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.database import get_db
from app.models import GuestUser, UserSwipe, SavedMeme
from app.schemas import ProfileResponse, MatchResponse
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
        total_swipes=total_swipes,
        total_likes=total_likes,
        total_dislikes=total_dislikes,
        total_saves=total_saves,
        like_ratio=like_ratio,
        created_at=user.created_at
    )

@router.get("/matches", response_model=List[MatchResponse])
async def get_matches(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    matches = await find_matches(db, user.id, min_likes=10, top_n=10, threshold=0.1)
    return matches
