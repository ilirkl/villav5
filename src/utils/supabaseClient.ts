import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    `Missing Supabase configuration: URL=${supabaseUrl}, AnonKey=${supabaseAnonKey}. Check your environment variables.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);