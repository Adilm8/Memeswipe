import { useState } from 'react';
import { Meme } from '@/api/types';
import { Trash2, Share2, Maximize2, Check } from 'lucide-react';

interface Props {
  meme: Meme;
  onUnsave?: (id: string) => void;
  onClick?: () => void;
}

export default function MemeCard({ meme, onUnsave, onClick }: Props) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(meme.image_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleUnsave = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onUnsave) {
      onUnsave(meme.id);
    }
  };

  return (
    <div 
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
      className="relative group rounded-2xl overflow-hidden bg-white border border-slate-200/90 shadow-xs hover:shadow-md hover:border-[#fe3c72]/50 aspect-square cursor-pointer transition-all duration-200 hover:scale-[1.02] select-none"
    >
      <img 
        src={meme.image_url} 
        alt={meme.title} 
        loading="lazy"
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" 
      />
      
      {/* Subreddit badge */}
      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded-md text-[10px] font-semibold text-white pointer-events-none">
        r/{meme.source}
      </div>

      {/* Hover/Touch Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
        <div className="flex justify-end gap-1.5">
          <button 
            onClick={handleShare}
            title={copied ? "Copied!" : "Copy meme link"}
            className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-xs transition-colors"
          >
            {copied ? <Check size={14} className="text-emerald-400" /> : <Share2 size={14} />}
          </button>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
            title="Enlarge meme"
            className="p-1.5 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-xs transition-colors"
          >
            <Maximize2 size={14} />
          </button>
          
          {onUnsave && (
            <button 
              onClick={handleUnsave}
              title="Remove from saved"
              className="p-1.5 bg-rose-500/70 hover:bg-rose-600 rounded-full text-white backdrop-blur-xs transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div>
          <p className="text-xs font-semibold text-white line-clamp-2 leading-snug">{meme.title}</p>
          <span className="text-[10px] text-amber-300 font-medium">▲ {meme.upvotes.toLocaleString()} upvotes</span>
        </div>
      </div>
    </div>
  );
}
