import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function checkPolicies() {
  const { data, error } = await supabaseAdmin.rpc('get_policies', { table_name: 'profiles' });
  // If rpc doesn't exist, we can query pg_policies
  if (error) {
    const { data: policies, error: err2 } = await supabaseAdmin.from('pg_policies').select('*').eq('tablename', 'profiles');
    console.log(policies || err2);
  } else {
    console.log(data);
  }
}
checkPolicies();
