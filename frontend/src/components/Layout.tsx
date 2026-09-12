import { Outlet, NavLink } from 'react-router-dom';
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
      
      <main className="flex-1 overflow-hidden relative flex flex-col">
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
}
