import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import MatchesModal from './MatchesModal';
import { useMemes } from '@/hooks/useMemes';
import { useSwipe } from '@/hooks/useSwipe';
import { useSession } from '@/hooks/useSession';
import { fetchSaved } from '@/api/memes';
import { Loader2, Sparkles, RotateCcw } from 'lucide-react';

export default function SwipeDeck() {
  const navigate = useNavigate();
  const { memes, removeMeme, isLoading, isRefilling, isEmpty, refillFeed, resetDislikesAndReload } = useMemes();
  const { handleSwipe, handleSave, handleUnsave } = useSwipe();
  const { session, likesCount } = useSession();
  const [showMatches, setShowMatches] = useState(false);
  const [hasShownMatches, setHasShownMatches] = useState(() => localStorage.getItem('matches_shown') === 'true');
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());

  const cardRefs = useRef<Record<string, any>>({});
  const isSwipingRef = useRef(false);

  const activeMemes = useMemo(() => memes, [memes]);
  const currentMeme = activeMemes[activeMemes.length - 1];

  // Load existing saved memes for this guest session
  useEffect(() => {
    if (session) {
      fetchSaved()
        .then((savedList) => {
          if (Array.isArray(savedList)) {
            setSavedIds(new Set(savedList.map((s) => s.meme.id)));
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

  // Toggle save/unsave for current meme
  const toggleSave = useCallback(async (memeId: string) => {
    const isCurrentlySaved = savedIds.has(memeId);

    // Optimistic UI state update
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (isCurrentlySaved) {
        next.delete(memeId);
      } else {
        next.add(memeId);
      }
      return next;
    });

    try {
      if (isCurrentlySaved) {
        await handleUnsave(memeId);
      } else {
        await handleSave(memeId);
      }
    } catch (err) {
      console.error('Toggle save failed:', err);
      // Revert optimistic update on error
      setSavedIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) {
          next.add(memeId);
        } else {
          next.delete(memeId);
        }
        return next;
      });
    }
  }, [savedIds, handleSave, handleUnsave]);

  // Keyboard navigation (Arrow keys + S)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (e.key === 'ArrowRight') {
        e.preventDefault();
        triggerSwipe('right');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        triggerSwipe('left');
      } else if (e.key === 'ArrowUp' || e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (currentMeme) {
          toggleSave(currentMeme.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe, toggleSave, currentMeme]);

  const isCurrentSaved = currentMeme ? savedIds.has(currentMeme.id) : false;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-[90%] max-w-sm aspect-[3/4] max-h-[70vh] mx-auto mt-4">
        {/* Out of Memes / Refilling State */}
        {(isEmpty || isRefilling) && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 rounded-3xl border border-slate-800 shadow-2xl z-20">
            {isRefilling ? (
              <div className="flex flex-col items-center">
                <Loader2 className="animate-spin text-orange-400 w-12 h-12 mb-4" />
                <h3 className="text-lg font-bold text-white">Hunting fresh memes...</h3>
                <p className="text-xs text-slate-400 mt-1">Digging into Reddit's trending communities</p>
              </div>
            ) : (
              <div className="flex flex-col items-center max-w-xs">
                <span className="text-5xl mb-3">🔥</span>
                <h3 className="text-xl font-bold text-white mb-1">You're All Caught Up!</h3>
                <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                  You swiped through all available memes. Choose what to do next:
                </p>

                <div className="flex flex-col gap-2.5 w-full">
                  <button
                    onClick={refillFeed}
                    className="w-full py-3 px-4 bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <Sparkles size={16} />
                    Fetch More Memes from Internet
                  </button>

                  <button
                    onClick={resetDislikesAndReload}
                    className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-xs rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <RotateCcw size={14} className="text-emerald-400" />
                    Reshuffle Skipped Memes
                  </button>

                  <button
                    onClick={() => navigate('/saved')}
                    className="w-full py-2 px-4 text-slate-400 hover:text-amber-300 font-normal text-xs rounded-xl transition-colors mt-1"
                  >
                    ⭐ Browse Your Saved Memes
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : null}
        
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
            <SwipeCard meme={meme} />
          </TinderCard>
        ))}

        {isLoading && !isRefilling && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 rounded-3xl z-50">
            <Loader2 className="animate-spin text-white w-10 h-10" />
          </div>
        )}
      </div>

      <div className="mt-6 mb-2 flex flex-col items-center">
        <ActionButtons 
          onLike={() => triggerSwipe('right')} 
          onDislike={() => triggerSwipe('left')}
          onSave={() => {
            if (currentMeme) {
              toggleSave(currentMeme.id);
            }
          }}
          isSaved={isCurrentSaved}
          disabled={!currentMeme || isRefilling}
        />

        {/* Keyboard shortcut hints */}
        <div className="mt-3 flex items-center justify-center gap-3 text-[11px] text-slate-400 select-none">
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-300">←</kbd> Nope
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-300">↑</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-300">S</kbd> {isCurrentSaved ? 'Saved' : 'Save'}
          </span>
          <span className="flex items-center gap-1">
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[10px] text-slate-300">→</kbd> Like
          </span>
        </div>
      </div>

      {showMatches && <MatchesModal onClose={() => setShowMatches(false)} />}
    </div>
  );
}
