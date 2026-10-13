import { createClient } from '@supabase/supabase-js';

// Dedicated Supabase client for Fala do Bairro Marketplace Independent Platform
// Enables independent database, auth sessions, RLS and image storage.
const defaultMarketplaceUrl = 'https://ggztxuctokgzycltyoxo.supabase.co';
const defaultMarketplaceKey = 'sb_publishable_wAHaotl_XNE4veee9QLj_w_PTr2yZUr';

const marketplaceUrl = (import.meta.env.VITE_MARKETPLACE_SUPABASE_URL && import.meta.env.VITE_MARKETPLACE_SUPABASE_URL.trim() !== '')
  ? import.meta.env.VITE_MARKETPLACE_SUPABASE_URL
  : defaultMarketplaceUrl;

const marketplaceAnonKey = (import.meta.env.VITE_MARKETPLACE_SUPABASE_ANON_KEY && import.meta.env.VITE_MARKETPLACE_SUPABASE_ANON_KEY.trim() !== '')
  ? import.meta.env.VITE_MARKETPLACE_SUPABASE_ANON_KEY
  : defaultMarketplaceKey;

// Separate auth storage ensures sessions in Fala do Bairro do not leak or overwrite Marketplace sessions
export const supabaseMarketplace = createClient(marketplaceUrl, marketplaceAnonKey, {
  auth: {
    storageKey: 'marketplace_auth_token',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  }
});
