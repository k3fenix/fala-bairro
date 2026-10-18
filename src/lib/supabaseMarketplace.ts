import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Oficial e Unificado para o Fala do Bairro Marketplace.
 * Reutiliza a instância e sessão de autenticação do Supabase oficial do Fala do Bairro,
 * garantindo Single Sign-On (login único), sessão integrada e persistência confiável
 * dos anúncios vinculados ao user_id real do usuário.
 */
export const supabaseMarketplace = supabase;

// Cliente auxiliar legado caso existam itens legados na base secundária
const legacyMarketplaceUrl = 'https://ggztxuctokgzycltyoxo.supabase.co';
const legacyMarketplaceKey = 'sb_publishable_wAHaotl_XNE4veee9QLj_w_PTr2yZUr';

export const supabaseLegacyMarketplace = createClient(legacyMarketplaceUrl, legacyMarketplaceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

export default supabaseMarketplace;
