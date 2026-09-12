import { Meme } from '@/api/types';
import { Trash2, Share2 } from 'lucide-react';

interface Props {
  meme: Meme;
  onUnsave?: (id: string) => void;
}

export default function MemeCard({ meme, onUnsave }: Props) {
  return (
    <div className="relative group rounded-xl overflow-hidden bg-slate-800 border border-slate-700 aspect-square">
      <img src={meme.image_url} alt={meme.title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <p className="text-white text-sm font-semibold line-clamp-2">{meme.title}</p>
        <div className="flex justify-end gap-2">
          <button className="p-2 bg-slate-800/80 rounded-full hover:bg-slate-700 text-white">
            <Share2 size={16} />
          </button>
          {onUnsave && (
            <button 
              onClick={() => onUnsave(meme.id)}
              className="p-2 bg-rose-500/80 rounded-full hover:bg-rose-500 text-white"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
