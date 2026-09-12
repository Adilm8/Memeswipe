import asyncio
from app.database import async_session, init_db
from app.services.meme_seeder import seed_memes

async def main():
    await init_db()
    async with async_session() as session:
        count = await seed_memes(session)
        print(f"Seeded {count} memes")

if __name__ == "__main__":
    asyncio.run(main())
