import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, Profile } from '@/api/types';
import { createSession, validateSession } from '@/api/session';
import { fetchProfile } from '@/api/profile';

interface SessionContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  likesCount: number;
  incrementLikes: () => void;
  refreshProfile: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchProfile();
      setProfile(p);
      setLikesCount(p.total_likes);
    } catch (e) {
      console.error("Failed to load profile stats:", e);
    }
  }, []);

  useEffect(() => {
    const initSession = async () => {
      const token = localStorage.getItem('session_token');
      try {
        if (token) {
          const validSession = await validateSession();
          setSession(validSession);
        } else {
          const newSession = await createSession();
          localStorage.setItem('session_token', newSession.session_token);
          setSession(newSession);
        }
      } catch (error) {
        console.error("Session error:", error);
        localStorage.removeItem('session_token');
        const newSession = await createSession();
        localStorage.setItem('session_token', newSession.session_token);
        setSession(newSession);
      } finally {
        setIsLoading(false);
      }
    };
    initSession();
  }, []);

  // Fetch actual database stats as soon as the session is established
  useEffect(() => {
    if (session) {
      loadProfile();
    }
  }, [session, loadProfile]);

  const incrementLikes = () => setLikesCount(prev => prev + 1);

  return (
    <SessionContext.Provider value={{ 
      session, 
      profile, 
      isLoading, 
      likesCount, 
      incrementLikes, 
      refreshProfile: loadProfile 
    }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) throw new Error('useSessionContext must be used within a SessionProvider');
  return context;
};
