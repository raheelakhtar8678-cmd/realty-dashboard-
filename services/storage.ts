import { Transaction, GlobalSettings } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from '../constants';

// Defines the shape of data sent/received from API
interface UserData {
  transactions: Transaction[];
  settings: GlobalSettings;
}

const LOCAL_STORAGE_KEY = 'realty_dashboard_users';

export const StorageService = {
  // --- Auth Methods ---

  async register(username: string, password: string, securityQuestion: string, securityAnswer: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, securityQuestion, securityAnswer }),
      });
      
      if (res.status === 500) throw new Error("Server Error"); // Trigger fallback
      
      const data = await res.json();
      return { success: res.ok, message: data.error || data.message };
    } catch (e) {
      // FALLBACK: Register locally
      console.warn("Backend unavailable, falling back to local storage.");
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      if (users[username]) {
        return { success: false, message: 'User already exists (Offline Mode)' };
      }
      users[username] = { 
        password, 
        securityQuestion, 
        securityAnswer, 
        data: { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS } 
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
      return { success: true, message: 'Registered in Offline Mode' };
    }
  },

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (res.status === 500) throw new Error("Server Error");
      return res.ok;
    } catch (e) {
      // FALLBACK: Login locally
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      const user = users[username];
      if (user && user.password === password) return true;
      return false;
    }
  },

  async getSecurityQuestion(username: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/auth?action=question&username=${encodeURIComponent(username)}`);
      if (res.status === 500) throw new Error("Server Error");
      if (!res.ok) return null;
      const data = await res.json();
      return data.question;
    } catch (e) {
      // FALLBACK
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      return users[username]?.securityQuestion || null;
    }
  },

  async resetPassword(username: string, answer: string, newPassword: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth?action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answer, newPassword }),
      });
      if (res.status === 500) throw new Error("Server Error");
      return res.ok;
    } catch (e) {
      // FALLBACK
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      const user = users[username];
      if (user && user.securityAnswer.toLowerCase() === answer.toLowerCase()) {
        user.password = newPassword;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
        return true;
      }
      return false;
    }
  },

  // --- Data Methods ---

  async saveData(username: string, data: UserData): Promise<void> {
    try {
      await fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, data }),
      });
    } catch (e) {
      // FALLBACK
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      if (users[username]) {
        users[username].data = data;
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
      }
    }
  },

  async loadData(username: string): Promise<UserData> {
    try {
      const res = await fetch(`/api/data?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const json = await res.json();
        return {
          transactions: json.transactions || INITIAL_TRANSACTIONS,
          settings: json.settings || INITIAL_SETTINGS
        };
      }
      throw new Error("Failed to load");
    } catch (e) {
      // FALLBACK
      const users = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}');
      if (users[username] && users[username].data) {
        return users[username].data;
      }
    }
    return { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS };
  }
};