import { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@/api/types';
import { createSession, validateSession } from '@/api/session';

interface SessionContextType {
  session: Session | null;
  isLoading: boolean;
  likesCount: number;
  incrementLikes: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

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

  const incrementLikes = () => setLikesCount(prev => prev + 1);

  return (
    <SessionContext.Provider value={{ session, isLoading, likesCount, incrementLikes }}>
      {children}
    </SessionContext.Provider>
  );
};

export const useSessionContext = () => {
  const context = useContext(SessionContext);
  if (context === undefined) throw new Error('useSessionContext must be used within a SessionProvider');
  return context;
};
