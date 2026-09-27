import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  'https://vmnrsvmvkmqowcsgkhvd.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MDUxNzM2OCwiZXhwIjoyMTA2MDkzMzY4fQ.uUvef5YfeMw32YDkdrRreXjwy4Murw_Y7vL-O2OtAAI'
);

async function cleanPosts() {
  const { error: postsError } = await supabaseAdmin.from('posts').delete().neq('id', 0);
  if (postsError) console.error('Erro ao limpar posts:', postsError);
  else console.log('Posts e comentários limpos com sucesso!');
}

cleanPosts();
