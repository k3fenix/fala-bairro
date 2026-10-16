-- =========================================================================
-- CORREÇÃO DEFINITIVA COMPATÍVEL COM SUA TABELA PROFILES ATUAL
-- Execute este script no SQL Editor do Supabase:
-- =========================================================================

-- 1. Garante que as colunas necessárias existam sem dar erro caso já existam ou faltem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS handle TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS whatsapp TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS neighborhood TEXT DEFAULT 'Mário Covas';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Aprovado';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Habilitar RLS e aplicar permissões abertas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Perfis públicos para leitura" ON public.profiles;
DROP POLICY IF EXISTS "Usuários criam e editam próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Permitir tudo profiles" ON public.profiles;
DROP POLICY IF EXISTS "Marketplace profiles visíveis publicamente" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
DROP POLICY IF EXISTS "Usuários podem inserir seu próprio perfil" ON public.profiles;

-- Política 1: Leitura livre dos perfis
CREATE POLICY "Perfis públicos para leitura" 
ON public.profiles 
FOR SELECT 
USING (true);

-- Política 2: Criação e edição liberada
CREATE POLICY "Usuários criam e editam próprio perfil" 
ON public.profiles 
FOR ALL 
USING (true)
WITH CHECK (true);

-- 3. TRIGGER AUTOMÁTICO PARA NOVOS USUÁRIOS DO SUPABASE AUTH
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_name TEXT;
  v_avatar TEXT;
  v_phone TEXT;
BEGIN
  v_name := COALESCE(
    new.raw_user_meta_data->>'name',
    new.raw_user_meta_data->>'full_name',
    split_part(new.email, '@', 1)
  );
  v_avatar := COALESCE(
    new.raw_user_meta_data->>'avatar',
    new.raw_user_meta_data->>'avatar_url',
    'https://i.pravatar.cc/150?u=' || new.id
  );
  v_phone := COALESCE(
    new.raw_user_meta_data->>'whatsapp',
    new.raw_user_meta_data->>'phone',
    ''
  );

  INSERT INTO public.profiles (
    id,
    name,
    full_name,
    email,
    handle,
    avatar,
    avatar_url,
    whatsapp,
    phone,
    neighborhood,
    address,
    status
  )
  VALUES (
    new.id,
    v_name,
    v_name,
    new.email,
    COALESCE(new.raw_user_meta_data->>'handle', '@' || split_part(new.email, '@', 1)),
    v_avatar,
    v_avatar,
    v_phone,
    v_phone,
    COALESCE(new.raw_user_meta_data->>'neighborhood', 'Mário Covas'),
    COALESCE(new.raw_user_meta_data->>'address', ''),
    'Aprovado'
  )
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    status = 'Aprovado',
    updated_at = now();

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove e recria o trigger no auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. SINCRONIZAR E APROVAR TODOS OS USUÁRIOS QUE JÁ ESTÃO NO AUTH.USERS
INSERT INTO public.profiles (
  id,
  name,
  full_name,
  email,
  handle,
  avatar,
  avatar_url,
  status
)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'name', raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  email,
  COALESCE(raw_user_meta_data->>'handle', '@' || split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'avatar', raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150?u=' || id),
  COALESCE(raw_user_meta_data->>'avatar', raw_user_meta_data->>'avatar_url', 'https://i.pravatar.cc/150?u=' || id),
  'Aprovado'
FROM auth.users
ON CONFLICT (id) DO UPDATE SET
  status = 'Aprovado';
