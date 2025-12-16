import { Transaction, GlobalSettings } from './types';

export const INITIAL_TRANSACTIONS: Transaction[] = [
  // Income
  {
    id: '1',
    date: '2024-05-15',
    description: '123 Maple Drive Closing',
    category: 'Commission',
    amount: 12500,
    type: 'income',
    status: 'completed',
  },
  {
    id: '2',
    date: '2024-05-20',
    description: '450 Oak Ave Listing',
    category: 'Commission',
    amount: 8750,
    type: 'income',
    status: 'pending',
  },
  {
    id: '3',
    date: '2024-04-10',
    description: '789 Pine Ln Buyer Rep',
    category: 'Commission',
    amount: 9200,
    type: 'income',
    status: 'completed',
  },
  // Expenses
  {
    id: '4',
    date: '2024-05-02',
    description: 'Zillow Premier Agent',
    category: 'Lead Gen',
    amount: 850,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '5',
    date: '2024-05-05',
    description: 'Luxury Staging Co.',
    category: 'Staging',
    amount: 2100,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '6',
    date: '2024-05-12',
    description: 'Pro Photography - Maple Dr',
    category: 'Marketing',
    amount: 450,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '7',
    date: '2024-05-18',
    description: 'Open House Catering',
    category: 'Marketing',
    amount: 175,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '8',
    date: '2024-05-01',
    description: 'Brokerage Desk Fees',
    category: 'Office',
    amount: 300,
    type: 'expense',
    status: 'completed',
  },
  {
    id: '9',
    date: '2024-05-19',
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
  monthlyRevenueGoal: 20000,
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