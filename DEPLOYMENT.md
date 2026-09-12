# 🚀 Memeswipe Deployment Guide (100% Free for Students)

This guide walks you through deploying **Memeswipe** completely free of charge, with **zero server maintenance**, and **automatic continuous deployment** (whenever you run `git push`, your site updates automatically).

---

## 📊 1. Resource Requirements

You do **not** need high-end or expensive cloud resources for this project:

| Component | Technology | Memory (RAM) | Storage | Cost |
| :--- | :--- | :--- | :--- | :--- |
| **Frontend** | React + Vite (SPA) | 0 MB (Static CDN) | ~2 MB | **Free** (Vercel / Cloudflare) |
| **Backend** | FastAPI + Python 3.12 | ~80 – 150 MB | ~200 MB | **Free** (Render / Railway) |
| **Database** | PostgreSQL | ~20 MB | ~10 – 50 MB | **Free** (Neon.tech / Supabase) |
| **AI Features** | Google Gemini 2.5 Flash | External API | 0 MB | **Free** (Google AI Studio) |

---

## 🏆 Recommended Free Architecture: Vercel + Render + Neon

This is the standard modern stack for web applications. It costs **$0.00/month**, requires no credit card, and gives you:
- Auto-deploys on every `git push`.
- Free custom domains and automatic HTTPS/SSL certificates.
- No Linux server administration required.

```
       [ Client Browser ]
         /           \
  (Static Assets)   (API Calls)
       /               \
[ Vercel (Frontend) ]   [ Render (FastAPI Backend) ]
                                |
                        [ Neon.tech (Postgres DB) ]
```

---

## 🛠️ Step-by-Step Deployment Guide

### Step 1: Free Database on Neon.tech (2 minutes)
1. Go to [Neon.tech](https://neon.tech) and sign up with your **GitHub account**.
2. Click **Create Project**, name it `memeswipe`, and click **Create**.
3. Under **Connection Details**, copy the **Connection string**:
   ```
   postgresql://alex:abc123xyz@ep-cool-fog-123456.us-east-2.aws.neon.tech/memeswipe?sslmode=require
   ```
   *(Keep this string handy; our backend automatically formats it for asyncpg!)*

---

### Step 2: Deploy Backend on Render (3 minutes)
1. Go to [Render.com](https://render.com) and sign up with **GitHub**.
2. In the dashboard, click **New +** → **Web Service**.
3. Connect your GitHub repository (`Tinder-For-Memes` or `Memeswipe`).
4. Configure the service:
   - **Name**: `memeswipe-backend`
   - **Region**: Choose closest to you (e.g. Frankfurt, Oregon, Ohio).
   - **Language**: `Python 3` (or `Docker`).
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Instance Type**: **Free**
5. Scroll down to **Environment Variables** and add:
   - `DATABASE_URL` = *(paste your Neon.tech connection string from Step 1)*
   - `GEMINI_API_KEY` = *(your Google Gemini API key from [aistudio.google.com](https://aistudio.google.com))*
   - `CORS_ORIGINS` = `*` *(or your Vercel URL once created)*
6. Click **Create Web Service**.
7. Once deployed (1-2 minutes), copy your backend URL (e.g., `https://memeswipe-backend.onrender.com`).

---

### Step 3: Deploy Frontend on Vercel (2 minutes)
1. Go to [Vercel.com](https://vercel.com) and log in with your **GitHub account** (included with GitHub Student Pack).
2. Click **Add New...** → **Project**.
3. Import your `Memeswipe` repository.
4. Configure the build:
   - **Framework Preset**: `Vite`
   - **Root Directory**: Click `Edit` and select **`frontend`**.
5. Under **Environment Variables**, add:
   - **Name**: `VITE_API_URL`
   - **Value**: *(paste your Render backend URL from Step 2, without a trailing slash, e.g. `https://memeswipe-backend.onrender.com`)*
6. Click **Deploy**.
7. In ~30 seconds, your site is live with a `https://your-project.vercel.app` domain!

*(Optional: In Render, update `CORS_ORIGINS` to `https://your-project.vercel.app` for strict security).*

---

## 🎓 Alternative: Using GitHub Student Developer Pack

If you have the **GitHub Student Developer Pack**, you have free credits:

### Option A: Railway (GitHub Student Pack Partner)
- Railway gives students free usage credits.
- In Railway: Click **New Project** → **Provision PostgreSQL** + **GitHub Repo**.
- In the same canvas, you can host the database, backend, and frontend with 1 click.

### Option B: DigitalOcean ($200 Free Student Credit)
- GitHub Student Pack provides **$200 in DigitalOcean credits**.
- Spin up a **$4/month basic Ubuntu Droplet**.
- Install Docker: `curl -fsSL https://get.docker.com | sh`
- Clone your repo: `git clone https://github.com/<your-username>/Tinder-For-Memes.git`
- Run: `docker compose up -d`
- Everything (Postgres DB + Backend) runs immediately in Docker.

---

## 🔄 How to Easily Edit in the Future

Once set up:
1. Make code changes locally.
2. Commit and push:
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```
3. **Vercel** and **Render** will automatically detect the push, rebuild, and update your live site within 1 minute with **zero downtime**.
