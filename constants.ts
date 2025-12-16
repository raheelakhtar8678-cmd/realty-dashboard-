import { Transaction, GlobalSettings } from './types';

// Helper to generate dates in the current month
const now = new Date();
const y = now.getFullYear();
const m = String(now.getMonth() + 1).padStart(2, '0');
const getDate = (day: number) => {
    // Handle days that might not exist in current month (e.g. Feb 30)
    const maxDay = new Date(y, now.getMonth() + 1, 0).getDate();
    const safeDay = Math.min(day, maxDay);
    return `${y}-${m}-${String(safeDay).padStart(2, '0')}`;
};

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Income
  {
    id: '1',
    date: getDate(15),
    description: '123 Maple Drive Closing',
    category: 'Commission',
    amount: 12500,
    type: 'income',
    status: 'completed',
  },
  {
    id: '2',
    date: getDate(20),
    description: '450 Oak Ave Listing',
    category: 'Commission',
    amount: 8750,
    type: 'income',
    status: 'pending',
  },
  {
    id: '3',
    date: getDate(10),
    description: '789 Pine Ln Buyer Rep',
    category: 'Commission',
    amount: 9200,
    type: 'income',
    status: 'completed',
  },
  // Expenses
  {
    id: '4',
    date: getDate(2),
    description: 'Zillow Premier Agent',
    category: 'Lead Gen',
    amount: 850,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '5',
    date: getDate(5),
    description: 'Luxury Staging Co.',
    category: 'Staging',
    amount: 2100,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '6',
    date: getDate(12),
    description: 'Pro Photography - Maple Dr',
    category: 'Marketing',
    amount: 450,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '7',
    date: getDate(18),
    description: 'Open House Catering',
    category: 'Marketing',
    amount: 175,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '8',
    date: getDate(1),
    description: 'Brokerage Desk Fees',
    category: 'Office',
    amount: 300,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '9',
    date: getDate(19),
    description: 'Facebook Ads',
    category: 'Marketing',
    amount: 250,
    type: 'expense',
    status: 'completed',
  }
];

export const INITIAL_SETTINGS: GlobalSettings = {
  reinvestmentRate: 50, 
  inflationRate: 3.0,
  taxRate: 25.0,
  annualWithdrawal: 0,
  rmdStartYear: 10,
  monthlyRevenueGoal: 35000,
  goalType: 'revenue',
};

export const EXPENSE_CATEGORIES = [
  'Marketing',
  'Staging',
  'Lead Gen',
  'Office',
  'Travel',
  'Education',
  'Licensing'
];

export const INCOME_CATEGORIES = [
  'Commission',
  'Consulting',
  'Referral Fee'
];