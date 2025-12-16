import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// Keys are managed via Vercel Environment Variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
const PROJECT_URL = "";
const PROJECT_KEY = "";

// Helper to reliably get env variables
const getEnvVar = (key: string) => {
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Check Env Vars first, then LocalStorage (manual connection), then Hardcoded Fallback (empty)
const getStoredVar = (key: string) => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
    }
    return null;
}

// Logic: Try Environment -> Try Browser Storage -> Use Hardcoded Fallback
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getStoredVar('MANUAL_SUPABASE_URL') || PROJECT_URL;
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getStoredVar('MANUAL_SUPABASE_KEY') || PROJECT_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. App running in Offline Mode.");
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;

export const resetSupabaseConfig = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('MANUAL_SUPABASE_URL');
        localStorage.removeItem('MANUAL_SUPABASE_KEY');
        window.location.reload();
    }
};