import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function forceCreateUser() {
  console.log('Forçando criação de usuário...');
  
  // 1. Criar no Auth.users (Bypass rate limits)
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'plastilarbr@gmail.com',
    password: 'password123',
    email_confirm: true
  });

  if (authError) {
    console.error('Erro no Auth:', authError);
    return;
  }

  console.log('Usuário criado no Auth com ID:', authData.user.id);

  // 2. Criar no public.profiles
  const { error: profileError } = await supabaseAdmin.from('profiles').insert([
    {
      id: authData.user.id,
      name: 'Paulo Teste',
      email: 'plastilarbr@gmail.com',
      handle: '@pauloteste',
      status: 'Pendente',
      avatar: 'https://i.pravatar.cc/150?u=plastilarbr@gmail.com',
      whatsapp: '19998919027',
      neighborhood: 'Jardim Eu',
      address: 'Rua Rús',
      role: 'user'
    }
  ]);

  if (profileError) {
    console.error('Erro no Profile:', profileError);
  } else {
    console.log('Perfil criado com sucesso! Status PENDENTE.');
  }
}

forceCreateUser();
