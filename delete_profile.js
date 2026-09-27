import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function deleteProfile() {
  const { data, error } = await supabase.from('profiles').delete().eq('email', 'plastilarbr@gmail.com');
  console.log('Delete Profile Error:', error);
  console.log('Deleted data:', data);
}

deleteProfile();
