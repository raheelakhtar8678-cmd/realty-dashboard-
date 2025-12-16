import { Transaction, GlobalSettings } from '../types';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from '../constants';

const USERS_KEY = 'realty_users_v2'; // Version bump for schema change
const DATA_PREFIX = 'realty_data_';

// Simple text encoder for hashing
const hashString = async (text: string): Promise<string> => {
  const msgBuffer = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return Array.from(new Uint8Array(hashBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
};

interface UserData {
  transactions: Transaction[];
  settings: GlobalSettings;
}

export const StorageService = {
  // --- Auth Methods ---

  async register(username: string, password: string, securityQuestion: string, securityAnswer: string): Promise<{ success: boolean; message?: string }> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    if (users[username]) {
      return { success: false, message: 'Username already exists' };
    }

    const passwordHash = await hashString(password);
    // Hash the answer normalized (lowercase, trimmed) to prevent case-sensitivity issues during recovery
    const answerHash = await hashString(securityAnswer.toLowerCase().trim());

    users[username] = {
      passwordHash,
      securityQuestion,
      answerHash,
      created: new Date().toISOString()
    };

    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    
    // Initialize default data for new user
    this.saveData(username, { 
      transactions: INITIAL_TRANSACTIONS, 
      settings: INITIAL_SETTINGS 
    });

    return { success: true };
  },

  async login(username: string, password: string): Promise<boolean> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[username];
    if (!user) return false;

    const hash = await hashString(password);
    return hash === user.passwordHash;
  },

  getSecurityQuestion(username: string): string | null {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[username];
    return user ? user.securityQuestion : null;
  },

  async resetPassword(username: string, answer: string, newPassword: string): Promise<boolean> {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    const user = users[username];
    
    if (!user) return false;

    const inputHash = await hashString(answer.toLowerCase().trim());
    
    if (inputHash !== user.answerHash) return false;

    user.passwordHash = await hashString(newPassword);
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    return true;
  },

  // --- Data Methods ---

  saveData(username: string, data: UserData) {
    localStorage.setItem(`${DATA_PREFIX}${username}`, JSON.stringify(data));
  },

  loadData(username: string): UserData {
    const data = localStorage.getItem(`${DATA_PREFIX}${username}`);
    if (data) {
      return JSON.parse(data);
    }
    return { transactions: INITIAL_TRANSACTIONS, settings: INITIAL_SETTINGS };
  },

  userExists(username: string): boolean {
    const users = JSON.parse(localStorage.getItem(USERS_KEY) || '{}');
    return !!users[username];
  }
};