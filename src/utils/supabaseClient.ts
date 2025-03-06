import { createClient } from '@supabase/supabase-js';

console.log('Environment Variables:', process.env);

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    `Missing Supabase configuration: URL=${supabaseUrl}, AnonKey=${supabaseKey}. Check your environment variables.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey);