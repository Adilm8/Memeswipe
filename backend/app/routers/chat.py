from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc, func
from sqlalchemy.orm import selectinload
from app.database import get_db, async_session
from app.models import GuestUser, Friendship, ChatMessage, Meme, UserSwipe
from app.schemas import ChatMessageCreate, ChatMessageResponse, ConversationSummary
from app.routers.session import get_current_user
from app.services.ai_service import AIService
from typing import List, Optional
import uuid

router = APIRouter(prefix="/chat", tags=["Chat"])
ai_service = AIService()

async def get_user_likes(db: AsyncSession, user_id: uuid.UUID):
    res = await db.execute(
        select(UserSwipe.meme_id).where(UserSwipe.user_id == user_id, UserSwipe.action == "like")
    )
    return set(res.scalars().all())

def compute_compat_percent(set_a: set, set_b: set) -> int:
    if not set_a or not set_b:
        return 72
    union = set_a.union(set_b)
    if not union:
        return 72
    inter = set_a.intersection(set_b)
    ratio = len(inter) / len(union)
    return min(98, max(50, int(55 + ratio * 43)))

# Helper background task to generate realistic in-character persona response
async def generate_and_save_persona_reply(
    friend_id: uuid.UUID,
    user_id: uuid.UUID,
    user_message: str,
    meme_id: Optional[uuid.UUID]
):
    try:
        async with async_session() as db:
            friend = await db.get(GuestUser, friend_id)
            if not friend:
                return

            meme = None
            if meme_id:
                meme = await db.get(Meme, meme_id)

            reply_text = await ai_service.chat_as_persona(
                persona_name=friend.nickname or friend.username or "Friend",
                persona_bio=friend.bio,
                message=user_message,
                meme=meme
            )

            reply_msg = ChatMessage(
                sender_id=friend_id,
                receiver_id=user_id,
                content=reply_text,
                is_read=False
            )
            db.add(reply_msg)
            await db.commit()
    except Exception as e:
        print(f"Error in persona auto-reply: {e}")

@router.get("/conversations", response_model=List[ConversationSummary])
async def get_conversations(
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    # 1. Get all friends
    friendship_stmt = select(Friendship).where(
        or_(
            Friendship.user_id == current_user.id,
            Friendship.friend_id == current_user.id
        ),
        Friendship.status == "accepted"
    )
    friendships = (await db.execute(friendship_stmt)).scalars().all()
    
    partner_ids = set()
    for f in friendships:
        partner_ids.add(f.friend_id if f.user_id == current_user.id else f.user_id)

    # 2. Also get any users with existing chat messages
    msg_partners_stmt = select(ChatMessage.sender_id, ChatMessage.receiver_id).where(
        or_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == current_user.id)
    )
    msg_partners = (await db.execute(msg_partners_stmt)).all()
    for s_id, r_id in msg_partners:
        partner_ids.add(r_id if s_id == current_user.id else s_id)

    if not partner_ids:
        return []

    partners_res = await db.execute(
        select(GuestUser).where(GuestUser.id.in_(partner_ids))
    )
    partners = partners_res.scalars().all()

    my_likes = await get_user_likes(db, current_user.id)
    conversations = []

    for p in partners:
        p_likes = await get_user_likes(db, p.id)
        compat = compute_compat_percent(my_likes, p_likes)

        # Get latest message
        last_msg_stmt = select(ChatMessage).where(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == p.id),
                and_(ChatMessage.sender_id == p.id, ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(desc(ChatMessage.created_at)).limit(1)
        last_msg = (await db.execute(last_msg_stmt)).scalars().first()

        # Count unread messages
        unread_stmt = select(func.count()).where(
            ChatMessage.sender_id == p.id,
            ChatMessage.receiver_id == current_user.id,
            ChatMessage.is_read == False
        )
        unread_count = (await db.execute(unread_stmt)).scalar() or 0

        conversations.append(ConversationSummary(
            friend_id=p.id,
            username=p.username,
            nickname=p.nickname,
            avatar_url=p.avatar_url,
            bio=p.bio,
            compatibility=compat,
            last_message=last_msg.content if last_msg else None,
            last_message_time=last_msg.created_at if last_msg else None,
            unread_count=unread_count
        ))

    # Sort conversations: active conversations with messages first, then by date/compat
    conversations.sort(
        key=lambda c: (c.last_message_time is not None, c.last_message_time, c.compatibility),
        reverse=True
    )
    return conversations

@router.get("/{friend_id}", response_model=List[ChatMessageResponse])
async def get_messages(
    friend_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    stmt = (
        select(ChatMessage)
        .options(selectinload(ChatMessage.meme))
        .where(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == friend_id),
                and_(ChatMessage.sender_id == friend_id, ChatMessage.receiver_id == current_user.id)
            )
        )
        .order_by(ChatMessage.created_at.asc())
    )
    messages = (await db.execute(stmt)).scalars().all()

    # Mark incoming unread messages as read
    unread_ids = [m.id for m in messages if m.receiver_id == current_user.id and not m.is_read]
    if unread_ids:
        await db.execute(
            ChatMessage.__table__.update()
            .where(ChatMessage.id.in_(unread_ids))
            .values(is_read=True)
        )
        await db.commit()

    return [
        ChatMessageResponse(
            id=m.id,
            sender_id=m.sender_id,
            receiver_id=m.receiver_id,
            content=m.content,
            meme_id=m.meme_id,
            meme_title=m.meme.title if m.meme else None,
            meme_image_url=m.meme.image_url if m.meme else None,
            is_read=m.is_read,
            created_at=m.created_at,
            is_mine=(m.sender_id == current_user.id)
        )
        for m in messages
    ]

@router.post("/{friend_id}")
async def send_message(
    friend_id: uuid.UUID,
    body: ChatMessageCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: GuestUser = Depends(get_current_user)
):
    if friend_id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot chat with yourself")

    friend = await db.get(GuestUser, friend_id)
    if not friend:
        raise HTTPException(status_code=404, detail="User not found")

    # Ensure friendship exists
    existing_f = await db.execute(
        select(Friendship).where(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
            )
        )
    )
    if not existing_f.scalars().first():
        new_f = Friendship(user_id=current_user.id, friend_id=friend_id, status="accepted")
        db.add(new_f)

    # Create message
    msg = ChatMessage(
        sender_id=current_user.id,
        receiver_id=friend_id,
        content=body.content.strip(),
        meme_id=body.meme_id,
        is_read=False
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    # Check if friend is a mock seeded persona (has email ending in example.com or specific seeded username)
    is_persona = friend.email and friend.email.endswith("@example.com")
    if is_persona or friend.username in [
        "history_nerd_elena", "dark_humor_dave", "crypto_chad_vitalik", 
        "wholesome_zoe", "absurdist_alex", "tech_bro_jason", "cringe_kevin", 
        "goth_gf_raven", "sunny_vibes", "emily_sunflower", "wholesome_charlie"
    ]:
        background_tasks.add_task(
            generate_and_save_persona_reply,
            friend_id,
            current_user.id,
            body.content,
            body.meme_id
        )

    return {"status": "success", "message_id": msg.id}
