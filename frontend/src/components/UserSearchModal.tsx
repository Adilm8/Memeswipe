import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, UserPlus, Check, MessageSquare, Loader2, Sparkles } from 'lucide-react';
import { searchUsers, addFriend } from '@/api/chat';
import { UserSearchResult } from '@/api/types';
import { useNavigate } from 'react-router-dom';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat?: (friendId: string) => void;
}

export default function UserSearchModal({ isOpen, onClose, onOpenChat }: Props) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    if (!isOpen) {
      setQuery('');
      setResults([]);
      return;
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(() => {
      searchUsers(trimmed)
        .then((res) => setResults(res))
        .catch((err) => console.error("Failed to search users:", err))
        .finally(() => setLoading(false));
    }, 280);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const handleAddFriend = async (userId: string) => {
    setAddingId(userId);
    try {
      await addFriend(userId);
      setAddedIds((prev) => new Set([...prev, userId]));
    } catch (err) {
      console.error("Failed to add friend:", err);
    } finally {
      setAddingId(null);
    }
  };

  const handleStartChat = (userId: string) => {
    onClose();
    if (onOpenChat) {
      onOpenChat(userId);
    } else {
      navigate(`/chat/${userId}`);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
        >
          {/* Header */}
          <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#fe3c72] flex items-center justify-center text-white shadow-2xs">
                <Search size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Find Friends & Taste Twins</h3>
                <p className="text-xs text-slate-500">Search users by username or nickname</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Search Input Bar */}
          <div className="p-4 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Type username (e.g. elena, dave, sunny)..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-100/80 border border-slate-200 rounded-2xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#fe3c72] transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Results List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2.5 min-h-[220px]">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400 gap-2">
                <Loader2 size={24} className="animate-spin text-[#fe3c72]" />
                <span className="text-xs font-medium">Scanning comedy frequencies...</span>
              </div>
            ) : query.trim() && results.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-xl mb-2">
                  🔍
                </div>
                <p className="text-xs font-semibold text-slate-600">No users found</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Try searching for elena, dave, vitalik, sunny, or zoe</p>
              </div>
            ) : !query.trim() ? (
              <div className="flex flex-col items-center justify-center h-44 text-slate-400 text-center px-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-xl mb-2 text-[#fe3c72]">
                  ✨
                </div>
                <p className="text-xs font-semibold text-slate-700">Search for friends</p>
                <p className="text-[11px] text-slate-400 mt-0.5">Connect with meme creators and humor twins to share jokes directly</p>
              </div>
            ) : (
              results.map((user) => {
                const isFriend = user.is_friend || addedIds.has(user.user_id);
                const isAdding = addingId === user.user_id;

                return (
                  <div
                    key={user.user_id}
                    className="p-3 bg-white hover:bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between gap-3 transition-colors shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-11 h-11 rounded-full overflow-hidden bg-[#fe3c72] flex items-center justify-center text-white font-bold text-sm flex-none shadow-2xs">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.nickname} className="w-full h-full object-cover" />
                        ) : (
                          user.nickname.substring(0, 2).toUpperCase()
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                            {user.nickname}
                          </h4>
                          {user.username && (
                            <span className="text-[11px] text-slate-400 font-normal truncate">
                              @{user.username}
                            </span>
                          )}
                          <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Sparkles size={9} />
                            {user.compatibility}% Match
                          </span>
                        </div>
                        {user.bio && (
                          <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                            {user.bio}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1.5 flex-none">
                      {isFriend ? (
                        <>
                          <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-xl flex items-center gap-1">
                            <Check size={12} />
                            Friends
                          </span>
                          <button
                            onClick={() => handleStartChat(user.user_id)}
                            title="Open Chat"
                            className="px-2.5 py-1 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl transition-all shadow-2xs active:scale-95 flex items-center gap-1 text-xs font-bold cursor-pointer"
                          >
                            <MessageSquare size={13} />
                            <span>Chat</span>
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleAddFriend(user.user_id)}
                          disabled={isAdding}
                          className="px-3 py-1.5 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {isAdding ? (
                            <Loader2 size={12} className="animate-spin" />
                          ) : (
                            <UserPlus size={13} />
                          )}
                          <span>Add Friend</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
