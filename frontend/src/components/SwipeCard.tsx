import { Meme } from '@/api/types';

interface SwipeCardProps {
  meme: Meme;
}

export default function SwipeCard({ meme }: SwipeCardProps) {
  return (
    <div className="relative w-full h-full bg-slate-900 rounded-2xl border border-slate-700/80 overflow-hidden flex flex-col pointer-events-none select-none">
      {/* Subreddit badge & Upvotes */}
      <div className="absolute top-3 right-3 bg-black/75 px-2.5 py-1 rounded-full backdrop-blur-md z-20 border border-white/10 flex items-center gap-1.5">
        <span className="text-[11px] font-semibold text-slate-200">r/{meme.source}</span>
        {meme.upvotes > 0 && (
          <span className="text-[10px] text-amber-400 font-medium">▲ {meme.upvotes.toLocaleString()}</span>
        )}
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

      {/* Crisp Title Strip */}
      <div className="flex-none px-4 py-3 bg-slate-900 border-t border-slate-800/80 z-20">
        <h2 className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
          {meme.title}
        </h2>
      </div>
    </div>
  );
}
