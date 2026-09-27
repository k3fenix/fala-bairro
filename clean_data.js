import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function cleanAllData() {
  console.log('Iniciando limpeza total de dados...');

  // 1. Apagar todos os posts (Isso também apaga os comentários por CASCADE)
  const { error: postsError } = await supabaseAdmin.from('posts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (postsError) console.error('Erro ao limpar posts:', postsError);
  else console.log('Posts e comentários limpos!');

  // 2. Apagar perfis, exceto o admin
  const { error: profilesError } = await supabaseAdmin.from('profiles').delete().neq('email', 'lucianoalkine@gmail.com');
  if (profilesError) console.error('Erro ao limpar perfis:', profilesError);
  else console.log('Perfis de teste limpos!');

  // 3. Obter todos os usuários no auth.users
  const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
  if (listError) {
    console.error('Erro ao listar usuários:', listError);
    return;
  }

  // 4. Deletar todos os usuários do auth.users, exceto o admin
  for (const user of users) {
    if (user.email !== 'lucianoalkine@gmail.com') {
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Erro ao deletar usuário ${user.email}:`, deleteError);
      } else {
        console.log(`Usuário ${user.email} deletado completamente do sistema.`);
      }
    }
  }

  console.log('LIMPEZA CONCLUÍDA! Banco de dados zerado (exceto o Admin).');
}

cleanAllData();
