import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from app.models import Meme
import asyncio
import random

SUBREDDITS = [
    "memes",
    "dankmemes",
    "wholesomememes",
    "me_irl",
    "ProgrammerHumor",
    "cleanmemes",
    "historymemes",
    "comedyheaven",
    "terriblefacebookmemes",
    "AdviceAnimals",
]

async def fetch_fresh_memes(db: AsyncSession, subreddits: list[str] = None, batch_size: int = 50) -> int:
    """Fetch fresh memes from meme-api.com and save non-duplicate ones to the DB."""
    if not subreddits:
        # Pick 3-4 random subreddits each time for variety
        subreddits = random.sample(SUBREDDITS, k=min(4, len(SUBREDDITS)))

    inserted_count = 0
    valid_memes = []

    async with httpx.AsyncClient(timeout=10.0) as client:
        for subreddit in subreddits:
            try:
                response = await client.get(f"https://meme-api.com/gimme/{subreddit}/{batch_size}")
                if response.status_code == 200:
                    data = response.json()
                    memes = data.get("memes", [])

                    for m in memes:
                        if m.get("nsfw", False):
                            continue
                        # Relax upvote filter so more variety passes
                        if m.get("ups", 0) < 100:
                            continue

                        url = m.get("url", "")
                        if not any(url.endswith(ext) for ext in [".jpg", ".png", ".webp", ".jpeg"]):
                            continue

                        external_id = m.get("postLink", "").split("/")[-1] or url

                        valid_memes.append({
                            "external_id": external_id,
                            "title": m.get("title", ""),
                            "image_url": url,
                            "source": m.get("subreddit", ""),
                            "source_url": m.get("postLink", ""),
                            "author": m.get("author", ""),
                            "upvotes": m.get("ups", 0),
                            "is_nsfw": m.get("nsfw", False)
                        })
            except Exception as e:
                print(f"Error fetching from r/{subreddit}: {e}")

    if valid_memes:
        # Deduplicate within this batch by external_id
        unique_memes = {m["external_id"]: m for m in valid_memes}
        stmt = insert(Meme).values(list(unique_memes.values())).on_conflict_do_nothing(index_elements=['external_id'])
        result = await db.execute(stmt)
        inserted_count = result.rowcount
        await db.commit()

    return inserted_count

async def seed_memes(db: AsyncSession, count: int = 500) -> int:
    """Seed initial batch of memes across all primary subreddits."""
    total_inserted = 0
    subreddits = ["memes", "dankmemes", "wholesomememes", "me_irl", "ProgrammerHumor", "cleanmemes"]

    async with httpx.AsyncClient(timeout=15.0) as client:
        for subreddit in subreddits:
            # 2 batches of 50 per subreddit
            for _ in range(2):
                try:
                    response = await client.get(f"https://meme-api.com/gimme/{subreddit}/50")
                    if response.status_code == 200:
                        data = response.json()
                        memes = data.get("memes", [])

                        valid_memes = []
                        for m in memes:
                            if m.get("nsfw", False):
                                continue
                            if m.get("ups", 0) < 100:
                                continue

                            url = m.get("url", "")
                            if not any(url.endswith(ext) for ext in [".jpg", ".png", ".webp", ".jpeg"]):
                                continue

                            external_id = m.get("postLink", "").split("/")[-1] or url

                            valid_memes.append({
                                "external_id": external_id,
                                "title": m.get("title", ""),
                                "image_url": url,
                                "source": m.get("subreddit", ""),
                                "source_url": m.get("postLink", ""),
                                "author": m.get("author", ""),
                                "upvotes": m.get("ups", 0),
                                "is_nsfw": m.get("nsfw", False)
                            })

                        if valid_memes:
                            unique_memes = {m["external_id"]: m for m in valid_memes}
                            stmt = insert(Meme).values(list(unique_memes.values())).on_conflict_do_nothing(index_elements=['external_id'])
                            result = await db.execute(stmt)
                            total_inserted += result.rowcount
                            await db.commit()
                except Exception as e:
                    print(f"Error seeding r/{subreddit}: {e}")

                await asyncio.sleep(0.5)

    return total_inserted
