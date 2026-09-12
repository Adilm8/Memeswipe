from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import GuestUser, Meme, UserSwipe
from app.schemas import AIRequest, AIResponse, HumorProfileResponse, MemeResponse
from app.routers.session import get_current_user
from app.services.ai_service import AIService
from typing import List
import uuid

router = APIRouter(prefix="/ai", tags=["AI"])
ai_service = AIService()

@router.get("/humor-profile", response_model=HumorProfileResponse)
async def get_humor_profile(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    result = await db.execute(
        select(Meme).join(UserSwipe).where(UserSwipe.user_id == user.id, UserSwipe.action == "like")
    )
    liked_memes = result.scalars().all()
    
    if not liked_memes:
        return HumorProfileResponse(
            profile="Not enough swipes to determine humor profile.",
            top_categories=["Unknown"],
            humor_style="Undiscovered"
        )
        
    return await ai_service.generate_humor_profile(liked_memes)

@router.post("/explain", response_model=AIResponse)
async def explain_meme(
    request: AIRequest,
    db: AsyncSession = Depends(get_db)
):
    if not request.meme_id:
        raise HTTPException(status_code=400, detail="meme_id is required")
        
    result = await db.execute(select(Meme).where(Meme.id == request.meme_id))
    meme = result.scalars().first()
    if not meme:
        raise HTTPException(status_code=404, detail="Meme not found")
        
    explanation = await ai_service.explain_meme(meme)
    return AIResponse(response=explanation)

@router.get("/recommend", response_model=List[MemeResponse])
async def recommend_memes(
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    # Liked memes
    result = await db.execute(
        select(Meme).join(UserSwipe).where(UserSwipe.user_id == user.id, UserSwipe.action == "like")
    )
    liked_memes = result.scalars().all()
    
    # Candidates
    swiped_subquery = select(UserSwipe.meme_id).where(UserSwipe.user_id == user.id)
    cand_result = await db.execute(
        select(Meme).where(Meme.id.not_in(swiped_subquery)).limit(20)
    )
    candidates = cand_result.scalars().all()
    
    if not liked_memes or not candidates:
        return candidates[:5]
        
    recommended = await ai_service.recommend_memes(liked_memes, candidates)
    return recommended

@router.post("/chat", response_model=AIResponse)
async def chat(
    request: AIRequest,
    db: AsyncSession = Depends(get_db),
    user: GuestUser = Depends(get_current_user)
):
    result = await db.execute(
        select(Meme).join(UserSwipe).where(UserSwipe.user_id == user.id, UserSwipe.action == "like")
    )
    liked_memes = result.scalars().all()
    
    current_meme = None
    if request.meme_id:
        meme_res = await db.execute(select(Meme).where(Meme.id == request.meme_id))
        current_meme = meme_res.scalars().first()
        
    profile = await ai_service.generate_humor_profile(liked_memes)
    context = (
        f"User nickname: {user.nickname} ({'Guest' if user.is_guest else 'Registered Member'}). "
        f"Total likes: {len(liked_memes)}. "
        f"Humor Profile: {profile.profile}. Style: {profile.humor_style}. "
        f"Favorite categories: {', '.join(profile.top_categories)}."
    )
    
    response = await ai_service.chat(request.message, context, current_meme=current_meme)
    return AIResponse(response=response)
