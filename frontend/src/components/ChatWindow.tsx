import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Send, Image as ImageIcon, X, Sparkles, 
  Loader2, Check, CheckCheck, Trash2, ExternalLink 
} from 'lucide-react';
import { fetchMessages, sendMessage, fetchFriends, removeFriend } from '@/api/chat';
import { fetchSaved, fetchFeed } from '@/api/memes';
import { ChatMessage, FriendItem, Meme, SavedMeme } from '@/api/types';
import MemeModal from '@/components/MemeModal';

interface ChatWindowProps {
  friendId: string;
  onBack?: () => void;
}

export default function ChatWindow({ friendId, onBack }: ChatWindowProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [friend, setFriend] = useState<FriendItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [attachedMeme, setAttachedMeme] = useState<Meme | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerTab, setPickerTab] = useState<'saved' | 'trending'>('saved');
  const [savedMemes, setSavedMemes] = useState<SavedMeme[]>([]);
  const [feedMemes, setFeedMemes] = useState<Meme[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [enlargedMeme, setEnlargedMeme] = useState<Meme | null>(null);
  const [isTyping, setIsTyping] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCount = useRef(0);

  // Load friend profile & info
  useEffect(() => {
    fetchFriends()
      .then((friendsList) => {
        const found = friendsList.find((f) => f.user_id === friendId);
        if (found) {
          setFriend(found);
        }
      })
      .catch((err) => console.error('Failed to fetch friend info:', err));
  }, [friendId]);

  // Initial messages fetch
  const loadMessages = async (showLoading = false) => {
    if (showLoading) setIsLoading(true);
    try {
      const data = await fetchMessages(friendId);
      setMessages(data);
      if (data.length > lastMessageCount.current) {
        lastMessageCount.current = data.length;
        setIsTyping(false);
      }
    } catch (err) {
      console.error('Failed to load messages:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMessages(true);

    // Live polling every 2.5s for real-time responsiveness & persona replies
    const timer = setInterval(() => {
      loadMessages(false);
    }, 2500);

    return () => clearInterval(timer);
  }, [friendId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = inputText.trim();
    if ((!text && !attachedMeme) || isSending) return;

    setIsSending(true);
    setInputText('');
    const memeToSend = attachedMeme;
    setAttachedMeme(null);

    // Optimistic message
    const tempId = `temp-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender_id: 'me',
      receiver_id: friendId,
      content: text,
      meme_id: memeToSend?.id || null,
      meme_title: memeToSend?.title || null,
      meme_image_url: memeToSend?.image_url || null,
      is_read: false,
      created_at: new Date().toISOString(),
      is_mine: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setIsTyping(true);

    try {
      await sendMessage(friendId, text, memeToSend?.id);
      await loadMessages(false);
    } catch (err) {
      console.error('Failed to send message:', err);
      setIsTyping(false);
    } finally {
      setIsSending(false);
    }
  };

  const handleOpenPicker = async () => {
    setShowPicker(true);
    setLoadingSaved(true);
    try {
      const [saved, feed] = await Promise.all([
        savedMemes.length === 0 ? fetchSaved().catch(() => []) : Promise.resolve(savedMemes),
        feedMemes.length === 0 ? fetchFeed(16).catch(() => []) : Promise.resolve(feedMemes),
      ]);
      setSavedMemes(saved);
      setFeedMemes(feed);
      if (saved.length === 0 && feed.length > 0) {
        setPickerTab('trending');
      }
    } catch (err) {
      console.error('Failed to load memes for picker:', err);
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSelectMeme = (meme: Meme) => {
    setAttachedMeme(meme);
    setShowPicker(false);
  };

  const handleRemoveFriend = async () => {
    if (!window.confirm(`Remove ${friend?.nickname || 'friend'} from friends?`)) return;
    try {
      await removeFriend(friendId);
      if (onBack) onBack();
      else navigate('/matches');
    } catch (err) {
      console.error('Failed to remove friend:', err);
    }
  };

  const formatTime = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const isPersona = friend?.username?.includes('dave') || 
                    friend?.username?.includes('elena') || 
                    friend?.username?.includes('vitalik') || 
                    friend?.username?.includes('zoe') || 
                    friend?.username?.includes('marcus') || 
                    friend?.username?.includes('kai') || 
                    friend?.username?.includes('sophia') || 
                    friend?.username?.includes('chad');

  const compatPct = friend ? (friend.compatibility > 1 ? Math.round(friend.compatibility) : Math.round(friend.compatibility * 100)) : 80;

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5] relative overflow-hidden">
      {/* ========================================================= */}
      {/* CHAT HEADER: Avatar, Friend Details, Compatibility, Menu */}
      {/* ========================================================= */}
      <div className="flex-none bg-white border-b border-slate-200/90 px-4 py-3 flex items-center justify-between z-20 shadow-2xs">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack || (() => navigate(-1))}
            className="p-1.5 -ml-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-full transition-colors flex-none"
            title="Back"
          >
            <ArrowLeft size={20} />
          </button>

          {/* Friend Avatar */}
          <div className="relative flex-none">
            <div className="w-10 h-10 rounded-full overflow-hidden bg-[#fe3c72] flex items-center justify-center font-bold text-sm text-white shadow-2xs">
              {friend?.avatar_url ? (
                <img
                  src={friend.avatar_url}
                  alt={friend.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(friend?.nickname || 'U').substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white bg-emerald-500" />
          </div>

          {/* Friend Name & Compatibility */}
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">
                {friend?.nickname || 'Humor Match'}
              </h3>
              {friend?.username && (
                <span className="hidden sm:inline text-xs text-slate-400 truncate">
                  @{friend.username}
                </span>
              )}
              <span className="flex-none px-2 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-[10px] font-extrabold shadow-2xs">
                {compatPct}% Match
              </span>
            </div>

            <div className="flex items-center gap-1 text-[11px] text-slate-500 truncate">
              {isPersona ? (
                <span className="text-[#fe3c72] font-semibold flex items-center gap-1">
                  <Sparkles size={11} /> Gemini Persona
                </span>
              ) : (
                <span className="text-emerald-600 font-medium">Online</span>
              )}
              {friend?.bio && (
                <span className="hidden md:inline text-slate-400 truncate max-w-[200px]">
                  • "{friend.bio}"
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleRemoveFriend}
            title="Remove Friend"
            className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* ========================================================= */}
      {/* MESSAGE STREAM: Bubbles, Attached Memes, AI Replies        */}
      {/* ========================================================= */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 sm:space-y-4 min-h-0"
      >
        {isLoading ? (
          <div className="h-full flex items-center justify-center">
            <Loader2 size={28} className="animate-spin text-[#fe3c72]" />
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-center text-3xl mb-3 shadow-xs">
              💬
            </div>
            <h4 className="font-bold text-base text-slate-800 mb-1">
              Start a Conversation with {friend?.nickname || 'your match'}!
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mb-4">
              Send a greeting, roast a joke, or attach your favorite meme using the button below.
            </p>
            <div className="flex flex-wrap gap-2 justify-center max-w-sm">
              <button
                type="button"
                onClick={() => {
                  setInputText('Hey! We got a high humor match, what kind of memes do you like? 😂');
                }}
                className="text-xs bg-white hover:bg-rose-50 text-slate-700 hover:text-[#fe3c72] border border-slate-200 px-3 py-1.5 rounded-full transition-colors shadow-2xs"
              >
                👋 Say hello
              </button>
              <button
                type="button"
                onClick={() => {
                  setInputText('Rate my meme taste from 1 to 10 🔥');
                }}
                className="text-xs bg-white hover:bg-rose-50 text-slate-700 hover:text-[#fe3c72] border border-slate-200 px-3 py-1.5 rounded-full transition-colors shadow-2xs"
              >
                🔥 Rate taste
              </button>
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.is_mine;

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
              >
                {/* Friend Avatar for incoming */}
                {!isMine && (
                  <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-none shadow-2xs mb-1">
                    {friend?.avatar_url ? (
                      <img
                        src={friend.avatar_url}
                        alt={friend.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{(friend?.nickname || 'U').substring(0, 2).toUpperCase()}</span>
                    )}
                  </div>
                )}

                {/* Message Bubble Container */}
                <div
                  className={`max-w-[85%] sm:max-w-[70%] flex flex-col ${
                    isMine ? 'items-end' : 'items-start'
                  }`}
                >
                  <div
                    className={`rounded-2xl p-3 shadow-xs transition-all overflow-hidden ${
                      isMine
                        ? 'bg-[#fe3c72] text-white rounded-br-xs'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-bl-xs'
                    }`}
                  >
                    {/* Attached Meme Card (if message has meme) */}
                    {(msg.meme_id || msg.meme_image_url) && (
                      <div
                        onClick={() => {
                          if (msg.meme_id && msg.meme_image_url) {
                            setEnlargedMeme({
                              id: msg.meme_id,
                              title: msg.meme_title || 'Meme',
                              image_url: msg.meme_image_url,
                              source: 'shared',
                              source_url: '',
                              upvotes: 0,
                              likes_count: 0,
                              dislikes_count: 0,
                            });
                          }
                        }}
                        className={`mb-2 rounded-xl overflow-hidden cursor-pointer border transition-transform hover:scale-[1.01] ${
                          isMine
                            ? 'bg-black/20 border-white/20'
                            : 'bg-slate-100 border-slate-200'
                        }`}
                      >
                        {msg.meme_image_url && (
                          <div className="max-h-60 sm:max-h-72 w-full overflow-hidden bg-black/40 flex items-center justify-center">
                            <img
                              src={msg.meme_image_url}
                              alt={msg.meme_title || 'Shared meme'}
                              className="max-h-60 sm:max-h-72 w-auto max-w-full object-contain"
                            />
                          </div>
                        )}
                        {msg.meme_title && (
                          <div
                            className={`p-2 text-xs font-bold truncate ${
                              isMine ? 'text-white' : 'text-slate-800'
                            }`}
                          >
                            {msg.meme_title}
                          </div>
                        )}
                        <div
                          className={`px-2 pb-1.5 text-[10px] flex items-center gap-1 ${
                            isMine ? 'text-white/80' : 'text-slate-400'
                          }`}
                        >
                          <ExternalLink size={10} />
                          <span>Click to enlarge</span>
                        </div>
                      </div>
                    )}

                    {/* Text content */}
                    {msg.content && (
                      <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-line break-words">
                        {msg.content}
                      </p>
                    )}
                  </div>

                  {/* Timestamp & Status info */}
                  <div
                    className={`flex items-center gap-1 mt-1 px-1 text-[10px] text-slate-400 ${
                      isMine ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <span>{formatTime(msg.created_at)}</span>
                    {isMine && (
                      <span title={msg.is_read ? 'Read' : 'Sent'}>
                        {msg.is_read ? (
                          <CheckCheck size={13} className="text-emerald-500" />
                        ) : (
                          <Check size={13} className="text-slate-400" />
                        )}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Live Typing indicator for AI persona or friend */}
        {isTyping && (
          <div className="flex items-center gap-2 justify-start">
            <div className="w-7 h-7 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-[10px] font-bold flex-none shadow-2xs">
              {friend?.avatar_url ? (
                <img
                  src={friend.avatar_url}
                  alt={friend.nickname}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{(friend?.nickname || 'U').substring(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl px-3.5 py-2 flex items-center gap-2 shadow-2xs text-slate-500 text-xs">
              <Loader2 size={13} className="animate-spin text-[#fe3c72]" />
              <span className="font-medium text-slate-600">
                {friend?.nickname || 'Friend'} is typing...
              </span>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* ATTACHED MEME PREVIEW (Staged before sending)              */}
      {/* ========================================================= */}
      {attachedMeme && (
        <div className="p-2.5 px-4 bg-rose-50 border-t border-rose-200/80 flex items-center justify-between z-10">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-900 border border-rose-300 flex-none shadow-xs">
              <img
                src={attachedMeme.image_url}
                alt={attachedMeme.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold text-[#fe3c72] uppercase tracking-wider">
                Meme attached
              </span>
              <p className="text-xs font-bold text-slate-800 truncate">
                {attachedMeme.title}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAttachedMeme(null)}
            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-100 rounded-full transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* ========================================================= */}
      {/* INPUT BAR: Attachment picker button, text input, send      */}
      {/* ========================================================= */}
      <form
        onSubmit={handleSend}
        className="flex-none p-3 bg-white border-t border-slate-200/90 flex items-center gap-2 z-20"
      >
        <button
          type="button"
          onClick={handleOpenPicker}
          title="Attach saved meme"
          className="p-2.5 text-slate-500 hover:text-[#fe3c72] hover:bg-rose-50 border border-slate-200 rounded-xl transition-colors flex-none cursor-pointer"
        >
          <ImageIcon size={18} />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={`Message ${friend?.nickname || 'friend'}...`}
          className="flex-1 px-4 py-2.5 bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:bg-white focus:border-[#fe3c72] transition-colors"
        />

        <button
          type="submit"
          disabled={(!inputText.trim() && !attachedMeme) || isSending}
          className="p-2.5 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl shadow-md shadow-rose-500/20 transition-all active:scale-95 disabled:opacity-40 flex-none cursor-pointer"
          title="Send"
        >
          {isSending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Send size={18} />
          )}
        </button>
      </form>

      {/* ========================================================= */}
      {/* SAVED MEME PICKER DRAWER / MODAL                          */}
      {/* ========================================================= */}
      {showPicker && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
          onClick={() => setShowPicker(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[80vh]"
          >
            <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 gap-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-[#fe3c72] flex items-center justify-center text-white text-xs">
                  <ImageIcon size={14} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 hidden sm:inline">Attach Meme</h4>
              </div>

              {/* Saved vs Trending Tabs */}
              <div className="flex bg-slate-200/80 p-0.5 rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setPickerTab('saved')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    pickerTab === 'saved'
                      ? 'bg-white text-slate-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Saved ({savedMemes.length})
                </button>
                <button
                  type="button"
                  onClick={() => setPickerTab('trending')}
                  className={`px-3 py-1 rounded-lg transition-all ${
                    pickerTab === 'trending'
                      ? 'bg-white text-slate-800 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-800'
                  }`}
                >
                  Trending ({feedMemes.length})
                </button>
              </div>

              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 min-h-[220px]">
              {loadingSaved ? (
                <div className="h-40 flex items-center justify-center">
                  <Loader2 size={24} className="animate-spin text-[#fe3c72]" />
                </div>
              ) : pickerTab === 'saved' && savedMemes.length === 0 ? (
                <div className="text-center py-10 text-slate-500">
                  <p className="text-xs font-semibold mb-1">No saved memes yet!</p>
                  <p className="text-[11px] text-slate-400 mb-3">
                    Switch to Trending tab to pick hot memes right now.
                  </p>
                  <button
                    type="button"
                    onClick={() => setPickerTab('trending')}
                    className="px-3 py-1.5 bg-rose-50 text-[#fe3c72] hover:bg-rose-100 rounded-xl text-xs font-bold transition-colors"
                  >
                    View Trending Memes
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {(pickerTab === 'saved' ? savedMemes.map(s => s.meme) : feedMemes).map((meme) => (
                    <div
                      key={meme.id}
                      onClick={() => handleSelectMeme(meme)}
                      className="group relative aspect-square rounded-2xl overflow-hidden border border-slate-200 hover:border-[#fe3c72] cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={meme.image_url}
                        alt={meme.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                      <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <p className="text-[11px] font-bold text-white line-clamp-2">
                          {meme.title}
                        </p>
                        <span className="text-[10px] text-rose-300 font-semibold mt-0.5">
                          Tap to attach
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Enlarged Meme Modal */}
      <MemeModal meme={enlargedMeme} onClose={() => setEnlargedMeme(null)} />
    </div>
  );
}
