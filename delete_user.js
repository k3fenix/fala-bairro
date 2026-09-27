import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function deleteUserByEmail() {
  const email = 'plastilarbr@gmail.com';
  console.log(`Buscando usuário com email: ${email}`);
  
  // Get all users
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  
  if (listError) {
    console.error('Erro ao listar usuários:', listError);
    return;
  }

  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log('Usuário não encontrado na tabela auth.users. O e-mail não está registrado.');
    return;
  }

  console.log(`Deletando usuário: ${user.id}`);
  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
  
  if (deleteError) {
    console.error('Erro ao deletar usuário:', deleteError);
  } else {
    console.log('Usuário deletado com sucesso do sistema de Autenticação!');
  }
}

deleteUserByEmail();
