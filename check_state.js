import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function checkUser() {
  const { data: { users } } = await supabaseAdmin.auth.admin.listUsers();
  console.log('Users in Auth:', users.map(u => u.email));
  
  const { data: profiles } = await supabaseAdmin.from('profiles').select('*');
  console.log('Profiles in DB:', profiles.map(p => p.email));
}

checkUser();
