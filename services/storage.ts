import { Transaction, GlobalSettings } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from '../constants';

// Defines the shape of data sent/received from API
interface UserData {
  transactions: Transaction[];
  settings: GlobalSettings;
}

export const StorageService = {
  // --- Auth Methods ---

  async register(username: string, password: string, securityQuestion: string, securityAnswer: string): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/auth?action=register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, securityQuestion, securityAnswer }),
      });
      const data = await res.json();
      return { success: res.ok, message: data.error || data.message };
    } catch (e) {
      return { success: false, message: 'Network error during registration' };
    }
  },

  async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth?action=login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      return res.ok;
    } catch (e) {
      return false;
    }
  },

  async getSecurityQuestion(username: string): Promise<string | null> {
    try {
      const res = await fetch(`/api/auth?action=question&username=${encodeURIComponent(username)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.question;
    } catch (e) {
      return null;
    }
  },

  async resetPassword(username: string, answer: string, newPassword: string): Promise<boolean> {
    try {
      const res = await fetch('/api/auth?action=reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, answer, newPassword }),
      });
      return res.ok;
    } catch (e) {
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
      console.error("Failed to save data", e);
    }
  },

  async loadData(username: string): Promise<UserData> {
    try {
      const res = await fetch(`/api/data?username=${encodeURIComponent(username)}`);
      if (res.ok) {
        const json = await res.json();
        // Ensure defaults if fields are missing in new DB records
        return {
          transactions: json.transactions || INITIAL_TRANSACTIONS,
          settings: json.settings || INITIAL_SETTINGS
        };
      }
    } catch (e) {
      console.error("Failed to load data", e);
    }
    // Fallback to initial data
    return { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS };
  }
};