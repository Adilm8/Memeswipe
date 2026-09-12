import { useState, useEffect, useRef } from 'react';
import { AIMessage } from '@/api/types';
import { chatWithAI, fetchHumorProfile } from '@/api/ai';
import { useSession } from '@/hooks/useSession';
import { Send, Sparkles, Loader2, RotateCcw } from 'lucide-react';
import clsx from 'clsx';

const DEFAULT_ANALYST_MESSAGES: AIMessage[] = [
  { 
    role: 'assistant', 
    content: "Hi! I'm your AI Humor Analyst. Ask me anything about your meme taste, comedic patterns, or which matches share your sense of humor!" 
  }
];

export default function AIChatPanel() {
  const { session } = useSession();
  const analystStorageKey = `memeswipe_analyst_${session?.user_id || 'active'}`;

  // Session-persisted messages across route navigation
  const [messages, setMessages] = useState<AIMessage[]>(() => {
    try {
      const stored = sessionStorage.getItem(analystStorageKey) || localStorage.getItem(analystStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return DEFAULT_ANALYST_MESSAGES;
  });

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  // Sync on session change
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(analystStorageKey) || localStorage.getItem(analystStorageKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
          return;
        }
      }
      setMessages(DEFAULT_ANALYST_MESSAGES);
    } catch (e) {}
  }, [analystStorageKey]);

  // Persist whenever messages change
  useEffect(() => {
    try {
      sessionStorage.setItem(analystStorageKey, JSON.stringify(messages));
      localStorage.setItem(analystStorageKey, JSON.stringify(messages));
    } catch (e) {}
  }, [messages, analystStorageKey]);

  const handleClear = () => {
    setMessages(DEFAULT_ANALYST_MESSAGES);
    try {
      sessionStorage.removeItem(analystStorageKey);
      localStorage.removeItem(analystStorageKey);
    } catch (e) {}
  };

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const newMsgs: AIMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(newMsgs);
    setInput('');
    setLoading(true);
    try {
      const reply = await chatWithAI(text);
      setMessages([...newMsgs, { role: 'assistant', content: reply }]);
    } catch (e) {
      setMessages([...newMsgs, { role: 'assistant', content: "Sorry, I couldn't process that right now. 🤖" }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const profile = await fetchHumorProfile();
      setMessages(p => [...p, { 
        role: 'assistant', 
        content: `✨ **Here is your humor profile:**\n\n${profile.profile}\n\n**Top categories:** ${profile.top_categories.join(', ')}` 
      }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: "Not enough data to analyze your humor yet! Like at least 5 memes first." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f0f2f5]">
      {/* Messages Scroll Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 max-w-3xl w-full mx-auto">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={clsx(
              "max-w-[85%] rounded-2xl p-4 shadow-xs text-sm leading-relaxed",
              m.role === 'user' 
                ? "bg-[#fe3c72] text-white rounded-tr-xs" 
                : "bg-white text-slate-800 border border-slate-200/90 rounded-tl-xs"
            )}>
              <p className="whitespace-pre-wrap">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200/90 rounded-2xl p-4 rounded-tl-xs flex items-center space-x-2 text-slate-500 shadow-xs">
              <Loader2 className="animate-spin w-4 h-4 text-[#fe3c72]" />
              <span className="text-xs font-semibold">Analyzing humor neural pathways...</span>
            </div>
          </div>
        )}
      </div>
      
      {/* Bottom Input Area */}
      <div className="p-4 bg-white border-t border-slate-200/90 flex-none">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button 
              onClick={handleAnalyze} 
              disabled={loading}
              className="flex-none flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-[#fe3c72] border border-rose-200 text-xs font-bold px-3.5 py-1.5 rounded-full transition-colors active:scale-95 disabled:opacity-50"
            >
              <Sparkles size={13} />
              Analyze My Humor Profile
            </button>
            <button 
              onClick={() => sendMessage("What kind of humor do I like the most?")}
              disabled={loading}
              className="flex-none text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              What is my top category?
            </button>
            <button 
              onClick={() => sendMessage("Why did I match with my top match?")}
              disabled={loading}
              className="flex-none text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 text-xs font-medium px-3 py-1.5 rounded-full transition-colors"
            >
              Explain my matches
            </button>
            <button 
              onClick={handleClear} 
              disabled={loading || messages.length <= 1}
              title="Reset conversation"
              className="flex-none flex items-center gap-1 text-slate-400 hover:text-slate-700 bg-slate-100 hover:bg-slate-200 text-xs font-medium px-3 py-1.5 rounded-full transition-colors disabled:opacity-40 ml-auto"
            >
              <RotateCcw size={12} />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder="Ask about your meme humor or matches..."
              className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#fe3c72] focus:bg-white transition-colors"
            />
            <button 
              onClick={() => sendMessage(input)} 
              disabled={loading || !input.trim()} 
              className="p-2.5 bg-[#fe3c72] hover:bg-[#e02d60] text-white rounded-xl shadow-xs disabled:opacity-40 transition-all active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
