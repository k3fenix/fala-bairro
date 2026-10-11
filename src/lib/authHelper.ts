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
 * Retorna o usuário logado atualmente com compatibilidade total:
 * 1. Impersonação de admin (impersonatedUser)
 * 2. Sessão ativa do Supabase Auth (supabase.auth.getUser)
 * 3. Chaves legacy do localStorage (user_auth, user_id, user_name, etc.)
 * 4. Objeto 'user' salvo em JSON no localStorage
 */
export async function getAuthUser(): Promise<UserSession | null> {
  // 1. Impersonação
  const impersonatedStr = localStorage.getItem('impersonatedUser');
  if (impersonatedStr) {
    try {
      const u = JSON.parse(impersonatedStr);
      syncUserInStorage(u);
      return u;
    } catch (e) {
      console.error('Erro ao ler impersonatedUser:', e);
    }
  }

  // 2. Supabase Auth direto
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      let profileName = localStorage.getItem('user_name') || '';
      let profileAvatar = localStorage.getItem('user_avatar') || '';
      let profileWhatsapp = localStorage.getItem('user_whatsapp') || '';
      let profileNeighborhood = localStorage.getItem('user_neighborhood') || '';

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

      syncUserInStorage(userObj);
      return userObj;
    }
  } catch (err) {
    console.warn('Aviso ao buscar supabase.auth.getUser:', err);
  }

  // 3. Chaves legacy do localStorage
  const isAuth = localStorage.getItem('user_auth') === 'true';
  const userId = localStorage.getItem('user_id');
  if (isAuth && userId) {
    const userObj: UserSession = {
      id: userId,
      name: localStorage.getItem('user_name') || 'Morador do Bairro',
      avatar: localStorage.getItem('user_avatar') || '',
      whatsapp: localStorage.getItem('user_whatsapp') || '',
      neighborhood: localStorage.getItem('user_neighborhood') || 'Mário Covas'
    };
    syncUserInStorage(userObj);
    return userObj;
  }

  // 4. Objeto 'user' serializado
  const storedUser = localStorage.getItem('user');
  if (storedUser) {
    try {
      const parsed = JSON.parse(storedUser);
      if (parsed && (parsed.id || parsed.name)) {
        return parsed;
      }
    } catch (e) {}
  }

  return null;
}

function syncUserInStorage(u: UserSession) {
  try {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('user_auth', 'true');
    if (u.id) localStorage.setItem('user_id', u.id);
    if (u.name) localStorage.setItem('user_name', u.name);
    if (u.whatsapp) localStorage.setItem('user_whatsapp', u.whatsapp);
    if (u.neighborhood) localStorage.setItem('user_neighborhood', u.neighborhood);
    if (u.avatar) localStorage.setItem('user_avatar', u.avatar);
  } catch (e) {}
}
