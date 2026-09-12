import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Share2, ChevronLeft, ChevronRight, Check, ExternalLink, User, Sparkles, Loader2 } from 'lucide-react';
import { Meme } from '@/api/types';
import { explainMeme } from '@/api/ai';

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
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  // Reset explanation when meme changes
  useEffect(() => {
    setExplanation(null);
    setIsExplaining(false);
  }, [meme?.id]);

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
        await navigator.clipboard.writeText(meme.source_url || meme.image_url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('Failed to copy link:', err);
    }
  };

  const handleExplain = async () => {
    if (explanation) {
      setExplanation(null); // toggle off
      return;
    }
    setIsExplaining(true);
    try {
      const text = await explainMeme(meme.id);
      setExplanation(text);
    } catch (err) {
      console.error('Failed to explain meme:', err);
      setExplanation("Could not analyze this meme right now. Try again later!");
    } finally {
      setIsExplaining(false);
    }
  };

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6"
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
          className="relative max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-slate-800 bg-slate-900/95 z-10">
            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={`https://reddit.com/r/${meme.source}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold px-2.5 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-full text-slate-200 transition-colors"
              >
                r/{meme.source}
              </a>

              {meme.author && (
                <span className="flex items-center gap-1 text-xs text-slate-400 bg-slate-800/60 px-2.5 py-1 rounded-full border border-slate-800">
                  <User size={12} className="text-slate-500" />
                  u/{meme.author}
                </span>
              )}

              {meme.upvotes > 0 && (
                <span className="text-xs text-amber-400 font-medium">
                  ▲ {meme.upvotes.toLocaleString()}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Reddit Post Link */}
              {meme.source_url && (
                <a
                  href={meme.source_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="Open post on Reddit"
                  className="px-2.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/40 text-orange-400 rounded-full transition-colors flex items-center gap-1 text-xs font-medium"
                >
                  <span>Reddit</span>
                  <ExternalLink size={12} />
                </a>
              )}

              <button
                onClick={handleShare}
                title="Copy post link"
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
          <div className="flex-1 overflow-auto bg-black/60 flex items-center justify-center p-2 sm:p-4 min-h-[250px] relative">
            <img
              src={meme.image_url}
              alt={meme.title}
              className="max-h-[58vh] w-auto max-w-full object-contain rounded-xl shadow-lg"
            />
          </div>

          {/* AI Explanation Banner (if open) */}
          {explanation && (
            <div className="p-3 bg-blue-950/40 border-t border-blue-900/50 text-xs text-blue-200">
              <div className="flex items-center gap-1.5 font-semibold text-blue-400 mb-1">
                <Sparkles size={14} /> AI Meme Analysis:
              </div>
              <p className="leading-relaxed">{explanation}</p>
            </div>
          )}

          {/* Footer Bar */}
          <div className="p-3.5 sm:p-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between gap-4">
            <h3 className="text-sm sm:text-base font-bold text-white leading-snug flex-1">
              {meme.title}
            </h3>

            {/* Explain Meme AI Button */}
            <button
              onClick={handleExplain}
              disabled={isExplaining}
              className="flex-none px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/40 text-blue-400 hover:text-blue-300 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors disabled:opacity-50"
            >
              {isExplaining ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Explaining...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>{explanation ? 'Hide Info' : 'Explain Meme'}</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
