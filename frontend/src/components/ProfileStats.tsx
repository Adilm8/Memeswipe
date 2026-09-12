import { Profile } from '@/api/types';
import { Activity, Heart, XOctagon, Star, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileStats({ profile }: { profile: Profile }) {
  const stats = [
    { label: 'Total Swipes', value: profile.total_swipes, icon: Activity, color: 'text-blue-400' },
    { label: 'Likes', value: profile.total_likes, icon: Heart, color: 'text-emerald-400' },
    { label: 'Dislikes', value: profile.total_dislikes, icon: XOctagon, color: 'text-rose-400' },
    { label: 'Saved', value: profile.total_saves, icon: Star, color: 'text-amber-400' },
    { 
      label: 'Like Ratio', 
      value: `${(profile.like_ratio * 100).toFixed(0)}%`, 
      icon: Percent, 
      color: profile.like_ratio > 0.5 ? 'text-emerald-400' : profile.like_ratio > 0.3 ? 'text-amber-400' : 'text-rose-400' 
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 mt-6">
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1 }}
          className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col items-center justify-center text-center"
        >
          <stat.icon className={`${stat.color} mb-2`} size={24} />
          <span className="text-2xl font-bold text-white">{stat.value}</span>
          <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
