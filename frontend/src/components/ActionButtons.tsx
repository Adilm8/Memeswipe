import { motion } from 'framer-motion';
import { X, Star, Heart } from 'lucide-react';

interface Props {
  onLike: () => void;
  onDislike: () => void;
  onSave: () => void;
  disabled?: boolean;
}

export default function ActionButtons({ onLike, onDislike, onSave, disabled }: Props) {
  return (
    <div className="flex items-center justify-center gap-6">
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onDislike}
        className="w-14 h-14 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-rose-500 disabled:opacity-50"
      >
        <X size={28} strokeWidth={3} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onSave}
        className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-amber-400 disabled:opacity-50"
      >
        <Star size={24} strokeWidth={3} />
      </motion.button>
      <motion.button
        whileTap={{ scale: 0.9 }}
        disabled={disabled}
        onClick={onLike}
        className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center shadow-lg border border-slate-700 text-emerald-400 disabled:opacity-50"
      >
        <Heart size={32} strokeWidth={3} fill="currentColor" />
      </motion.button>
    </div>
  );
}
