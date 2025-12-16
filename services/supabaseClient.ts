import { createClient } from '@supabase/supabase-js';

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

// Check Env Vars first, then LocalStorage (for manual connection via UI)
const getStoredVar = (key: string) => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem(key);
    }
    return null;
}

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL') || getStoredVar('MANUAL_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY') || getStoredVar('MANUAL_SUPABASE_KEY');

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