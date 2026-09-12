from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List, Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/memeswipe"
    GEMINI_API_KEY: Optional[str] = None
    CORS_ORIGINS: List[str] = ["http://localhost:5173"]
    MEME_API_BASE_URL: str = "https://meme-api.com"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

settings = Settings()
