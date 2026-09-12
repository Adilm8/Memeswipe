import { motion } from 'framer-motion';
import { X, Star, Heart, Sparkles } from 'lucide-react';

interface Props {
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  onExplain?: () => void;
  isSaved?: boolean;
  isExplaining?: boolean;
  disabled?: boolean;
}

export default function ActionButtons({ 
  onLike, 
  onDislike, 
  onSave, 
  onExplain,
  isSaved, 
  isExplaining,
  disabled 
}: Props) {
  return (
    <div className="flex items-center justify-center gap-3 sm:gap-6 flex-none shrink-0 py-1">
      {/* Nope (Dislike) */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        disabled={disabled}
        onClick={onDislike}
        title="Nope (Left arrow / ←)"
        aria-label="Nope"
        className="w-[52px] h-[52px] sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-xl border border-slate-200 text-[#ff4458] disabled:opacity-40 transition-all duration-200 hover:border-[#ff4458]/40 hover:bg-red-50/30 active:scale-95 flex-none shrink-0"
      >
        <X size={26} strokeWidth={3} />
      </motion.button>

      {/* Super Like / Star (Save) */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.08 }}
        disabled={disabled}
        onClick={onSave}
        title={isSaved ? "Saved! Click to unsave (Up arrow / S)" : "Star & Save (Up arrow / S)"}
        aria-label="Save"
        className={`w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center shadow-md hover:shadow-xl border disabled:opacity-40 transition-all duration-200 flex-none shrink-0 ${
          isSaved
            ? 'bg-cyan-50 border-[#00d4ff] text-[#00d4ff] shadow-cyan-500/20'
            : 'bg-white border-slate-200 text-[#00d4ff] hover:border-[#00d4ff]/40 hover:bg-cyan-50/30'
        }`}
      >
        <Star 
          size={21} 
          strokeWidth={2.5} 
          fill={isSaved ? "currentColor" : "none"}
          className="transition-all duration-200"
        />
      </motion.button>

      {/* AI Explain Meme Button */}
      {onExplain && (
        <motion.button
          whileTap={{ scale: 0.88 }}
          whileHover={{ scale: 1.08 }}
          disabled={disabled}
          onClick={onExplain}
          title={isExplaining ? "Hide AI explanation (E)" : "Explain meme with AI (E)"}
          aria-label="Explain meme with AI"
          className={`w-[44px] h-[44px] sm:w-[52px] sm:h-[52px] rounded-full flex items-center justify-center shadow-md hover:shadow-xl border disabled:opacity-40 transition-all duration-200 flex-none shrink-0 ${
            isExplaining
              ? 'bg-indigo-50 border-indigo-500 text-indigo-600 shadow-indigo-500/20'
              : 'bg-white border-slate-200 text-indigo-500 hover:border-indigo-400 hover:bg-indigo-50/40'
          }`}
        >
          <Sparkles 
            size={20} 
            strokeWidth={2.4} 
            className={`transition-all duration-200 ${isExplaining ? 'animate-pulse text-indigo-600' : ''}`}
          />
        </motion.button>
      )}

      {/* Like (Heart) */}
      <motion.button
        whileTap={{ scale: 0.88 }}
        whileHover={{ scale: 1.06 }}
        disabled={disabled}
        onClick={onLike}
        title="Like (Right arrow / →)"
        aria-label="Like"
        className="w-[52px] h-[52px] sm:w-16 sm:h-16 bg-white rounded-full flex items-center justify-center shadow-md hover:shadow-xl border border-slate-200 text-[#10b981] disabled:opacity-40 transition-all duration-200 hover:border-[#10b981]/40 hover:bg-emerald-50/30 active:scale-95 flex-none shrink-0"
      >
        <Heart size={27} strokeWidth={2.8} fill="currentColor" />
      </motion.button>
    </div>
  );
}
