import { useState } from 'react';
import { AIMessage } from '@/api/types';
import { chatWithAI, fetchHumorProfile } from '@/api/ai';
import { Send, Sparkles, Loader2 } from 'lucide-react';
import clsx from 'clsx';

export default function AIChatPanel() {
  const [messages, setMessages] = useState<AIMessage[]>([{ role: 'assistant', content: "Hi! I'm your AI Humor Analyst. What do you want to know about your meme taste?" }]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;
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
      setMessages(p => [...p, { role: 'assistant', content: `Here is your humor profile:

${profile.profile}

Top categories: ${profile.top_categories.join(', ')}` }]);
    } catch (e) {
      setMessages(p => [...p, { role: 'assistant', content: "Not enough data to analyze your humor yet!" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={clsx("flex", m.role === 'user' ? "justify-end" : "justify-start")}>
            <div className={clsx("max-w-[80%] rounded-2xl p-3", m.role === 'user' ? "bg-blue-600 text-white rounded-tr-sm" : "bg-slate-800 text-slate-200 border border-slate-700 rounded-tl-sm")}>
              <p className="whitespace-pre-wrap text-sm">{m.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-3 rounded-tl-sm flex items-center space-x-2">
              <Loader2 className="animate-spin w-4 h-4 text-slate-400" />
              <span className="text-slate-400 text-sm">Thinking...</span>
            </div>
          </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-800 border-t border-slate-700">
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          <button onClick={handleAnalyze} className="flex-none flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-xs text-white px-3 py-1.5 rounded-full transition-colors">
            <Sparkles size={14} className="text-blue-400" /> Analyze My Humor
          </button>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage(input)}
            placeholder="Ask something..."
            className="flex-1 bg-slate-900 border border-slate-700 rounded-full px-4 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
          />
          <button onClick={() => sendMessage(input)} disabled={loading || !input.trim()} className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50">
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
