import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function checkProfileInsert() {
  const { data: user, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: 'test_insert@bairro.com',
    password: 'password123',
    email_confirm: true
  });
  
  if (authError) {
    console.error('Auth error', authError);
    return;
  }
  
  const { data, error } = await supabaseAdmin.from('profiles').insert([
    {
      id: user.user.id,
      name: 'Test Name',
      email: 'test_insert@bairro.com',
      handle: '@test',
      avatar: 'http',
      whatsapp: '123',
      neighborhood: 'Bairro',
      address: 'End',
      status: 'Pendente'
    }
  ]);
  
  console.log('Insert Profile Error:', error);
  
  // Cleanup
  await supabaseAdmin.auth.admin.deleteUser(user.user.id);
}
checkProfileInsert();
