import { Outlet, NavLink } from 'react-router-dom';
import { Flame, Bookmark, User, Heart, Sparkles, LogIn, LogOut } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import AuthModal from '@/components/AuthModal';
import clsx from 'clsx';

export default function Layout() {
  const { session, likesCount, openAuthModal, logout } = useSession();

  const navItems = [
    { to: '/', icon: Flame, label: 'Swipe' },
    { to: '/matches', icon: Heart, label: 'Matches' },
    { to: '/ai', icon: Sparkles, label: 'AI Analyst' },
    { to: '/saved', icon: Bookmark, label: 'Saved' },
    { to: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden select-none">
      <AuthModal />
      
      {/* Sleek Top Header */}
      <header className="flex-none h-14 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 flex items-center justify-between z-30">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-rose-500 to-orange-500 flex items-center justify-center text-base shadow-sm">
            🔥
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-rose-400 via-orange-300 to-amber-300 bg-clip-text text-transparent">
            MemeSwipe
          </span>
        </div>

        {/* User Session status in header */}
        <div className="flex items-center gap-2.5">
          {session ? (
            <>
              <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-xs text-slate-300">
                <span className={`w-2 h-2 rounded-full ${session.is_guest ? 'bg-amber-400' : 'bg-emerald-400'} animate-pulse`}></span>
                <span className="font-medium text-slate-200 truncate max-w-[110px] sm:max-w-[160px]">
                  {session.username || session.nickname}
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-rose-400 font-semibold">{likesCount} ❤️</span>
              </div>

              {session.is_guest ? (
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-full text-xs font-semibold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <LogIn size={13} />
                  <span>Log In / Sign Up</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={logout}
                  title="Log out"
                  className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 rounded-lg transition-colors flex items-center gap-1 text-xs"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Log out</span>
                </button>
              )}
            </>
          ) : (
            <span className="text-xs text-slate-500">Connecting guest session...</span>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-hidden relative flex flex-col">
        <Outlet />
      </main>

      {/* Modern Floating Bottom Dock */}
      <nav 
        aria-label="Main navigation"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 backdrop-blur-xl border border-slate-700/80 rounded-full px-2 sm:px-3 py-1.5 shadow-2xl flex items-center gap-1 sm:gap-1.5 max-w-[94vw]"
      >
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              clsx(
                "flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-200 text-xs font-medium",
                isActive
                  ? "bg-gradient-to-r from-rose-500 to-orange-500 text-white shadow-md shadow-rose-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/60"
              )
            }
          >
            <Icon size={17} strokeWidth={2.2} />
            <span className="hidden sm:inline">{label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
