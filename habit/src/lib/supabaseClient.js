import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const appEnv = import.meta.env.VITE_APP_ENV || import.meta.env.MODE;
const expectedProjectRef = import.meta.env.VITE_SUPABASE_PROJECT_REF;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment is not configured. Create .env.local from .env.development.example and set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
  );
}

if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(supabaseUrl)) {
  throw new Error(`Invalid VITE_SUPABASE_URL for ${appEnv}: ${supabaseUrl}`);
}

const actualProjectRef = new URL(supabaseUrl).hostname.split('.')[0];

if (expectedProjectRef && actualProjectRef !== expectedProjectRef) {
  throw new Error(
    `Supabase project mismatch for ${appEnv}. Expected ${expectedProjectRef}, got ${actualProjectRef}.`
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
