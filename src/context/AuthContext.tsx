import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { getAuthUser, getAuthUserSync, clearAuthSession, UserSession } from '../lib/authHelper';

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
  // Inicialização síncrona: se já existe sessão no cache, disponibiliza imediatamente (0ms)
  const initialUser = getAuthUserSync();
  const [user, setUser] = useState<UserSession | null>(initialUser);
  const [loading, setLoading] = useState<boolean>(!initialUser);

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
    clearAuthSession();
    try {
      await supabase.auth.signOut();
    } catch (e) {}
    setUser(null);
  };

  useEffect(() => {
    // Revalidação assíncrona em segundo plano
    refreshUser();

    // Ouvir evento imediato da mesma janela (disparado por setAuthUser / clearAuthSession)
    const handleLocalAuthChange = (e: any) => {
      if (e.detail !== undefined) {
        setUser(e.detail);
        setLoading(false);
      } else {
        refreshUser();
      }
    };
    window.addEventListener('auth_state_changed', handleLocalAuthChange);

    // Ouvir mudanças de autenticação no Supabase
    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        // Imediatamente atualizar usuário síncrono com dados da sessão
        const meta = session.user.user_metadata || {};
        const immediateUser: UserSession = {
          id: session.user.id,
          email: session.user.email,
          name: meta.name || meta.full_name || session.user.email?.split('@')[0] || 'Morador do Bairro',
          avatar: meta.avatar_url || meta.avatar || '',
          neighborhood: meta.neighborhood || localStorage.getItem('user_neighborhood') || 'Mário Covas',
          whatsapp: meta.whatsapp || localStorage.getItem('user_whatsapp') || ''
        };
        setUser(prev => prev || immediateUser);
        setLoading(false);
        await refreshUser();
      } else if (!getAuthUserSync()) {
        setUser(null);
      }
    });

    // Ouvir alterações de localStorage para sincronizar abas distintas
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'user' || e.key === 'user_auth' || e.key === 'impersonatedUser') {
        const syncU = getAuthUserSync();
        setUser(syncU);
        refreshUser();
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('auth_state_changed', handleLocalAuthChange);
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

