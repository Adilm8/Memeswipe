import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function MatchesModal({ onClose }: { onClose: () => void }) {
  const navigate = useNavigate();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-slate-800 rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl border border-slate-700"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Your Humor Matches Are Ready!</h2>
        <p className="text-slate-400 mb-8">You've liked enough memes. Let's see who shares your brain cells.</p>
        
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { onClose(); navigate('/matches'); }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold shadow-lg hover:opacity-90"
          >
            View All Matches
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-slate-700 text-white rounded-xl font-semibold hover:bg-slate-600"
          >
            Keep Swiping
          </button>
        </div>
      </motion.div>
    </div>
  );
}
