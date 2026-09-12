from fastapi import APIRouter, Depends, HTTPException, Header, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import uuid
import re
import random

from app.database import get_db
from app.models import GuestUser
from app.schemas import UserRegisterRequest, UserLoginRequest, SessionResponse
from app.services.security import hash_password, verify_password
from app.routers.session import ADJECTIVES, NOUNS, to_session_response

router = APIRouter(prefix="/auth", tags=["Auth"])

USERNAME_REGEX = re.compile(r"^[a-zA-Z0-9_\-]+$")

@router.post("/register", response_model=SessionResponse)
async def register(
    req: UserRegisterRequest,
    session_token: Optional[str] = Header(None, alias="X-Session-Token"),
    db: AsyncSession = Depends(get_db)
):
    username = req.username.strip()
    password = req.password
    email = req.email.strip() if req.email and req.email.strip() else None

    if len(username) < 3 or len(username) > 30:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be between 3 and 30 characters."
        )

    if not USERNAME_REGEX.match(username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, underscores, and hyphens."
        )

    if len(password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long."
        )

    # Check if username is already taken
    existing_user_query = await db.execute(
        select(GuestUser).where(func.lower(GuestUser.username) == username.lower())
    )
    if existing_user_query.scalars().first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username is already taken."
        )

    # Check if email is already taken
    if email:
        existing_email_query = await db.execute(
            select(GuestUser).where(func.lower(GuestUser.email) == email.lower())
        )
        if existing_email_query.scalars().first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already in use."
            )

    # Check if current session belongs to a guest user to upgrade
    target_user: Optional[GuestUser] = None
    if session_token:
        result = await db.execute(select(GuestUser).where(GuestUser.session_token == session_token))
        guest_candidate = result.scalars().first()
        if guest_candidate and guest_candidate.is_guest:
            target_user = guest_candidate

    if target_user:
        # Upgrade existing guest user in-place to preserve swipes & saved memes
        target_user.username = username
        target_user.nickname = username
        target_user.email = email
        target_user.password_hash = hash_password(password)
        target_user.is_guest = False
        await db.commit()
        await db.refresh(target_user)
        return to_session_response(target_user)

    # Create new registered user
    new_user = GuestUser(
        session_token=str(uuid.uuid4()),
        nickname=username,
        username=username,
        email=email,
        password_hash=hash_password(password),
        is_guest=False
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)
    return to_session_response(new_user)

@router.post("/login", response_model=SessionResponse)
async def login(
    req: UserLoginRequest,
    db: AsyncSession = Depends(get_db)
):
    username = req.username.strip()
    password = req.password

    if not username or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username and password are required."
        )

    result = await db.execute(
        select(GuestUser).where(func.lower(GuestUser.username) == username.lower())
    )
    user = result.scalars().first()

    if not user or user.is_guest or not user.password_hash or not verify_password(password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username or password."
        )

    # Issue a fresh session token for security on login
    user.session_token = str(uuid.uuid4())
    await db.commit()
    await db.refresh(user)

    return to_session_response(user)

@router.post("/guest", response_model=SessionResponse)
async def create_guest(
    db: AsyncSession = Depends(get_db)
):
    token = str(uuid.uuid4())
    nickname = f"{random.choice(ADJECTIVES)}{random.choice(NOUNS)}{random.randint(100, 999)}"
    
    user = GuestUser(session_token=token, nickname=nickname, is_guest=True)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    
    return to_session_response(user)
