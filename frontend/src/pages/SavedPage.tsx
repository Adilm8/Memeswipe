import { useEffect, useState } from 'react';
import SavedMemeGrid from '@/components/SavedMemeGrid';
import { SavedMeme } from '@/api/types';
import { fetchSaved } from '@/api/memes';
import { Loader2 } from 'lucide-react';

export default function SavedPage() {
  const [memes, setMemes] = useState<SavedMeme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved().then(setMemes).finally(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white">Saved Memes ⭐ <span className="text-slate-400 text-sm font-normal">({memes.length})</span></h2>
      </div>
      {loading ? (
        <div className="flex-1 flex items-center justify-center"><Loader2 className="animate-spin text-amber-400" /></div>
      ) : (
        <SavedMemeGrid memes={memes} setMemes={setMemes} />
      )}
    </div>
  );
}
