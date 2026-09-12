import google.generativeai as genai
from app.config import settings
from app.models import Meme
from app.schemas import HumorProfileResponse, MemeResponse
from typing import List, Dict
import time

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        if self.api_key:
            genai.configure(api_key=self.api_key)
            self.model = genai.GenerativeModel('gemini-2.0-flash')
        else:
            self.model = None
            
        self._profile_cache: Dict[str, dict] = {}
        
    def _is_configured(self) -> bool:
        return self.model is not None
        
    async def generate_humor_profile(self, liked_memes: List[Meme]) -> HumorProfileResponse:
        if not liked_memes:
            return HumorProfileResponse(profile="Not enough data.", top_categories=[], humor_style="Unknown")
            
        cache_key = str([str(m.id) for m in liked_memes[:10]])
        if cache_key in self._profile_cache:
            cache_entry = self._profile_cache[cache_key]
            if time.time() - cache_entry['time'] < 3600:
                return cache_entry['profile']
                
        if not self._is_configured():
            mock = HumorProfileResponse(
                profile="You seem to like random internet humor.",
                top_categories=["Dank", "Wholesome"],
                humor_style="Casual"
            )
            return mock
            
        titles = [m.title for m in liked_memes[:20]]
        sources = list(set([m.source for m in liked_memes[:20]]))
        
        prompt = f"""
        Based on the user liking memes with the following titles: {titles}
        and from these sources/subreddits: {sources}
        Generate a fun humor profile. 
        Format as exactly 3 lines:
        Line 1: A 1-2 sentence description of their humor profile.
        Line 2: Comma-separated top 3 categories (e.g. Dark, Wholesome, Tech).
        Line 3: A 1-3 word description of their humor style.
        """
        
        try:
            response = self.model.generate_content(prompt)
            lines = response.text.strip().split('\n')
            if len(lines) >= 3:
                profile = lines[0]
                categories = [c.strip() for c in lines[1].split(',')]
                style = lines[2]
            else:
                raise ValueError("Invalid format")
        except Exception as e:
            print(f"Error calling Gemini: {e}")
            profile = "Error generating profile."
            categories = ["Error"]
            style = "Error"
            
        result = HumorProfileResponse(profile=profile, top_categories=categories, humor_style=style)
        self._profile_cache[cache_key] = {'time': time.time(), 'profile': result}
        return result

    async def explain_meme(self, meme: Meme) -> str:
        if not self._is_configured():
            return f"Mock explanation for {meme.title}: It's funny because it subverts expectations."
            
        prompt = f"Explain why a meme titled '{meme.title}' from '{meme.source}' is likely funny."
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return "Could not explain this meme at the moment."

    async def recommend_memes(self, liked_memes: List[Meme], candidates: List[Meme]) -> List[MemeResponse]:
        # Fallback to random if no AI
        if not self._is_configured():
            return [MemeResponse.model_validate(m) for m in candidates[:5]]
            
        return [MemeResponse.model_validate(m) for m in candidates[:5]]

    async def chat(self, message: str, context: str) -> str:
        if not self._is_configured():
            return "I am a mock AI. I see your context is: " + context
            
        prompt = f"Context about user: {context}\nUser says: {message}\nRespond as a witty, meme-loving AI assistant."
        try:
            response = self.model.generate_content(prompt)
            return response.text.strip()
        except Exception:
            return "Oops, I glitched out."
