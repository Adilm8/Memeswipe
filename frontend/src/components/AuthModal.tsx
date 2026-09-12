import React, { useState, useEffect } from 'react';
import { X, Lock, User, Mail, Eye, EyeOff, Loader2, Sparkles, LogIn, UserPlus } from 'lucide-react';
import { useSessionContext } from '@/context/SessionContext';

export default function AuthModal() {
  const {
    isAuthModalOpen,
    authModalMode,
    openAuthModal,
    closeAuthModal,
    login,
    register,
    continueAsGuest,
    session,
  } = useSessionContext();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens or mode changes
  useEffect(() => {
    if (isAuthModalOpen) {
      setError(null);
      setPassword('');
    }
  }, [isAuthModalOpen, authModalMode, session]);

  if (!isAuthModalOpen) return null;

  const isLogin = authModalMode === 'login';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUsername = username.trim();
    if (!trimmedUsername) {
      setError('Please enter a username.');
      return;
    }
    if (!password) {
      setError('Please enter a password.');
      return;
    }
    if (!isLogin && password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (isLogin) {
        await login({ username: trimmedUsername, password });
      } else {
        await register({
          username: trimmedUsername,
          password,
          email: email.trim() ? email.trim() : undefined,
        });
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      {/* Modal Container */}
      <div 
        className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header with Close */}
        <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#fe3c72] flex items-center justify-center text-sm shadow-xs text-white">
              🔥
            </div>
            <h3 className="font-extrabold text-lg text-slate-900">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h3>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Guest conversion banner when registering */}
        {!isLogin && session?.is_guest && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
            <Sparkles size={16} className="text-amber-500 flex-shrink-0 mt-0.5" />
            <span>
              Your current guest likes and saved memes will automatically be linked to your new account!
            </span>
          </div>
        )}

        {/* Tab switchers */}
        <div className="flex px-6 pt-4 gap-2">
          <button
            type="button"
            onClick={() => {
              setError(null);
              openAuthModal('login');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              isLogin
                ? 'bg-slate-100 text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <LogIn size={14} />
            Log In
          </button>
          <button
            type="button"
            onClick={() => {
              setError(null);
              openAuthModal('register');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all ${
              !isLogin
                ? 'bg-slate-100 text-slate-900 shadow-xs border border-slate-200'
                : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <UserPlus size={14} />
            Sign Up
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-600 font-medium leading-relaxed">
              {error}
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Username</label>
            <div className="relative">
              <User size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fe3c72] focus:bg-white transition-colors"
                autoComplete={isLogin ? "username" : "new-username"}
                required
              />
            </div>
          </div>

          {/* Optional Email Input (Registration Only) */}
          {!isLogin && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-700 block">Email</label>
                <span className="text-[11px] text-slate-400 font-medium">Optional</span>
              </div>
              <div className="relative">
                <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-4 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fe3c72] focus:bg-white transition-colors"
                  autoComplete="email"
                />
              </div>
            </div>
          )}

          {/* Password Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 block">Password</label>
            <div className="relative">
              <Lock size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isLogin ? 'Enter your password' : 'At least 6 characters'}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-11 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#fe3c72] focus:bg-white transition-colors"
                autoComplete={isLogin ? "current-password" : "new-password"}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full mt-2 py-3 px-4 bg-[#fe3c72] hover:bg-[#e02d60] text-white font-bold rounded-xl text-sm shadow-md shadow-rose-500/20 disabled:opacity-50 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                {isLogin ? 'Logging in...' : 'Creating account...'}
              </>
            ) : (
              isLogin ? 'Log In' : 'Create Account'
            )}
          </button>

          {/* Continue as Guest option */}
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={continueAsGuest}
              className="text-xs text-slate-500 hover:text-slate-800 hover:underline transition-colors"
            >
              Continue exploring as guest →
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
