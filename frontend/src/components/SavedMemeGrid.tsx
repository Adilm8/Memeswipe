import { SavedMeme } from '@/api/types';
import MemeCard from './MemeCard';
import { unsaveMeme } from '@/api/memes';

export default function SavedMemeGrid({ memes, setMemes }: { memes: SavedMeme[], setMemes: React.Dispatch<React.SetStateAction<SavedMeme[]>> }) {
  const handleUnsave = async (memeId: string) => {
    try {
      await unsaveMeme(memeId);
      setMemes(prev => prev.filter(m => m.meme.id !== memeId));
    } catch (e) {
      console.error(e);
    }
  };

  if (memes.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center text-slate-400">
        <p>No saved memes yet. Start swiping! 👆</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 overflow-y-auto pb-20">
      {memes.map(m => (
        <MemeCard key={m.id} meme={m.meme} onUnsave={handleUnsave} />
      ))}
    </div>
  );
}
