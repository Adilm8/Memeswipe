import { useEffect, useState } from 'react';
import { Match } from '@/api/types';
import { fetchMatches } from '@/api/profile';
import { Loader2, Users } from 'lucide-react';
import { motion } from 'framer-motion';

export default function MatchesPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMatches().then(setMatches).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-emerald-500" /></div>;

  return (
    <div className="p-4 h-full overflow-y-auto">
      <h2 className="text-xl font-bold text-white mb-6">Your Humor Twins 👯</h2>
      
      {matches.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-slate-400">
          <Users size={48} className="mb-4 opacity-50" />
          <p>Like at least 10 memes to find your humor twins! 😄</p>
        </div>
      ) : (
        <div className="space-y-4">
          {matches.map((match, i) => (
            <motion.div 
              key={match.user_id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-slate-800 rounded-2xl p-4 border border-slate-700"
            >
              <div className="flex justify-between items-center mb-3">
                <h3 className="font-bold text-lg text-white">{match.nickname}</h3>
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-sm font-semibold">
                  {(match.similarity_score * 100).toFixed(0)}% Match
                </span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2 mb-4">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${match.similarity_score * 100}%` }}></div>
              </div>
              <p className="text-sm text-slate-400 mb-2">{match.shared_memes_count} shared memes</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {match.shared_memes.map(meme => (
                  <img key={meme.id} src={meme.image_url} alt={meme.title} className="w-16 h-16 rounded-lg object-cover flex-none" />
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
