import os
import json

base_dir = r"e:\TInder for Memes\frontend"

def write_file(path, content):
    full_path = os.path.join(base_dir, path)
    os.makedirs(os.path.dirname(full_path), exist_ok=True)
    with open(full_path, "w", encoding="utf-8") as f:
        f.write(content.strip() + "\n")

files = {
    "package.json": """{
  "name": "memeswipe",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint src/"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.0",
    "react-tinder-card": "^1.6.4",
    "framer-motion": "^11.3.0",
    "lucide-react": "^0.441.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.40",
    "tailwindcss": "^3.4.7",
    "typescript": "^5.5.4",
    "vite": "^5.4.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^2.5.2"
  }
}""",
    "vite.config.ts": """import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});""",
    "tsconfig.json": """{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}""",
    "tsconfig.node.json": """{
  "compilerOptions": {
    "composite": true,
    "skipLibCheck": true,
    "module": "ESNext",
    "moduleResolution": "bundler",
    "allowSyntheticDefaultImports": true
  },
  "include": ["vite.config.ts"]
}""",
    "tailwind.config.js": """/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}""",
    "postcss.config.js": """export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}""",
    ".env.example": """VITE_API_URL=http://localhost:8000""",
    "index.html": """<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <title>MemeSwipe — Tinder for Memes</title>
  </head>
  <body class="bg-slate-900 text-white overflow-hidden">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>""",
    "vercel.json": """{
  "rewrites": [
    { "source": "/api/:path*", "destination": "https://your-backend.onrender.com/api/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}""",
    "src/index.css": """@tailwind base;
@tailwind components;
@tailwind utilities;

@layer utilities {
  .text-shadow {
    text-shadow: 0 2px 4px rgba(0,0,0,0.5);
  }
}

body {
  margin: 0;
  overscroll-behavior-y: contain;
}
""",
    "src/vite-env.d.ts": """/// <reference types="vite/client" />""",
    "src/main.tsx": """import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);""",
    "src/App.tsx": """import { Routes, Route } from 'react-router-dom';
import { SessionProvider } from '@/context/SessionContext';
import Layout from '@/components/Layout';
import SwipePage from '@/pages/SwipePage';
import SavedPage from '@/pages/SavedPage';
import ProfilePage from '@/pages/ProfilePage';
import MatchesPage from '@/pages/MatchesPage';
import AIPage from '@/pages/AIPage';

export default function App() {
  return (
    <SessionProvider>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<SwipePage />} />
          <Route path="/saved" element={<SavedPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/ai" element={<AIPage />} />
        </Route>
      </Routes>
    </SessionProvider>
  );
}""",
    "src/api/types.ts": """export interface Meme {
  id: string;
  title: string;
  image_url: string;
  source: string;
  upvotes: number;
  likes_count: number;
  dislikes_count: number;
}

export interface Session {
  session_token: string;
  user_id: string;
  nickname: string;
  created_at: string;
}

export interface Profile {
  user_id: string;
  nickname: string;
  total_swipes: number;
  total_likes: number;
  total_dislikes: number;
  total_saves: number;
  like_ratio: number;
  created_at: string;
}

export interface Match {
  user_id: string;
  nickname: string;
  similarity_score: number;
  shared_memes_count: number;
  shared_memes: Meme[];
}

export interface SavedMeme {
  id: string;
  meme: Meme;
  saved_at: string;
}

export type SwipeAction = 'like' | 'dislike';

export interface HumorProfile {
  profile: string;
  top_categories: string[];
  humor_style: string;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}
""",
    "src/api/client.ts": """export const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchWithSession(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('session_token');
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('X-Session-Token', token);
  }
  headers.set('Content-Type', 'application/json');

  const url = `${API_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });
  
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  
  return response.json();
}

export const client = {
  get: <T>(endpoint: string) => fetchWithSession(endpoint, { method: 'GET' }) as Promise<T>,
  post: <T>(endpoint: string, data?: any) => fetchWithSession(endpoint, { method: 'POST', body: JSON.stringify(data) }) as Promise<T>,
  delete: <T>(endpoint: string) => fetchWithSession(endpoint, { method: 'DELETE' }) as Promise<T>
};""",
    "src/api/memes.ts": """import { client } from './client';
import { Meme, SavedMeme, SwipeAction } from './types';

export const fetchFeed = (count: number = 20) => client.get<Meme[]>(`/api/memes/feed?count=${count}`);
export const swipeMeme = (memeId: string, action: SwipeAction) => client.post<Meme>(`/api/memes/${memeId}/swipe`, { action });
export const saveMeme = (memeId: string) => client.post<SavedMeme>(`/api/memes/${memeId}/save`);
export const unsaveMeme = (memeId: string) => client.delete<void>(`/api/memes/${memeId}/save`);
export const fetchSaved = () => client.get<SavedMeme[]>('/api/memes/saved');
""",
    "src/api/session.ts": """import { client } from './client';
import { Session } from './types';

export const createSession = () => client.post<Session>('/api/session');
export const validateSession = () => client.get<Session>('/api/session/me');
""",
    "src/api/profile.ts": """import { client } from './client';
import { Profile, Match } from './types';

export const fetchProfile = () => client.get<Profile>('/api/profile');
export const fetchMatches = () => client.get<Match[]>('/api/profile/matches');
""",
    "src/api/ai.ts": """import { client } from './client';
import { HumorProfile } from './types';

export const fetchHumorProfile = () => client.get<HumorProfile>('/api/ai/humor-profile');
export const explainMeme = (memeId: string) => client.post<{explanation: string}>(`/api/ai/explain`, { meme_id: memeId }).then(res => res.explanation);
export const chatWithAI = (message: string, memeId?: string) => client.post<{reply: string}>('/api/ai/chat', { message, meme_id: memeId }).then(res => res.reply);
""",
    "src/context/SessionContext.tsx": """import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@/api/types';
import { createSession, validateSession } from '@/api/session';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  likesCount: number;
  incrementLikes: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('session_token');
      try {
        if (token) {
          const validSession = await validateSession();
          setSession(validSession);
        } else {
          const newSession = await createSession();
          localStorage.setItem('session_token', newSession.session_token);
          setSession(newSession);
        }
      } catch (error) {
        console.error("Session error:", error);
        localStorage.removeItem('session_token');
        const newSession = await createSession();
        localStorage.setItem('session_token', newSession.session_token);
        setSession(newSession);
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, []);

  const incrementLikes = () => setLikesCount(prev => prev + 1);

  return (
    <SessionContext.Provider value={{ session, isLoading, likesCount, incrementLikes }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) throw new Error('useSessionContext must be used within a SessionProvider');
  return context;
};
""",
    "src/hooks/useSession.ts": """import { useSessionContext } from '@/context/SessionContext';

export const useSession = () => {
  return useSessionContext();
};
""",
    "src/hooks/useMemes.ts": """import { useState, useEffect, useCallback } from 'react';
import { Meme } from '@/api/types';
import { fetchFeed } from '@/api/memes';

export const useMemes = () => {
  const [memes, setMemes] = useState<Meme[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadMemes = useCallback(async () => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      const feed = await fetchFeed(20);
      setMemes(prev => [...feed, ...prev]);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (memes.length < 5) {
      loadMemes();
    }
  }, [memes.length, loadMemes]);

  const removeMeme = (id: string) => {
    setMemes(prev => prev.filter(m => m.id !== id));
  };

  return {
    memes,
    isLoading,
    isEmpty: memes.length === 0,
    removeMeme
  };
};
""",
    "src/hooks/useSwipe.ts": """import { useState } from 'react';
import { swipeMeme, saveMeme } from '@/api/memes';
import { SwipeAction } from '@/api/types';
import { useSession } from './useSession';

export const useSwipe = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const { incrementLikes } = useSession();

  const handleSwipe = async (memeId: string, action: SwipeAction) => {
    setIsProcessing(true);
    try {
      if (action === 'like') {
        incrementLikes();
      }
      await swipeMeme(memeId, action);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async (memeId: string) => {
    setIsProcessing(true);
    try {
      await saveMeme(memeId);
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  return { handleSwipe, handleSave, isProcessing };
};
""",
    "src/components/Layout.tsx": """import { Outlet, NavLink } from 'react-router-dom';
import { Flame, Bookmark, User, Heart, Sparkles } from 'lucide-react';
import clsx from 'clsx';

export default function Layout() {
  const navItems = [
    { to: '/', icon: Flame, label: 'Swipe' },
    { to: '/matches', icon: Heart, label: 'Matches' },
    { to: '/ai', icon: Sparkles, label: 'AI' },
    { to: '/saved', icon: Bookmark, label: 'Saved' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white font-sans">
      <header className="flex-none h-14 bg-gradient-to-r from-rose-500 to-orange-500 flex items-center justify-center shadow-md z-10">
        <h1 className="text-xl font-bold tracking-tight text-white shadow-sm">MemeSwipe 🔥</h1>
      </header>
      
      <main className="flex-1 overflow-hidden relative">
        <Outlet />
      </main>
      
      <nav className="flex-none h-16 bg-slate-800 border-t border-slate-700 flex justify-around items-center z-10 pb-safe">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink 
            key={to} 
            to={to} 
            className={({isActive}) => clsx(
              "flex flex-col items-center justify-center w-full h-full transition-colors",
              isActive ? "text-rose-500" : "text-slate-400 hover:text-slate-200"
            )}
          >
            <Icon size={24} strokeWidth={2.5} />
            <span className="text-[10px] mt-1 font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}""",
    "src/components/SwipeCard.tsx": """import React from 'react';
import { Meme } from '@/api/types';

interface SwipeCardProps {
  meme: Meme;
}

export default function SwipeCard({ meme }: SwipeCardProps) {
  return (
    <div className="relative w-full h-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-none select-none">
      <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm z-10">
        <span className="text-xs font-semibold text-white">r/{meme.source}</span>
      </div>
      <div className="flex-1 w-full h-full">
        <img 
          src={meme.image_url} 
          alt={meme.title}
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <h2 className="text-xl font-bold text-white text-shadow leading-tight">
          {meme.title}
        </h2>
      </div>
    </div>
  );
}""",
    "src/components/SwipeDeck.tsx": """import React, { useRef, useState, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import MatchesModal from './MatchesModal';
import { useMemes } from '@/hooks/useMemes';
import { useSwipe } from '@/hooks/useSwipe';
import { useSession } from '@/hooks/useSession';
import { Loader2 } from 'lucide-react';

export default function SwipeDeck() {
  const { memes, removeMeme, isLoading, isEmpty } = useMemes();
  const { handleSwipe, handleSave } = useSwipe();
  const { likesCount } = useSession();
  const [showMatches, setShowMatches] = useState(false);
  const [hasShownMatches, setHasShownMatches] = useState(() => localStorage.getItem('matches_shown') === 'true');

  const activeMemes = useMemo(() => memes, [memes]);

  const onSwipe = (direction: string, memeId: string) => {
    if (direction === 'right') {
      handleSwipe(memeId, 'like');
      if (likesCount + 1 >= 10 && !hasShownMatches) {
        setShowMatches(true);
        setHasShownMatches(true);
        localStorage.setItem('matches_shown', 'true');
      }
    } else if (direction === 'left') {
      handleSwipe(memeId, 'dislike');
    }
  };

  const onCardLeftScreen = (myIdentifier: string) => {
    removeMeme(myIdentifier);
  };

  const currentMeme = activeMemes[activeMemes.length - 1];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-[90%] max-w-sm aspect-[3/4] max-h-[70vh] mx-auto mt-4">
        {isEmpty && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <span className="text-6xl mb-4">🤷‍♂️</span>
            <p>No more memes!</p>
          </div>
        ) : null}
        
        {activeMemes.map((meme, index) => (
          <TinderCard
            key={meme.id}
            className="absolute inset-0 cursor-grab active:cursor-grabbing"
            onSwipe={(dir) => onSwipe(dir, meme.id)}
            onCardLeftScreen={() => onCardLeftScreen(meme.id)}
            preventSwipe={['up', 'down']}
          >
            <SwipeCard meme={meme} />
          </TinderCard>
        ))}

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-3xl z-50">
            <Loader2 className="animate-spin text-white w-10 h-10" />
          </div>
        )}
      </div>

      <div className="mt-8 mb-4">
        <ActionButtons 
          onLike={() => {
            if (currentMeme) {
              onSwipe('right', currentMeme.id);
              removeMeme(currentMeme.id);
            }
          }} 
          onDislike={() => {
            if (currentMeme) {
              onSwipe('left', currentMeme.id);
              removeMeme(currentMeme.id);
            }
          }}
          onSave={() => {
            if (currentMeme) {
              handleSave(currentMeme.id);
            }
          }}
          disabled={!currentMeme}
        />
      </div>

      {showMatches && <MatchesModal onClose={() => setShowMatches(false)} />}
    </div>
  );
}""",
    "src/components/ActionButtons.tsx": """import React from 'react';
import { motion } from 'framer-motion';
import { X, Star, Heart } from 'lucide-react';

interface Props {
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onLike, onDislike, onSave, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-6">
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onDislike}
        className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-rose-500 disabled:opacity-50"
      >
        <X size={28} strokeWidth={3} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onSave}
        className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-amber-400 disabled:opacity-50"
      >
        <Star size={24} strokeWidth={3} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onLike}
        className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-emerald-400 disabled:opacity-50"
      >
        <Heart size={32} strokeWidth={3} fill="currentColor" />
      </motion.button>
    </div>
  );
}""",
    "src/components/MatchesModal.tsx": """import React from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function MatchesModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-700"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Humor Matches Are Ready!</h2>
        <p className="text-slate-400 mb-8">You've liked enough memes. Let's see who shares your brain cells.</p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { onClose(); navigate('/matches'); }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:opacity-90"
          >
            View All Matches
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600"
          >
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </div>
  );
}""",
    "src/components/MemeCard.tsx": """import React from 'react';
import { Meme } from '@/api/types';
import { Trash2, Share2 } from 'lucide-react';

interface Props {
  meme: Meme;
  onUnsave?: (id: string) => void;
}

export default function MemeCard({ meme, onUnsave }: Props) {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-slate-800 border border-slate-700 aspect-square">
      <img src={meme.image_url} alt={meme.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <p className="text-white text-sm font-semibold line-clamp-2">{meme.title}</p>
        <div className="flex justify-end gap-2">
          <button className="p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 text-white">
            <Share2 size={16} />
          </button>
          {onUnsave && (
            <button 
              onClick={() => onUnsave(meme.id)}
              className="p-2 bg-rose-500/80 rounded-full hover:bg-rose-500 text-white"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}""",
    "src/components/SavedMemeGrid.tsx": """import React from 'react';
import { SavedMeme } from '@/api/types';
import MemeCard from './MemeCard';
import { unsaveMeme } from '@/api/memes';

export default function SavedMemeGrid({ memes, setMemes }: { memes: SavedMeme[], setMemes: React.Dispatch<React.SetStateAction<SavedMeme[]>> }) {
  const handleUnsave = async (memeId: string) => {
    try {
      await unsaveMeme(memeId);
      setMemes(prev => prev.filter(m => m.meme.id !== memeId));
    } catch (e) {
      console.error(e);
    }
  };

  if (memes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>No saved memes yet. Start swiping! 👆</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 overflow-y-auto pb-20">
      {memes.map(m => (
        <MemeCard key={m.id} meme={m.meme} onUnsave={handleUnsave} />
      ))}
    </div>
  );
}""",
    "src/components/ProfileStats.tsx": """import React from 'react';
import { Profile } from '@/api/types';
import { Activity, Heart, XOctagon, Star, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileStats({ profile }: { profile: Profile }) {
  const stats = [
    { label: 'Total Swipes', value: profile.total_swipes, icon: Activity, color: 'text-blue-400' },
    { label: 'Likes', value: profile.total_likes, icon: Heart, color: 'text-emerald-400' },
    { label: 'Dislikes', value: profile.total_dislikes, icon: XOctagon, color: 'text-rose-400' },
    { label: 'Saved', value: profile.total_saves, icon: Star, color: 'text-amber-400' },
    { 
      label: 'Like Ratio', 
      value: `${(profile.like_ratio * 100).toFixed(0)}%`, 
      icon: Percent, 
      color: profile.like_ratio > 0.5 ? 'text-emerald-400' : profile.like_ratio > 0.3 ? 'text-amber-400' : 'text-rose-400' 
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center"
        >
          <stat.icon className={`${stat.color} mb-2`} size={24} />
          <span className="text-2xl font-bold text-white">{stat.value}</span>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}""",
    "src/components/AIChatPanel.tsx": """import React, { useState } from 'react';
import { AIMessage } from '@/api/types';
import { chatWithAI, fetchHumorProfile } from '@/api/ai';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function AIChatPanel() {
  const [messages, setMessages] = useState<AIMessage[]>([{ role: 'assistant', content: "Hi! I'm your AI Humor Analyst. What do you want to know about your meme taste?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
    const newMsgs: AIMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithAI(text);
      setMessages([...newMsgs, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: "Sorry, I couldn't process that right now. 🤖" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const profile = await fetchHumorProfile();
      setMessages(p => [...p, { role: 'assistant', content: `Here is your humor profile:\n\n${profile.profile}\n\nTop categories: ${profile.top_categories.join(', ')}` }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: "Not enough data to analyze your humor yet!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={clsx("max-w-[80%] rounded-2xl p-3", m.role === 'user' ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm")}>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 rounded-tl-sm flex items-center space-x-2">
              <Loader2 className="animate-spin w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={handleAnalyze} className="flex-none flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-xs text-white px-3 py-1.5 rounded-full transition-colors">
            <Sparkles size={14} className="text-blue-400" /> Analyze My Humor
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask something..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}""",
    "src/pages/SwipePage.tsx": """import React from 'react';
import SwipeDeck from '@/components/SwipeDeck';

export default function SwipePage() {
  return (
    <div className="w-full h-full">
      <SwipeDeck />
    </div>
  );
}""",
    "src/pages/SavedPage.tsx": """import React, { useEffect, useState } from 'react';
import SavedMemeGrid from '@/components/SavedMemeGrid';
import { SavedMeme } from '@/api/types';
import { fetchSaved } from '@/api/memes';
import { Loader2 } from 'lucide-react';

export default function SavedPage() {
  const [memes, setMemes] = useState<SavedMeme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved().then(setMemes).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">Saved Memes ⭐ <span className="text-slate-400 text-sm font-normal">({memes.length})</span></h2>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-amber-400" /></div>
      ) : (
        <SavedMemeGrid memes={memes} setMemes={setMemes} />
      )}
    </div>
  );
}""",
    "src/pages/ProfilePage.tsx": """import React, { useEffect, useState } from 'react';
import { Profile } from '@/api/types';
import { fetchProfile } from '@/api/profile';
import ProfileStats from '@/components/ProfileStats';
import { useSession } from '@/hooks/useSession';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile || !session) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-rose-500" /></div>;
  }

  const initials = session.nickname.substring(0, 2).toUpperCase();

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex flex-col items-center mt-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-slate-800">
          <span className="text-3xl font-bold text-white">{initials}</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">{session.nickname}</h2>
        <p className="text-slate-400 text-sm">Member since {new Date(session.created_at).toLocaleDateString()}</p>
      </div>
      
      <ProfileStats profile={profile} />
    </div>
  );
}""",
    "src/pages/MatchesPage.tsx": """import React, { useEffect, useState } from 'react';
import { Match } from '@/api/types';
import { fetchMatches } from '@/api/profile';
import { Loader2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches().then(setMatches).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6">Your Humor Twins 👯</h2>
      
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
          <Users size={48} className="mb-4 opacity-50" />
          <p>Like at least 10 memes to find your humor twins! 😄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <motion.div 
              key={match.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-800 rounded-2xl p-4 border border-slate-700"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-white">{match.nickname}</h3>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold">
                  {(match.similarity_score * 100).toFixed(0)}% Match
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${match.similarity_score * 100}%` }}></div>
              </div>
              <p className="text-sm text-slate-400 mb-2">{match.shared_memes_count} shared memes</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {match.shared_memes.map(meme => (
                  <img key={meme.id} src={meme.image_url} alt={meme.title} className="w-16 h-16 rounded-lg object-cover flex-none" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}""",
    "src/pages/AIPage.tsx": """import React from 'react';
import AIChatPanel from '@/components/AIChatPanel';

export default function AIPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          AI Humor Analyst <span className="text-2xl">🤖</span>
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChatPanel />
      </div>
    </div>
  );
}"""
}

for path, content in files.items():
    write_file(path, content)

print("Scaffold complete!")
