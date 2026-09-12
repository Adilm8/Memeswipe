import { Meme } from '@/api/types';
import { ExternalLink, User, Maximize2, Sparkles } from 'lucide-react';
import { useRef } from 'react';

interface SwipeCardProps {
  meme: Meme;
  onEnlarge?: (meme: Meme) => void;
  onExplain?: (meme: Meme) => void;
  isExplaining?: boolean;
}

export default function SwipeCard({ meme, onEnlarge, onExplain, isExplaining }: SwipeCardProps) {
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
    <div className="relative w-full h-full bg-white rounded-2xl sm:rounded-3xl border border-slate-300 overflow-hidden flex flex-col pointer-events-none select-none">
      {/* Top Floating Badges: Subreddit, Author & Score */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 flex items-center justify-between z-20 pointer-events-auto">
        <div className="flex items-center gap-1.5">
          <a
            href={`https://reddit.com/r/${meme.source}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`Browse r/${meme.source}`}
            className="bg-black/60 hover:bg-black/80 px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md border border-white/20 text-[11px] font-semibold text-white transition-colors"
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
              className="p-1 sm:p-1.5 bg-black/60 hover:bg-black/80 text-white rounded-full backdrop-blur-md border border-white/20 transition-transform hover:scale-110"
            >
              <Maximize2 size={12} />
            </button>
          )}

          <div className="bg-black/60 px-2.5 py-0.5 sm:py-1 rounded-full backdrop-blur-md border border-white/20 flex items-center gap-1 text-[11px] font-semibold text-amber-300">
            <span>▲</span>
            <span>{meme.upvotes > 0 ? meme.upvotes.toLocaleString() : 'Hot'}</span>
          </div>
        </div>
      </div>

      {/* Meme Image Container: crisp and completely shadow-free */}
      <div 
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        title="Click or tap to enlarge"
        className="pointer-events-auto cursor-zoom-in relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 p-1 sm:p-2.5 overflow-hidden"
      >
        <img 
          src={meme.image_url} 
          alt={meme.title}
          draggable={false}
          className="relative z-10 max-h-full max-w-full w-auto h-auto object-contain rounded-lg"
        />
      </div>

      {/* Bottom Info Strip */}
      <div className="flex-none px-3.5 py-2.5 sm:px-4 sm:py-3 bg-white border-t border-slate-100 z-20 flex items-center justify-between gap-2 pointer-events-auto">
        <h2 
          onClick={() => onEnlarge?.(meme)}
          title="Click to enlarge"
          className="text-xs sm:text-sm font-bold text-slate-800 leading-snug line-clamp-2 flex-1 cursor-pointer hover:text-[#fe3c72] transition-colors"
        >
          {meme.title}
        </h2>

        <div className="flex items-center gap-1.5 flex-none">
          {onExplain ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onExplain(meme);
              }}
              title="Explain meme with AI (E)"
              className={`flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-lg border transition-colors shadow-2xs ${
                isExplaining
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border-indigo-200/80'
              }`}
            >
              <Sparkles size={11} className={isExplaining ? 'animate-pulse' : ''} />
              <span>{isExplaining ? 'Hide Info' : 'Explain'}</span>
            </button>
          ) : onEnlarge ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onEnlarge(meme);
              }}
              title="Explain meme with AI"
              className="flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-2 py-1 rounded-lg border border-indigo-200/80 transition-colors shadow-2xs"
            >
              <Sparkles size={11} />
              <span>Explain</span>
            </button>
          ) : null}

          {meme.source_url && (
            <a
              href={meme.source_url}
              target="_blank"
              rel="noopener noreferrer"
              title="Open discussion on Reddit"
              className="flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-[#fe3c72] bg-slate-100 hover:bg-rose-50 px-2 py-1 rounded-lg border border-slate-200 transition-colors"
            >
              <span>Reddit</span>
              <ExternalLink size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
