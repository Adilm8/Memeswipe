import { Meme } from '@/api/types';
import { ExternalLink, User, Maximize2 } from 'lucide-react';
import { useRef } from 'react';

interface SwipeCardProps {
  meme: Meme;
  onEnlarge?: (meme: Meme) => void;
}

export default function SwipeCard({ meme, onEnlarge }: SwipeCardProps) {
  const dragStartPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartPos.current = { x: e.clientX, y: e.clientY };
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStartPos.current) return;
    const dx = Math.abs(e.clientX - dragStartPos.current.x);
    const dy = Math.abs(e.clientY - dragStartPos.current.y);
    dragStartPos.current = null;
    // If movement is very small (< 8px), it's a tap/click, not a drag swipe
    if (dx < 8 && dy < 8 && onEnlarge) {
      onEnlarge(meme);
    }
  };

  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col pointer-events-none select-none">
      {/* Top Badges: Subreddit & Author & Upvotes & Zoom Button */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <a
            href={`https://reddit.com/r/${meme.source}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Browse r/${meme.source}`}
            className="bg-black/75 hover:bg-black/90 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 text-[11px] font-semibold text-slate-200 hover:text-white transition-colors"
          >
            r/{meme.source}
          </a>
          {meme.author && (
            <span className="hidden sm:flex items-center gap-1 bg-black/60 px-2 py-1 rounded-full backdrop-blur-md border border-white/10 text-[10px] text-slate-300">
              <User size={10} className="text-slate-400" />
              u/{meme.author}
            </span>
          )}
        </div>

        {/* Upvotes score & Enlarge button */}
        <div className="flex items-center gap-1.5">
          {onEnlarge && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEnlarge(meme);
              }}
              title="Enlarge meme (Space / Click)"
              className="p-1.5 bg-black/75 hover:bg-black/90 text-slate-300 hover:text-white rounded-full backdrop-blur-md border border-white/10 transition-transform hover:scale-110"
            >
              <Maximize2 size={13} />
            </button>
          )}

          <div className="bg-black/75 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1 text-[11px] font-medium text-amber-400">
            <span>▲</span>
            <span>{meme.upvotes > 0 ? meme.upvotes.toLocaleString() : 'Hot'}</span>
          </div>
        </div>
      </div>

      {/* Meme Image Container: object-contain with ambient background, click to enlarge */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        title="Click or tap to enlarge"
        className="pointer-events-auto cursor-zoom-in relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 p-2 sm:p-3 overflow-hidden"
      >
        {/* Ambient blurred glow filling container naturally */}
        <div 
          className="absolute inset-0 opacity-20 blur-3xl scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${meme.image_url})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        />
        <img 
          src={meme.image_url} 
          alt={meme.title}
          draggable={false}
          className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-xl"
        />
      </div>

      {/* Title Strip with direct link to Reddit discussion and Enlarge button */}
      <div className="flex-none px-4 py-3 bg-slate-900 border-t border-slate-800/80 z-20 flex items-center justify-between gap-2.5 pointer-events-auto">
        <h2 
          onClick={() => onEnlarge?.(meme)}
          title="Click to enlarge"
          className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 flex-1 cursor-pointer hover:text-amber-200 transition-colors"
        >
          {meme.title}
        </h2>

        <div className="flex items-center gap-1.5 flex-none">
          {onEnlarge && (
            <button
              onClick={() => onEnlarge(meme)}
              title="Enlarge meme (Space)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            >
              <Maximize2 size={13} />
            </button>
          )}

          {meme.source_url && (
            <a
              href={meme.source_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open Reddit discussion, context & comments"
              className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500/50 rounded-lg text-xs font-medium text-orange-400 hover:text-orange-300 transition-all shadow-sm"
            >
              <span>Reddit</span>
              <ExternalLink size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
