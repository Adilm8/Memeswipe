import { useSession } from '@/hooks/useSession';
import ProfileStats from '@/components/ProfileStats';
import { Loader2, Sparkles, UserPlus, LogIn, LogOut, CheckCircle2, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { session, profile, openAuthModal, logout } = useSession();

  if (!profile || !session) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="animate-spin text-rose-500" />
      </div>
    );
  }

  const displayName = session.username || session.nickname;
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <div className="p-6 overflow-y-auto h-full pb-24">
      <div className="flex flex-col items-center mt-2 max-w-lg mx-auto">
        {/* Avatar */}
        <div className="relative">
          <div className={`w-24 h-24 rounded-full flex items-center justify-center shadow-lg border-4 border-slate-800 ${
            session.is_guest 
              ? 'bg-gradient-to-br from-amber-500 to-orange-600' 
              : 'bg-gradient-to-br from-indigo-500 to-purple-600'
          }`}>
            <span className="text-3xl font-bold text-white">{initials}</span>
          </div>
        </div>

        {/* User Identity */}
        <h2 className="mt-3 text-2xl font-bold text-white tracking-tight">{displayName}</h2>
        
        {/* Account Type Badge */}
        <div className="mt-2 flex items-center gap-1.5">
          {session.is_guest ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-300 border border-amber-500/20">
              <ShieldAlert size={12} />
              Guest Account
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <CheckCircle2 size={12} />
              Registered Member
            </span>
          )}
        </div>

        {session.email && (
          <p className="text-slate-400 text-xs mt-1">{session.email}</p>
        )}

        <p className="text-slate-500 text-xs mt-1">
          Member since {new Date(session.created_at).toLocaleDateString()}
        </p>

        {/* Upgrade / Account Action Banner */}
        {session.is_guest ? (
          <div className="mt-4 w-full bg-gradient-to-br from-amber-500/10 via-orange-500/10 to-rose-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center text-center gap-2.5">
            <div className="flex items-center gap-1.5 text-amber-300 font-semibold text-xs">
              <Sparkles size={15} />
              <span>Keep your memes forever</span>
            </div>
            <p className="text-xs text-slate-300/90 leading-relaxed">
              Create an account to keep your liked memes, custom matches, and AI humor profile synced across devices.
            </p>
            <div className="flex gap-2 w-full pt-1">
              <button
                type="button"
                onClick={() => openAuthModal('register')}
                className="flex-1 py-2 px-3 bg-gradient-to-r from-rose-500 to-orange-500 hover:from-rose-600 hover:to-orange-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-rose-500/20 transition-all flex items-center justify-center gap-1.5"
              >
                <UserPlus size={14} />
                <span>Create Account</span>
              </button>
              <button
                type="button"
                onClick={() => openAuthModal('login')}
                className="py-2 px-4 bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
              >
                <LogIn size={14} />
                <span>Log In</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-4 flex items-center gap-2">
            <button
              type="button"
              onClick={logout}
              className="px-4 py-2 bg-slate-800/80 hover:bg-rose-500/20 hover:text-rose-400 text-slate-300 border border-slate-700 rounded-xl text-xs font-medium transition-all flex items-center gap-1.5"
            >
              <LogOut size={14} />
              <span>Log Out</span>
            </button>
          </div>
        )}
      </div>
      
      <div className="max-w-xl mx-auto mt-6">
        <ProfileStats profile={profile} />
      </div>
    </div>
  );
}
