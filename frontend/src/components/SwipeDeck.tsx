import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import MatchesModal from './MatchesModal';
import MemeModal from './MemeModal';
import { useMemes } from '@/hooks/useMemes';
import { useSwipe } from '@/hooks/useSwipe';
import { useSession } from '@/hooks/useSession';
import { fetchSaved } from '@/api/memes';
import { SavedMeme, Meme } from '@/api/types';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';

export default function SwipeDeck() {
  const { memes, removeMeme, isLoading, isRefilling, isEmpty, refillFeed, resetDislikesAndReload } = useMemes();
  const { handleSwipe, handleSave, handleUnsave } = useSwipe();
  const { session, likesCount, refreshProfile } = useSession();
  const [showMatches, setShowMatches] = useState(false);
  const [hasShownMatches, setHasShownMatches] = useState(() => localStorage.getItem('matches_shown') === 'true');
  const [savedMemes, setSavedMemes] = useState<SavedMeme[]>([]);
  const [enlargedMeme, setEnlargedMeme] = useState<Meme | null>(null);

  const cardRefs = useRef<Record<string, any>>({});
  const isSwipingRef = useRef(false);

  const activeMemes = useMemo(() => memes, [memes]);
  const currentMeme = activeMemes[activeMemes.length - 1];

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
  }, [removeMeme]);

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

  // Global keyboard shortcuts (Left/Right arrow, Up/S to save, Space to enlarge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input/textarea
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
      } else if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        if (currentMeme) {
          setEnlargedMeme(currentMeme);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe, toggleSave, currentMeme]);

  const isCurrentSaved = currentMeme ? savedIds.has(currentMeme.id) : false;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-between p-4 sm:p-6 overflow-hidden">
      {/* Tinder Top Watermark Logo */}
      <div className="flex items-center gap-2 mb-2 select-none opacity-40 hover:opacity-80 transition-opacity">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-[#fe3c72] to-[#ff655b] flex items-center justify-center text-xs text-white">
          🔥
        </div>
        <span className="font-bold text-xs tracking-wider uppercase text-slate-400">
          MemeSwipe Discover
        </span>
      </div>

      {/* Main Tinder Card Deck Stage */}
      <div className="flex-1 w-full flex items-center justify-center relative min-h-0">
        <div className="relative w-full max-w-[420px] aspect-[4/5] max-h-[66vh] sm:max-h-[70vh] flex items-center justify-center">
          {/* Empty Deck State */}
          {isEmpty ? (
            <div className="w-full h-full bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 flex flex-col items-center justify-center text-center animate-fadeIn">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-[#fe3c72]/15 to-[#ff655b]/15 flex items-center justify-center text-4xl mb-4 border border-[#fe3c72]/20">
                🎉
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">You've Swiped Everything!</h3>
              <p className="text-slate-500 text-xs sm:text-sm max-w-xs mb-6 leading-relaxed">
                You have browsed all cached memes in this session. Fetch fresh memes from Reddit or reshuffle your skipped cards.
              </p>
              
              {isRefilling ? (
                <div className="flex flex-col items-center gap-2 py-4">
                  <Loader2 className="animate-spin text-[#fe3c72] w-8 h-8" />
                  <span className="text-xs font-semibold text-slate-600">Fetching latest memes from Reddit...</span>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5 w-full max-w-xs">
                  <button
                    onClick={() => refillFeed()}
                    className="w-full py-3 px-4 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-md shadow-rose-500/20 flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles size={16} />
                    Fetch Fresh Memes from Reddit
                  </button>

                  <button
                    onClick={async () => {
                      await resetDislikesAndReload();
                      refreshProfile();
                    }}
                    className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw size={14} className="text-emerald-500" />
                    Reshuffle Skipped Memes
                  </button>
                </div>
              )}
            </div>
          ) : null}

          {/* Active Cards */}
          {activeMemes.map((meme) => (
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
              <SwipeCard meme={meme} onEnlarge={(m) => setEnlargedMeme(m)} />
            </TinderCard>
          ))}

          {isLoading && !isRefilling && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-3xl z-50">
              <Loader2 className="animate-spin text-[#fe3c72] w-10 h-10" />
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons & Tinder Keyboard Legend */}
      <div className="flex-none flex flex-col items-center mt-3 sm:mt-4 w-full">
        <ActionButtons 
          onLike={() => triggerSwipe('right')} 
          onDislike={() => triggerSwipe('left')}
          onSave={() => {
            if (currentMeme) {
              toggleSave(currentMeme);
            }
          }}
          isSaved={isCurrentSaved}
          disabled={!currentMeme || isRefilling}
        />

        {/* Tinder-style Desktop Keyboard Shortcut Bar (matches uploaded design) */}
        <div className="mt-3 flex items-center justify-center gap-2 sm:gap-3 text-[11px] text-slate-400 select-none flex-wrap">
          <span className="flex items-center gap-1 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">←</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Nope</span>
          </span>
          <span className="flex items-center gap-1 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">↑ / S</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">{isCurrentSaved ? 'Saved' : 'Save'}</span>
          </span>
          <span className="flex items-center gap-1 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs">
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">→</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Like</span>
          </span>
          <button
            onClick={() => currentMeme && setEnlargedMeme(currentMeme)}
            className="flex items-center gap-1 bg-white/80 border border-slate-200 px-2 py-0.5 rounded-full shadow-xs hover:border-[#fe3c72]/40 hover:text-[#fe3c72] transition-colors"
          >
            <kbd className="px-1 bg-slate-100 rounded text-slate-600 font-mono text-[10px]">Space</kbd>
            <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">Enlarge</span>
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
    </div>
  );
}
