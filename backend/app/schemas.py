from pydantic import BaseModel
from uuid import UUID
from typing import Optional, List, Literal
from datetime import datetime

class MemeResponse(BaseModel):
    id: UUID
    title: str
    image_url: str
    source: str
    source_url: Optional[str] = None
    author: Optional[str] = None
    upvotes: int
    likes_count: int
    dislikes_count: int
    
    class Config:
        from_attributes = True

class SwipeRequest(BaseModel):
    action: Literal["like", "dislike"]

class UserRegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None

class UserLoginRequest(BaseModel):
    username: str
    password: str

class ProfileUpdateRequest(BaseModel):
    nickname: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class SessionResponse(BaseModel):
    session_token: str
    user_id: UUID
    nickname: str
    is_guest: bool = True
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

class ProfileResponse(BaseModel):
    user_id: UUID
    nickname: str
    is_guest: bool = True
    username: Optional[str] = None
    email: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    total_swipes: int
    total_likes: int
    total_dislikes: int
    total_saves: int
    like_ratio: float
    created_at: datetime

class MatchResponse(BaseModel):
    user_id: UUID
    nickname: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    similarity_score: float
    shared_memes_count: int
    shared_memes: List[MemeResponse]

class SavedMemeResponse(BaseModel):
    id: UUID
    meme: MemeResponse
    saved_at: datetime
    
    class Config:
        from_attributes = True

class AIRequest(BaseModel):
    message: str
    meme_id: Optional[UUID] = None

class AIResponse(BaseModel):
    response: str

class HumorProfileResponse(BaseModel):
    profile: str
    top_categories: List[str]
    humor_style: str

class UserSearchResult(BaseModel):
    user_id: UUID
    username: Optional[str] = None
    nickname: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    is_friend: bool = False
    compatibility: int = 50

class FriendResponse(BaseModel):
    user_id: UUID
    username: Optional[str] = None
    nickname: str
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    compatibility: int = 50
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

class ChatMessageCreate(BaseModel):
    content: str
    meme_id: Optional[UUID] = None

class ChatMessageResponse(BaseModel):
    id: UUID
    sender_id: UUID
    receiver_id: UUID
    content: str
    meme_id: Optional[UUID] = None
    meme_title: Optional[str] = None
    meme_image_url: Optional[str] = None
    is_read: bool = False
    created_at: datetime
    is_mine: bool = False

class ConversationSummary(BaseModel):
    friend_id: UUID
    username: Optional[str] = None
    nickname: str
    avatar_url: Optional[str] = None
    bio: Optional[str] = None
    compatibility: int = 50
    last_message: Optional[str] = None
    last_message_time: Optional[datetime] = None
    unread_count: int = 0

