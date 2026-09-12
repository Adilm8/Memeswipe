import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, Profile } from '@/api/types';
import { createSession, validateSession } from '@/api/session';
import { fetchProfile } from '@/api/profile';
import { loginUser, registerUser, createGuestSession, LoginParams, RegisterParams } from '@/api/auth';

interface SessionContextType {
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  likesCount: number;
  incrementLikes: () => void;
  refreshProfile: () => Promise<void>;
  login: (params: LoginParams) => Promise<void>;
  register: (params: RegisterParams) => Promise<void>;
  logout: () => Promise<void>;
  continueAsGuest: () => Promise<void>;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const SessionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [likesCount, setLikesCount] = useState(0);

  // Auth modal state
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
  }, []);

  const loadProfile = useCallback(async () => {
    try {
      const p = await fetchProfile();
      setProfile(p);
      setLikesCount(p.total_likes);
    } catch (e) {
      console.error("Failed to load profile stats:", e);
    }
  }, []);

  const initSession = useCallback(async () => {
    setIsLoading(true);
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
      console.error("Session error, resetting to guest:", error);
      localStorage.removeItem('session_token');
      try {
        const newSession = await createSession();
        localStorage.setItem('session_token', newSession.session_token);
        setSession(newSession);
      } catch (err) {
        console.error("Critical session creation failure:", err);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();
  }, [initSession]);

  // Fetch stats when session is ready
  useEffect(() => {
    if (session) {
      loadProfile();
    }
  }, [session, loadProfile]);

  const incrementLikes = () => setLikesCount(prev => prev + 1);

  const login = async (params: LoginParams) => {
    const loggedInSession = await loginUser(params);
    localStorage.setItem('session_token', loggedInSession.session_token);
    setSession(loggedInSession);
    await loadProfile();
    closeAuthModal();
  };

  const register = async (params: RegisterParams) => {
    // If user is currently guest, backend will upgrade their account retaining swipes
    const registeredSession = await registerUser(params);
    localStorage.setItem('session_token', registeredSession.session_token);
    setSession(registeredSession);
    await loadProfile();
    closeAuthModal();
  };

  const logout = async () => {
    setIsLoading(true);
    localStorage.removeItem('session_token');
    try {
      const guestSession = await createGuestSession();
      localStorage.setItem('session_token', guestSession.session_token);
      setSession(guestSession);
      await loadProfile();
    } catch (err) {
      console.error("Failed to initialize new guest session after logout:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const continueAsGuest = async () => {
    closeAuthModal();
    if (!session) {
      await initSession();
    }
  };

  return (
    <SessionContext.Provider value={{ 
      session, 
      profile, 
      isLoading, 
      likesCount, 
      incrementLikes, 
      refreshProfile: loadProfile,
      login,
      register,
      logout,
      continueAsGuest,
      isAuthModalOpen,
      authModalMode,
      openAuthModal,
      closeAuthModal
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
