import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseLive =
  supabaseUrl !== '' &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Only instantiate when env vars are valid — avoids crash on static pages
export const supabase: SupabaseClient | null = isSupabaseLive
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;
