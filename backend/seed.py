import asyncio
import os
import sys

# Support passing a remote/custom database URL via CLI argument:
# python seed.py --db-url "postgresql://postgres:...@roundhouse.proxy.rlwy.net:12345/railway"
for i, arg in enumerate(sys.argv):
    if arg == "--db-url" and i + 1 < len(sys.argv):
        os.environ["DATABASE_URL"] = sys.argv[i + 1]
    elif arg.startswith("--db-url="):
        os.environ["DATABASE_URL"] = arg.split("=", 1)[1]

from app.database import async_session, init_db
from app.services.meme_seeder import seed_memes
from app.scripts.seed_users import seed_data

async def main():
    print("==================================================")
    print("🚀 MEMESWIPE UNIFIED DATABASE SEEDER")
    print("==================================================")
    
    print("\n[Step 1/3] Ensuring tables and database schema are ready...")
    await init_db()
    print("✓ Schema initialized.")

    print("\n[Step 2/3] Fetching and seeding fresh memes from Reddit...")
    async with async_session() as session:
        meme_count = await seed_memes(session)
        print(f"✓ Seeded {meme_count} fresh memes.")

    print("\n[Step 3/3] Generating synthetic personas, simulated swipes, and starred memes...")
    user_stats = await seed_data()
    print("✓ Synthetic personas and user interactions successfully generated!")

    print("\n==================================================")
    print("🎉 ALL DATABASE SEEDING COMPLETED SUCCESSFULLY!")
    if user_stats and isinstance(user_stats, dict):
        print(f"  • Users Created:    {user_stats.get('total_users_created')}")
        print(f"  • Swipes Generated: {user_stats.get('total_swipes_created')}")
        print(f"  • Likes:            {user_stats.get('total_likes_created')}")
        print(f"  • Dislikes:         {user_stats.get('total_dislikes_created')}")
        print(f"  • Starred Memes:    {user_stats.get('total_saves_created')}")
        print(f"  • Test Accounts PW: {user_stats.get('default_password')}")
    print("==================================================")

if __name__ == "__main__":
    asyncio.run(main())
