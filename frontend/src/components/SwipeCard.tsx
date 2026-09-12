import { Meme } from '@/api/types';
import { ExternalLink, User } from 'lucide-react';

interface SwipeCardProps {
  meme: Meme;
}

export default function SwipeCard({ meme }: SwipeCardProps) {
  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col pointer-events-none select-none">
      {/* Top Badges: Subreddit & Author & Upvotes */}
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

        {/* Upvotes score */}
        <div className="bg-black/75 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 flex items-center gap-1 text-[11px] font-medium text-amber-400">
          <span>▲</span>
          <span>{meme.upvotes > 0 ? meme.upvotes.toLocaleString() : 'Hot'}</span>
        </div>
      </div>

      {/* Meme Image Container: object-contain with ambient background, no cropped text */}
      <div className="relative flex-1 w-full h-full flex items-center justify-center bg-slate-950 p-2 sm:p-3 overflow-hidden">
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

      {/* Crisp Title Strip with direct link to Reddit discussion */}
      <div className="flex-none px-4 py-3 bg-slate-900 border-t border-slate-800/80 z-20 flex items-center justify-between gap-3">
        <h2 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2 flex-1">
          {meme.title}
        </h2>
        {meme.source_url && (
          <a
            href={meme.source_url}
            target="_blank"
            rel="noopener noreferrer"
            title="Open Reddit discussion, context & comments"
            className="pointer-events-auto flex-none flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-orange-500/50 rounded-lg text-xs font-medium text-orange-400 hover:text-orange-300 transition-all shadow-sm"
          >
            <span>Reddit</span>
            <ExternalLink size={12} />
          </a>
        )}
      </div>
    </div>
  );
}
