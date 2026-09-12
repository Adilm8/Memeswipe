import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, User, Heart, Sparkles, LogIn, LogOut, Flame, Bot, Send, Loader2, RotateCcw } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { fetchMatches } from '@/api/profile';
import { chatWithAI } from '@/api/ai';
import { Match } from '@/api/types';
import AuthModal from '@/components/AuthModal';
import clsx from 'clsx';

const DEFAULT_COMPANION_MESSAGES: Array<{ id: string; sender: 'ai' | 'user'; text: string }> = [
  {
    id: '1',
    sender: 'ai',
    text: "Hey! 🤖 I'm your Meme Companion powered by Gemini. Swipe memes on the right, or pick a prompt below to roast your taste or analyze humor!"
  }
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, likesCount, openAuthModal, logout } = useSession();
  const [matches, setMatches] = useState<Match[]>([]);

  const companionKey = `memeswipe_companion_${session?.user_id || 'active'}`;

  // Live Gemini AI companion chat state with session persistence
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: 'ai' | 'user'; text: string }>>(() => {
    try {
      const stored = sessionStorage.getItem(companionKey) || localStorage.getItem(companionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_COMPANION_MESSAGES;
  });

  const [chatInput, setChatInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll chat to bottom
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiLoading]);

  // Sync stored messages when active session changes
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(companionKey) || localStorage.getItem(companionKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setChatMessages(parsed);
          return;
        }
      }
      setChatMessages(DEFAULT_COMPANION_MESSAGES);
    } catch (e) {}
  }, [companionKey]);

  // Persist messages whenever chatMessages changes
  useEffect(() => {
    try {
      sessionStorage.setItem(companionKey, JSON.stringify(chatMessages));
      localStorage.setItem(companionKey, JSON.stringify(chatMessages));
    } catch (e) {}
  }, [chatMessages, companionKey]);

  const handleClearCompanion = () => {
    setChatMessages(DEFAULT_COMPANION_MESSAGES);
    try {
      sessionStorage.removeItem(companionKey);
      localStorage.removeItem(companionKey);
    } catch (e) {}
  };

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
  const avatarUrl = session?.avatar_url;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || chatInput).trim();
    if (!text || isAiLoading) return;

    const userMsgId = Date.now().toString();
    setChatMessages(prev => [...prev, { id: userMsgId, sender: 'user', text }]);
    setChatInput('');
    setIsAiLoading(true);

    try {
      const reply = await chatWithAI(text);
      setChatMessages(prev => [
        ...prev,
        { id: (Date.now() + 1).toString(), sender: 'ai', text: reply }
      ]);
    } catch (err: any) {
      console.error('AI chat error:', err);
      setChatMessages(prev => [
        ...prev,
        { 
          id: (Date.now() + 1).toString(), 
          sender: 'ai', 
          text: "My meme neurons are currently cooling down! 🤖 Try asking again in a moment." 
        }
      ]);
    } finally {
      setIsAiLoading(false);
    }
  };

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
            <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center font-bold text-xs text-white shadow-2xs">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
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
      <aside className="hidden lg:flex w-[280px] lg:w-[290px] xl:w-[310px] bg-white border-r border-slate-200/90 flex-col flex-none z-30 shadow-2xs h-full">
        {/* Top Profile Header: Gradient Pink/Coral Bar */}
        <div className="flex-none h-16 bg-gradient-to-r from-[#fe3c72] via-[#ff655b] to-[#ff7854] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
          {/* User Profile Info (clickable to view Profile) */}
          <button 
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2.5 hover:opacity-90 transition-opacity text-left min-w-0"
          >
            <div className="relative flex-none">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-white/20 backdrop-blur-md border-2 border-white flex items-center justify-center font-bold text-sm text-white shadow-2xs">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white ${
                session?.is_guest ? 'bg-amber-300' : 'bg-emerald-400'
              }`} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-white text-xs truncate max-w-[115px]">
                  {displayName}
                </span>
                <span className="text-[10px] text-white/90 bg-black/15 px-1.5 py-0.2 rounded font-medium flex-none">
                  {likesCount} ❤️
                </span>
              </div>
              <span className="text-[10px] text-white/85 font-medium truncate">
                {session?.is_guest ? 'Guest Session' : 'My Profile'}
              </span>
            </div>
          </button>

          {/* Right Action: Auth button / settings */}
          <div className="flex items-center gap-1.5 flex-none">
            {session?.is_guest ? (
              <button
                onClick={() => openAuthModal('login')}
                className="px-2.5 py-1 bg-white hover:bg-white/95 text-[#fe3c72] rounded-full text-[11px] font-bold shadow-xs flex items-center gap-1 transition-all active:scale-95"
              >
                <LogIn size={12} strokeWidth={2.5} />
                <span>Log In</span>
              </button>
            ) : (
              <button
                onClick={logout}
                title="Log out"
                className="p-1.5 text-white/90 hover:text-white hover:bg-white/20 rounded-full transition-colors"
              >
                <LogOut size={15} strokeWidth={2.2} />
              </button>
            )}
          </div>
        </div>

        {/* Tinder "Discover Memes" Hero Card */}
        <div className="p-3 border-b border-slate-100">
          <button
            onClick={() => navigate('/')}
            className={clsx(
              "w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left group",
              isSwipingRoute
                ? "bg-gradient-to-r from-rose-50 to-orange-50 border-2 border-[#fe3c72]/30 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100/80 border border-slate-200"
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center text-lg transition-transform group-hover:scale-105 shadow-2xs flex-none",
              isSwipingRoute
                ? "bg-gradient-to-tr from-[#fe3c72] to-[#ff655b] text-white"
                : "bg-white border-2 border-[#fe3c72] text-[#fe3c72]"
            )}>
              🔥
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-900 group-hover:text-[#fe3c72] transition-colors">
                  Discover Memes
                </h4>
                {isSwipingRoute && (
                  <span className="w-2 h-2 rounded-full bg-[#fe3c72] animate-ping" />
                )}
              </div>
              <p className="text-[11px] text-slate-500 truncate mt-0.5">
                Swipe memes to find your taste twins!
              </p>
            </div>
          </button>
        </div>

        {/* Section Tabs (Matches / AI Analyst / Saved / Profile) */}
        <div className="flex items-center px-2 pt-2 pb-1 gap-1 border-b border-slate-100">
          <NavLink
            to="/matches"
            title="Humor Matches"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Heart size={13} strokeWidth={2.4} />
            <span className="truncate">Matches</span>
            {matches.length > 0 && (
              <span className="px-1 py-0.1 bg-[#fe3c72] text-white rounded-full text-[9px] font-bold">
                {matches.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/ai"
            title="AI Analyst"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Sparkles size={13} strokeWidth={2.4} />
            <span className="truncate">Analyst</span>
          </NavLink>

          <NavLink
            to="/saved"
            title="Saved Memes"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Bookmark size={13} strokeWidth={2.4} />
            <span className="truncate">Saved</span>
          </NavLink>

          <NavLink
            to="/profile"
            title="My Profile"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-1 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <User size={13} strokeWidth={2.4} />
            <span className="truncate">Profile</span>
          </NavLink>
        </div>

        {/* ========================================================= */}
        {/* LOWER SIDEBAR: AI MEME COMPANION CHAT (Powered by Gemini) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
          {/* AI Header */}
          <div className="p-3 pb-2 border-b border-slate-100 flex items-center justify-between bg-white/70">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center text-white shadow-2xs">
                <Bot size={14} />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <span>Meme Companion</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </h4>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleClearCompanion}
                title="Reset companion conversation"
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <RotateCcw size={12} />
              </button>
              <span className="text-[10px] font-extrabold uppercase tracking-wide bg-rose-50 text-[#fe3c72] border border-rose-200/80 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkles size={10} />
                Gemini AI
              </span>
            </div>
          </div>

          {/* Quick Prompt Suggestion Chips */}
          <div className="px-3 pt-2 pb-1.5 flex gap-1.5 overflow-x-auto no-scrollbar border-b border-slate-100/60 bg-white/40">
            <button
              type="button"
              disabled={isAiLoading}
              onClick={() => handleSendMessage("🎭 Roast my humor taste")}
              className="text-[10px] font-semibold bg-white hover:bg-rose-50 text-slate-600 hover:text-[#fe3c72] border border-slate-200/80 hover:border-rose-200 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
            >
              🎭 Roast taste
            </button>
            <button
              type="button"
              disabled={isAiLoading}
              onClick={() => handleSendMessage("✨ What's my humor style based on my likes?")}
              className="text-[10px] font-semibold bg-white hover:bg-rose-50 text-slate-600 hover:text-[#fe3c72] border border-slate-200/80 hover:border-rose-200 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
            >
              ✨ My style
            </button>
            <button
              type="button"
              disabled={isAiLoading}
              onClick={() => handleSendMessage("😂 Tell me a top tier meme joke")}
              className="text-[10px] font-semibold bg-white hover:bg-rose-50 text-slate-600 hover:text-[#fe3c72] border border-slate-200/80 hover:border-rose-200 rounded-full px-2.5 py-1 whitespace-nowrap transition-colors shadow-2xs disabled:opacity-50"
            >
              😂 Joke
            </button>
          </div>

          {/* Scrollable Conversation Bubbles */}
          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center text-white flex-none text-[11px] shadow-2xs">
                    🤖
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white font-medium rounded-tr-xs shadow-xs'
                      : 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-xs shadow-2xs whitespace-pre-line'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {isAiLoading && (
              <div className="flex gap-2 justify-start items-center">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center text-white flex-none text-[11px] shadow-2xs">
                  🤖
                </div>
                <div className="bg-white border border-slate-200/80 rounded-2xl px-3 py-2 flex items-center gap-2 shadow-2xs text-slate-500">
                  <Loader2 size={13} className="animate-spin text-[#fe3c72]" />
                  <span className="text-[11px] font-medium text-slate-600">Gemini is thinking...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input Bar */}
          <div className="p-2.5 bg-white border-t border-slate-100 flex items-center gap-1.5">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder={isAiLoading ? "Waiting for Gemini..." : "Ask Meme AI..."}
              disabled={isAiLoading}
              className="flex-1 px-3 py-2 text-xs bg-slate-100/80 border border-slate-200/60 rounded-xl focus:outline-none focus:bg-white focus:border-[#fe3c72] transition-colors disabled:opacity-60"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim() || isAiLoading}
              className="p-2 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white rounded-xl hover:opacity-90 transition-all disabled:opacity-30 active:scale-95 shadow-2xs"
              title="Send message"
            >
              {isAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            </button>
          </div>
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
