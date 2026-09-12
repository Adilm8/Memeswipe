import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Users, Search, UserPlus, Flame, Sparkles, MessageCircle, Heart, ArrowRight, Loader2 } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import UserSearchModal from '@/components/UserSearchModal';
import { fetchFriends, addFriend } from '@/api/chat';
import { fetchMatches } from '@/api/profile';
import { FriendItem, Match } from '@/api/types';

export default function ChatPage() {
  const { friendId } = useParams<{ friendId?: string }>();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingFriendId, setAddingFriendId] = useState<string | null>(null);

  useEffect(() => {
    if (!friendId) {
      setLoading(true);
      Promise.all([
        fetchFriends().catch(() => [] as FriendItem[]),
        fetchMatches().catch(() => [] as Match[])
      ])
        .then(([frnds, mtchs]) => {
          setFriends(frnds);
          setMatches(mtchs);
        })
        .finally(() => setLoading(false));
    }
  }, [friendId, isSearchOpen]);

  if (friendId) {
    return (
      <ChatWindow 
        friendId={friendId} 
        onBack={() => navigate('/chat')} 
      />
    );
  }

  const totalUnread = friends.reduce((acc, f) => acc + (f.unread_count || 0), 0);
  const friendUserIds = new Set(friends.map(f => f.user_id));

  const handleConnectAndChat = async (userId: string) => {
    setAddingFriendId(userId);
    try {
      if (!friendUserIds.has(userId)) {
        await addFriend(userId);
      }
      navigate(`/chat/${userId}`);
    } catch (e) {
      console.error("Failed to add friend:", e);
      navigate(`/chat/${userId}`);
    } finally {
      setAddingFriendId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-y-auto">
      {/* Top Header Bar */}
      <div className="flex-none bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-[#fe3c72] flex items-center justify-center text-white shadow-2xs">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-slate-900 flex items-center gap-2">
              <span>Social Lounge</span>
              {totalUnread > 0 && (
                <span className="px-2 py-0.2 bg-[#fe3c72] text-white rounded-full text-[10px] font-bold">
                  {totalUnread} new
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500">Connect with humor twins & share memes directly</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-3.5 py-2 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
          >
            <UserPlus size={14} />
            <span className="hidden sm:inline">Find Friends</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {/* Main Social Hub Content */}
      <div className="flex-1 max-w-5xl w-full mx-auto p-4 sm:p-6 space-y-6 pb-20">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#fe3c72]" />
          </div>
        ) : (
          <>
            {/* Mobile-Only Friends Quick Row (< lg screens where sidebar is hidden) */}
            {friends.length > 0 && (
              <div className="lg:hidden bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center justify-between mb-2 px-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Quick Chat ({friends.length})
                  </span>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="text-xs font-bold text-[#fe3c72] flex items-center gap-1 cursor-pointer"
                  >
                    <UserPlus size={12} />
                    <span>Add</span>
                  </button>
                </div>
                <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-1">
                  {friends.map((f) => (
                    <button
                      key={`mob-${f.user_id}`}
                      onClick={() => navigate(`/chat/${f.user_id}`)}
                      className="flex flex-col items-center gap-1 flex-none group cursor-pointer"
                    >
                      <div className="relative">
                        <div className="w-11 h-11 rounded-full p-0.5 bg-[#fe3c72]">
                          <div className="w-full h-full rounded-full overflow-hidden bg-white flex items-center justify-center text-xs font-bold text-slate-700">
                            {f.avatar_url ? (
                              <img src={f.avatar_url} alt={f.nickname} className="w-full h-full object-cover" />
                            ) : (
                              <span>{f.nickname.substring(0, 2).toUpperCase()}</span>
                            )}
                          </div>
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
                        {f.unread_count > 0 && (
                          <span className="absolute -top-1 -right-1 px-1 bg-[#fe3c72] text-white rounded-full text-[9px] font-extrabold border border-white">
                            {f.unread_count}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] font-medium text-slate-600 truncate max-w-[55px]">
                        {f.nickname.split(' ')[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-[#fe3c72] flex-none">
                  <Users size={22} />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-900">{friends.length}</div>
                  <div className="text-xs text-slate-500">Connected Friends</div>
                </div>
              </div>

              <div 
                onClick={() => navigate('/matches')}
                className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center justify-between cursor-pointer hover:border-rose-300 transition-colors group"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 flex-none">
                    <Heart size={22} />
                  </div>
                  <div>
                    <div className="text-xl font-extrabold text-slate-900 flex items-center gap-1.5">
                      <span>{matches.length}</span>
                      <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded-full">
                        Twins
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">Humor Taste Matches</div>
                  </div>
                </div>
                <ArrowRight size={16} className="text-slate-400 group-hover:text-[#fe3c72] group-hover:translate-x-0.5 transition-all" />
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 flex-none">
                  <MessageCircle size={22} />
                </div>
                <div>
                  <div className="text-xl font-extrabold text-slate-900">{totalUnread}</div>
                  <div className="text-xs text-slate-500">Unread Messages</div>
                </div>
              </div>
            </div>

            {/* Suggested Humor Twins to Connect With */}
            <div>
              <div className="flex items-center justify-between mb-3 px-1">
                <div>
                  <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-1.5">
                    <span>Suggested Humor Twins</span>
                    <span className="text-[11px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">
                      High Compatibility
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">Users who laughed at the exact same memes you loved</p>
                </div>

                <button
                  onClick={() => navigate('/matches')}
                  className="text-xs font-bold text-[#fe3c72] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight size={13} />
                </button>
              </div>

              {matches.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-6 text-center shadow-2xs">
                  <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-2xl mx-auto mb-2 border border-rose-100">
                    🔥
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 mb-1">Swipe More Memes to Find Twins</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                    As you like and save memes, our algorithm pairs you with users who share your exact comedic frequency.
                  </p>
                  <button
                    onClick={() => navigate('/')}
                    className="px-4 py-2 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    Start Swiping
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {matches.slice(0, 4).map((m) => {
                    const pct = Math.round(m.similarity_score > 1 ? m.similarity_score : m.similarity_score * 100);
                    const isFriend = friendUserIds.has(m.user_id);
                    const isAdding = addingFriendId === m.user_id;

                    return (
                      <div
                        key={m.user_id}
                        className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-xs transition-shadow flex flex-col justify-between gap-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-11 h-11 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-none">
                              {m.avatar_url ? (
                                <img src={m.avatar_url} alt={m.nickname} className="w-full h-full object-cover" />
                              ) : (
                                <span>{m.nickname.substring(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-sm text-slate-800 truncate">
                                {m.nickname}
                              </h4>
                              <p className="text-xs text-slate-400 truncate">
                                {m.bio || `${m.shared_memes_count} mutual memes`}
                              </p>
                            </div>
                          </div>

                          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200/80 rounded-full text-xs font-extrabold flex-none">
                            {pct}% Match
                          </span>
                        </div>

                        {/* Humor Compatibility Progress Indicator */}
                        <div className="space-y-1">
                          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                            <div 
                              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100">
                          {isFriend ? (
                            <button
                              onClick={() => navigate(`/chat/${m.user_id}`)}
                              className="w-full py-2 bg-rose-50 hover:bg-rose-100/80 text-[#fe3c72] rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <MessageCircle size={14} />
                              <span>Open Chat</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleConnectAndChat(m.user_id)}
                              disabled={isAdding}
                              className="w-full py-2 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer disabled:opacity-50"
                            >
                              {isAdding ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <UserPlus size={14} />
                              )}
                              <span>Connect & Chat</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Feature Spotlight: Social & Meme Sharing */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-3">
              <div className="flex items-center gap-2 text-[#fe3c72] font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>Feature Spotlight</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900">
                Share Memes Directly in Conversations
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
                Tired of copying image links? When chatting with any friend, click the <strong>📎 Share Meme</strong> button next to the message input. You can pick directly from your <strong>Saved Memes</strong> collection or grab any fresh <strong>Trending Meme</strong> with 1-click!
              </p>
              <div className="pt-2 flex flex-wrap gap-2.5">
                <button
                  onClick={() => setIsSearchOpen(true)}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Search size={13} />
                  <span>Search User Directory</span>
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="px-4 py-2 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <Flame size={13} />
                  <span>Discover More Memes</span>
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <UserSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenChat={(id) => {
          setIsSearchOpen(false);
          navigate(`/chat/${id}`);
        }}
      />
    </div>
  );
}
