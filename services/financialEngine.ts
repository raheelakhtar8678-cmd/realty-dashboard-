import { Transaction, DashboardMetrics, DateSummary, GlobalSettings } from '../types';

export const calculateMetrics = (transactions: Transaction[], settings: GlobalSettings): DashboardMetrics => {
  const raw = transactions.reduce(
    (acc, t) => {
      if (t.type === 'income') {
        acc.totalIncome += t.amount;
        if (t.status === 'pending') {
          acc.pendingCommissions += t.amount;
        }
      } else if (t.type === 'withdrawal') {
        acc.totalWithdrawal += t.amount;
      } else if (t.type === 'saving') {
        acc.totalSaving += t.amount;
      } else {
        acc.totalExpense += t.amount;
      }
      return acc;
    },
    { totalIncome: 0, totalExpense: 0, totalWithdrawal: 0, totalSaving: 0, pendingCommissions: 0 }
  );

  // Apply Scenarios
  const taxMultiplier = 1 - (settings.taxRate / 100);
  const inflationMultiplier = 1 + (settings.inflationRate / 100);

  // Annualization Logic (Simple: Average monthly * 12)
  const dates = transactions.map(t => new Date(t.date).getTime());
  let monthsSpan = 1;
  if (dates.length > 0) {
     const min = Math.min(...dates);
     const max = Math.max(...dates);
     const diffDays = (max - min) / (1000 * 60 * 60 * 24);
     monthsSpan = Math.max(1, Math.ceil(diffDays / 30));
  }
  
  const annualizedIncome = (raw.totalIncome / monthsSpan) * 12;
  const annualizedExpense = (raw.totalExpense / monthsSpan) * 12;
  
  // Scenario Net: (Proj Income - (Proj Expense * Inflation)) * Tax
  const scenarioNet = (annualizedIncome - (annualizedExpense * inflationMultiplier)) * taxMultiplier;

  // Net Income (Profit) = (Income - Expense) * Tax Multiplier
  const netIncome = (raw.totalIncome - raw.totalExpense) * taxMultiplier;

  // Net Cash Flow = Income - Expense - Withdrawal - Saving
  // Saving is treated as money moved "out" of operating cash flow into a separate bucket.
  const netCashFlow = raw.totalIncome - raw.totalExpense - raw.totalWithdrawal - raw.totalSaving;

  return {
    totalIncome: raw.totalIncome,
    totalExpense: raw.totalExpense,
    totalWithdrawal: raw.totalWithdrawal,
    totalSaving: raw.totalSaving,
    grossIncome: raw.totalIncome - raw.totalExpense,
    netIncome: netIncome,
    netCashFlow: netCashFlow,
    pendingCommissions: raw.pendingCommissions * taxMultiplier,
    projectedNextYearExpense: raw.totalExpense * inflationMultiplier,
    projectedScenarioNet: scenarioNet
  };
};

export const getChartData = (transactions: Transaction[], settings: GlobalSettings) => {
  // Sort by date
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Group by Month (YYYY-MM)
  const monthlyMap = new Map<string, { income: number; expense: number; withdrawal: number; saving: number }>();
  
  sorted.forEach(t => {
    const monthKey = t.date.substring(0, 7); // YYYY-MM
    const current = monthlyMap.get(monthKey) || { income: 0, expense: 0, withdrawal: 0, saving: 0 };
    
    if (t.type === 'income') {
      current.income += t.amount;
    } else if (t.type === 'withdrawal') {
      current.withdrawal += t.amount;
    } else if (t.type === 'saving') {
      current.saving += t.amount;
    } else {
      current.expense += t.amount;
    }
    monthlyMap.set(monthKey, current);
  });

  const taxMultiplier = 1 - (settings.taxRate / 100);

  return Array.from(monthlyMap.entries()).map(([date, data]) => ({
    date,
    ...data,
    grossProfit: data.income - data.expense,
    netProfit: (data.income - data.expense) * taxMultiplier
  }));
};

