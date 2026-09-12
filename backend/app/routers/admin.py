import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Query, status
from sqlalchemy import text

from app.database import async_session, init_db
from app.services.meme_seeder import seed_memes
from app.scripts.seed_users import seed_data
from app.models import GuestUser, Meme, UserSwipe, SavedMeme, Friendship, ChatMessage

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "memeswipe123")


async def execute_data_import(data: Dict[str, Any], replace_all: bool = True) -> Dict[str, Any]:
    """Import users, memes, swipes, saves, friendships, and chats into the database."""
    await init_db()

    async with async_session() as session:
        if replace_all:
            # Delete child tables before parent tables to maintain referential integrity
            await session.execute(text("DELETE FROM chat_messages;"))
            await session.execute(text("DELETE FROM friendships;"))
            await session.execute(text("DELETE FROM saved_memes;"))
            await session.execute(text("DELETE FROM user_swipes;"))
            await session.execute(text("DELETE FROM guest_users;"))
            await session.execute(text("DELETE FROM memes;"))
            await session.commit()

        # 1. Guest & Registered Users
        users_list = [
            GuestUser(
                id=uuid.UUID(u["id"]),
                session_token=u["session_token"],
                nickname=u["nickname"],
                username=u.get("username"),
                email=u.get("email"),
                password_hash=u.get("password_hash"),
                is_guest=u.get("is_guest", True),
                bio=u.get("bio"),
                avatar_url=u.get("avatar_url"),
                created_at=datetime.fromisoformat(u["created_at"]) if u.get("created_at") else None,
            )
            for u in data.get("guest_users", [])
        ]
        if users_list:
            session.add_all(users_list)
            await session.commit()

        # 2. Memes
        memes_list = [
            Meme(
                id=uuid.UUID(m["id"]),
                external_id=m["external_id"],
                title=m["title"],
                image_url=m["image_url"],
                source=m["source"],
                source_url=m.get("source_url"),
                author=m.get("author"),
                upvotes=m.get("upvotes", 0),
                likes_count=m.get("likes_count", 0),
                dislikes_count=m.get("dislikes_count", 0),
                is_nsfw=m.get("is_nsfw", False),
                created_at=datetime.fromisoformat(m["created_at"]) if m.get("created_at") else None,
            )
            for m in data.get("memes", [])
        ]
        if memes_list:
            session.add_all(memes_list)
            await session.commit()

        # 3. User Swipes
        swipes_list = [
            UserSwipe(
                id=uuid.UUID(s["id"]),
                user_id=uuid.UUID(s["user_id"]),
                meme_id=uuid.UUID(s["meme_id"]),
                action=s["action"],
                created_at=datetime.fromisoformat(s["created_at"]) if s.get("created_at") else None,
            )
            for s in data.get("user_swipes", [])
        ]
        if swipes_list:
            session.add_all(swipes_list)
            await session.commit()

        # 4. Saved Memes
        saves_list = [
            SavedMeme(
                id=uuid.UUID(sm["id"]),
                user_id=uuid.UUID(sm["user_id"]),
                meme_id=uuid.UUID(sm["meme_id"]),
                created_at=datetime.fromisoformat(sm["created_at"]) if sm.get("created_at") else None,
            )
            for sm in data.get("saved_memes", [])
        ]
        if saves_list:
            session.add_all(saves_list)
            await session.commit()

        # 5. Friendships
        friends_list = [
            Friendship(
                id=uuid.UUID(f["id"]),
                user_id=uuid.UUID(f["user_id"]),
                friend_id=uuid.UUID(f["friend_id"]),
                status=f.get("status", "accepted"),
                created_at=datetime.fromisoformat(f["created_at"]) if f.get("created_at") else None,
            )
            for f in data.get("friendships", [])
        ]
        if friends_list:
            session.add_all(friends_list)
            await session.commit()

        # 6. Chat Messages
        chats_list = [
            ChatMessage(
                id=uuid.UUID(c["id"]),
                sender_id=uuid.UUID(c["sender_id"]),
                receiver_id=uuid.UUID(c["receiver_id"]),
                content=c["content"],
                meme_id=uuid.UUID(c["meme_id"]) if c.get("meme_id") else None,
                is_read=c.get("is_read", False),
                created_at=datetime.fromisoformat(c["created_at"]) if c.get("created_at") else None,
            )
            for c in data.get("chat_messages", [])
        ]
        if chats_list:
            session.add_all(chats_list)
            await session.commit()

        # Recalculate upvotes and like/dislike counts on memes
        await session.execute(text("""
            UPDATE memes m
            SET likes_count = COALESCE((
                SELECT COUNT(*) FROM user_swipes us WHERE us.meme_id = m.id AND us.action = 'like'
            ), 0),
            dislikes_count = COALESCE((
                SELECT COUNT(*) FROM user_swipes us WHERE us.meme_id = m.id AND us.action = 'dislike'
            ), 0);
        """))
        await session.commit()

    return {
        "status": "success",
        "message": "Data successfully restored to the database!",
        "records_imported": {
            "guest_users": len(users_list),
            "memes": len(memes_list),
            "user_swipes": len(swipes_list),
            "saved_memes": len(saves_list),
            "friendships": len(friends_list),
            "chat_messages": len(chats_list),
        }
    }


@router.get("/restore-local")
@router.post("/restore-local")
async def restore_local_database(
    secret: str = Query(default="memeswipe123"),
    replace_all: bool = Query(default=True)
) -> Dict[str, Any]:
    """
    Restore the database using the bundled local_dump.json containing all original local users,
    chats, friendships, memes, and interactions.
    """
    if secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key. Pass ?secret=<ADMIN_SECRET>."
        )

    dump_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "local_dump.json")
    if not os.path.exists(dump_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"local_dump.json not found at {dump_path}"
        )

    with open(dump_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    return await execute_data_import(data, replace_all=replace_all)


@router.post("/import-data")
async def import_data(
    payload: Dict[str, Any],
    secret: str = Query(default="memeswipe123"),
    replace_all: bool = Query(default=True)
) -> Dict[str, Any]:
    """Import arbitrary JSON dataset into database."""
    if secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid admin secret key."
        )
    return await execute_data_import(payload, replace_all=replace_all)


@router.get("/seed")
@router.post("/seed")
async def seed_database(secret: str = Query(default="memeswipe123")) -> Dict[str, Any]:
    """Populate database using synthetic persona generator and fresh Reddit memes."""
    if secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key. Pass ?secret=<ADMIN_SECRET>."
        )

    await init_db()
    async with async_session() as session:
        memes_count = await seed_memes(session)

    user_stats = await seed_data()

    return {
        "status": "success",
        "message": "Database successfully populated with memes and synthetic user personas!",
        "memes_added": memes_count,
        "users": user_stats
    }
