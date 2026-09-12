import { useEffect, useState } from 'react';
import { Profile } from '@/api/types';
import { fetchProfile } from '@/api/profile';
import ProfileStats from '@/components/ProfileStats';
import { useSession } from '@/hooks/useSession';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { session } = useSession();
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetchProfile().then(setProfile).catch(console.error);
  }, []);

  if (!profile || !session) {
    return <div className="flex items-center justify-center h-full"><Loader2 className="animate-spin text-rose-500" /></div>;
  }

  const initials = session.nickname.substring(0, 2).toUpperCase();

  return (
    <div className="p-6 overflow-y-auto h-full">
      <div className="flex flex-col items-center mt-4">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg border-4 border-slate-800">
          <span className="text-3xl font-bold text-white">{initials}</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-white">{session.nickname}</h2>
        <p className="text-slate-400 text-sm">Member since {new Date(session.created_at).toLocaleDateString()}</p>
      </div>
      
      <ProfileStats profile={profile} />
    </div>
  );
}
