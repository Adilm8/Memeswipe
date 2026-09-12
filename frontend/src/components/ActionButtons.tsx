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
    <div className="flex items-center justify-center gap-5 sm:gap-7">
      {/* Nope (Dislike) */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        disabled={disabled}
        onClick={onDislike}
        title="Nope (Left arrow / ←)"
        aria-label="Nope"
        className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-xl border border-slate-200 text-[#ff4458] disabled:opacity-40 transition-all duration-200 hover:border-[#ff4458]/40 hover:bg-red-50/30 active:scale-95"
      >
        <X size={28} strokeWidth={3} />
      </motion.button>

      {/* Super Like / Star (Save) */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.08 }}
        disabled={disabled}
        onClick={onSave}
        title={isSaved ? "Saved! Click to unsave (Up arrow / S)" : "Star & Save (Up arrow / S)"}
        aria-label="Save"
        className={`w-12 h-12 sm:w-13 sm:h-13 rounded-full flex items-center justify-center shadow-md hover:shadow-xl border disabled:opacity-40 transition-all duration-200 ${
          isSaved
            ? 'bg-cyan-50 border-[#00d4ff] text-[#00d4ff] shadow-cyan-500/20'
            : 'bg-white border-slate-200 text-[#00d4ff] hover:border-[#00d4ff]/40 hover:bg-cyan-50/30'
        }`}
      >
        <Star 
          size={24} 
          strokeWidth={2.5} 
          fill={isSaved ? "currentColor" : "none"}
          className="transition-all duration-200"
        />
      </motion.button>

      {/* Like (Heart) */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        disabled={disabled}
        onClick={onLike}
        title="Like (Right arrow / →)"
        aria-label="Like"
        className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-xl border border-slate-200 text-[#10b981] disabled:opacity-40 transition-all duration-200 hover:border-[#10b981]/40 hover:bg-emerald-50/30 active:scale-95"
      >
        <Heart size={30} strokeWidth={2.8} fill="currentColor" />
      </motion.button>
    </div>
  );
}
