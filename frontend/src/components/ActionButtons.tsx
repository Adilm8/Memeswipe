import { motion } from 'framer-motion';
import { X, Star, Heart } from 'lucide-react';

interface Props {
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  isSaved?: boolean;
  disabled?: boolean;
}

export default function ActionButtons({ onLike, onDislike, onSave, isSaved, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-6">
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onDislike}
        title="Dislike (Left arrow)"
        aria-label="Dislike"
        className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-rose-500 disabled:opacity-50 transition-colors hover:border-rose-500/50"
      >
        <X size={28} strokeWidth={3} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onSave}
        title={isSaved ? "Saved! Click to unsave (Up arrow / S)" : "Save meme (Up arrow / S)"}
        aria-label="Save"
        className={`w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border text-amber-400 disabled:opacity-50 transition-all ${
          isSaved ? 'border-amber-400/80 bg-amber-400/15 shadow-amber-400/20' : 'border-slate-700 hover:border-amber-400/50'
        }`}
      >
        <Star 
          size={24} 
          strokeWidth={3} 
          fill={isSaved ? "currentColor" : "none"}
          className="transition-all duration-200"
        />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onLike}
        title="Like (Right arrow)"
        aria-label="Like"
        className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-emerald-400 disabled:opacity-50 transition-colors hover:border-emerald-500/50"
      >
        <Heart size={32} strokeWidth={3} fill="currentColor" />
      </motion.button>
    </div>
  );
}
