-- ==============================================================================
-- AJUSTE RLS E POLICIES PARA O NOVO BANCO SUPABASE DO MARKETPLACE
-- Projeto: ggztxuctokgzycltyoxo.supabase.co
-- Objetivo: Garantir que publicações de anúncios funcionem para todos os moradores
-- ==============================================================================

-- 1. Permitir que a coluna user_id seja nula ou flexível caso o usuário ainda não tenha registro em profiles
ALTER TABLE IF EXISTS public.marketplace_listings 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Garantir que as colunas seller_name e type existam na tabela marketplace_listings
ALTER TABLE IF EXISTS public.marketplace_listings 
ADD COLUMN IF NOT EXISTS seller_name TEXT,
ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'Venda';

-- 3. Ajustar permissão de INSERT em marketplace_listings (permitir inserções públicas e autenticadas)
DROP POLICY IF EXISTS "Inserção de anúncios pelo usuário" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Permitir criacao de anuncios" ON public.marketplace_listings;

CREATE POLICY "Permitir criacao de anuncios" 
ON public.marketplace_listings 
FOR INSERT 
WITH CHECK (true);

-- 4. Ajustar permissão de SELECT em marketplace_listings
DROP POLICY IF EXISTS "Leitura pública de anúncios aprovados" ON public.marketplace_listings;
DROP POLICY IF EXISTS "Permitir leitura de anuncios" ON public.marketplace_listings;

CREATE POLICY "Permitir leitura de anuncios" 
ON public.marketplace_listings 
FOR SELECT 
USING (true);

-- 5. Ajustar permissões para imagens dos anúncios (marketplace_listing_images)
DROP POLICY IF EXISTS "Inserção de imagens de anúncios" ON public.marketplace_listing_images;
DROP POLICY IF EXISTS "Permitir criacao de imagens" ON public.marketplace_listing_images;

CREATE POLICY "Permitir criacao de imagens" 
ON public.marketplace_listing_images 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Leitura pública de imagens" ON public.marketplace_listing_images;
DROP POLICY IF EXISTS "Permitir leitura de imagens" ON public.marketplace_listing_images;

CREATE POLICY "Permitir leitura de imagens" 
ON public.marketplace_listing_images 
FOR SELECT 
USING (true);

-- 6. Garantir leitura de categorias
DROP POLICY IF EXISTS "Leitura pública de categorias" ON public.marketplace_categories;
CREATE POLICY "Leitura pública de categorias" 
ON public.marketplace_categories 
FOR SELECT 
USING (true);
