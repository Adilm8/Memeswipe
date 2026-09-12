import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MessageSquare, Search, UserPlus, Users, Loader2 } from 'lucide-react';
import ChatWindow from '@/components/ChatWindow';
import UserSearchModal from '@/components/UserSearchModal';
import { fetchConversations, fetchFriends } from '@/api/chat';
import { Conversation, FriendItem } from '@/api/types';

export default function ChatPage() {
  const { friendId } = useParams<{ friendId?: string }>();
  const navigate = useNavigate();
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!friendId) {
      setLoading(true);
      Promise.all([fetchConversations(), fetchFriends()])
        .then(([convs, frnds]) => {
          setConversations(convs);
          setFriends(frnds);
        })
        .catch(console.error)
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

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] overflow-y-auto">
      {/* Top Bar */}
      <div className="flex-none bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center text-white shadow-2xs">
            <MessageSquare size={20} />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">Direct Messages</h2>
            <p className="text-xs text-slate-500">Chat & share memes with your humor matches</p>
          </div>
        </div>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="px-4 py-2 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white rounded-full text-xs font-bold shadow-xs hover:opacity-95 flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Search size={14} />
          <span>Find Friends</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 max-w-4xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {loading ? (
          <div className="h-64 flex items-center justify-center">
            <Loader2 size={32} className="animate-spin text-[#fe3c72]" />
          </div>
        ) : friends.length === 0 && conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl mb-4 shadow-2xs">
              💬
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Conversations Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-6 leading-relaxed">
              Find friends by username, or match with users who like the same memes as you to start chatting!
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="px-5 py-2.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95"
              >
                <Search size={15} />
                <span>Search Users</span>
              </button>
              <button
                onClick={() => navigate('/matches')}
                className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-2xs flex items-center gap-2 transition-all"
              >
                <Users size={15} />
                <span>View Humor Twins</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Conversations Section */}
            {conversations.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 px-1">
                  Recent Conversations ({conversations.length})
                </h3>
                <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100 overflow-hidden shadow-xs">
                  {conversations.map((conv) => {
                    const pct = conv.compatibility > 1 ? Math.round(conv.compatibility) : Math.round(conv.compatibility * 100);
                    return (
                      <div
                        key={conv.friend_id}
                        onClick={() => navigate(`/chat/${conv.friend_id}`)}
                        className="p-4 flex items-center justify-between hover:bg-slate-50/80 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center text-white font-bold text-sm shadow-2xs">
                              {conv.avatar_url ? (
                                <img
                                  src={conv.avatar_url}
                                  alt={conv.nickname}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{conv.nickname.substring(0, 2).toUpperCase()}</span>
                              )}
                            </div>
                            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-sm text-slate-900 group-hover:text-[#fe3c72] transition-colors truncate">
                                {conv.nickname}
                              </h4>
                              {conv.username && (
                                <span className="text-xs text-slate-400 truncate">
                                  @{conv.username}
                                </span>
                              )}
                              <span className="px-2 py-0.2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-bold">
                                {pct}%
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {conv.last_message || 'Started a conversation'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-none">
                          {conv.unread_count > 0 && (
                            <span className="px-2 py-0.5 bg-[#fe3c72] text-white rounded-full text-[10px] font-bold shadow-xs">
                              {conv.unread_count} new
                            </span>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {conv.last_message_time
                              ? new Date(conv.last_message_time).toLocaleTimeString([], {
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

            {/* All Friends List */}
            {friends.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    All Friends ({friends.length})
                  </h3>
                  <button
                    onClick={() => setIsSearchOpen(true)}
                    className="text-xs font-bold text-[#fe3c72] hover:underline flex items-center gap-1"
                  >
                    <UserPlus size={13} />
                    <span>Add more</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {friends.map((f) => {
                    const pct = f.compatibility > 1 ? Math.round(f.compatibility) : Math.round(f.compatibility * 100);
                    return (
                      <div
                        key={f.user_id}
                        onClick={() => navigate(`/chat/${f.user_id}`)}
                        className="bg-white p-3.5 rounded-2xl border border-slate-200 hover:border-rose-300 hover:shadow-xs transition-all cursor-pointer flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs shadow-2xs flex-none">
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
                          <div className="min-w-0">
                            <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">
                              {f.nickname}
                            </h4>
                            <p className="text-[11px] text-slate-400 truncate">
                              @{f.username || 'user'} • {pct}% Match
                            </p>
                          </div>
                        </div>

                        <span className="px-2.5 py-1 bg-rose-50 text-[#fe3c72] hover:bg-[#fe3c72] hover:text-white rounded-xl text-xs font-bold transition-colors flex-none">
                          Chat
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
