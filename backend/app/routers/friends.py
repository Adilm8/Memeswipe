from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func
from app.database import get_db
from app.models import GuestUser, Friendship, ChatMessage, UserSwipe
from app.schemas import UserSearchResult, FriendResponse
from app.routers.session import get_current_user
from typing import List
import uuid

router = APIRouter(prefix="/friends", tags=["Friends"])

async def get_user_likes(db: AsyncSession, user_id: uuid.UUID):
    res = await db.execute(
        select(UserSwipe.meme_id).where(UserSwipe.user_id == user_id, UserSwipe.action == "like")
    )
    return set(res.scalars().all())

def compute_compat_percent(set_a: set, set_b: set) -> int:
    if not set_a or not set_b:
        return 70
    union = set_a.union(set_b)
    if not union:
        return 70
    inter = set_a.intersection(set_b)
    ratio = len(inter) / len(union)
    # Scale from 55% to 98%
    score = int(55 + ratio * 43)
    return min(98, max(50, score))

@router.get("/search", response_model=List[UserSearchResult])
async def search_users(
    q: str = Query("", min_length=0),
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    trimmed = q.strip()
    if trimmed:
        query_str = f"%{trimmed}%"
        users_res = await db.execute(
            select(GuestUser)
            .where(
                GuestUser.id != current_user.id,
                or_(
                    GuestUser.username.ilike(query_str),
                    GuestUser.nickname.ilike(query_str)
                )
            )
            .limit(25)
        )
    else:
        # If no query provided, return registered users / featured community members
        users_res = await db.execute(
            select(GuestUser)
            .where(
                GuestUser.id != current_user.id,
                GuestUser.is_guest == False
            )
            .order_by(GuestUser.created_at.desc())
            .limit(25)
        )
    users = users_res.scalars().all()
    if not users:
        return []

    # Get current user's friendships
    friend_ids_res = await db.execute(
        select(Friendship.friend_id)
        .where(Friendship.user_id == current_user.id, Friendship.status == "accepted")
    )
    friend_ids = set(friend_ids_res.scalars().all())

    # Get reciprocal friendships as well
    reciprocal_res = await db.execute(
        select(Friendship.user_id)
        .where(Friendship.friend_id == current_user.id, Friendship.status == "accepted")
    )
    friend_ids.update(reciprocal_res.scalars().all())

    my_likes = await get_user_likes(db, current_user.id)

    results = []
    for u in users:
        u_likes = await get_user_likes(db, u.id)
        compat = compute_compat_percent(my_likes, u_likes)
        results.append(UserSearchResult(
            user_id=u.id,
            username=u.username,
            nickname=u.nickname,
            bio=u.bio,
            avatar_url=u.avatar_url,
            is_friend=(u.id in friend_ids),
            compatibility=compat
        ))
    return results

@router.get("", response_model=List[FriendResponse])
async def get_friends(
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    # Find all accepted friends where current_user is either user_id or friend_id
    stmt = select(Friendship).where(
        or_(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == current_user.id
        ),
        Friendship.status == "accepted"
    )
    friendships = (await db.execute(stmt)).scalars().all()
    
    friend_target_ids = set()
    for f in friendships:
        fid = f.friend_id if f.user_id == current_user.id else f.user_id
        friend_target_ids.add(fid)

    if not friend_target_ids:
        return []

    users_res = await db.execute(
        select(GuestUser).where(GuestUser.id.in_(friend_target_ids))
    )
    friends = users_res.scalars().all()

    my_likes = await get_user_likes(db, current_user.id)
    response_items = []

    for f in friends:
        f_likes = await get_user_likes(db, f.id)
        compat = compute_compat_percent(my_likes, f_likes)

        # Get latest message
        last_msg_stmt = select(ChatMessage).where(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == f.id),
                and_(ChatMessage.sender_id == f.id, ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(desc(ChatMessage.created_at)).limit(1)
        last_msg = (await db.execute(last_msg_stmt)).scalars().first()

        # Count unread messages
        unread_stmt = select(func.count()).where(
            ChatMessage.sender_id == f.id,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_read == False
        )
        unread_count = (await db.execute(unread_stmt)).scalar() or 0

        response_items.append(FriendResponse(
            user_id=f.id,
            username=f.username,
            nickname=f.nickname,
            bio=f.bio,
            avatar_url=f.avatar_url,
            compatibility=compat,
            last_message=last_msg.content if last_msg else None,
            last_message_time=last_msg.created_at if last_msg else None,
            unread_count=unread_count
        ))

    # Sort friends by last message time if exists, else by compatibility
    response_items.sort(
        key=lambda x: (x.last_message_time is not None, x.last_message_time, x.compatibility),
        reverse=True
    )
    return response_items

@router.post("/{target_user_id}")
async def add_friend(
    target_user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    if target_user_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot add yourself as a friend")

    target_user = await db.get(GuestUser, target_user_id)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")

    # Check if existing friendship exists
    existing = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == target_user_id),
                and_(Friendship.user_id == target_user_id, Friendship.friend_id == current_user.id)
            )
        )
    )
    friendship = existing.scalars().first()

    if friendship:
        friendship.status = "accepted"
    else:
        new_f = Friendship(
            user_id=current_user.id,
            friend_id=target_user_id,
            status="accepted"
        )
        db.add(new_f)

    await db.commit()
    return {"status": "success", "message": f"You are now friends with {target_user.nickname}"}

@router.delete("/{target_user_id}")
async def remove_friend(
    target_user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    existing = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == target_user_id),
                and_(Friendship.user_id == target_user_id, Friendship.friend_id == current_user.id)
            )
        )
    )
    friendship = existing.scalars().first()
    if friendship:
        await db.delete(friendship)
        await db.commit()
        return {"status": "success", "message": "Friend removed"}

    raise HTTPException(status_code=404, detail="Friendship not found")