export const getCategoryData = (transactions: Transaction[]) => {
  // Only categorize expenses for the pie chart
  const expenses = transactions.filter(t => t.type === 'expense');
  const catMap = new Map<string, number>();

  expenses.forEach(t => {
    const current = catMap.get(t.category) || 0;
    catMap.set(t.category, current + t.amount);
  });

  return Array.from(catMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
};

export const getIncomeProjection = (transactions: Transaction[], settings?: GlobalSettings) => {
  const completedIncome = transactions.filter(t => t.type === 'income' && t.status === 'completed');
  const expenses = transactions.filter(t => t.type === 'expense');

  // Calculate Averages
  const calculateMonthlyAverage = (items: Transaction[]) => {
      if (items.length === 0) return 0;
      const dates = items.map(t => new Date(t.date).getTime());
      const minDate = new Date(Math.min(...dates));
      const maxDate = new Date(Math.max(...dates));
      const diffMonths = Math.max(1, Math.ceil(Math.abs(maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24 * 30.44)));
      return items.reduce((sum, t) => sum + t.amount, 0) / diffMonths;
  };

  const avgIncome = calculateMonthlyAverage(completedIncome);
  const avgExpense = calculateMonthlyAverage(expenses);

  const today = new Date();
  const projection = [];
  
  // Inflation Logic
  const inflationRate = settings?.inflationRate || 0;
  const monthlyInflation = inflationRate / 100 / 12;

  for (let i = 0; i < 12; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
    
    const pending = transactions
      .filter(t => t.type === 'income' && t.status === 'pending' && t.date.startsWith(monthKey))
      .reduce((sum, t) => sum + t.amount, 0);
      
    // Forecast Income: Baseline or Pending if higher
    const forecastIncome = Math.max(pending, avgIncome);
    
    // Forecast Expense: Base * (1 + inflation)^months
    const projectedExpense = avgExpense * Math.pow(1 + monthlyInflation, i);

    projection.push({
      name: label,
      forecast: Math.round(forecastIncome),
      projectedExpense: Math.round(projectedExpense),
      pending: pending,
      netPotential: Math.round(forecastIncome - projectedExpense)
    });
  }
  return projection;
};

export const getTimeSummaries = (transactions: Transaction[], settings: GlobalSettings) => {
  const now = new Date();
  // We use string comparison for dates to avoid timezone shifting issues with 'YYYY-MM-DD'
  const todayStr = now.toISOString().split('T')[0];
  const currentMonthKey = now.toISOString().slice(0, 7); // YYYY-MM
  
  // Helpers
  const getWeekNumber = (d: Date) => {
      d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
      d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
      var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
      var weekNo = Math.ceil(( ( (d.getTime() - yearStart.getTime()) / 86400000) + 1)/7);
      return weekNo;
  };
  const currentWeek = getWeekNumber(now);
  const currentYear = now.getFullYear();

  const summarize = (filterFn: (t: Transaction) => boolean): DateSummary => {
    const filtered = transactions.filter(filterFn);
    const income = filtered.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const expense = filtered.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const withdrawal = filtered.filter(t => t.type === 'withdrawal').reduce((s, t) => s + t.amount, 0);
    const saving = filtered.filter(t => t.type === 'saving').reduce((s, t) => s + t.amount, 0);
    
    return {
      period: '',
      income,
      expense,
      withdrawal,
      saving,
      net: income - expense - withdrawal - saving
    };
  };

  return {
    day: { 
      ...summarize(t => t.date === todayStr), 
      period: 'Today' 
    },
    week: { 
      ...summarize(t => {
         const d = new Date(t.date);
         return getWeekNumber(d) === currentWeek && d.getFullYear() === currentYear;
      }), 
      period: 'This Week' 
    },
    month: { 
      ...summarize(t => t.date.startsWith(currentMonthKey)), 
      period: 'This Month' 
    }
  };
};