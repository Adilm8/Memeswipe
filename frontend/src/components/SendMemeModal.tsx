import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Check, Search, MessageSquare, Loader2 } from 'lucide-react';
import { fetchFriends, sendMessage } from '@/api/chat';
import { FriendItem, Meme } from '@/api/types';
import { useNavigate } from 'react-router-dom';

interface SendMemeModalProps {
  meme: Meme | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SendMemeModal({
  meme,
  isOpen,
  onClose,
  onSuccess,
}: SendMemeModalProps) {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<FriendItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setSelectedFriendId(null);
      setCustomNote('');
      setSentSuccess(false);
      setSearchQuery('');
      return;
    }

    setLoading(true);
    fetchFriends()
      .then((res) => {
        setFriends(res);
        if (res.length > 0) {
          setSelectedFriendId(res[0].user_id);
        }
      })
      .catch((err) => console.error('Failed to load friends for share modal:', err))
      .finally(() => setLoading(false));
  }, [isOpen]);

  if (!isOpen || !meme) return null;

  const filteredFriends = friends.filter((f) => {
    const q = searchQuery.toLowerCase();
    return (
      f.nickname.toLowerCase().includes(q) ||
      (f.username && f.username.toLowerCase().includes(q))
    );
  });

  const handleSend = async () => {
    if (!selectedFriendId || isSending) return;

    setIsSending(true);
    try {
      const note = customNote.trim() || 'Check out this meme! 😂';
      await sendMessage(selectedFriendId, note, meme.id);
      setSentSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
        setSentSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to send meme to friend:', err);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenChat = () => {
    if (selectedFriendId) {
      onClose();
      navigate(`/chat/${selectedFriendId}`);
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-[#fe3c72] to-[#ff6036] flex items-center justify-center text-white shadow-2xs">
                <Send size={15} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">Send Meme to Friend</h3>
                <p className="text-[11px] text-slate-500">Direct message with meme card</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-full transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Meme Preview Snapshot */}
          <div className="p-3.5 bg-slate-100/60 border-b border-slate-200/80 flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 flex-none shadow-xs">
              <img
                src={meme.image_url}
                alt={meme.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Meme Attachment
              </span>
              <h4 className="text-xs font-bold text-slate-800 truncate">{meme.title}</h4>
              <span className="text-[10px] text-orange-600 font-semibold">
                r/{meme.source}
              </span>
            </div>
          </div>

          {/* Success overlay state */}
          {sentSuccess ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mb-3 shadow-xs">
                <Check size={28} strokeWidth={3} />
              </div>
              <h4 className="text-base font-bold text-slate-900 mb-1">Meme Sent!</h4>
              <p className="text-xs text-slate-500 mb-4">
                Your friend received this meme in their direct messages.
              </p>
              <button
                onClick={handleOpenChat}
                className="px-4 py-2 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5"
              >
                <MessageSquare size={14} />
                <span>Open Chat</span>
              </button>
            </div>
          ) : (
            <div className="p-4 flex-1 flex flex-col min-h-0 space-y-3">
              {/* Optional note input */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Add an optional comment
                </label>
                <input
                  type="text"
                  value={customNote}
                  onChange={(e) => setCustomNote(e.target.value)}
                  placeholder="e.g. This is literally us 😂"
                  className="w-full px-3 py-2 text-xs bg-slate-100/80 border border-slate-200 rounded-xl focus:outline-none focus:bg-white focus:border-[#fe3c72] transition-colors"
                />
              </div>

              {/* Friend Selector */}
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-bold text-slate-700">
                    Choose Friend
                  </label>
                  {friends.length > 4 && (
                    <div className="relative w-36">
                      <Search size={11} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Filter..."
                        className="w-full pl-6 pr-2 py-0.5 text-[10px] bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                      />
                    </div>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto max-h-48 border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                  {loading ? (
                    <div className="p-6 flex items-center justify-center">
                      <Loader2 size={20} className="animate-spin text-[#fe3c72]" />
                    </div>
                  ) : filteredFriends.length === 0 ? (
                    <div className="p-5 text-center text-xs text-slate-500">
                      {friends.length === 0 ? (
                        <>
                          <p className="font-semibold text-slate-700">No friends added yet!</p>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Search for users or match with humor twins first to start chatting.
                          </p>
                        </>
                      ) : (
                        <p>No matching friends found</p>
                      )}
                    </div>
                  ) : (
                    filteredFriends.map((f) => {
                      const isSelected = selectedFriendId === f.user_id;
                      const pct = f.compatibility > 1 ? Math.round(f.compatibility) : Math.round(f.compatibility * 100);

                      return (
                        <div
                          key={f.user_id}
                          onClick={() => setSelectedFriendId(f.user_id)}
                          className={`p-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                            isSelected ? 'bg-rose-50/70' : 'hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-9 h-9 rounded-full overflow-hidden bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold flex-none shadow-2xs">
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
                              <h5 className="text-xs font-bold text-slate-800 truncate">
                                {f.nickname}
                              </h5>
                              <p className="text-[10px] text-slate-400 truncate">
                                @{f.username || 'user'} • {pct}% compatibility
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-none">
                            <div
                              className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${
                                isSelected
                                  ? 'bg-[#fe3c72] border-[#fe3c72] text-white'
                                  : 'border-slate-300'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={3} />}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Send Button */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!selectedFriendId || isSending || filteredFriends.length === 0}
                  className="w-full py-2.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-98 disabled:opacity-40"
                >
                  {isSending ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>Send Meme to Selected Friend</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
