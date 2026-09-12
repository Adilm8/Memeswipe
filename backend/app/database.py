from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy import text
from app.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
Base = declarative_base()

async def get_db():
    async with async_session() as session:
        yield session

async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.execute(text("ALTER TABLE guest_users ADD COLUMN IF NOT EXISTS username VARCHAR UNIQUE;"))
        await conn.execute(text("ALTER TABLE guest_users ADD COLUMN IF NOT EXISTS email VARCHAR UNIQUE;"))
        await conn.execute(text("ALTER TABLE guest_users ADD COLUMN IF NOT EXISTS password_hash VARCHAR;"))
        await conn.execute(text("ALTER TABLE guest_users ADD COLUMN IF NOT EXISTS is_guest BOOLEAN NOT NULL DEFAULT TRUE;"))
        await conn.execute(text("ALTER TABLE guest_users ADD COLUMN IF NOT EXISTS bio VARCHAR;"))
        await conn.execute(text("ALTER TABLE guest_users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR;"))
