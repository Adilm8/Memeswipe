from sqlalchemy import Column, String, Integer, Boolean, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship, mapped_column, Mapped
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import uuid
from typing import Optional
from datetime import datetime, timezone
from app.database import Base

def utcnow():
    return datetime.now(timezone.utc)

class Meme(Base):
    __tablename__ = "memes"
    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    external_id: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    title: Mapped[str] = mapped_column(String, nullable=False)
    image_url: Mapped[str] = mapped_column(String, nullable=False)
    source: Mapped[str] = mapped_column(String, nullable=False)
    source_url: Mapped[str] = mapped_column(String, nullable=True)
    author: Mapped[str] = mapped_column(String, nullable=True)
    upvotes: Mapped[int] = mapped_column(Integer, default=0)
    likes_count: Mapped[int] = mapped_column(Integer, default=0)
    dislikes_count: Mapped[int] = mapped_column(Integer, default=0)
    is_nsfw: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    
    swipes = relationship("UserSwipe", back_populates="meme", cascade="all, delete-orphan")
    saved_by = relationship("SavedMeme", back_populates="meme", cascade="all, delete-orphan")

class GuestUser(Base):
    __tablename__ = "guest_users"
    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_token: Mapped[str] = mapped_column(String, unique=True, index=True, nullable=False)
    nickname: Mapped[str] = mapped_column(String, nullable=False)
    username: Mapped[Optional[str]] = mapped_column(String, unique=True, index=True, nullable=True)
    email: Mapped[Optional[str]] = mapped_column(String, unique=True, nullable=True)
    password_hash: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    is_guest: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    
    swipes = relationship("UserSwipe", back_populates="user", cascade="all, delete-orphan")
    saved_memes = relationship("SavedMeme", back_populates="user", cascade="all, delete-orphan")

class UserSwipe(Base):
    __tablename__ = "user_swipes"
    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("guest_users.id"), index=True)
    meme_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("memes.id", ondelete="CASCADE"))
    action: Mapped[str] = mapped_column(String, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    
    __table_args__ = (UniqueConstraint('user_id', 'meme_id', name='uq_user_meme_swipe'),)
    
    user = relationship("GuestUser", back_populates="swipes")
    meme = relationship("Meme", back_populates="swipes")

class SavedMeme(Base):
    __tablename__ = "saved_memes"
    id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("guest_users.id"), index=True)
    meme_id: Mapped[uuid.UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("memes.id", ondelete="CASCADE"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utcnow)
    
    __table_args__ = (UniqueConstraint('user_id', 'meme_id', name='uq_user_meme_save'),)
    
    user = relationship("GuestUser", back_populates="saved_memes")
    meme = relationship("Meme", back_populates="saved_by")
