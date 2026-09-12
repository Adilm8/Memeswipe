import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import MatchesModal from './MatchesModal';
import { useMemes } from '@/hooks/useMemes';
import { useSwipe } from '@/hooks/useSwipe';
import { useSession } from '@/hooks/useSession';
import { fetchSaved } from '@/api/memes';
import { Loader2 } from 'lucide-react';

export default function SwipeDeck() {
  const { memes, removeMeme, isLoading, isEmpty } = useMemes();
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
        {isEmpty && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <span className="text-6xl mb-4">🤷‍♂️</span>
            <p className="text-lg font-medium">No more memes!</p>
            <p className="text-sm text-slate-500 mt-1">Check back later or view your saved memes.</p>
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

        {isLoading && (
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
          disabled={!currentMeme}
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
