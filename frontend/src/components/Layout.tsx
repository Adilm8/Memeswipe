import { useState, useEffect } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, User, Heart, Sparkles, LogIn, LogOut, Flame } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { fetchMatches } from '@/api/profile';
import { Match } from '@/api/types';
import AuthModal from '@/components/AuthModal';
import clsx from 'clsx';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, likesCount, openAuthModal, logout } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);

  // Load matches whenever session or likesCount updates
  useEffect(() => {
    if (session && likesCount >= 5) {
      fetchMatches()
        .then(setMatches)
        .catch((e) => console.error("Failed to load matches for sidebar:", e));
    }
  }, [session, likesCount]);

  const isSwipingRoute = location.pathname === '/';
  const displayName = session?.username || session?.nickname || 'Guest';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col lg:flex-row h-screen w-screen bg-[#f0f2f5] text-slate-800 font-sans overflow-hidden select-none">
      <AuthModal />

      {/* ========================================================= */}
      {/* MOBILE / TABLET TOP BAR (< lg screens): Compact & Sleek   */}
      {/* ========================================================= */}
      <header className="lg:hidden flex-none h-14 bg-white border-b border-slate-200/90 px-3 sm:px-4 flex items-center justify-between z-30 shadow-2xs">
        {/* Left: User Profile Avatar */}
        <button 
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 hover:opacity-85 transition-opacity"
          title="View Profile"
        >
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center font-bold text-xs text-white shadow-2xs">
              {initials}
            </div>
            <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${
              session?.is_guest ? 'bg-amber-400' : 'bg-emerald-400'
            }`} />
          </div>
          <span className="font-bold text-xs text-slate-800 truncate max-w-[90px] sm:max-w-[130px]">
            {displayName}
          </span>
        </button>

        {/* Center: MemeSwipe Logo / Direct link to Swipe */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1.5 font-extrabold text-base tracking-tight bg-gradient-to-r from-[#fe3c72] via-[#ff655b] to-[#ff7854] bg-clip-text text-transparent hover:opacity-90 transition-opacity"
        >
          <span className="text-base">🔥</span>
          <span>MemeSwipe</span>
        </button>

        {/* Right: Quick Navigation Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          <NavLink
            to="/"
            title="Discover Memes"
            className={({ isActive }) => clsx(
              "p-2 rounded-xl transition-all",
              isActive ? "text-[#fe3c72] bg-rose-50 font-bold" : "text-slate-400 hover:text-slate-700"
            )}
          >
            <Flame size={19} strokeWidth={2.4} />
          </NavLink>

          <NavLink
            to="/matches"
            title="Matches"
            className={({ isActive }) => clsx(
              "p-2 rounded-xl transition-all relative",
              isActive ? "text-[#fe3c72] bg-rose-50 font-bold" : "text-slate-400 hover:text-slate-700"
            )}
          >
            <Heart size={19} strokeWidth={2.4} />
            {matches.length > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#fe3c72]" />
            )}
          </NavLink>

          <NavLink
            to="/saved"
            title="Saved Memes"
            className={({ isActive }) => clsx(
              "p-2 rounded-xl transition-all",
              isActive ? "text-[#fe3c72] bg-rose-50 font-bold" : "text-slate-400 hover:text-slate-700"
            )}
          >
            <Bookmark size={18} strokeWidth={2.4} />
          </NavLink>

          <NavLink
            to="/ai"
            title="AI Analyst"
            className={({ isActive }) => clsx(
              "p-2 rounded-xl transition-all",
              isActive ? "text-[#fe3c72] bg-rose-50 font-bold" : "text-slate-400 hover:text-slate-700"
            )}
          >
            <Sparkles size={18} strokeWidth={2.4} />
          </NavLink>

          {session?.is_guest && (
            <button
              onClick={() => openAuthModal('login')}
              className="ml-1 px-2.5 py-1 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white rounded-full text-[11px] font-bold shadow-2xs"
            >
              Log In
            </button>
          )}
        </div>
      </header>

      {/* ========================================================= */}
      {/* DESKTOP LEFT SIDEBAR (>= lg screens): Classic Tinder Panel */}
      {/* ========================================================= */}
      <aside className="hidden lg:flex w-[350px] xl:w-[380px] bg-white border-r border-slate-200/90 flex-col flex-none z-30 shadow-2xs h-full">
        {/* Top Profile Header: Gradient Pink/Coral Bar */}
        <div className="flex-none h-16 bg-gradient-to-r from-[#fe3c72] via-[#ff655b] to-[#ff7854] px-4 py-2.5 flex items-center justify-between shadow-xs">
          {/* User Profile Info (clickable to view Profile) */}
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity text-left"
          >
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border-2 border-white flex items-center justify-center font-bold text-sm text-white shadow-2xs">
                {initials}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                session?.is_guest ? 'bg-amber-300' : 'bg-emerald-400'
              }`} />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-sm truncate max-w-[130px]">
                  {displayName}
                </span>
                <span className="text-[11px] text-white/80 bg-black/15 px-1.5 py-0.2 rounded font-medium">
                  {likesCount} ❤️
                </span>
              </div>
              <span className="text-[11px] text-white/85 font-medium">
                {session?.is_guest ? 'Guest Session' : 'My Profile'}
              </span>
            </div>
          </button>

          {/* Right Action: Auth button / settings */}
          <div className="flex items-center gap-2">
            {session?.is_guest ? (
              <button
                onClick={() => openAuthModal('login')}
                className="px-3 py-1 bg-white hover:bg-white/95 text-[#fe3c72] rounded-full text-xs font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95"
              >
                <LogIn size={13} strokeWidth={2.5} />
                <span>Log In</span>
              </button>
            ) : (
              <button
                onClick={logout}
                title="Log out"
                className="p-2 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <LogOut size={16} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        {/* Tinder "Discover Memes" Hero Card */}
        <div className="p-3.5 border-b border-slate-100">
          <button
            onClick={() => navigate('/')}
            className={clsx(
              "w-full p-3 rounded-2xl flex items-center gap-3.5 transition-all text-left group",
              isSwipingRoute
                ? "bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-[#fe3c72]/30 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100/80 border border-slate-200"
            )}
          >
            <div className={clsx(
              "w-12 h-12 rounded-2xl flex items-center justify-center text-xl transition-transform group-hover:scale-105 shadow-2xs flex-none",
              isSwipingRoute
                ? "bg-gradient-to-tr from-[#fe3c72] to-[#ff655b] text-white"
                : "bg-white border-2 border-[#fe3c72] text-[#fe3c72]"
            )}>
              🔥
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#fe3c72] transition-colors">
                  Discover Memes
                </h4>
                {isSwipingRoute && (
                  <span className="w-2 h-2 rounded-full bg-[#fe3c72] animate-ping" />
                )}
              </div>
              <p className="text-xs text-slate-500 truncate mt-0.5">
                Start swiping to find your humor twins!
              </p>
            </div>
          </button>
        </div>

        {/* Section Tabs (Matches / AI Analyst / Saved / Profile) */}
        <div className="flex items-center px-3 pt-2 pb-1 gap-1 border-b border-slate-100">
          <NavLink
            to="/matches"
            className={({ isActive }) => clsx(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Heart size={14} strokeWidth={2.4} />
            <span>Matches</span>
            {matches.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-[#fe3c72] text-white rounded-full text-[10px] font-bold">
                {matches.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/ai"
            className={({ isActive }) => clsx(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Sparkles size={14} strokeWidth={2.4} />
            <span>AI Analyst</span>
          </NavLink>

          <NavLink
            to="/saved"
            className={({ isActive }) => clsx(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Bookmark size={14} strokeWidth={2.4} />
            <span>Saved</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => clsx(
              "flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <User size={14} strokeWidth={2.4} />
            <span>Profile</span>
          </NavLink>
        </div>

        {/* Sidebar Content List: Real-time Matches & Chats */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="flex items-center justify-between px-2 py-1 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Humor Twins & Matches
            </span>
            {matches.length > 0 && (
              <span className="text-xs text-slate-400 font-semibold">
                {matches.length} found
              </span>
            )}
          </div>

          {likesCount < 10 ? (
            <div className="p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
              <span className="text-2xl mb-1 block">🎯</span>
              <p className="text-xs font-bold text-slate-700">Find your Humor Twins</p>
              <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                Like {10 - likesCount} more memes on the right to discover people who laugh at the exact same jokes!
              </p>
              <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#fe3c72] to-[#ff6036] h-full rounded-full transition-all duration-300"
                  style={{ width: `${(likesCount / 10) * 100}%` }}
                />
              </div>
            </div>
          ) : matches.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <Heart size={28} className="mx-auto text-slate-300 mb-2" />
              <p className="text-xs font-semibold text-slate-600">No matches found yet</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Keep swiping memes to find taste twins!</p>
            </div>
          ) : (
            matches.map((m) => {
              const matchInitials = m.nickname.substring(0, 2).toUpperCase();
              const percent = Math.round(m.similarity_score * 100);
              return (
                <button
                  key={m.user_id}
                  onClick={() => navigate('/matches')}
                  className="w-full p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 flex items-center gap-3 transition-all text-left group"
                >
                  <div className="relative flex-none">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-2xs group-hover:scale-105 transition-transform">
                      {matchInitials}
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-full bg-[#10b981] text-white text-[9px] font-bold border-2 border-white shadow-2xs">
                      {percent}%
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-800 truncate group-hover:text-[#fe3c72] transition-colors">
                        {m.nickname}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600">
                        {percent}% Match
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5 flex items-center gap-1">
                      <span>👯</span> {m.shared_memes_count} shared memes in common
                    </p>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN STAGE: Full Viewport on Mobile, Right Panel on Desktop */}
      {/* ========================================================= */}
      <main className="flex-1 h-[calc(100dvh-3.5rem)] lg:h-full relative overflow-hidden flex flex-col bg-[#f0f2f5]">
        <Outlet />
      </main>
    </div>
  );
}
