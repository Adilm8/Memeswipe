import httpx
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.dialects.postgresql import insert
from app.models import Meme
import asyncio

async def seed_memes(db: AsyncSession, count: int = 500) -> int:
    subreddits = ["memes", "dankmemes", "wholesomememes", "me_irl"]
    inserted_count = 0
    batch_size = 50
    
    async with httpx.AsyncClient() as client:
        for subreddit in subreddits:
            for _ in range(count // (len(subreddits) * batch_size)):
                try:
                    response = await client.get(f"https://meme-api.com/gimme/{subreddit}/{batch_size}")
                    if response.status_code == 200:
                        data = response.json()
                        memes = data.get("memes", [])
                        
                        valid_memes = []
                        for m in memes:
                            if m.get("nsfw", False):
                                continue
                            if m.get("ups", 0) < 500:
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
                            stmt = insert(Meme).values(valid_memes).on_conflict_do_nothing(index_elements=['external_id'])
                            result = await db.execute(stmt)
                            inserted_count += result.rowcount
                            await db.commit()
                except Exception as e:
                    print(f"Error seeding {subreddit}: {e}")
                
                await asyncio.sleep(1) # Be nice to API
                
    return inserted_count
