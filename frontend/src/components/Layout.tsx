import { useState, useEffect, useRef, useCallback } from 'react';
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Heart, Sparkles, LogIn, LogOut, Flame, Bot, Send, Loader2, RotateCcw, Users, UserPlus } from 'lucide-react';
import { useSession } from '@/hooks/useSession';
import { fetchMatches } from '@/api/profile';
import { chatWithAI } from '@/api/ai';
import { fetchFriends } from '@/api/chat';
import { Match, FriendItem } from '@/api/types';
import AuthModal from '@/components/AuthModal';
import UserSearchModal from '@/components/UserSearchModal';
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
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [sidebarTab, setSidebarTab] = useState<'chats' | 'ai'>('chats');

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

  // Load and poll friends & chats for sidebar & unread badges
  const loadFriends = useCallback(async () => {
    if (session) {
      try {
        const list = await fetchFriends();
        setFriends(list);
      } catch (e) {
        console.error("Failed to load friends for sidebar:", e);
      }
    }
  }, [session]);

  useEffect(() => {
    loadFriends();
    const interval = setInterval(loadFriends, 3500);
    return () => clearInterval(interval);
  }, [loadFriends]);

  const totalUnread = friends.reduce((acc, f) => acc + (f.unread_count || 0), 0);

  const isSwipingRoute = location.pathname === '/';
  const isSocialActive = location.pathname.startsWith('/chat') || location.pathname.startsWith('/social');
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
    <div className="flex flex-col lg:flex-row h-screen h-[100dvh] w-screen bg-[#f0f2f5] text-slate-800 font-sans overflow-hidden select-none">
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
            <div className="w-8 h-8 rounded-full overflow-hidden bg-[#fe3c72] flex items-center justify-center font-bold text-xs text-white shadow-2xs">
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
          <span className="font-bold text-xs text-slate-800 truncate max-w-[65px] xs:max-w-[90px] sm:max-w-[130px]">
            {displayName}
          </span>
        </button>

        {/* Center: Memeswipe Logo / Direct link to Swipe */}
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 font-extrabold text-sm sm:text-base tracking-tight text-[#fe3c72] hover:opacity-90 transition-opacity flex-none"
        >
          <img src="/favicon-32x32.png" alt="Memeswipe" className="w-5 h-5 object-contain flex-none" />
          <span>Memeswipe</span>
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
            to="/chat"
            title="Social & Friends"
            className={clsx(
              "p-2 rounded-xl transition-all relative",
              isSocialActive ? "text-[#fe3c72] bg-rose-50 font-bold" : "text-slate-400 hover:text-slate-700"
            )}
          >
            <Users size={19} strokeWidth={2.4} />
            {totalUnread > 0 && (
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
              className="ml-1 px-2.5 py-1 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-full text-[11px] font-bold shadow-2xs transition-colors"
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
        {/* Top Profile Header: Solid Coral Bar */}
        <div className="flex-none h-16 bg-[#fe3c72] px-3.5 py-2.5 flex items-center justify-between shadow-xs">
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
                ? "bg-rose-50 border-2 border-[#fe3c72]/40 shadow-2xs"
                : "bg-slate-50 hover:bg-slate-100/80 border border-slate-200"
            )}
          >
            <div className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-105 shadow-2xs flex-none p-1.5",
              isSwipingRoute
                ? "bg-[#fe3c72]"
                : "bg-white border-2 border-[#fe3c72]"
            )}>
              <img src="/favicon-32x32.png" alt="Memeswipe" className="w-full h-full object-contain" />
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

        {/* Section Tabs (Matches / Social / AI Analyst / Saved) */}
        <div className="flex items-center px-1.5 pt-2 pb-1 gap-1 border-b border-slate-100 overflow-x-auto no-scrollbar">
          <NavLink
            to="/matches"
            title="Humor Matches"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-0.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Heart size={12} strokeWidth={2.4} />
            <span className="truncate">Matches</span>
            {matches.length > 0 && (
              <span className="px-1 py-0.1 bg-[#fe3c72] text-white rounded-full text-[9px] font-bold">
                {matches.length}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/chat"
            title="Social & Friends"
            className={clsx(
              "flex-1 py-1.5 px-0.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all relative",
              isSocialActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Users size={12} strokeWidth={2.4} />
            <span className="truncate">Social</span>
            {totalUnread > 0 && (
              <span className="px-1 py-0.1 bg-[#fe3c72] text-white rounded-full text-[9px] font-bold">
                {totalUnread}
              </span>
            )}
          </NavLink>

          <NavLink
            to="/ai"
            title="AI Analyst"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-0.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Sparkles size={12} strokeWidth={2.4} />
            <span className="truncate">Analyst</span>
          </NavLink>

          <NavLink
            to="/saved"
            title="Saved Memes"
            className={({ isActive }) => clsx(
              "flex-1 py-1.5 px-0.5 rounded-xl text-[10px] font-bold flex items-center justify-center gap-1 transition-all",
              isActive 
                ? "text-[#fe3c72] bg-rose-50 border-b-2 border-[#fe3c72]"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            )}
          >
            <Bookmark size={12} strokeWidth={2.4} />
            <span className="truncate">Saved</span>
          </NavLink>
        </div>

        {/* ========================================================= */}
        {/* LOWER SIDEBAR: DUAL MODE (DIRECT CHATS or MEME AI COMPANION) */}
        {/* ========================================================= */}
        <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50">
          {/* Segmented Switch Header */}
          <div className="p-2 border-b border-slate-100 bg-white/70 flex items-center justify-between gap-1.5">
            <div className="flex-1 bg-slate-100/90 p-0.5 rounded-xl flex">
              <button
                type="button"
                onClick={() => setSidebarTab('chats')}
                className={clsx(
                  "flex-1 py-1 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                  sidebarTab === 'chats'
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Users size={12} />
                <span>Friends</span>
                {totalUnread > 0 && (
                  <span className="px-1 py-0.2 bg-[#fe3c72] text-white text-[9px] font-extrabold rounded-full leading-none">
                    {totalUnread}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setSidebarTab('ai')}
                className={clsx(
                  "flex-1 py-1 px-1.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1",
                  sidebarTab === 'ai'
                    ? "bg-white text-slate-800 shadow-2xs"
                    : "text-slate-500 hover:text-slate-800"
                )}
              >
                <Bot size={12} />
                <span>Meme AI</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            </div>

            {sidebarTab === 'chats' ? (
              <button
                type="button"
                onClick={() => setIsSearchOpen(true)}
                title="Add Friends"
                className="p-1.5 text-[#fe3c72] hover:bg-rose-50 border border-rose-200/80 rounded-xl transition-colors flex-none"
              >
                <UserPlus size={13} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleClearCompanion}
                title="Reset companion conversation"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex-none"
              >
                <RotateCcw size={13} />
              </button>
            )}
          </div>

          {/* MODE 1: SOCIAL FRIENDS & CHATS DRAWER */}
          {sidebarTab === 'chats' ? (
            <div className="flex-1 flex flex-col min-h-0">
              {friends.length === 0 ? (
                <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
                  <div className="w-11 h-11 rounded-2xl bg-rose-50 flex items-center justify-center text-xl mb-2 border border-rose-100">
                    👥
                  </div>
                  <h5 className="text-xs font-bold text-slate-700 mb-0.5">No Friends Yet</h5>
                  <p className="text-[11px] text-slate-400 mb-3 max-w-[180px]">
                    Find friends by username or connect with humor twins to chat!
                  </p>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="px-3 py-1.5 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <UserPlus size={12} />
                    <span>Find Friends</span>
                  </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  {/* Social Media Stories / Active Friends Row */}
                  <div className="flex-none p-2.5 border-b border-slate-100 bg-white/40 overflow-x-auto no-scrollbar flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setIsSearchOpen(true)}
                      className="flex flex-col items-center gap-1 group flex-none cursor-pointer"
                      title="Find & Add Friends"
                    >
                      <div className="w-10 h-10 rounded-full border-2 border-dashed border-rose-300 group-hover:border-[#fe3c72] group-hover:bg-rose-50/50 flex items-center justify-center text-[#fe3c72] transition-all">
                        <UserPlus size={14} />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-500 group-hover:text-[#fe3c72]">Add</span>
                    </button>

                    {friends.map((f) => {
                      const isCurrent = location.pathname === `/chat/${f.user_id}`;
                      const pct = Math.round(f.compatibility > 1 ? f.compatibility : f.compatibility * 100);
                      return (
                        <button
                          key={`story-${f.user_id}`}
                          type="button"
                          onClick={() => navigate(`/chat/${f.user_id}`)}
                          className="flex flex-col items-center gap-1 group flex-none cursor-pointer text-left"
                          title={`${f.nickname} (${pct}% match)`}
                        >
                          <div className="relative">
                            <div className={clsx(
                              "w-10 h-10 rounded-full p-0.5 transition-transform group-hover:scale-105",
                              isCurrent 
                                ? "bg-[#fe3c72] shadow-xs" 
                                : "bg-slate-200 group-hover:bg-[#fe3c72]/50"
                            )}>
                              <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center text-xs font-bold text-slate-700">
                                {f.avatar_url ? (
                                  <img src={f.avatar_url} alt={f.nickname} className="w-full h-full object-cover" />
                                ) : (
                                  <span>{f.nickname.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                            </div>
                            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                          </div>
                          <span className="text-[10px] font-medium text-slate-600 group-hover:text-slate-900 truncate max-w-[48px] text-center">
                            {f.nickname.split(' ')[0]}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Friends & Chats Vertical List */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100/80">
                    {friends.map((f) => {
                      const isCurrentChat = location.pathname === `/chat/${f.user_id}`;
                      const pct = Math.round(f.compatibility > 1 ? f.compatibility : f.compatibility * 100);

                      return (
                        <div
                          key={f.user_id}
                          onClick={() => navigate(`/chat/${f.user_id}`)}
                          className={clsx(
                            "p-2.5 px-3 flex items-center justify-between cursor-pointer transition-colors group",
                            isCurrentChat ? "bg-rose-50/80 border-l-3 border-[#fe3c72]" : "hover:bg-white"
                          )}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="relative flex-none">
                              <div className="w-9 h-9 rounded-full overflow-hidden bg-[#fe3c72] flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                                {f.avatar_url ? (
                                  <img
                                    src={f.avatar_url}
                                    alt={f.nickname}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <span>{f.nickname.substring(0, 2).toUpperCase()}</span>
                                )}
                              </div>
                              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white bg-emerald-500" />
                            </div>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5">
                                <h5 className="text-xs font-bold text-slate-800 group-hover:text-[#fe3c72] transition-colors truncate">
                                  {f.nickname}
                                </h5>
                                <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 border border-emerald-200/60 px-1 py-0.2 rounded-full flex-none">
                                  {pct}%
                                </span>
                              </div>
                              <p className={clsx(
                                "text-[11px] truncate mt-0.5",
                                f.unread_count > 0 ? "font-semibold text-slate-800" : "text-slate-400"
                              )}>
                                {f.last_message || "Say hello 👋"}
                              </p>
                            </div>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-none ml-2">
                            {f.unread_count > 0 && (
                              <span className="px-1.5 py-0.2 bg-[#fe3c72] text-white rounded-full text-[9px] font-bold shadow-2xs">
                                {f.unread_count}
                              </span>
                            )}
                            <span className="text-[9px] text-slate-400">
                              {f.last_message_time
                                ? new Date(f.last_message_time).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })
                                : ''}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* MODE 2: AI COMPANION (Gemini) */
            <div className="flex-1 flex flex-col min-h-0">
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
                      <div className="w-6 h-6 rounded-full bg-[#fe3c72] flex items-center justify-center text-white flex-none text-[11px] shadow-2xs">
                        🤖
                      </div>
                    )}
                    <div
                      className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-[#fe3c72] text-white font-medium rounded-tr-xs shadow-xs'
                          : 'bg-white border border-slate-200/80 text-slate-700 rounded-tl-xs shadow-2xs whitespace-pre-line'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isAiLoading && (
                  <div className="flex gap-2 justify-start items-center">
                    <div className="w-6 h-6 rounded-full bg-[#fe3c72] flex items-center justify-center text-white flex-none text-[11px] shadow-2xs">
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
                  className="p-2 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl transition-all disabled:opacity-30 active:scale-95 shadow-2xs"
                  title="Send message"
                >
                  {isAiLoading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN STAGE: Full Viewport on Mobile, Right Panel on Desktop */}
      {/* ========================================================= */}
      <main className="flex-1 min-h-0 h-full relative overflow-hidden flex flex-col bg-[#f0f2f5]">
        <Outlet />
      </main>

      {/* Global User Search Modal */}
      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenChat={(uid) => {
          setIsSearchOpen(false);
          navigate(`/chat/${uid}`);
        }}
      />
    </div>
  );
}
