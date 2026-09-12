from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.database import get_db
from app.models import GuestUser
from app.schemas import SessionResponse
import uuid
import random

router = APIRouter(prefix="/session", tags=["Session"])

ADJECTIVES = [
    "Cryptic", "Dank", "Based", "Cursed", "Wholesome", "Epic", "Savage",
    "Cosmic", "Spicy", "Chill", "Turbo", "Mega", "Ultra", "Vibe", "Pixel",
    "Shadow", "Lucky", "Neon", "Retro", "Quantum", "Hyper", "Blazing",
]
NOUNS = [
    "Panda", "Wizard", "Doggo", "Pepe", "Chad", "Boomer", "Zoomer",
    "Narwhal", "Phoenix", "Llama", "Raccoon", "Otter", "Capybara", "Gecko",
    "Shiba", "Dragon", "Penguin", "Sloth", "Tiger", "Falcon", "Axolotl",
]

async def get_current_user(
    session_token: str = Header(..., alias="X-Session-Token"),
    db: AsyncSession = Depends(get_db)
) -> GuestUser:
    result = await db.execute(select(GuestUser).where(GuestUser.session_token == session_token))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=401, detail="Invalid session token")
    return user

def to_session_response(user: GuestUser) -> SessionResponse:
    return SessionResponse(
        session_token=user.session_token,
        user_id=user.id,
        nickname=user.nickname,
        is_guest=user.is_guest,
        username=user.username,
        email=user.email,
        bio=user.bio,
        avatar_url=user.avatar_url,
        created_at=user.created_at
    )

@router.post("", response_model=SessionResponse)
async def create_session(db: AsyncSession = Depends(get_db)):
    token = str(uuid.uuid4())
    nickname = f"{random.choice(ADJECTIVES)}{random.choice(NOUNS)}{random.randint(100, 999)}"
    
    user = GuestUser(session_token=token, nickname=nickname, is_guest=True)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return to_session_response(user)

@router.get("/me", response_model=SessionResponse)
async def get_current_session(
    user: GuestUser = Depends(get_current_user),
):
    """Validate current session via X-Session-Token header."""
    return to_session_response(user)

@router.get("/{token}", response_model=SessionResponse)
async def get_session(token: str, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(GuestUser).where(GuestUser.session_token == token))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return to_session_response(user)

