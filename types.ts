export type TransactionType = 'income' | 'expense' | 'withdrawal' | 'saving';
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
  withdrawal: number;
  saving: number;
  net: number; // Cash Flow
}

export interface DashboardMetrics {
  totalIncome: number;
  totalExpense: number;
  totalWithdrawal: number;
  totalSaving: number;
  netIncome: number; // Post-tax Profit (Income - Expense) * TaxRate
  netCashFlow: number; // Liquid Cash (Income - Expense - Withdrawal - Saving)
  grossIncome: number; // Pre-tax
  pendingCommissions: number; // Post-tax value
  projectedNextYearExpense: number; // Inflation adjusted
  projectedScenarioNet: number; // Annualized, Tax & Inflation adjusted
}

export interface GlobalSettings {
  reinvestmentRate: number; // %
  inflationRate: number; // %
  taxRate: number; // %
  annualWithdrawal: number;
  rmdStartYear: number;
  monthlyRevenueGoal: number; // Customizable Goal Amount
  goalType: 'revenue' | 'savings'; // Toggle between tracking Income or Savings
}