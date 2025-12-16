import React, { useRef, useState, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { Trash2, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Calendar, ArrowUp, ArrowDown, ArrowUpDown, DollarSign, Wallet, TrendingDown, LayoutList, PieChart, Activity } from 'lucide-react';
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from '../constants';

interface Props {
  transactions: Transaction[];
  setTransactions: (t: Transaction[]) => void;
}

type SortConfig = {
  key: keyof Transaction | null;
  direction: 'asc' | 'desc';
};

const DateCell = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const formatDate = (isoDate: string) => {
    if (!isoDate) return 'Select Date';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleClick = () => {
    if (inputRef.current) {
      if (typeof (inputRef.current as any).showPicker === 'function') {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div 
      className="relative group cursor-pointer flex items-center gap-2 py-2 px-3 hover:bg-slate-800 rounded-md transition-colors"
      onClick={handleClick}
    >
      <span className={`text-sm font-mono whitespace-nowrap ${value ? 'text-slate-300 group-hover:text-white' : 'text-slate-500'}`}>
        {formatDate(value)}
      </span>
      <input
        ref={inputRef}
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="invisible absolute bottom-0 left-0 w-0 h-0"
      />
    </div>
  );
};

const DashboardTickerItem = ({ label, value, subValue, type }: { label: string, value: string, subValue?: string, type: 'neutral' | 'positive' | 'negative' | 'info' }) => {
  const colors = {
    neutral: 'text-slate-200 border-slate-700',
    positive: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/5',
    negative: 'text-rose-400 border-rose-500/30 bg-rose-500/5',
    info: 'text-indigo-400 border-indigo-500/30 bg-indigo-500/5',
  };

  return (
    <div className={`flex flex-col px-4 py-2 border-r last:border-r-0 border-slate-700/50 min-w-[120px] ${type !== 'neutral' ? colors[type] + ' border-b-2' : ''}`}>
      <span className="text-[10px] uppercase tracking-wider font-semibold opacity-70 mb-0.5 whitespace-nowrap">{label}</span>
      <span className="text-lg font-mono font-bold tracking-tight whitespace-nowrap">{value}</span>
      {subValue && <span className="text-[10px] opacity-60 font-medium whitespace-nowrap">{subValue}</span>}
    </div>
  );
};

const PortfolioGrid: React.FC<Props> = ({ transactions, setTransactions }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  
  const handleUpdate = (id: string, field: keyof Transaction, value: any) => {
    setTransactions(transactions.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleDelete = (id: string) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleAdd = () => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      description: '',
      category: 'Other',
      amount: 0,
      type: 'expense',
      status: 'pending'
    };
    setTransactions([newTransaction, ...transactions]);
    setSortConfig({ key: 'date', direction: 'desc' });
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredTransactions = useMemo(() => {
    let data = transactions;
    if (filterType !== 'all') {
      data = data.filter(t => t.type === filterType);
    }
    return data;
  }, [transactions, filterType]);

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return filteredTransactions;
    
    return [...filteredTransactions].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredTransactions, sortConfig]);

  // Real-time Dashboard Calculation
  const metrics = useMemo(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const pending = transactions.filter(t => t.status === 'pending' && t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const completedCount = transactions.filter(t => t.status === 'completed').length;
    return { income, expense, net: income - expense, pending, completedCount };
  }, [transactions]);

  const SortIcon = ({ column }: { column: keyof Transaction }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-slate-600 opacity-0 group-hover:opacity-50 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="text-emerald-400" /> 
      : <ArrowDown size={12} className="text-emerald-400" />;
  };

  const HeaderCell = ({ label, field, className = "" }: { label: string, field: keyof Transaction, className?: string }) => (
    <th 
      className={`py-3 px-3 font-semibold border-b border-slate-700 bg-slate-900 text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 select-none cursor-pointer group hover:text-white transition-colors whitespace-nowrap ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-1.5 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
        {label}
        <SortIcon column={field} />
      </div>
    </th>
  );

  return (
    <div className="flex flex-col h-full bg-slate-800/50 rounded-xl border border-slate-700 shadow-2xl overflow-hidden backdrop-blur-sm">
      
      {/* 1. Integrated Dashboard Header (The "Ticker") */}
      <div className="bg-slate-900 border-b border-slate-700 flex flex-nowrap overflow-x-auto no-scrollbar items-center">
        <div className="flex items-center px-4 py-2 border-r border-slate-700/50 bg-slate-950/30 flex-shrink-0">
           <Activity className="text-emerald-500 animate-pulse" size={20} />
        </div>
        <DashboardTickerItem 
          label="Net Cash Flow" 
          value={`$${metrics.net.toLocaleString()}`} 
          type={metrics.net >= 0 ? 'info' : 'negative'} 
        />
        <DashboardTickerItem 
          label="Total Revenue" 
          value={`$${metrics.income.toLocaleString()}`} 
          type="positive"
        />
        <DashboardTickerItem 
          label="Total Expenses" 
          value={`$${metrics.expense.toLocaleString()}`} 
          type="negative"
        />
        <DashboardTickerItem 
          label="Pending Income" 
          value={`$${metrics.pending.toLocaleString()}`} 
          subValue={`${transactions.filter(t => t.status === 'pending').length} Deals`}
          type="neutral"
        />
        <div className="flex-1 flex items-center justify-end px-4 gap-2 min-w-[200px]">
           <div className="flex bg-slate-800 p-0.5 rounded-lg border border-slate-700 hidden sm:flex">
              {['all', 'income', 'expense'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterType(f as any)}
                  className={`px-3 py-1 text-[10px] uppercase font-bold rounded-md transition-all ${filterType === f ? 'bg-slate-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  {f}
                </button>
              ))}
           </div>
           <button 
            onClick={handleAdd}
            className="flex items-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-md transition-all shadow-lg shadow-emerald-900/20 active:translate-y-0.5 whitespace-nowrap"
          >
            <Plus size={14} /> NEW ENTRY
          </button>
        </div>
      </div>
      
      {/* 2. The Grid */}
      <div className="flex-1 overflow-auto custom-scrollbar relative bg-slate-900/40">
        <table className="w-full text-left border-collapse min-w-[800px] lg:min-w-full">
          <thead>
            <tr className="shadow-sm">
              <HeaderCell label="Date" field="date" className="w-32 pl-4" />
              <HeaderCell label="Transaction" field="description" />
              <HeaderCell label="Type" field="type" className="w-28" />
              <HeaderCell label="Category" field="category" className="w-36" />
              <HeaderCell label="Amount" field="amount" className="w-32 text-right" />
              <HeaderCell label="Status" field="status" className="w-28 text-center" />
              <th className="py-3 px-2 border-b border-slate-700 bg-slate-900 sticky top-0 z-10 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-800/50">
            {sortedTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-800/60 group transition-colors">
                <td className="p-0 pl-1">
                  <DateCell 
                    value={t.date} 
                    onChange={(val) => handleUpdate(t.id, 'date', val)} 
                  />
                </td>
                <td className="p-1">
                  <input 
                    type="text" 
                    value={t.description}
                    onChange={(e) => handleUpdate(t.id, 'description', e.target.value)}
                    className="w-full bg-transparent border-none rounded px-3 py-2 text-slate-200 outline-none focus:bg-slate-800 placeholder-slate-600 font-medium transition-all"
                    placeholder="Enter description..."
                  />
                </td>
                <td className="p-1">
                   <div 
                      className={`flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors ${t.type === 'income' ? 'hover:bg-emerald-500/10' : 'hover:bg-rose-500/10'}`}
                      onClick={() => handleUpdate(t.id, 'type', t.type === 'income' ? 'expense' : 'income')}
                   >
                     {t.type === 'income' ? (
                        <>
                          <ArrowUpRight size={14} className="text-emerald-400" />
                          <span className="text-xs font-bold text-emerald-400">Income</span>
                        </>
                     ) : (
                        <>
                          <ArrowDownLeft size={14} className="text-rose-400" />
                          <span className="text-xs font-bold text-rose-400">Expense</span>
                        </>
                     )}
                   </div>
                </td>
                <td className="p-1">
                   <select
                      value={t.category}
                      onChange={(e) => handleUpdate(t.id, 'category', e.target.value)}
                      className="w-full bg-transparent text-slate-300 text-xs font-medium border-none outline-none focus:bg-slate-800 rounded px-2 py-2 cursor-pointer"
                   >
                      {(t.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                        <option key={c} value={c} className="bg-slate-900">{c}</option>
                      ))}
                      <option value="Other" className="bg-slate-900">Other</option>
                   </select>
                </td>
                <td className="p-1 text-right">
                  <div className="relative group/amt">
                     <span className={`absolute left-3 top-2 text-xs transition-colors ${t.type === 'income' ? 'text-emerald-500/50 group-focus-within/amt:text-emerald-500' : 'text-rose-500/50 group-focus-within/amt:text-rose-500'}`}>$</span>
                     <input 
                      type="number" 
                      value={t.amount}
                      onChange={(e) => handleUpdate(t.id, 'amount', Number(e.target.value))}
                      className={`w-full bg-transparent border-none rounded px-3 py-2 pl-6 font-mono text-right outline-none focus:bg-slate-800 transition-all font-bold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}
                    />
                  </div>
                </td>
                <td className="p-1 text-center">
                   <button 
                    onClick={() => handleUpdate(t.id, 'status', t.status === 'completed' ? 'pending' : 'completed')}
                    className={`inline-flex items-center justify-center w-full gap-1.5 px-2 py-1.5 rounded text-[10px] uppercase tracking-wider font-bold transition-all whitespace-nowrap ${t.status === 'completed' ? 'text-slate-400 hover:text-emerald-400' : 'text-amber-400 bg-amber-500/10'}`}
                   >
                     {t.status === 'completed' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                     {t.status}
                   </button>
                </td>
                <td className="p-1 text-center">
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="text-slate-600 hover:text-rose-400 p-1.5 hover:bg-rose-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
             {/* Empty State / Ghost Row */}
             {sortedTransactions.length === 0 && (
                <tr>
                   <td colSpan={7} className="text-center py-12 text-slate-600">
                      <LayoutList size={48} className="mx-auto mb-3 opacity-20"/>
                      <p>No transactions match your filter.</p>
                   </td>
                </tr>
             )}
          </tbody>
        </table>
      </div>
      
      {/* 3. Footer Summary */}
      <div className="bg-slate-900 border-t border-slate-800 p-2 px-4 flex justify-between items-center text-xs text-slate-500 font-mono">
         <span>{sortedTransactions.length} Rows</span>
         <span>Last updated: just now</span>
      </div>
    </div>
  );
};

export default PortfolioGrid;