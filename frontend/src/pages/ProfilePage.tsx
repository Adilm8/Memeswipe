import { useNavigate } from 'react-router-dom';
import { useSession } from '@/hooks/useSession';
import ProfileStats from '@/components/ProfileStats';
import { Loader2, Sparkles, UserPlus, LogIn, LogOut, CheckCircle2, ShieldAlert, ArrowLeft, Flame } from 'lucide-react';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { session, profile, openAuthModal, logout } = useSession();

  if (!profile || !session) {
    return (
      <div className="flex items-center justify-center h-full bg-[#f0f2f5]">
        <Loader2 className="animate-spin text-[#fe3c72] w-8 h-8" />
      </div>
    );
  }

  const displayName = session.username || session.nickname;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      {/* Top Bar with "Back to Swiping" button */}
      <div className="flex-none bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Back to Swiping"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-extrabold text-slate-900">
            User Profile & Humor Stats
          </h2>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-1.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Flame size={14} />
          <span>Swipe Memes</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 max-w-2xl w-full mx-auto">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-xs flex flex-col items-center text-center">
          {/* Avatar with Tinder gradient */}
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-[#fe3c72] via-[#ff655b] to-[#ff7854] flex items-center justify-center text-white font-black text-3xl shadow-md border-4 border-white">
              {initials}
            </div>
          </div>

          {/* User Identity */}
          <h2 className="mt-4 text-2xl font-black text-slate-900 tracking-tight">{displayName}</h2>
          
          {/* Account Type Badge */}
          <div className="mt-2 flex items-center gap-2">
            {session.is_guest ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                <ShieldAlert size={12} />
                Guest Account
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                <CheckCircle2 size={12} />
                Registered Member
              </span>
            )}
          </div>

          {session.email && (
            <p className="text-slate-500 text-xs mt-1.5">{session.email}</p>
          )}

          <p className="text-slate-400 text-xs mt-1">
            Member since {new Date(session.created_at).toLocaleDateString()}
          </p>

          {/* Upgrade / Account Action Banner */}
          {session.is_guest ? (
            <div className="mt-5 w-full bg-gradient-to-br from-rose-50/70 via-orange-50/70 to-amber-50/70 border border-[#fe3c72]/20 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5">
              <div className="flex items-center gap-1.5 text-[#fe3c72] font-bold text-xs">
                <Sparkles size={15} />
                <span>Keep your memes forever</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed max-w-md">
                Create an account to keep your liked memes, custom matches, and AI humor profile synced across devices.
              </p>
              <div className="flex gap-2 w-full pt-1 max-w-sm">
                <button
                  type="button"
                  onClick={() => openAuthModal('register')}
                  className="flex-1 py-2.5 px-3 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <UserPlus size={14} />
                  <span>Create Account</span>
                </button>
                <button
                  type="button"
                  onClick={() => openAuthModal('login')}
                  className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 active:scale-95 shadow-xs"
                >
                  <LogIn size={14} />
                  <span>Log In</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={logout}
                className="px-5 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-600 border border-slate-200 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 active:scale-95"
              >
                <LogOut size={14} />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
        
        <ProfileStats profile={profile} />
      </div>
    </div>
  );
}
