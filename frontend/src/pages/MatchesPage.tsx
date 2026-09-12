import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Match, Meme } from '@/api/types';
import { fetchMatches } from '@/api/profile';
import { addFriend } from '@/api/chat';
import MemeModal from '@/components/MemeModal';
import UserSearchModal from '@/components/UserSearchModal';
import { Loader2, Flame, ArrowLeft, MessageSquare, Search } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MatchesPage() {
  const navigate = useNavigate();
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMeme, setSelectedMeme] = useState<Meme | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    fetchMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChatWithMatch = async (matchUserId: string) => {
    try {
      await addFriend(matchUserId);
    } catch (e) {}
    navigate(`/chat/${matchUserId}`);
  };

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
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <span>Humor Twins & Matches</span>
            <span className="text-xs bg-rose-50 text-[#fe3c72] border border-rose-200 px-2 py-0.5 rounded-full font-bold">
              {matches.length}
            </span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(true)}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-full text-xs font-bold shadow-2xs flex items-center gap-1.5 transition-all"
          >
            <Search size={13} />
            <span>Find Friends</span>
          </button>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-1.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Flame size={14} />
            <span>Swipe Memes</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 pb-24 max-w-4xl w-full mx-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[#fe3c72] w-8 h-8" />
          </div>
        ) : matches.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl mb-4 border border-rose-100">
              👯
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Humor Twins Yet</h3>
            <p className="text-xs text-slate-500 max-w-sm mb-5 leading-relaxed">
              Swipe and like at least 10 memes to find users with the exact same taste in comedy!
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-5 py-2.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 flex items-center gap-2 transition-all active:scale-95"
            >
              <Flame size={15} />
              Start Swiping Now
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map((match, i) => {
              const percent = (match.similarity_score * 100).toFixed(0);
              const initials = match.nickname.substring(0, 2).toUpperCase();

              return (
                <motion.div 
                  key={match.user_id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-xs flex-none">
                        {match.avatar_url ? (
                          <img src={match.avatar_url} alt={match.nickname} className="w-full h-full object-cover" />
                        ) : (
                          <span>{initials}</span>
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900">{match.nickname}</h3>
                        <p className="text-xs text-slate-500">
                          {match.shared_memes_count} shared memes in common
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-none">
                      <button
                        onClick={() => handleChatWithMatch(match.user_id)}
                        className="px-3.5 py-1.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <MessageSquare size={13} />
                        <span>Chat</span>
                      </button>

                      <span className="px-3 py-1 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-extrabold shadow-2xs">
                        {percent}% Match
                      </span>
                    </div>
                  </div>

                  {match.bio && (
                    <p className="text-xs text-slate-600 italic bg-slate-50 px-3 py-1.5 rounded-xl mb-3 border border-slate-100">
                      "{match.bio}"
                    </p>
                  )}

                  {/* Similarity meter */}
                  <div className="w-full bg-slate-100 rounded-full h-2 mb-4 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-emerald-400 to-emerald-500 h-2 rounded-full transition-all duration-500" 
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  {/* Shared Memes Row */}
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                      Memes You Both Liked (Tap to enlarge)
                    </span>
                    <div className="flex gap-2.5 overflow-x-auto pb-2 pt-1">
                      {match.shared_memes.map(meme => (
                        <div 
                          key={meme.id} 
                          onClick={() => setSelectedMeme(meme)}
                          className="relative flex-none w-18 h-18 sm:w-20 sm:h-20 rounded-xl overflow-hidden cursor-pointer border border-slate-200 hover:border-[#fe3c72] hover:scale-105 transition-all shadow-xs group"
                        >
                          <img 
                            src={meme.image_url} 
                            alt={meme.title} 
                            className="w-full h-full object-cover" 
                          />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                          <span className="absolute bottom-1 left-1 bg-black/70 backdrop-blur-xs text-[9px] text-white font-semibold px-1 rounded">
                            r/{meme.source}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Enlarged view for shared memes */}
      <MemeModal
        meme={selectedMeme}
        onClose={() => setSelectedMeme(null)}
      />

      {/* User Search Modal */}
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
