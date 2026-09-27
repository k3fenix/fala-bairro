import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTczNjgsImV4cCI6MjEwNjA5MzM2OH0.poqkou0F9t5ZhZDRYmu_Zi1tneFTNStUHnSmtM1MCIE'
);

async function testDB() {
  console.log('Testing Profiles Insert...');
  const { error: profileError, data: pData } = await supabase.from('profiles').insert([
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Test User',
      email: 'test@test.com',
      handle: '@test',
      status: 'Pendente'
    }
  ]).select();
  console.log('Profile Insert Error:', profileError);
  console.log('Profile Data:', pData);

  console.log('Testing Settings Upsert...');
  const { error: settingsError, data: sData } = await supabase.from('settings').upsert({
    key: 'global_announcement',
    value: 'Teste de aviso'
  }, { onConflict: 'key' }).select();
  console.log('Settings Upsert Error:', settingsError);
  console.log('Settings Data:', sData);
}

testDB();
