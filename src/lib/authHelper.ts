import { supabase } from './supabase';

export interface UserSession {
  id: string;
  name: string;
  email?: string;
  avatar?: string;
  whatsapp?: string;
  neighborhood?: string;
}

/**
 * Retorna o usuário logado atualmente de forma SÍNCRONA (0ms) a partir do cache local.
 * Essencial para evitar qualquer "flicker" ou atraso ao navegar entre o portal e o marketplace.
 */
export function getAuthUserSync(): UserSession | null {
  try {
    // 1. Impersonação de administrador
    const impersonatedStr = localStorage.getItem('impersonatedUser');
    if (impersonatedStr) {
      const u = JSON.parse(impersonatedStr);
      if (u && (u.id || u.name)) return u;
    }

    // 2. Objeto 'user' serializado
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      if (parsed && (parsed.id || parsed.name)) {
        return parsed;
      }
    }

    // 3. Chaves legacy do localStorage
    const isAuth = localStorage.getItem('user_auth') === 'true';
    const userId = localStorage.getItem('user_id');
    if (isAuth && userId) {
      return {
        id: userId,
        name: localStorage.getItem('user_name') || 'Morador do Bairro',
        avatar: localStorage.getItem('user_avatar') || '',
        whatsapp: localStorage.getItem('user_whatsapp') || '',
        neighborhood: localStorage.getItem('user_neighborhood') || 'Mário Covas'
      };
    }
  } catch (e) {
    console.warn('Erro ao ler getAuthUserSync:', e);
  }
  return null;
}

/**
 * Salva e propaga a sessão do usuário imediatamente em toda a aplicação.
 */
export function setAuthUser(u: UserSession) {
  try {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('user_auth', 'true');
    if (u.id) localStorage.setItem('user_id', u.id);
    if (u.name) localStorage.setItem('user_name', u.name);
    if (u.whatsapp) localStorage.setItem('user_whatsapp', u.whatsapp);
    if (u.neighborhood) localStorage.setItem('user_neighborhood', u.neighborhood);
    if (u.avatar) localStorage.setItem('user_avatar', u.avatar);
    
    // Dispara evento para atualização imediata na mesma janela
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: u }));
    }
  } catch (e) {
    console.warn('Erro ao salvar setAuthUser:', e);
  }
}

/**
 * Limpa a sessão local e notifica todos os ouvintes.
 */
export function clearAuthSession() {
  try {
    localStorage.removeItem('user_auth');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_avatar');
    localStorage.removeItem('user_neighborhood');
    localStorage.removeItem('user_whatsapp');
    localStorage.removeItem('user');
    localStorage.removeItem('impersonatedUser');

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('auth_state_changed', { detail: null }));
    }
  } catch (e) {}
}

/**
 * Retorna o usuário logado atualmente com revalidação assíncrona:
 * 1. Verifica cache local síncrono
 * 2. Valida com Supabase Auth e perfil atualizado
 */
export async function getAuthUser(): Promise<UserSession | null> {
  // 1. Checagem síncrona imediata
  const cached = getAuthUserSync();

  // 2. Revalidação com Supabase Auth direto
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let profileName = cached?.name || localStorage.getItem('user_name') || '';
      let profileAvatar = cached?.avatar || localStorage.getItem('user_avatar') || '';
      let profileWhatsapp = cached?.whatsapp || localStorage.getItem('user_whatsapp') || '';
      let profileNeighborhood = cached?.neighborhood || localStorage.getItem('user_neighborhood') || '';

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (profile) {
        profileName = profile.name || profileName;
        profileAvatar = profile.avatar || profileAvatar;
        profileWhatsapp = profile.whatsapp || profileWhatsapp;
        profileNeighborhood = profile.neighborhood || profileNeighborhood;
      }

      const userObj: UserSession = {
        id: user.id,
        email: user.email,
        name: profileName || 'Morador do Bairro',
        avatar: profileAvatar,
        whatsapp: profileWhatsapp,
        neighborhood: profileNeighborhood || 'Mário Covas'
      };

      setAuthUser(userObj);
      return userObj;
    }
  } catch (err) {
    console.warn('Aviso ao buscar supabase.auth.getUser:', err);
  }

  return cached;
}

