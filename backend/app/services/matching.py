from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.models import GuestUser, UserSwipe, Meme
from app.schemas import MatchResponse, MemeResponse
from typing import List, Dict, Set
import uuid

async def find_matches(
    db: AsyncSession, 
    user_id: uuid.UUID, 
    min_likes: int = 10, 
    top_n: int = 10, 
    threshold: float = 0.1
) -> List[MatchResponse]:
    # 1. Get user's liked memes
    user_likes_result = await db.execute(
        select(UserSwipe.meme_id).where(UserSwipe.user_id == user_id, UserSwipe.action == "like")
    )
    user_liked_memes = set(user_likes_result.scalars().all())
    
    if len(user_liked_memes) < min_likes:
        return []
        
    # 2. Get other users who liked at least one of those memes
    others_result = await db.execute(
        select(UserSwipe.user_id, UserSwipe.meme_id)
        .where(UserSwipe.meme_id.in_(user_liked_memes), UserSwipe.action == "like", UserSwipe.user_id != user_id)
    )
    
    others_likes: Dict[uuid.UUID, Set[uuid.UUID]] = {}
    for uid, mid in others_result.all():
        if uid not in others_likes:
            others_likes[uid] = set()
        others_likes[uid].add(mid)
        
    # We also need to know total likes of those users to compute Jaccard properly
    # |A U B| = |A| + |B| - |A n B|
    # To avoid querying |B| for all users, we'll query it for users that share at least 1 meme
    candidate_ids = list(others_likes.keys())
    if not candidate_ids:
        return []
        
    cand_total_result = await db.execute(
        select(UserSwipe.user_id, UserSwipe.meme_id)
        .where(UserSwipe.user_id.in_(candidate_ids), UserSwipe.action == "like")
    )
    
    cand_full_likes: Dict[uuid.UUID, Set[uuid.UUID]] = {}
    for uid, mid in cand_total_result.all():
        if uid not in cand_full_likes:
            cand_full_likes[uid] = set()
        cand_full_likes[uid].add(mid)

    matches = []
    for cand_id, cand_likes in cand_full_likes.items():
        intersection = user_liked_memes.intersection(cand_likes)
        union = user_liked_memes.union(cand_likes)
        
        if not union:
            continue
            
        jaccard = len(intersection) / len(union)
        if jaccard > threshold:
            matches.append((cand_id, jaccard, intersection))
            
    matches.sort(key=lambda x: x[1], reverse=True)
    top_matches = matches[:top_n]
    
    if not top_matches:
        return []
        
    # Load user data and shared memes
    match_responses = []
    for cand_id, jaccard, shared in top_matches:
        user_res = await db.execute(select(GuestUser).where(GuestUser.id == cand_id))
        cand_user = user_res.scalars().first()
        if not cand_user:
            continue
            
        shared_list = list(shared)[:5]
        memes_res = await db.execute(select(Meme).where(Meme.id.in_(shared_list)))
        shared_memes = [MemeResponse.model_validate(m) for m in memes_res.scalars().all()]
        
        match_responses.append(MatchResponse(
            user_id=cand_user.id,
            nickname=cand_user.nickname,
            similarity_score=jaccard,
            shared_memes_count=len(shared),
            shared_memes=shared_memes
        ))
        
    return match_responses
