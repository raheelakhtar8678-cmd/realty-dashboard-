import { Transaction, GlobalSettings } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from '../constants';
import { supabase } from './supabaseClient';

interface UserData {
  transactions: Transaction[];
  settings: GlobalSettings;
}

const LOCAL_STORAGE_KEY = 'realty_dashboard_users';

export const StorageService = {
  // --- Auth Methods ---

  async register(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    if (supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });
      if (error) return { success: false, message: error.message };
      
      // Initialize data row
      if (data.user) {
         await supabase.from('user_data').insert({
            user_id: data.user.id,
            content: { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS }
         });
      }
      return { success: true };
    }

    // Fallback: Local Storage
    const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    if (users[email]) {
      return { success: false, message: 'User already exists (Offline Mode)' };
    }
    users[email] = { 
      password, 
      data: { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS } 
    };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
    return { success: true, message: 'Registered in Offline Mode' };
  },

  async login(email: string, password: string): Promise<{ success: boolean; message?: string }> {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) return { success: false, message: error.message };
      return { success: true };
    }

    // Fallback: Local Storage
    const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    const user = users[email];
    if (user && user.password === password) return { success: true };
    return { success: false, message: 'Invalid credentials (Offline)' };
  },

  // --- Data Methods ---

  async saveData(email: string, data: UserData): Promise<void> {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { error } = await supabase.from('user_data').upsert({
          user_id: session.user.id,
          content: data,
          updated_at: new Date()
        });
        if (!error) return; // Success
      }
    }

    // Fallback
    const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    if (users[email]) {
      users[email].data = data;
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
    }
  },

  async loadData(email: string): Promise<UserData> {
    if (supabase) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const { data, error } = await supabase
          .from('user_data')
          .select('content')
          .eq('user_id', session.user.id)
          .single();
        
        if (data && data.content) {
          return data.content as UserData;
        }
      }
    }

    // Fallback
    const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
    if (users[email] && users[email].data) {
      return users[email].data;
    }
    
    return { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS };
  },

  isOnline(): boolean {
    return !!supabase;
  }
};