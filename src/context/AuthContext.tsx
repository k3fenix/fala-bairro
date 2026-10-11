import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAuthUser, UserSession } from '../lib/authHelper';

interface AuthContextType {
  user: UserSession | null;
  loading: boolean;
  refreshUser: () => Promise<UserSession | null>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  refreshUser: async () => null,
  logout: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async (): Promise<UserSession | null> => {
    try {
      const u = await getAuthUser();
      setUser(u);
      return u;
    } catch (e) {
      console.warn('Erro ao atualizar usuário no AuthProvider:', e);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_neighborhood');
    localStorage.removeItem('user_whatsapp');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedUser');
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  useEffect(() => {
    refreshUser();

    // Ouvir mudanças de autenticação no Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        await refreshUser();
      } else {
        await refreshUser();
      }
    });

    // Ouvir alterações de localStorage para sincronizar abas e rotas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'user_auth' || e.key === 'impersonatedUser') {
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      authListener?.subscription.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, refreshUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
