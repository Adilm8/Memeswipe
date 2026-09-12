import asyncio
import random
import uuid
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any

from sqlalchemy import select, func, text, delete
from app.database import async_session
from app.models import GuestUser, UserSwipe, SavedMeme, Meme
from app.services.security import hash_password

PERSONAS: List[Dict[str, Any]] = [
    {
        "archetype": "Wholesome Optimist",
        "description": "Loves uplifting, heartwarming, pet, and encouraging humor. Dislikes dark irony.",
        "users": [
            {"username": "sunny_vibes", "email": "sunny@example.com", "is_guest": False},
            {"username": "emily_sunflower", "email": "emily.s@example.com", "is_guest": False},
            {"username": "wholesome_charlie", "email": "charlie.w@example.com", "is_guest": False},
            {"nickname": "CosmicOtter302", "is_guest": True},
        ],
        "affinities": {
            "wholesomememes": 0.94,
            "me_irl": 0.55,
            "memes": 0.50,
            "AdviceAnimals": 0.45,
            "HistoryMemes": 0.35,
            "comedyheaven": 0.20,
            "dankmemes": 0.10,
        },
        "save_rate": 0.22,
        "min_swipes": 45,
        "max_swipes": 75,
    },
    {
        "archetype": "History Buff & Academic",
        "description": "Loves historical events, ancient civilisations, and nerd puns. Skips low-effort slapstick.",
        "users": [
            {"username": "caesar_enjoyer", "email": "julius@example.com", "is_guest": False},
            {"username": "history_nerd_elena", "email": "elena.hist@example.com", "is_guest": False},
            {"username": "byzantine_stan", "email": "constantine@example.com", "is_guest": False},
            {"nickname": "QuantumFalcon881", "is_guest": True},
        ],
        "affinities": {
            "HistoryMemes": 0.95,
            "comedyheaven": 0.45,
            "memes": 0.40,
            "AdviceAnimals": 0.35,
            "wholesomememes": 0.30,
            "me_irl": 0.30,
            "dankmemes": 0.30,
        },
        "save_rate": 0.20,
        "min_swipes": 40,
        "max_swipes": 70,
    },
    {
        "archetype": "Absurdist & Surrealist",
        "description": "Loves anti-humor, bizarre non-sequiturs, and surreal memes from comedyheaven.",
        "users": [
            {"username": "void_dweller", "email": "void@example.com", "is_guest": False},
            {"username": "surreal_soup", "email": "soup.surreal@example.com", "is_guest": False},
            {"username": "skibidi_philosopher", "email": "skibidi@example.com", "is_guest": False},
            {"nickname": "TurboAxolotl712", "is_guest": True},
        ],
        "affinities": {
            "comedyheaven": 0.95,
            "dankmemes": 0.70,
            "memes": 0.40,
            "me_irl": 0.35,
            "HistoryMemes": 0.30,
            "AdviceAnimals": 0.20,
            "wholesomememes": 0.08,
        },
        "save_rate": 0.18,
        "min_swipes": 45,
        "max_swipes": 70,
    },
    {
        "archetype": "Classic / Nostalgic Memer",
        "description": "Loves classic 2010s top-text/bottom-text formats and vintage AdviceAnimals.",
        "users": [
            {"username": "vintage_doge", "email": "doge.classic@example.com", "is_guest": False},
            {"username": "nostalgia_dave", "email": "dave.memes@example.com", "is_guest": False},
            {"username": "boomer_memer_99", "email": "boomer99@example.com", "is_guest": False},
            {"nickname": "RetroPenguin404", "is_guest": True},
        ],
        "affinities": {
            "AdviceAnimals": 0.95,
            "memes": 0.75,
            "wholesomememes": 0.45,
            "me_irl": 0.40,
            "HistoryMemes": 0.30,
            "dankmemes": 0.25,
            "comedyheaven": 0.15,
        },
        "save_rate": 0.15,
        "min_swipes": 40,
        "max_swipes": 65,
    },
    {
        "archetype": "Relatable Introvert",
        "description": "Loves self-deprecating student, procrastination, coffee, and daily awkward life humor.",
        "users": [
            {"username": "sleepy_coder", "email": "sleepy@example.com", "is_guest": False},
            {"username": "coffee_and_anxiety", "email": "caffeine@example.com", "is_guest": False},
            {"username": "couch_potato_sam", "email": "sam.couch@example.com", "is_guest": False},
            {"nickname": "ChillCapybara520", "is_guest": True},
        ],
        "affinities": {
            "me_irl": 0.95,
            "memes": 0.75,
            "wholesomememes": 0.60,
            "AdviceAnimals": 0.40,
            "dankmemes": 0.35,
            "comedyheaven": 0.30,
            "HistoryMemes": 0.20,
        },
        "save_rate": 0.18,
        "min_swipes": 40,
        "max_swipes": 70,
    },
    {
        "archetype": "Edgy Dank Memer",
        "description": "Loves high-irony satire, dark jokes, and cynical internet subculture. Dislikes sweetness.",
        "users": [
            {"username": "dank_overlord", "email": "overlord@example.com", "is_guest": False},
            {"username": "based_sigma_42", "email": "sigma42@example.com", "is_guest": False},
            {"username": "glitch_reaper", "email": "reaper@example.com", "is_guest": False},
            {"nickname": "SpicyRaccoon993", "is_guest": True},
        ],
        "affinities": {
            "dankmemes": 0.95,
            "comedyheaven": 0.70,
            "me_irl": 0.45,
            "memes": 0.35,
            "HistoryMemes": 0.30,
            "AdviceAnimals": 0.15,
            "wholesomememes": 0.05,
        },
        "save_rate": 0.16,
        "min_swipes": 45,
        "max_swipes": 75,
    },
    {
        "archetype": "Balanced Meme Sommelier",
        "description": "High-volume connoisseur whose preference scales with meme quality and upvotes across all genres.",
        "users": [
            {"username": "meme_sommelier", "email": "sommelier@example.com", "is_guest": False},
            {"username": "curator_alex", "email": "alex.curates@example.com", "is_guest": False},
            {"nickname": "BlazingNarwhal808", "is_guest": True},
            {"nickname": "UltraShiba115", "is_guest": True},
        ],
        "affinities": {
            "wholesomememes": 0.55,
            "HistoryMemes": 0.55,
            "comedyheaven": 0.55,
            "dankmemes": 0.55,
            "AdviceAnimals": 0.50,
            "me_irl": 0.55,
            "memes": 0.55,
        },
        "save_rate": 0.22,
        "min_swipes": 50,
        "max_swipes": 80,
    },
]

