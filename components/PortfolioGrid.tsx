import React, { useRef, useState, useMemo } from 'react';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import { Trash2, Plus, ArrowUpRight, ArrowDownLeft, CheckCircle2, Clock, Calendar, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';
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
    // Parse manually to avoid timezone issues with YYYY-MM-DD
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getFullDateTooltip = (isoDate: string) => {
    if (!isoDate) return 'Click to select date';
    const [y, m, d] = isoDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    // Returns full date e.g., "Monday, May 15, 2024"
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const handleClick = () => {
    if (inputRef.current) {
      // Use typeof check to prevent TypeScript from narrowing 'inputRef.current' to 'never' in the else block
      if (typeof (inputRef.current as any).showPicker === 'function') {
        (inputRef.current as any).showPicker();
      } else {
        inputRef.current.focus();
      }
    }
  };

  return (
    <div 
      className="relative group cursor-pointer flex items-center gap-2 py-1.5 px-2 hover:bg-slate-800 rounded transition-colors border border-transparent hover:border-slate-600"
      onClick={handleClick}
      title={getFullDateTooltip(value)}
    >
      <Calendar size={14} className="text-slate-500 group-hover:text-emerald-400 transition-colors flex-shrink-0" />
      <span className={`text-sm font-medium whitespace-nowrap ${value ? 'text-slate-300 group-hover:text-white' : 'text-slate-500'}`}>
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

const PortfolioGrid: React.FC<Props> = ({ transactions, setTransactions }) => {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'date', direction: 'desc' });
  
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
      description: 'New Entry',
      category: 'Marketing',
      amount: 0,
      type: 'expense',
      status: 'completed'
    };
    setTransactions([newTransaction, ...transactions]);
    // Reset sort to date desc so the new entry (today) appears near top or according to its date
    setSortConfig({ key: 'date', direction: 'desc' });
  };

  const handleSort = (key: keyof Transaction) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedTransactions = useMemo(() => {
    if (!sortConfig.key) return transactions;
    
    return [...transactions].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [transactions, sortConfig]);

  const SortIcon = ({ column }: { column: keyof Transaction }) => {
    if (sortConfig.key !== column) return <ArrowUpDown size={12} className="text-slate-600 opacity-0 group-hover:opacity-50 transition-opacity" />;
    return sortConfig.direction === 'asc' 
      ? <ArrowUp size={12} className="text-emerald-400" /> 
      : <ArrowDown size={12} className="text-emerald-400" />;
  };

  const HeaderCell = ({ label, field, className = "" }: { label: string, field: keyof Transaction, className?: string }) => (
    <th 
      className={`p-3 font-medium border-b border-slate-700 cursor-pointer hover:bg-slate-800/50 transition-colors select-none group ${className}`}
      onClick={() => handleSort(field)}
    >
      <div className={`flex items-center gap-2 ${className.includes('text-right') ? 'justify-end' : className.includes('text-center') ? 'justify-center' : 'justify-start'}`}>
        {label}
        <SortIcon column={field} />
      </div>
    </th>
  );

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-xl overflow-hidden flex flex-col h-full">
      <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
        <h3 className="text-white font-semibold flex items-center gap-2">
          Transaction Ledger
          <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-full">{transactions.length} Entries</span>
        </h3>
        <button 
          onClick={handleAdd}
          className="flex items-center gap-1 text-xs bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded transition-colors shadow-lg shadow-indigo-500/20"
        >
          <Plus size={14} /> Add Entry
        </button>
      </div>
      
      <div className="overflow-x-auto flex-1 custom-scrollbar">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm">
              <HeaderCell label="Date" field="date" className="w-40 pl-4" />
              <HeaderCell label="Type" field="type" className="w-28" />
              <HeaderCell label="Description" field="description" />
              <HeaderCell label="Category" field="category" className="w-36" />
              <HeaderCell label="Amount" field="amount" className="w-32 text-right" />
              <HeaderCell label="Status" field="status" className="w-28 text-center" />
              <th className="p-3 font-medium border-b border-slate-700 w-10"></th>
            </tr>
          </thead>
          <tbody className="text-sm divide-y divide-slate-700">
            {sortedTransactions.map((t) => (
              <tr key={t.id} className="hover:bg-slate-700/30 group transition-colors">
                <td className="p-2 pl-3">
                  <DateCell 
                    value={t.date} 
                    onChange={(val) => handleUpdate(t.id, 'date', val)} 
                  />
                </td>
                <td className="p-2">
                   <div className="relative">
                    <select
                      value={t.type}
                      onChange={(e) => handleUpdate(t.id, 'type', e.target.value as TransactionType)}
                      className={`bg-slate-900 border border-transparent hover:border-slate-600 rounded px-2 py-1.5 outline-none w-full text-xs appearance-none cursor-pointer font-medium transition-all ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                    <div className="absolute right-2 top-2 pointer-events-none">
                       {t.type === 'income' ? <ArrowUpRight size={12} className="text-emerald-400"/> : <ArrowDownLeft size={12} className="text-rose-400"/>}
                    </div>
                   </div>
                </td>
                <td className="p-2">
                  <input 
                    type="text" 
                    value={t.description}
                    onChange={(e) => handleUpdate(t.id, 'description', e.target.value)}
                    className="bg-transparent border border-transparent hover:border-slate-600 rounded px-2 py-1.5 text-slate-200 w-full outline-none focus:bg-slate-900 focus:border-indigo-500 transition-all placeholder-slate-600"
                    placeholder="Transaction details..."
                  />
                </td>
                <td className="p-2">
                  <div className="relative">
                    <select
                        value={t.category}
                        onChange={(e) => handleUpdate(t.id, 'category', e.target.value)}
                        className="bg-transparent border border-transparent hover:border-slate-600 rounded px-2 py-1.5 text-slate-300 w-full outline-none focus:bg-slate-900 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                      >
                        {(t.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                  </div>
                </td>
                <td className="p-2 text-right">
                  <input 
                    type="number" 
                    value={t.amount}
                    onChange={(e) => handleUpdate(t.id, 'amount', Number(e.target.value))}
                    className="bg-transparent border border-transparent hover:border-slate-600 rounded px-2 py-1.5 text-slate-100 font-mono w-full text-right outline-none focus:bg-slate-900 focus:border-indigo-500 transition-all"
                  />
                </td>
                <td className="p-2 text-center">
                   <button 
                    onClick={() => handleUpdate(t.id, 'status', t.status === 'completed' ? 'pending' : 'completed')}
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-semibold transition-all ${t.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 ring-1 ring-emerald-500/20' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 ring-1 ring-amber-500/20'}`}
                   >
                     {t.status === 'completed' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
                     {t.status === 'completed' ? 'Paid' : 'Pending'}
                   </button>
                </td>
                <td className="p-2 text-center">
                  <button 
                    onClick={() => handleDelete(t.id)}
                    className="text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all p-1.5 hover:bg-red-500/10 rounded"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PortfolioGrid;