export type TransactionType = 'income' | 'expense';
export type TransactionStatus = 'pending' | 'completed';

export interface Transaction {
  id: string;
  date: string;
  description: string; // e.g., Property Address or Vendor
  category: string; // e.g., Commission, Marketing, Staging, Fuel
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
}

export interface DateSummary {
  period: string;
  income: number;
  expense: number;
  net: number;
}

export interface DashboardMetrics {
  totalIncome: number;
  totalExpense: number;
  netIncome: number; // Post-tax
  grossIncome: number; // Pre-tax
  pendingCommissions: number; // Post-tax value
  projectedNextYearExpense: number; // Inflation adjusted
}

export interface GlobalSettings {
  reinvestmentRate: number; // %
  inflationRate: number; // %
  taxRate: number; // %
  annualWithdrawal: number;
  rmdStartYear: number;
}