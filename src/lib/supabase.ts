import { createClient } from '@supabase/supabase-js';

const fallbackUrl = 'https://vmnrsvmvkmqowcsgkhvd.supabase.co';
const fallbackAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZtbnJzdm12a21xb3djc2draHZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA1MTczNjgsImV4cCI6MjEwNjA5MzM2OH0.poqkou0F9t5ZhZDRYmu_Zi1tneFTNStUHnSmtM1MCIE';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL && import.meta.env.VITE_SUPABASE_URL.trim() !== '')
  ? import.meta.env.VITE_SUPABASE_URL
  : fallbackUrl;

const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY && import.meta.env.VITE_SUPABASE_ANON_KEY.trim() !== '')
  ? import.meta.env.VITE_SUPABASE_ANON_KEY
  : fallbackAnonKey;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
