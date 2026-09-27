import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function fixProfile() {
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  const user = users.find(u => u.email === 'plastilarbr@gmail.com');
  
  if (user) {
    const { error } = await supabaseAdmin.from('profiles').insert([{
      id: user.id,
      email: user.email,
      name: 'Paulo Silva',
      handle: '@paulo',
      whatsapp: '19998919027',
      neighborhood: 'Jardim Eu',
      address: 'Rua Rús',
      status: 'Pendente',
      role: 'user',
      avatar: 'https://i.pravatar.cc/150?u=paulo'
    }]);
    
    if (error) console.error('Erro ao inserir perfil:', error);
    else console.log('Perfil consertado com sucesso!');
  } else {
    console.log('Usuário não encontrado no Auth.');
  }
}

fixProfile();
