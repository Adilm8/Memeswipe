import { Profile } from '@/api/types';
import { Activity, Heart, XOctagon, Star, Percent } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ProfileStats({ profile }: { profile: Profile }) {
  const stats = [
    { label: 'Total Swipes', value: profile.total_swipes, icon: Activity, color: 'text-indigo-500' },
    { label: 'Likes', value: profile.total_likes, icon: Heart, color: 'text-emerald-500' },
    { label: 'Dislikes', value: profile.total_dislikes, icon: XOctagon, color: 'text-rose-500' },
    { label: 'Saved Memes', value: profile.total_saves, icon: Star, color: 'text-amber-500' },
    { 
      label: 'Like Ratio', 
      value: `${(profile.like_ratio * 100).toFixed(0)}%`, 
      icon: Percent, 
      color: profile.like_ratio > 0.5 ? 'text-emerald-500' : profile.like_ratio > 0.3 ? 'text-amber-500' : 'text-rose-500' 
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 mt-6">
      {stats.map((stat, i) => (
        <motion.div 
          key={stat.label}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col items-center justify-center text-center"
        >
          <stat.icon className={`${stat.color} mb-1.5`} size={22} />
          <span className="text-2xl sm:text-3xl font-black text-slate-900">{stat.value}</span>
          <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  );
}
