# FALA DO BAIRRO - O que acontece no seu bairro, a comunidade conta.

Este projeto foi inicializado utilizando React, TypeScript, Tailwind CSS e Vite, com a base da interface mobile-first desenvolvida.

## 🚀 Como Executar Localmente

1. Certifique-se de que as dependências estão instaladas:
```bash
npm install
```

2. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

## 📐 Estrutura Atual
- `src/pages/Landing.tsx`: Landing page inicial com design moderno e atraente.
- `src/pages/Feed.tsx`: O feed principal mobile-first com cards responsivos.
- `src/components/BottomNav.tsx`: Navegação inferior para dispositivos móveis.
- `src/App.tsx`: Configuração do React Router.

## 🛠 Próximos Passos (Supabase & Backend)

Para completar a integração Backend solicitada, você deve configurar seu projeto no [Supabase](https://supabase.com/) e rodar os seguintes SQLs no SQL Editor do Supabase para criar as tabelas:

### 1. Criar Tabelas Principais

```sql
-- Criar tabela de Bairros
create table public.neighborhoods (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  city text not null,
  state text not null,
  active boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de Perfis (conectada ao Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  name text,
  username text unique,
  avatar_url text,
  city text,
  neighborhood_id uuid references public.neighborhoods(id),
  role text default 'user',
  status text default 'active',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de Categorias
create table public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  icon text,
  active boolean default true
);

-- Criar tabela de Publicações
create table public.posts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  neighborhood_id uuid references public.neighborhoods(id) not null,
  category_id uuid references public.categories(id),
  content text,
  status text default 'pending', -- pending, approved, rejected
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de Mídias
create table public.post_media (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  media_type text not null, -- image, video
  storage_path text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Criar tabela de Interações (Curtidas)
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null, -- heart, upvote, downvote
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(post_id, user_id)
);
```

### 2. Configurar Autenticação e Storage
- Configure o Supabase Auth para usar Email e Senha.
- Crie dois Buckets no Supabase Storage:
  - `public-post-media` (Público)
  - `avatars` (Público)
  - `private-submissions` (Privado - apenas Admin)

### 3. Variáveis de Ambiente
Crie um arquivo `.env` na raiz do projeto:
```env
VITE_SUPABASE_URL=sua_url_aqui
VITE_SUPABASE_ANON_KEY=sua_key_aqui
```

### 4. Segurança (Row Level Security - RLS)
Lembre-se de ativar o RLS em todas as tabelas criadas no Supabase e definir políticas, por exemplo:
- `posts`: Visualização apenas de posts onde `status = 'approved'` (para usuários comuns).
- `profiles`: Usuários só podem editar seu próprio perfil.

## 📱 PWA (Progressive Web App)
Para transformar o app em PWA, utilize o plugin `vite-plugin-pwa`. Configure-o em `vite.config.ts` com os ícones do sistema para que a opção "Adicionar à tela inicial" fique disponível nos celulares.
