# 🐸 Memeswipe

Swipe through memes, like them, save them, and discover people who share your sense of humor.

![MemeSwipe](https://img.shields.io/badge/MemeSwipe-v1.0-ff6b6b?style=for-the-badge&logo=react&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)

## 📋 Project Description

**MemeSwipe** is a web application where users swipe through memes in a Tinder-like interface. Swipe right to like, left to dislike. Liked memes are tracked, saved memes go into a personal collection, and after liking 10+ memes, the app finds "humor matches" — other users with similar taste.

An AI-powered humor analyst (powered by Google Gemini) can analyze your meme preferences, explain why memes are funny, and chat about your humor profile.

### Key Features

- 🃏 **Swipe Feed** — Tinder-style card swiping with spring physics animations
- ❤️ **Like / Dislike / Save** — Three distinct actions per meme
- 📊 **Profile & Stats** — Track your total swipes, likes, dislikes, save ratio
- 👯 **Humor Matches** — Jaccard similarity algorithm finds users with overlapping taste
- 🤖 **AI Humor Analyst** — Chat with an AI that analyzes your meme preferences (Google Gemini)
- 🎨 **Dark Theme UI** — Beautiful mobile-first design with smooth animations

---

## 🚀 Installation & Setup

### Prerequisites

- **Python 3.12+**
- **Node.js 18+** & **npm**
- **PostgreSQL 15+** (running locally or remote connection string)

### 1. Clone the Repository

```bash
git clone https://github.com/YOUR_USERNAME/memeswipe.git
cd memeswipe
```

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your DATABASE_URL and optional GEMINI_API_KEY
```

**Create the PostgreSQL database:**
```sql
CREATE DATABASE memeswipe;
```

**Run the server:**
```bash
uvicorn app.main:app --reload --port 8000
```

**Seed memes into the database:**
```bash
python seed.py
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start dev server (proxies /api to localhost:8000)
npm run dev
```

Open **http://localhost:5173** in your browser.

---

## 🏗️ Design & Development Process

### Architecture Decision Records

#### Why FastAPI + React?

| Decision | Rationale |
|---|---|
| **FastAPI** (backend) | Async-first Python framework. Native Pydantic validation, auto-generated OpenAPI docs, excellent performance with asyncpg. Perfect for a JSON API with multiple concurrent users. |
| **React + Vite** (frontend) | Largest ecosystem for swipe gesture libraries (`react-tinder-card`). Vite provides instant HMR and fast builds. TypeScript ensures type safety across the API contract. |
| **PostgreSQL** | Relational DB for structured data (users, memes, swipes). UUID primary keys, `ON CONFLICT DO NOTHING` for deduplication, efficient JOINs for the matching algorithm. |
| **Tailwind CSS** | Utility-first CSS for rapid prototyping. Dark theme, responsive design, and consistent spacing without writing custom CSS. |
| **framer-motion** | Production-grade animation library for React. Spring physics, `AnimatePresence` for exit animations, `whileTap` for button feedback. |

#### Why NOT Next.js?

Next.js adds SSR/SSG complexity that a single-page swipe app doesn't need. Our app is purely client-side rendered with API calls — Vite's simplicity is a better fit.

#### Why NOT Authentication?

This is an MVP. Guest sessions (UUID-based) let users start swiping instantly without friction. The session token is stored in `localStorage` and validated on each API call via `X-Session-Token` header.

### Meme Sourcing Strategy

We use **D3vd Meme API** (`meme-api.com`) — a free, keyless API that aggregates top memes from Reddit communities:
- `r/memes`, `r/dankmemes`, `r/wholesomememes`, `r/me_irl`
- Quality filter: upvotes ≥ 500, not NSFW, valid image URL
- Deduplication via `external_id` (Reddit post ID)
- All API calls are **server-side only** (via the seeder script), never from the frontend

### Matching Algorithm

**Jaccard Similarity** on liked meme sets:

```
similarity(A, B) = |A ∩ B| / |A ∪ B|
```

Where A = memes liked by user A, B = memes liked by user B. Users with similarity > 10% and who have liked ≥ 10 memes qualify as matches.

### AI Integration

Google Gemini (`gemini-2.0-flash`) powers the AI features:
- **Humor Profile**: Analyzes titles and subreddits of liked memes to generate a personality summary
- **Meme Explanation**: Explains why a specific meme is funny based on its title and context
- **Chat**: General humor Q&A with user's swipe history as context
- **Graceful Fallback**: If no API key is configured, mock responses are returned instead of errors

---

## 🎯 Unique Approaches

1. **Pre-seeded Database**: Instead of fetching memes on-demand (which causes latency and rate limiting), we pre-populate the database with 500+ high-quality memes. This guarantees instant card rendering during swipes.

2. **Image Preloading**: The frontend preloads the next 2-3 meme images in the background, ensuring zero visual lag when swiping.

3. **Guest Sessions Without Auth**: Anonymous UUID-based sessions stored in `localStorage`. Users can start swiping immediately — zero signup friction.

4. **Jaccard Similarity for Matching**: A mathematically sound approach to finding "humor twins" based on overlapping liked memes, computed efficiently with SQL set operations.

5. **AI Mock Fallback**: The AI service gracefully degrades when no Gemini API key is configured, returning predefined mock responses so the app remains fully functional.

---

## ⚖️ Trade-offs

| Decision | Trade-off |
|---|---|
| **Guest sessions** | Users lose data if they clear `localStorage` or switch browsers. Acceptable for MVP; upgrade path: add optional email/OAuth sign-in. |
| **Pre-seeded memes** | Initial content is finite (~500 memes). Solved by daily refresh cron job fetching new trending memes. |
| **External image URLs** | Meme images are hosted on `i.redd.it` — if Reddit deletes a post, the image breaks. Mitigation: store a copy or validate on fetch. |
| **Jaccard similarity** | Simple but effective. Doesn't capture meme semantics (two memes about the same topic from different subreddits aren't linked). Future: use embeddings for semantic matching. |
| **No real-time features** | Matches are computed on-demand, not pushed via WebSocket. Users refresh to see new matches. Acceptable for MVP. |
| **AI rate limiting** | Gemini free tier has 15 RPM limit. We cache humor profiles for 1 hour per user. Heavy usage could still hit limits. |

---

## 🐛 Known Issues

- **Session loss**: Clearing browser data or using incognito mode creates a new anonymous identity with no history.
- **Meme depletion**: If a user swipes through all seeded memes, the feed shows "No more memes" until new content is seeded.
- **Image loading**: Some Reddit image URLs may return 403/404 if the original post was deleted. No broken-image fallback is currently implemented.
- **Matching cold start**: With few users, the matching algorithm may return no results. It needs a critical mass of users with overlapping liked memes.
- **Mobile swipe conflicts**: On some mobile browsers, the swipe gesture may conflict with the browser's back/forward navigation. `preventSwipe` is set for up/down only.

---

## 📁 Project Structure

```
memeswipe/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI app entry point
│   │   ├── config.py            # Pydantic settings
│   │   ├── database.py          # Async SQLAlchemy engine
│   │   ├── models.py            # ORM models (Meme, User, Swipe, Save)
│   │   ├── schemas.py           # Pydantic request/response models
│   │   ├── routers/
│   │   │   ├── session.py       # Guest session endpoints
│   │   │   ├── memes.py         # Feed, swipe, save endpoints
│   │   │   ├── profile.py       # Stats & matches endpoints
│   │   │   └── ai.py            # AI humor analyst endpoints
│   │   └── services/
│   │       ├── ai_service.py    # Gemini API integration
│   │       ├── matching.py      # Jaccard similarity algorithm
│   │       └── meme_seeder.py   # Meme ingestion from API
│   ├── alembic/                 # Database migrations
│   ├── seed.py                  # Standalone seeding script
│   ├── Dockerfile               # Container config
│   ├── requirements.txt
│   └── render.yaml              # Render.com deployment blueprint
│
├── frontend/
│   ├── src/
│   │   ├── api/                 # Typed API client functions
│   │   ├── components/          # React components (SwipeDeck, Layout, etc.)
│   │   ├── context/             # Session context provider
│   │   ├── hooks/               # Custom hooks (useMemes, useSwipe, useSession)
│   │   └── pages/               # Route pages (Swipe, Saved, Profile, Matches, AI)
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── vercel.json              # Vercel deployment config
│
├── .gitignore
└── README.md
```

---

## 🌐 Tech Stack Summary

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + Vite + TypeScript | Best swipe library ecosystem, fast dev experience |
| Styling | Tailwind CSS + framer-motion | Rapid dark-theme design + polished animations |
| Swipe Gestures | react-tinder-card | Battle-tested Tinder-style card physics |
| Backend | FastAPI (Python 3.12) | Async-first, auto-docs, Pydantic validation |
| Database | PostgreSQL + SQLAlchemy 2.0 | Relational queries, UUID PKs, ON CONFLICT dedup |
| AI | Google Gemini (gemini-2.0-flash) | Free tier (15 RPM), fast inference, good humor understanding |
| Meme Source | D3vd Meme API (meme-api.com) | Free, keyless, curated Reddit memes |
| Deploy (FE) | Vercel | Free static hosting, instant deploys, global CDN |
| Deploy (BE) | Render | Free Python hosting + managed PostgreSQL |

---

## 🚀 Deployment

### Frontend → Vercel

1. Connect your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend/`
3. Build command: `npm run build`
4. Output directory: `dist/`
5. Update `vercel.json` rewrite to point to your Render backend URL

### Backend → Render

1. Connect your GitHub repo to [Render](https://render.com)
2. Use the `render.yaml` blueprint (Infrastructure as Code)
3. Or manually create a Web Service pointing to `backend/Dockerfile`
4. Add environment variables: `DATABASE_URL`, `GEMINI_API_KEY`, `CORS_ORIGINS`
5. Create a PostgreSQL database and link it

### Post-Deploy Checklist

- [ ] Run `python seed.py` on the deployed backend to populate memes
- [ ] Verify all API endpoints at `https://your-backend.onrender.com/docs`
- [ ] Test swipe flow end-to-end on the deployed frontend
- [ ] Confirm data persists across page refreshes

---

## 📜 License

MIT
