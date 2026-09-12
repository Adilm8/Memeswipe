import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import { motion, AnimatePresence } from 'framer-motion';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import MatchesModal from './MatchesModal';
import MemeModal from './MemeModal';
import SendMemeModal from './SendMemeModal';
import { useMemes } from '@/hooks/useMemes';
import { useSwipe } from '@/hooks/useSwipe';
import { useSession } from '@/hooks/useSession';
import { fetchSaved } from '@/api/memes';
import { explainMeme } from '@/api/ai';
import { SavedMeme, Meme } from '@/api/types';
import { Loader2, Sparkles, RotateCcw, X, Maximize2 } from 'lucide-react';

export default function SwipeDeck() {
  const { memes, removeMeme, isLoading, isRefilling, isEmpty, refillFeed, resetDislikesAndReload } = useMemes();
  const { handleSwipe, handleSave, handleUnsave } = useSwipe();
  const { session, likesCount, refreshProfile } = useSession();
  const [showMatches, setShowMatches] = useState(false);
  const [hasShownMatches, setHasShownMatches] = useState(() => localStorage.getItem('matches_shown') === 'true');
  const [savedMemes, setSavedMemes] = useState<SavedMeme[]>([]);
  const [enlargedMeme, setEnlargedMeme] = useState<Meme | null>(null);
  const [sharingMeme, setSharingMeme] = useState<Meme | null>(null);
  const [inlineExplanation, setInlineExplanation] = useState<{
    memeId: string;
    text: string | null;
    loading: boolean;
  } | null>(null);

  const cardRefs = useRef<Record<string, any>>({});
  const isSwipingRef = useRef(false);

  const activeMemes = useMemo(() => memes, [memes]);
  const currentMeme = activeMemes[activeMemes.length - 1];

  // Render ONLY the top 2 cards to eliminate shadow accumulation and DOM overhead
  const visibleMemes = useMemo(() => activeMemes.slice(-2), [activeMemes]);

  // Set of saved meme IDs
  const savedIds = useMemo(() => new Set(savedMemes.map(s => s.meme.id)), [savedMemes]);

  // Load existing saved memes for this session
  useEffect(() => {
    if (session) {
      fetchSaved()
        .then((savedList) => {
          if (Array.isArray(savedList)) {
            setSavedMemes(savedList);
          }
        })
        .catch((err) => console.error('Failed to fetch saved memes:', err));
    }
  }, [session]);

  const onSwipe = useCallback((direction: string, memeId: string) => {
    if (direction === 'right') {
      handleSwipe(memeId, 'like');
      if (likesCount + 1 >= 10 && !hasShownMatches) {
        setShowMatches(true);
        setHasShownMatches(true);
        localStorage.setItem('matches_shown', 'true');
      }
    } else if (direction === 'left') {
      handleSwipe(memeId, 'dislike');
    }
  }, [handleSwipe, likesCount, hasShownMatches]);

  const onCardLeftScreen = useCallback((memeId: string) => {
    removeMeme(memeId);
    delete cardRefs.current[memeId];
    isSwipingRef.current = false;
    setInlineExplanation(prev => (prev?.memeId === memeId ? null : prev));
  }, [removeMeme]);

  // Toggle AI explanation on main screen
  const handleToggleExplain = useCallback(async (meme: Meme) => {
    if (inlineExplanation?.memeId === meme.id) {
      setInlineExplanation(null);
      return;
    }

    setInlineExplanation({ memeId: meme.id, text: null, loading: true });
    try {
      const explanation = await explainMeme(meme.id);
      setInlineExplanation({ memeId: meme.id, text: explanation, loading: false });
    } catch (err) {
      console.error('Failed to explain meme:', err);
      setInlineExplanation({ 
        memeId: meme.id, 
        text: "Could not analyze this meme right now. Try again in a moment!", 
        loading: false 
      });
    }
  }, [inlineExplanation]);

  // Programmatically trigger swipe with spring animation
  const triggerSwipe = useCallback(async (direction: 'left' | 'right') => {
    if (!currentMeme || isSwipingRef.current) return;
    isSwipingRef.current = true;

    const cardRef = cardRefs.current[currentMeme.id];
    if (cardRef && typeof cardRef.swipe === 'function') {
      await cardRef.swipe(direction);
    } else {
      onSwipe(direction, currentMeme.id);
      removeMeme(currentMeme.id);
      isSwipingRef.current = false;
    }
  }, [currentMeme, onSwipe, removeMeme]);

  // Save / Unsave toggle
  const toggleSave = useCallback(async (meme: Meme) => {
    const isCurrentlySaved = savedIds.has(meme.id);
    if (isCurrentlySaved) {
      setSavedMemes(prev => prev.filter(s => s.meme.id !== meme.id));
      await handleUnsave(meme.id);
    } else {
      const newSavedItem: SavedMeme = {
        id: `temp-${meme.id}`,
        meme: meme,
        saved_at: new Date().toISOString()
      };
      setSavedMemes(prev => [newSavedItem, ...prev]);
      await handleSave(meme.id);
    }
    refreshProfile();
  }, [savedIds, handleSave, handleUnsave, refreshProfile]);

  // Global keyboard shortcuts (Left/Right arrow, Up/S to save, Space to enlarge, E to explain)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerSwipe('left');
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerSwipe('right');
      } else if (e.key === 'ArrowUp' || e.key === 's' || e.key === 'S') {
        e.preventDefault();
        if (currentMeme) {
          toggleSave(currentMeme);
        }
      } else if (e.key === 'e' || e.key === 'E') {
        e.preventDefault();
        if (currentMeme) {
          handleToggleExplain(currentMeme);
        }
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (currentMeme) {
          setEnlargedMeme(currentMeme);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe, toggleSave, handleToggleExplain, currentMeme]);

  const isCurrentSaved = currentMeme ? savedIds.has(currentMeme.id) : false;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-2 sm:p-3 md:p-4 overflow-hidden">
      {/* Tinder Top Watermark Logo */}
      <div className="flex items-center gap-1.5 select-none opacity-40 hover:opacity-80 transition-opacity mb-0.5 flex-none">
        <div className="w-5 h-5 rounded-lg bg-gradient-to-tr from-[#fe3c72] to-[#ff655b] flex items-center justify-center text-[10px] text-white">
          🔥
        </div>
        <span className="font-bold text-[11px] tracking-wider uppercase text-slate-400">
          MemeSwipe Discover
        </span>
      </div>

      {/* Main Tinder Card Deck Stage (scaled cleanly for all screen sizes with larger, clearer memes) */}
      <div className="flex-1 w-full flex items-center justify-center relative min-h-0 py-0.5 sm:py-1">
        <div className="relative w-full max-w-[370px] sm:max-w-[430px] md:max-w-[490px] lg:max-w-[540px] xl:max-w-[570px] h-[58vh] sm:h-[65vh] md:h-[70vh] lg:h-[73vh] max-h-[640px] xl:max-h-[690px] flex items-center justify-center">
          {/* Empty Deck State */}
          {isEmpty ? (
            <div className="w-full h-full bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 flex flex-col items-center justify-center text-center animate-fadeIn">
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-rose-50 flex items-center justify-center text-3xl sm:text-4xl mb-3 border border-rose-100">
                🎉
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-1.5">You've Swiped Everything!</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-xs mb-5 leading-relaxed">
                You have browsed all cached memes in this session. Fetch fresh memes from Reddit or reshuffle your skipped cards.
              </p>
              
              {isRefilling ? (
                <div className="flex flex-col items-center gap-2 py-3">
                  <Loader2 className="animate-spin text-[#fe3c72] w-7 h-7" />
                  <span className="text-xs font-semibold text-slate-600">Fetching latest memes from Reddit...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2 w-full max-w-xs">
                  <button
                    onClick={() => refillFeed()}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white font-semibold text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles size={15} />
                    Fetch Fresh Memes from Reddit
                  </button>

                  <button
                    onClick={async () => {
                      await resetDislikesAndReload();
                      refreshProfile();
                    }}
                    className="w-full py-2 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw size={13} className="text-emerald-500" />
                    Reshuffle Skipped Memes
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Active Cards: rendered cleanly with only top 2 cards, zero shadow accumulation */}
          {visibleMemes.map((meme) => (
            <TinderCard
              key={meme.id}
              ref={(el: any) => {
                if (el) cardRefs.current[meme.id] = el;
                else delete cardRefs.current[meme.id];
              }}
              className="absolute inset-0 cursor-grab active:cursor-grabbing"
              onSwipe={(dir) => onSwipe(dir, meme.id)}
              onCardLeftScreen={() => onCardLeftScreen(meme.id)}
              preventSwipe={['up', 'down']}
            >
              <SwipeCard 
                meme={meme} 
                onEnlarge={(m) => setEnlargedMeme(m)} 
                onExplain={handleToggleExplain}
                onShare={(m) => setSharingMeme(m)}
                isExplaining={inlineExplanation?.memeId === meme.id}
              />
            </TinderCard>
          ))}

          {/* Main Screen Inline AI Explanation Overlay */}
          <AnimatePresence>
            {inlineExplanation && currentMeme && inlineExplanation.memeId === currentMeme.id && (
              <motion.div
                initial={{ opacity: 0, y: 15, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 15, scale: 0.96 }}
                transition={{ duration: 0.2 }}
                className="absolute bottom-14 sm:bottom-16 left-2.5 right-2.5 z-40 bg-slate-900/95 backdrop-blur-md text-white border border-indigo-500/40 rounded-2xl p-3.5 shadow-2xl pointer-events-auto select-text"
              >
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-800">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-400">
                    <Sparkles size={14} className="text-indigo-400" />
                    <span>Gemini AI Meme Analysis</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEnlargedMeme(currentMeme)}
                      title="Enlarge meme (Space)"
                      className="px-2 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors flex items-center gap-1 text-[10px] font-medium border border-slate-700"
                    >
                      <Maximize2 size={11} />
                      <span className="hidden sm:inline">Enlarge</span>
                    </button>
                    <button
                      onClick={() => setInlineExplanation(null)}
                      title="Close explanation (E)"
                      className="p-1 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {inlineExplanation.loading ? (
                  <div className="py-3 flex items-center gap-2 text-xs text-indigo-300">
                    <Loader2 size={15} className="animate-spin text-indigo-400" />
                    <span className="font-medium">Gemini Vision is analyzing meme & text...</span>
                  </div>
                ) : (
                  <div className="max-h-36 sm:max-h-44 overflow-y-auto pr-1 mt-2">
                    <p className="text-xs text-slate-200 leading-relaxed font-normal">
                      {inlineExplanation.text}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {isLoading && !isRefilling && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-xs rounded-3xl z-50">
              <Loader2 className="animate-spin text-[#fe3c72] w-8 h-8" />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons & Tinder Keyboard Legend */}
      <div className="flex-none flex flex-col items-center mt-2 sm:mt-3 w-full">
        <ActionButtons 
          onLike={() => triggerSwipe('right')} 
          onDislike={() => triggerSwipe('left')}
          onSave={() => {
            if (currentMeme) {
              toggleSave(currentMeme);
            }
          }}
          onExplain={() => currentMeme && handleToggleExplain(currentMeme)}
          isExplaining={inlineExplanation?.memeId === currentMeme?.id}
          isSaved={isCurrentSaved}
          disabled={!currentMeme || isRefilling}
        />

        {/* Tinder Desktop Keyboard Shortcut Bar (hidden on mobile, visible on desktop) */}
        <div className="hidden sm:flex mt-2.5 items-center justify-center gap-2 text-[10px] text-slate-400 select-none flex-wrap">
          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[9px]">←</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Nope</span>
          </span>
          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[9px]">↑ / S</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">{isCurrentSaved ? 'Saved' : 'Save'}</span>
          </span>
          <button
            onClick={() => currentMeme && handleToggleExplain(currentMeme)}
            className={`flex items-center gap-1 bg-white border px-2 py-0.5 rounded-full transition-colors ${
              inlineExplanation?.memeId === currentMeme?.id
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
                : 'border-slate-200 text-slate-500 hover:border-indigo-400 hover:text-indigo-600'
            }`}
          >
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[9px]">E</kbd>
            <span className="font-semibold uppercase tracking-wider text-[9px]">Explain</span>
          </button>
          <span className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full">
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[9px]">→</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Like</span>
          </span>
          <button
            onClick={() => currentMeme && setEnlargedMeme(currentMeme)}
            className="flex items-center gap-1 bg-white border border-slate-200 px-2 py-0.5 rounded-full hover:border-[#fe3c72]/40 hover:text-[#fe3c72] transition-colors"
          >
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[9px]">Space</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[9px]">Enlarge</span>
          </button>
        </div>
      </div>

      {showMatches && <MatchesModal onClose={() => setShowMatches(false)} />}
      
      {/* Fullscreen Enlarged Modal for any meme */}
      <MemeModal 
        meme={enlargedMeme} 
        onClose={() => setEnlargedMeme(null)}
        onUnsave={(id) => {
          if (enlargedMeme && savedIds.has(id)) {
            toggleSave(enlargedMeme);
          }
        }}
      />

      {/* Share to Friend Modal */}
      <SendMemeModal
        meme={sharingMeme}
        isOpen={!!sharingMeme}
        onClose={() => setSharingMeme(null)}
      />
    </div>
  );
}
