import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { Loader2, Sparkles, RotateCcw, ArrowRight, Bookmark, Command } from 'lucide-react';

export default function SwipeDeck() {
  const navigate = useNavigate();
  const { memes, removeMeme, isLoading, isRefilling, isEmpty, refillFeed, resetDislikesAndReload } = useMemes();
  const { handleSwipe, handleSave, handleUnsave } = useSwipe();
  const { session, likesCount } = useSession();
  const [showMatches, setShowMatches] = useState(false);
  const [hasShownMatches, setHasShownMatches] = useState(() => localStorage.getItem('matches_shown') === 'true');
  const [savedMemes, setSavedMemes] = useState<SavedMeme[]>([]);
  const [previewMeme, setPreviewMeme] = useState<Meme | null>(null);

  const cardRefs = useRef<Record<string, any>>({});
  const isSwipingRef = useRef(false);

  const activeMemes = useMemo(() => memes, [memes]);
  const currentMeme = activeMemes[activeMemes.length - 1];

  // Set of saved meme IDs
  const savedIds = useMemo(() => new Set(savedMemes.map(s => s.meme.id)), [savedMemes]);

  // Load existing saved memes for this guest session
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

  // Toggle save/unsave for current meme
  const toggleSave = useCallback(async (meme: Meme) => {
    const isCurrentlySaved = savedIds.has(meme.id);

    // Optimistic UI state update
    if (isCurrentlySaved) {
      setSavedMemes(prev => prev.filter(s => s.meme.id !== meme.id));
    } else {
      setSavedMemes(prev => [{ id: `temp-${Date.now()}`, meme, saved_at: new Date().toISOString() }, ...prev]);
    }

    try {
      if (isCurrentlySaved) {
        await handleUnsave(meme.id);
      } else {
        await handleSave(meme.id);
      }
    } catch (err) {
      console.error('Toggle save failed:', err);
      // Revert optimistic update on error
      if (isCurrentlySaved) {
        setSavedMemes(prev => [{ id: `temp-${Date.now()}`, meme, saved_at: new Date().toISOString() }, ...prev]);
      } else {
        setSavedMemes(prev => prev.filter(s => s.meme.id !== meme.id));
      }
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
          toggleSave(currentMeme);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [triggerSwipe, toggleSave, currentMeme]);

  const isCurrentSaved = currentMeme ? savedIds.has(currentMeme.id) : false;

  return (
    <div className="flex-1 w-full h-full flex items-center justify-center px-4 sm:px-6 py-2 overflow-hidden">
      {/* 3-Column Responsive Container to utilize free space on desktop */}
      <div className="w-full max-w-7xl h-full flex items-center justify-center lg:justify-between gap-6 pb-20 sm:pb-24">
        
        {/* Left Sidebar on Desktop: Controls & Progress */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 flex-none">
          {/* Controls Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <Command size={14} className="text-orange-400" /> Keyboard Shortcuts
            </h4>
            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Swipe Left (Nope)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[11px] text-rose-400 font-semibold">←</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Swipe Right (Like)</span>
                <kbd className="px-2 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[11px] text-emerald-400 font-semibold">→</kbd>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Save / Unsave</span>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[11px] text-amber-400 font-semibold">↑</kbd>
                  <span className="text-slate-500">/</span>
                  <kbd className="px-1.5 py-1 bg-slate-800 rounded border border-slate-700 font-mono text-[11px] text-amber-400 font-semibold">S</kbd>
                </div>
              </div>
            </div>
          </div>

          {/* Taste Stats Card */}
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <span>📊</span> Humor Taste
            </h4>
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-800">
                <span className="text-xl font-extrabold text-emerald-400">{likesCount}</span>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Likes</p>
              </div>
              <div className="bg-slate-800/60 rounded-xl p-2.5 border border-slate-800">
                <span className="text-xl font-extrabold text-amber-400">{savedMemes.length}</span>
                <p className="text-[10px] text-slate-400 font-medium uppercase mt-0.5">Saved</p>
              </div>
            </div>

            <div className="mt-3 p-2.5 bg-slate-800/40 rounded-xl text-center">
              <p className="text-[11px] text-slate-400">
                {likesCount >= 10 ? (
                  <span className="text-emerald-400 font-semibold">🎉 Humor Twin Matches unlocked!</span>
                ) : (
                  <span>Like <strong className="text-white">{10 - likesCount}</strong> more to unlock matches</span>
                )}
              </p>
            </div>
          </div>
        </aside>

        {/* Center Main Stage: Card Deck + Action Buttons */}
        <div className="flex flex-col items-center justify-center flex-1 w-full max-w-sm sm:max-w-md lg:max-w-lg h-full">
          <div className="relative w-full h-[54vh] sm:h-[58vh] max-h-[520px] mx-auto">
            {/* Out of Memes / Refilling State */}
            {(isEmpty || isRefilling) && !isLoading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 bg-slate-900/95 rounded-2xl border border-slate-800 z-20">
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
              <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-2xl z-50">
                <Loader2 className="animate-spin text-orange-400 w-10 h-10" />
              </div>
            )}
          </div>

          {/* Action Buttons: Clean & Perfectly spaced */}
          <div className="mt-4 sm:mt-5 flex flex-col items-center">
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

            {/* Mobile / Tablet Keyboard shortcut hints */}
            <div className="lg:hidden mt-2.5 flex items-center justify-center gap-2.5 text-[10px] text-slate-400 select-none">
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[9px] text-slate-300">←</kbd> Nope
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[9px] text-slate-300">↑</kbd> / <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[9px] text-slate-300">S</kbd> {isCurrentSaved ? 'Saved' : 'Save'}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-slate-800 rounded border border-slate-700 font-mono text-[9px] text-slate-300">→</kbd> Like
              </span>
            </div>
          </div>
        </div>

        {/* Right Sidebar on Desktop: Saved Memes Quick Preview */}
        <aside className="hidden lg:flex flex-col gap-4 w-64 xl:w-72 flex-none">
          <div className="bg-slate-900/70 border border-slate-800/90 rounded-2xl p-4 flex flex-col max-h-[420px]">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Bookmark size={14} className="text-amber-400" /> Saved Memes
              </h4>
              <button 
                onClick={() => navigate('/saved')}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1 transition-colors"
              >
                View All <ArrowRight size={12} />
              </button>
            </div>

            {savedMemes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <span className="text-3xl mb-2">⭐</span>
                <p className="text-xs font-semibold text-slate-300">No saved memes yet</p>
                <p className="text-[10px] text-slate-500 mt-1">Click the star button on any meme to save it here</p>
              </div>
            ) : (
              <div className="space-y-2.5 overflow-y-auto max-h-[300px] pr-1">
                {savedMemes.slice(0, 4).map((s) => (
                  <div
                    key={s.id}
                    onClick={() => setPreviewMeme(s.meme)}
                    className="flex items-center gap-3 p-2 bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 rounded-xl cursor-pointer transition-all hover:scale-[1.02]"
                  >
                    <img 
                      src={s.meme.image_url} 
                      alt={s.meme.title} 
                      className="w-12 h-12 object-cover rounded-lg flex-none"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-200 truncate">{s.meme.title}</p>
                      <span className="text-[10px] text-slate-400">r/{s.meme.source}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {showMatches && <MatchesModal onClose={() => setShowMatches(false)} />}
      
      {/* Quick preview modal for saved meme clicked from sidebar */}
      <MemeModal 
        meme={previewMeme} 
        onClose={() => setPreviewMeme(null)} 
      />
    </div>
  );
}
