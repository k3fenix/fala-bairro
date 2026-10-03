import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTczNjgsImV4cCI6MjEwNjA5MzM2OH0.poqkou0F9t5ZhZDRYmu_Zi1tneFTNStUHnSmtM1MCIE'
);

async function check() {
  console.log('Testing Marketplace Select...');
  const { data, error } = await supabase.from('marketplace_items').select('*').limit(1);
  console.log("Error:", error);
  console.log("Data:", data);
}

check();
