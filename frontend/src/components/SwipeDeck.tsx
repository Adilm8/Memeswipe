import { useState, useMemo } from 'react';
import TinderCard from 'react-tinder-card';
import SwipeCard from './SwipeCard';
import ActionButtons from './ActionButtons';
import MatchesModal from './MatchesModal';
import { useMemes } from '@/hooks/useMemes';
import { useSwipe } from '@/hooks/useSwipe';
import { useSession } from '@/hooks/useSession';
import { Loader2 } from 'lucide-react';

export default function SwipeDeck() {
  const { memes, removeMeme, isLoading, isEmpty } = useMemes();
  const { handleSwipe, handleSave } = useSwipe();
  const { likesCount } = useSession();
  const [showMatches, setShowMatches] = useState(false);
  const [hasShownMatches, setHasShownMatches] = useState(() => localStorage.getItem('matches_shown') === 'true');

  const activeMemes = useMemo(() => memes, [memes]);

  const onSwipe = (direction: string, memeId: string) => {
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
  };

  const onCardLeftScreen = (myIdentifier: string) => {
    removeMeme(myIdentifier);
  };

  const currentMeme = activeMemes[activeMemes.length - 1];

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden">
      <div className="relative w-[90%] max-w-sm aspect-[3/4] max-h-[70vh] mx-auto mt-4">
        {isEmpty && !isLoading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400">
            <span className="text-6xl mb-4">🤷‍♂️</span>
            <p>No more memes!</p>
          </div>
        ) : null}
        
        {activeMemes.map((meme) => (
          <TinderCard
            key={meme.id}
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

      <div className="mt-8 mb-4">
        <ActionButtons 
          onLike={() => {
            if (currentMeme) {
              onSwipe('right', currentMeme.id);
              removeMeme(currentMeme.id);
            }
          }} 
          onDislike={() => {
            if (currentMeme) {
              onSwipe('left', currentMeme.id);
              removeMeme(currentMeme.id);
            }
          }}
          onSave={() => {
            if (currentMeme) {
              handleSave(currentMeme.id);
            }
          }}
          disabled={!currentMeme}
        />
      </div>

      {showMatches && <MatchesModal onClose={() => setShowMatches(false)} />}
    </div>
  );
}
