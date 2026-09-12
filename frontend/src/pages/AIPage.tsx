import AIChatPanel from '@/components/AIChatPanel';

export default function AIPage() {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b border-slate-800 bg-slate-900 z-10">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          AI Humor Analyst <span className="text-2xl">🤖</span>
        </h2>
      </div>
      <div className="flex-1 overflow-hidden">
        <AIChatPanel />
      </div>
    </div>
  );
}
