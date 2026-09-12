import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Share2, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { Meme } from '@/api/types';
import { useState } from 'react';

interface MemeModalProps {
  meme: Meme | null;
  onClose: () => void;
  onUnsave?: (id: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
  hasNext?: boolean;
  hasPrev?: boolean;
}

export default function MemeModal({
  meme,
  onClose,
  onUnsave,
  onNext,
  onPrev,
  hasNext = false,
  hasPrev = false,
}: MemeModalProps) {
  const [copied, setCopied] = useState(false);

  // Keyboard navigation inside modal (Escape, ArrowLeft, ArrowRight)
  useEffect(() => {
    if (!meme) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowLeft' && hasPrev && onPrev) {
        e.preventDefault();
        onPrev();
      } else if (e.key === 'ArrowRight' && hasNext && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [meme, onClose, onPrev, onNext, hasPrev, hasNext]);

  if (!meme) return null;

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(meme.image_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy image link:', err);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 sm:p-6"
        onClick={onClose}
      >
        {/* Navigation Previous Button */}
        {hasPrev && onPrev && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onPrev();
            }}
            title="Previous (Left arrow)"
            aria-label="Previous meme"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* Navigation Next Button */}
        {hasNext && onNext && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNext();
            }}
            title="Next (Right arrow)"
            aria-label="Next meme"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 z-20 w-11 h-11 bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-white rounded-full flex items-center justify-center shadow-xl transition-transform hover:scale-110"
          >
            <ChevronRight size={26} />
          </button>
        )}

        {/* Modal Content Box */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-900/90 z-10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-full text-slate-300">
                r/{meme.source}
              </span>
              {meme.upvotes > 0 && (
                <span className="text-xs text-amber-400 font-medium">
                  ▲ {meme.upvotes.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                title="Copy image link"
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-white transition-colors flex items-center gap-1 text-xs"
              >
                {copied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
                {copied && <span className="text-emerald-400 pr-1">Copied!</span>}
              </button>

              {onUnsave && (
                <button
                  onClick={() => {
                    onUnsave(meme.id);
                    onClose();
                  }}
                  title="Remove from saved"
                  className="p-2 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-400 rounded-full transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              )}

              <button
                onClick={onClose}
                title="Close (Esc)"
                aria-label="Close enlarged view"
                className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-white transition-colors ml-1"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Image Container with natural aspect ratio */}
          <div className="flex-1 overflow-auto bg-black/60 flex items-center justify-center p-2 sm:p-4 min-h-[300px]">
            <img
              src={meme.image_url}
              alt={meme.title}
              className="max-h-[65vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* Footer Title */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
              {meme.title}
            </h3>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
