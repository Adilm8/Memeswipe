import google.generativeai as genai
from app.config import settings
from app.models import Meme
from app.schemas import HumorProfileResponse, MemeResponse
from typing import List, Dict, Optional
import time
import httpx

class AIService:
    def __init__(self):
        self.api_key = settings.GEMINI_API_KEY
        self.model = None
        if self.api_key:
            try:
                genai.configure(api_key=self.api_key)
                for model_candidate in ['gemini-3.6-flash', 'gemini-3-flash-preview', 'gemini-flash-latest']:
                    try:
                        self.model = genai.GenerativeModel(model_candidate)
                        print(f"Gemini AI successfully initialized with model: {model_candidate}")
                        break
                    except Exception as me:
                        print(f"Model {model_candidate} not available: {me}")
            except Exception as e:
                print(f"Failed to configure Gemini: {e}")
        else:
            print("Notice: GEMINI_API_KEY not set. AIService running in mock mode.")
            
        self._profile_cache: Dict[str, dict] = {}
        
    def _is_configured(self) -> bool:
        return self.model is not None
        
    async def generate_humor_profile(self, liked_memes: List[Meme]) -> HumorProfileResponse:
        if not liked_memes:
            return HumorProfileResponse(
                profile="Swipe right on some memes to unveil your AI humor archetype!",
                top_categories=["Awaiting Swipes"],
                humor_style="Unrevealed"
            )
            
        cache_key = str([str(m.id) for m in liked_memes[:15]])
        if cache_key in self._profile_cache:
            cache_entry = self._profile_cache[cache_key]
            if time.time() - cache_entry['time'] < 3600:
                return cache_entry['profile']
                
        if not self._is_configured():
            return HumorProfileResponse(
                profile="You seem to enjoy sharp internet irony, unexpected punchlines, and relatable daily chaos.",
                top_categories=["Dank", "Wholesome", "Relatable"],
                humor_style="Eclectic Connoisseur"
            )
            
        titles = [m.title for m in liked_memes[:25]]
        sources = list(set([m.source for m in liked_memes[:25]]))
        
        prompt = f"""
        Analyze this user's comedy taste based on the memes they liked:
        Titles: {titles}
        Subreddits: {sources}

        Provide a personality profile in exactly 3 lines:
        Line 1: A witty, fun 1-2 sentence psychological breakdown of their humor personality.
        Line 2: Top 3 comedy categories (comma-separated, e.g. Absurdist, Dark Satire, Relatable Wholesome).
        Line 3: A 1-3 word catchy Humor Archetype (e.g. Chaotic Dadaist, Cynical Academic, Wholesome Sloth).
        Do not add prefixes like 'Line 1:' or markdown bold formatting.
        """
        
        try:
            response = self.model.generate_content(prompt)
            lines = [l.strip() for l in response.text.strip().split('\n') if l.strip()]
            if len(lines) >= 3:
                profile = lines[0].replace('Line 1:', '').strip()
                categories = [c.strip().replace('Line 2:', '').strip() for c in lines[1].split(',')]
                style = lines[2].replace('Line 3:', '').strip()
            else:
                profile = response.text.strip()
                categories = ["Dank", "Irony", "Relatable"]
                style = "Meme Connoisseur"
        except Exception as e:
            print(f"Error calling Gemini humor profile: {e}")
            profile = "You have a vibrant, fast-evolving taste in online humor."
            categories = ["Eclectic", "Pop Culture", "Satire"]
            style = "Modern Memer"
            
        result = HumorProfileResponse(profile=profile, top_categories=categories, humor_style=style)
        self._profile_cache[cache_key] = {'time': time.time(), 'profile': result}
        return result

    async def explain_meme(self, meme: Meme) -> str:
        if not self._is_configured():
            return f"'{meme.title}' pokes fun at relatable daily absurdity and subverts classic expectations."
            
        system_instructions = (
            "You are a meme connoisseur and humor cultural expert. "
            "Explain why this meme is funny, decoding any slang, visual irony, template origins, "
            "or cultural references. Keep your answer concise (2-3 punchy sentences), witty, and fun."
        )
        
        # Try fetching image for multimodal vision analysis
        image_part = None
        if meme.image_url:
            try:
                async with httpx.AsyncClient(timeout=4.0) as client:
                    resp = await client.get(meme.image_url)
                    if resp.status_code == 200:
                        content_type = resp.headers.get("content-type", "image/jpeg")
                        if "image" in content_type:
                            image_part = {
                                "mime_type": content_type.split(";")[0],
                                "data": resp.content
                            }
            except Exception as img_err:
                print(f"Could not load meme image for vision: {img_err}")
                
        prompt_text = f"{system_instructions}\nMeme Title: '{meme.title}'\nSubreddit / Source: r/{meme.source}"
        
        try:
            if image_part:
                response = self.model.generate_content([prompt_text, image_part])
            else:
                response = self.model.generate_content(prompt_text)
            return response.text.strip()
        except Exception as e:
            print(f"Error calling Gemini in explain_meme: {e}")
            return f"This meme ('{meme.title}') humorously contrasts everyday expectations with ridiculous internet reality."

    async def recommend_memes(self, liked_memes: List[Meme], candidates: List[Meme]) -> List[MemeResponse]:
        return [MemeResponse.model_validate(m) for m in candidates[:5]]

    async def chat(self, message: str, context: str, current_meme: Optional[Meme] = None) -> str:
        if not self._is_configured():
            return "I'm your Meme Companion! Ask me about your humor taste or tell me what kind of jokes you love."
            
        system_prompt = (
            "You are MemeSwipe AI Companion, an ultra-smart, witty, friendly, and chronically online meme connoisseur. "
            "You help users analyze their comedy taste, roast their humor, explain memes, and recommend jokes. "
            "Use emojis naturally (🔥, 💀, 🧠, ✨, 🐶). Keep responses conversational, concise (around 2-4 sentences), "
            "and genuinely entertaining. Never sound robotic or generic."
        )
        
        full_prompt = f"{system_prompt}\n{context}\n"
        if current_meme:
            full_prompt += f"Currently visible meme on screen: '{current_meme.title}' from r/{current_meme.source}.\n"
        full_prompt += f"User message: {message}\nAI Companion response:"
        
        try:
            response = self.model.generate_content(full_prompt)
            return response.text.strip()
        except Exception as e:
            print(f"Error in Gemini chat: {e}")
            return "My meme radar hit a tiny glitch! Try sending again in a moment."
