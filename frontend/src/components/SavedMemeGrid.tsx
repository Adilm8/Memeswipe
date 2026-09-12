import { useState } from 'react';
import { SavedMeme } from '@/api/types';
import MemeCard from './MemeCard';
import MemeModal from './MemeModal';
import { unsaveMeme } from '@/api/memes';

interface Props {
  memes: SavedMeme[];
  setMemes: React.Dispatch<React.SetStateAction<SavedMeme[]>>;
}

export default function SavedMemeGrid({ memes, setMemes }: Props) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  const handleUnsave = async (memeId: string) => {
    try {
      await unsaveMeme(memeId);
      setMemes((prev) => prev.filter((m) => m.meme.id !== memeId));
      if (selectedIndex !== null) {
        setSelectedIndex(null);
      }
    } catch (e) {
      console.error('Failed to unsave meme:', e);
    }
  };

  if (memes.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-8 text-center">
        <span className="text-5xl mb-3">⭐</span>
        <p className="text-base font-semibold text-slate-300">No saved memes yet</p>
        <p className="text-sm text-slate-500 mt-1">Tap the star button on any meme to save it here!</p>
      </div>
    );
  }

  const selectedMeme = selectedIndex !== null && memes[selectedIndex] ? memes[selectedIndex].meme : null;

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 sm:gap-4 p-4 overflow-y-auto pb-24">
        {memes.map((m, idx) => (
          <MemeCard 
            key={m.id} 
            meme={m.meme} 
            onUnsave={handleUnsave} 
            onClick={() => setSelectedIndex(idx)}
          />
        ))}
      </div>

      {/* Fullscreen Enlarged Modal */}
      <MemeModal
        meme={selectedMeme}
        onClose={() => setSelectedIndex(null)}
        onUnsave={handleUnsave}
        onNext={() => setSelectedIndex((i) => (i !== null && i < memes.length - 1 ? i + 1 : i))}
        onPrev={() => setSelectedIndex((i) => (i !== null && i > 0 ? i - 1 : i))}
        hasNext={selectedIndex !== null && selectedIndex < memes.length - 1}
        hasPrev={selectedIndex !== null && selectedIndex > 0}
      />
    </>
  );
}
