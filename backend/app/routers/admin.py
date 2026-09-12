import os
from fastapi import APIRouter, HTTPException, Query, status
from app.database import async_session, init_db
from app.services.meme_seeder import seed_memes
from app.scripts.seed_users import seed_data
from typing import Dict, Any

router = APIRouter(prefix="/admin", tags=["Admin"])

ADMIN_SECRET = os.getenv("ADMIN_SECRET", "memeswipe123")

@router.get("/seed")
@router.post("/seed")
async def seed_database(secret: str = Query(default="memeswipe123")) -> Dict[str, Any]:
    """
    Populate the database with memes and simulated personas/swipes.
    Can be triggered via GET (in browser) or POST (API/curl).
    Protected by a secret key (default: 'memeswipe123' or ADMIN_SECRET env).
    """
    if secret != ADMIN_SECRET:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid secret key. Pass ?secret=<ADMIN_SECRET>."
        )

    # 1. Ensure all tables and columns exist
    await init_db()

    # 2. Seed memes from Reddit
    async with async_session() as session:
        memes_count = await seed_memes(session)

    # 3. Seed synthetic personas, profiles, and simulated swipes
    user_stats = await seed_data()

    return {
        "status": "success",
        "message": "Database successfully populated with memes and synthetic user personas!",
        "memes_added": memes_count,
        "users": user_stats
    }
