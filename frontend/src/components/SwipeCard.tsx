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
    <div className="relative w-full h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xl overflow-hidden flex flex-col pointer-events-none select-none transition-shadow duration-200">
      {/* Top Floating Badges: Subreddit, Author & Score */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <a
            href={`https://reddit.com/r/${meme.source}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Browse r/${meme.source}`}
            className="bg-black/60 hover:bg-black/80 px-3 py-1 rounded-full backdrop-blur-md border border-white/20 text-xs font-semibold text-white transition-colors"
          >
            r/{meme.source}
          </a>
          {meme.author && (
            <span className="hidden sm:flex items-center gap-1 bg-black/50 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 text-[11px] text-slate-200">
              <User size={11} className="text-slate-300" />
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
              className="p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/20 transition-transform hover:scale-110"
            >
              <Maximize2 size={13} />
            </button>
          )}

          <div className="bg-black/60 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1 text-xs font-semibold text-amber-300">
            <span>▲</span>
            <span>{meme.upvotes > 0 ? meme.upvotes.toLocaleString() : 'Hot'}</span>
          </div>
        </div>
      </div>

      {/* Meme Image Container: centered with click-to-enlarge */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        title="Click or tap to enlarge"
        className="pointer-events-auto cursor-zoom-in relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 p-2 sm:p-3 overflow-hidden"
      >
        {/* Ambient blurred glow filling background */}
        <div 
          className="absolute inset-0 opacity-25 blur-3xl scale-125 pointer-events-none"
          style={{ backgroundImage: `url(${meme.image_url})`, backgroundPosition: 'center', backgroundSize: 'cover' }}
        />
        <img 
          src={meme.image_url} 
          alt={meme.title}
          draggable={false}
          className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-xl shadow-sm"
        />
      </div>

      {/* Bottom Info Strip: clean Tinder style */}
      <div className="flex-none px-4 py-3 sm:px-5 sm:py-3.5 bg-white border-t border-slate-100 z-20 flex items-center justify-between gap-3 pointer-events-auto">
        <h2 
          onClick={() => onEnlarge?.(meme)}
          title="Click to enlarge"
          className="text-sm sm:text-base font-bold text-slate-800 leading-snug line-clamp-2 flex-1 cursor-pointer hover:text-[#fe3c72] transition-colors"
        >
          {meme.title}
        </h2>

        {meme.source_url && (
          <a
            href={meme.source_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open discussion on Reddit"
            className="flex-none flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-[#fe3c72] bg-slate-100 hover:bg-rose-50 px-2.5 py-1.5 rounded-lg border border-slate-200 transition-colors"
          >
            <span>Reddit</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
