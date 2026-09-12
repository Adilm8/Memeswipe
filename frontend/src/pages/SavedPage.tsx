import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SavedMemeGrid from '@/components/SavedMemeGrid';
import { SavedMeme } from '@/api/types';
import { fetchSaved } from '@/api/memes';
import { Loader2, ArrowLeft, Flame } from 'lucide-react';

export default function SavedPage() {
  const navigate = useNavigate();
  const [memes, setMemes] = useState<SavedMeme[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSaved().then(setMemes).finally(() => setLoading(false));
  }, []);

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
            <span>Saved Memes</span>
            <span className="text-xs bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded-full font-bold">
              {memes.length} ⭐
            </span>
          </h2>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-1.5 bg-gradient-to-r from-[#fe3c72] to-[#ff6036] hover:opacity-95 text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Flame size={14} />
          <span>Swipe Memes</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="animate-spin text-[#fe3c72] w-8 h-8" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto max-w-6xl w-full mx-auto">
          <SavedMemeGrid memes={memes} setMemes={setMemes} />
        </div>
      )}
    </div>
  );
}