DEFAULT_PASSWORD = "password123"

async def seed_data():
    async with async_session() as db:
        print("Fetching memes from database...")
        memes_res = await db.execute(select(Meme))
        all_memes: List[Meme] = memes_res.scalars().all()
        if not all_memes:
            print("ERROR: No memes found in the database. Please populate memes first.")
            return

        print(f"Found {len(all_memes)} memes across sources: {set(m.source for m in all_memes)}")

        # Collect all usernames and nicknames defined in PERSONAS
        seeded_usernames = [
            u["username"] for p in PERSONAS for u in p["users"] if not u["is_guest"]
        ]
        seeded_nicknames = [
            u.get("nickname") or u.get("username") for p in PERSONAS for u in p["users"]
        ]

        # Clean existing test users matching seeded accounts to ensure idempotency
        existing_users_res = await db.execute(
            select(GuestUser).where(
                (GuestUser.username.in_(seeded_usernames)) |
                (GuestUser.nickname.in_(seeded_nicknames))
            )
        )
        existing_users = existing_users_res.scalars().all()
        if existing_users:
            print(f"Cleaning {len(existing_users)} existing seed users for fresh generation...")
            for eu in existing_users:
                await db.delete(eu)
            await db.commit()

        now = datetime.now(timezone.utc)
        pwd_hash = hash_password(DEFAULT_PASSWORD)

        total_users_created = 0
        total_swipes_created = 0
        total_saves_created = 0
        total_likes_created = 0
        total_dislikes_created = 0

        print("\n=== Seeding Personas and Simulated Behavior ===")

        for persona in PERSONAS:
            archetype = persona["archetype"]
            affinities = persona["affinities"]
            save_rate = persona["save_rate"]
            print(f"\nArchetype: [{archetype}] - {persona['description']}")

            for user_spec in persona["users"]:
                is_guest = user_spec["is_guest"]
                username = user_spec.get("username")
                nickname = user_spec.get("nickname") or username
                email = user_spec.get("email")

                # Stagger user registration / session creation over the last 14 days
                days_ago = random.uniform(3.0, 14.0)
                user_created_at = now - timedelta(days=days_ago)

                user = GuestUser(
                    id=uuid.uuid4(),
                    session_token=str(uuid.uuid4()),
                    nickname=nickname,
                    username=username if not is_guest else None,
                    email=email if not is_guest else None,
                    password_hash=pwd_hash if not is_guest else None,
                    is_guest=is_guest,
                    created_at=user_created_at,
                )
                db.add(user)
                await db.flush()
                total_users_created += 1

                # Determine how many memes this user will swipe
                swipe_count = min(len(all_memes), random.randint(persona["min_swipes"], persona["max_swipes"]))
                user_memes = random.sample(all_memes, swipe_count)

                # Stagger swipes from user creation date up to now
                time_span_seconds = (now - user_created_at).total_seconds()

                user_likes = 0
                user_dislikes = 0
                user_saves = 0

                for idx, meme in enumerate(user_memes):
                    # Progressively distribute timestamps
                    time_offset = (idx / swipe_count) * time_span_seconds + random.uniform(-60, 60)
                    time_offset = max(0, min(time_span_seconds, time_offset))
                    swipe_created_at = user_created_at + timedelta(seconds=time_offset)

                    # Base probability from persona affinity
                    base_prob = affinities.get(meme.source, 0.40)

                    # Modifiers:
                    # 1. Meme upvote quality bonus (up to +0.08 for memes with high upvotes)
                    upvote_bonus = min(0.08, (meme.upvotes or 0) / 100000.0)
                    # 2. Individual human randomness (+- 0.08)
                    noise = random.uniform(-0.08, 0.08)

                    like_prob = max(0.05, min(0.95, base_prob + upvote_bonus + noise))
                    action = "like" if random.random() < like_prob else "dislike"

                    swipe = UserSwipe(
                        id=uuid.uuid4(),
                        user_id=user.id,
                        meme_id=meme.id,
                        action=action,
                        created_at=swipe_created_at,
                    )
                    db.add(swipe)
                    total_swipes_created += 1

                    if action == "like":
                        user_likes += 1
                        total_likes_created += 1

                        # Determine if user saves this meme
                        # Higher chance if meme matches their top category
                        source_affinity = affinities.get(meme.source, 0.40)
                        effective_save_rate = save_rate * (1.2 if source_affinity > 0.7 else 0.7)

                        if random.random() < effective_save_rate:
                            saved = SavedMeme(
                                id=uuid.uuid4(),
                                user_id=user.id,
                                meme_id=meme.id,
                                created_at=swipe_created_at + timedelta(seconds=random.randint(1, 10)),
                            )
                            db.add(saved)
                            user_saves += 1
                            total_saves_created += 1
                    else:
                        user_dislikes += 1
                        total_dislikes_created += 1

                user_type_label = "Registered" if not is_guest else "Guest"
                print(f"  ✓ {user_type_label:10} | {nickname:20} | Swipes: {swipe_count:2} ({user_likes:2} likes, {user_dislikes:2} dislikes, {user_saves:2} starred)")

        await db.commit()

        # Synchronize Meme likes_count and dislikes_count
        print("\nSynchronizing Meme likes_count and dislikes_count...")
        await db.execute(text("""
            UPDATE memes m
            SET likes_count = COALESCE((
                SELECT COUNT(*) FROM user_swipes us WHERE us.meme_id = m.id AND us.action = 'like'
            ), 0),
            dislikes_count = COALESCE((
                SELECT COUNT(*) FROM user_swipes us WHERE us.meme_id = m.id AND us.action = 'dislike'
            ), 0);
        """))
        await db.commit()

        print("\n=======================================================")
        print("SEEDING COMPLETE!")
        print(f"Total Synthetic Users Created: {total_users_created}")
        print(f"Total Swipes Generated:        {total_swipes_created}")
        print(f"  - Likes:                     {total_likes_created} ({(total_likes_created/total_swipes_created)*100:.1f}%)")
        print(f"  - Dislikes:                  {total_dislikes_created} ({(total_dislikes_created/total_swipes_created)*100:.1f}%)")
        print(f"Total Memes Starred:           {total_saves_created}")
        print(f"All Registered Users password: '{DEFAULT_PASSWORD}'")
        print("=======================================================\n")

if __name__ == "__main__":
    asyncio.run(seed_data())
