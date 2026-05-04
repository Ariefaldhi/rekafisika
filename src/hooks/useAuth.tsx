import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { UserSession } from '../lib/supabase';

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (session: UserSession) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user_session');
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch {
      localStorage.removeItem('user_session');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (session: UserSession) => {
    localStorage.setItem('user_session', JSON.stringify(session));
    setUser(session);
  };

  const logout = () => {
    localStorage.removeItem('user_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
