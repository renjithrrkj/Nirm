import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseLive =
  supabaseUrl !== '' &&
  supabaseUrl !== 'YOUR_SUPABASE_URL' &&
  supabaseUrl.startsWith('http') &&
  supabaseAnonKey !== '' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

// Only create the Supabase client when we have a valid URL
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseLive) return null;
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

// Proxy object that safely delegates calls
export const supabase = {
  from: (table: string) => {
    const client = getSupabase();
    if (!client) {
      // Return a no-op that looks like Supabase fluent API
      const noop: any = new Proxy({}, {
        get: () => noop,
        apply: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
      });
      return noop;
    }
    return client.from(table);
  },
};
