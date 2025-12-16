import { createClient } from '@supabase/supabase-js';

// --- CONFIGURATION ---
// These keys ensure the app connects to your specific database on all devices
const PROJECT_URL = "https://thwmikjwemugywqeklmr.supabase.co";
const PROJECT_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRod21pa2p3ZW11Z3l3cWVrbG1yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4Nzk2NzYsImV4cCI6MjA4MTQ1NTY3Nn0.bRdMK_etUpXCnJlXmJnoOH8gZyxKWy2XgdA928jjDMs";

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

// Check Env Vars first, then LocalStorage, then Hardcoded Project Keys
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