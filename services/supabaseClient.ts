import { createClient } from '@supabase/supabase-js';

// Helper to reliably get env variables in various environments (Vite, Next, etc)
const getEnvVar = (key: string) => {
  // 1. Vite / Modern Browsers
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // 2. Node / Webpack / Some Cloud environments
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

// Check for VITE_ prefixed keys first, then generic ones (just in case)
const supabaseUrl = getEnvVar('VITE_SUPABASE_URL') || getEnvVar('NEXT_PUBLIC_SUPABASE_URL');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseKey) {
  console.warn("Supabase credentials missing. App running in Offline Mode (Local Storage only).");
}

export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey) 
  : null;