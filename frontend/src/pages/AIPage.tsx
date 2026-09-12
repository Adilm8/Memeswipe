import { useNavigate } from 'react-router-dom';
import AIChatPanel from '@/components/AIChatPanel';
import { ArrowLeft, Flame, Sparkles } from 'lucide-react';

export default function AIPage() {
  const navigate = useNavigate();

  return (
    <div className="h-full flex flex-col bg-[#f0f2f5]">
      {/* Top Bar with "Back to Swiping" button */}
      <div className="flex-none bg-white border-b border-slate-200/90 px-6 py-4 flex items-center justify-between shadow-xs z-10">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors"
            title="Back to Swiping"
          >
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
            <Sparkles size={18} className="text-[#fe3c72]" />
            <span>AI Humor Taste Analyst</span>
          </h2>
        </div>

        <button
          onClick={() => navigate('/')}
          className="px-4 py-1.5 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-full text-xs font-bold shadow-xs flex items-center gap-1.5 transition-all active:scale-95"
        >
          <Flame size={14} />
          <span>Swipe Memes</span>
        </button>
      </div>

      <div className="flex-1 overflow-hidden">
        <AIChatPanel />
      </div>
    </div>
  );
}
