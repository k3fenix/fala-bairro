import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTczNjgsImV4cCI6MjEwNjA5MzM2OH0.poqkou0F9t5ZhZDRYmu_Zi1tneFTNStUHnSmtM1MCIE'
);

async function checkAnonInsert() {
  const email = `test_anon_${Math.random()}@bairro.com`;
  
  // 1. Sign up
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: 'password123',
  });
  
  if (authError) {
    console.error('Auth error', authError);
    return;
  }
  
  console.log('Signed up! User ID:', authData.user?.id);
  console.log('Session exists?', !!authData.session);
  
  if (authData.user) {
    // 2. Insert profile
    const { error: profileError } = await supabase.from('profiles').insert([
      {
        id: authData.user.id,
        name: 'Test Name',
        email,
        handle: '@test',
        avatar: 'http',
        whatsapp: '123',
        neighborhood: 'Bairro',
        address: 'End',
        status: 'Pendente'
      }
    ]);
    
    console.log('Insert Profile Error:', profileError);
  }
}
checkAnonInsert();
