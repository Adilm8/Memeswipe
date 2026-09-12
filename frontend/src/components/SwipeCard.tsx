import { Meme } from '@/api/types';

interface SwipeCardProps {
  meme: Meme;
}

export default function SwipeCard({ meme }: SwipeCardProps) {
  return (
    <div className="relative w-full h-full bg-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col pointer-events-none select-none">
      <div className="absolute top-4 right-4 bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm z-10">
        <span className="text-xs font-semibold text-white">r/{meme.source}</span>
      </div>
      <div className="flex-1 w-full h-full">
        <img 
          src={meme.image_url} 
          alt={meme.title}
          draggable={false}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent">
        <h2 className="text-xl font-bold text-white text-shadow leading-tight">
          {meme.title}
        </h2>
      </div>
    </div>
  );
}
