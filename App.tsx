import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from './constants';
import { Transaction, GlobalSettings } from './types';
import { calculateMetrics, getChartData, getCategoryData, getTimeSummaries, getIncomeProjection } from './services/financialEngine';
import { StorageService } from './services/storage';
import ControlPanel from './components/ControlPanel';
import PortfolioGrid from './components/PortfolioGrid';
import AuthScreen from './components/AuthScreen';
import { LayoutDashboard, Table, Building, Wallet, TrendingUp, TrendingDown, DollarSign, Home, Activity, LogOut, User as UserIcon, Loader2 } from 'lucide-react';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'ledger'>('dashboard');
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Load User Data on Login (Async)
  useEffect(() => {
    async function load() {
      if (currentUser) {
        setIsDataLoading(true);
        try {
          const data = await StorageService.loadData(currentUser);
          setTransactions(data.transactions);
          setSettings(data.settings);
          setIsDataLoaded(true);
        } catch (e) {
          console.error("Failed to load user data");
        } finally {
          setIsDataLoading(false);
        }
      }
    }
    load();
  }, [currentUser]);

  // Save User Data on Change (Debounced slightly)
  useEffect(() => {
    if (currentUser && isDataLoaded) {
      const timer = setTimeout(() => {
        StorageService.saveData(currentUser, { transactions, settings });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, settings, currentUser, isDataLoaded]);

  // Derived State - Recalculates when settings change
  const metrics = useMemo(() => calculateMetrics(transactions, settings), [transactions, settings]);
  const chartData = useMemo(() => getChartData(transactions, settings), [transactions, settings]);
  const categoryData = useMemo(() => getCategoryData(transactions), [transactions]);
  const timeSummaries = useMemo(() => getTimeSummaries(transactions, settings), [transactions, settings]);
  const projectionData = useMemo(() => getIncomeProjection(transactions), [transactions]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

  // --- Enhanced Tooltips ---
  // (Keeping existing Tooltips code for brevity as they remain unchanged)
  const CashFlowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = payload.find((p: any) => p.dataKey === 'netProfit')?.value || 0;
      const margin = income > 0 ? ((net / income) * 100).toFixed(1) : '0';

      const currentIndex = chartData.findIndex(item => item.date === label);
      const prevItem = currentIndex > 0 ? chartData[currentIndex - 1] : null;
      
      const getChange = (current: number, prev: number) => {
        if (!prev) return null;
        return ((current - prev) / prev) * 100;
      }
      
      const incomeChange = prevItem ? getChange(income, prevItem.income) : null;
      const expenseChange = prevItem ? getChange(expense, prevItem.expense) : null;

      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl text-xs w-64 ring-1 ring-white/10 z-50">
          <p className="text-slate-400 font-semibold mb-3 border-b border-slate-700 pb-2 flex justify-between">
            {label}
            <span className="text-[10px] font-normal text-slate-500">Monthly Close</span>
          </p>
          
          <div className="space-y-3">
            <div className="group">
              <div className="flex justify-between items-center mb-1">
                <span className="text-emerald-400 flex items-center gap-2 font-medium">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div> 
                  Income
                </span>
                <span className="font-mono text-white text-sm font-bold">${income.toLocaleString()}</span>
              </div>
              {incomeChange !== null && (
                 <div className="flex justify-end">
                   <div className={`text-[10px] flex items-center gap-1 ${incomeChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {incomeChange >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                     {Math.abs(incomeChange).toFixed(1)}% vs prev
                   </div>
                 </div>
              )}
            </div>

            <div className="group">
               <div className="flex justify-between items-center mb-1">
                 <span className="text-rose-400 flex items-center gap-2 font-medium">
                   <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></div> 
                   Expense
                 </span>
                 <span className="font-mono text-white text-sm">${expense.toLocaleString()}</span>
               </div>
               {expenseChange !== null && (
                 <div className="flex justify-end">
                   <div className={`text-[10px] flex items-center gap-1 ${expenseChange <= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {expenseChange > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                     {Math.abs(expenseChange).toFixed(1)}% vs prev
                   </div>
                 </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
               <div className="flex flex-col">
                 <span className="text-indigo-400 font-medium">Net Profit</span>
                 <span className="text-[10px] text-slate-500">Post-Tax ({settings.taxRate}%)</span>
               </div>
               <div className="text-right">
                 <div className="font-mono font-bold text-indigo-400 text-sm">${net.toLocaleString()}</div>
                 <div className="text-[10px] text-slate-500 font-mono">{margin}% Margin</div>
               </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const TaxTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const gross = payload.find((p: any) => p.dataKey === 'grossProfit')?.value || 0;
      const net = payload.find((p: any) => p.dataKey === 'netProfit')?.value || 0;
      const taxPaid = gross - net;

      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-4 rounded-xl shadow-2xl text-xs w-56 ring-1 ring-white/10 z-50">
          <p className="text-slate-400 font-semibold mb-2">{label}</p>
          <div className="space-y-2">
             <div className="flex justify-between gap-4">
                <span className="text-cyan-400">Gross Profit</span>
                <span className="font-mono text-white font-medium">${gross.toLocaleString()}</span>
             </div>
             <div className="flex justify-between gap-4">
                <span className="text-indigo-400">Net (After Tax)</span>
                <span className="font-mono text-white font-medium">${net.toLocaleString()}</span>
             </div>
             <div className="mt-2 pt-2 border-t border-slate-700 flex justify-between gap-4 text-amber-400 bg-amber-500/5 p-1 rounded">
                <span className="font-semibold">Est. Tax ({settings.taxRate}%)</span>
                <span className="font-mono">-${taxPaid.toLocaleString()}</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const ForecastTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const forecast = payload.find((p: any) => p.dataKey === 'forecast')?.value || 0;
      const baseline = payload.find((p: any) => p.dataKey === 'baseline')?.value || 0;
      const upside = forecast - baseline;
      const isProjected = forecast > baseline;

      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-xl shadow-2xl text-xs w-60 ring-1 ring-white/10 z-50">
          <p className="text-slate-400 font-semibold mb-2 border-b border-slate-700 pb-1">{label}</p>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 font-medium">Forecasted Income</span>
              <span className="font-mono font-bold text-white text-sm">${forecast.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Baseline Average</span>
              <span className="font-mono text-slate-400">${baseline.toLocaleString()}</span>
            </div>
            
            <div className={`mt-2 p-2 rounded border ${isProjected ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-800 border-slate-700'}`}>
               {isProjected ? (
                  <div className="flex flex-col gap-1">
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                       <TrendingUp size={12} /> Positive Deviation
                    </span>
                    <div className="flex justify-between text-emerald-300/80">
                      <span>Pending Deals Impact:</span>
                      <span className="font-mono">+${upside.toLocaleString()}</span>
                    </div>
                  </div>
               ) : (
                  <span className="text-slate-500 italic flex items-center gap-1">
                    <Activity size={12}/> Projection based on historical run-rate
                  </span>
               )}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const ExpenseTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const totalExpense = metrics.totalExpense;
      const percent = totalExpense > 0 ? ((data.value / totalExpense) * 100).toFixed(1) : 0;
      const color = data.payload.fill || '#64748b';

      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-xl shadow-2xl text-xs ring-1 ring-white/10 z-50">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-700">
            <div className="w-3 h-3 rounded-full shadow-lg" style={{ backgroundColor: color }}></div>
            <span className="font-bold text-slate-200 text-sm uppercase tracking-wide">{data.name}</span>
          </div>
          <div className="space-y-1">
             <div className="flex justify-between items-center gap-8">
               <span className="text-slate-400">Amount</span>
               <span className="text-lg font-mono text-white font-bold">${data.value.toLocaleString()}</span>
             </div>
             <div className="flex justify-between items-center gap-8">
               <span className="text-slate-400">Share</span>
               <span className="text-emerald-400 font-mono bg-emerald-500/10 px-1.5 py-0.5 rounded">{percent}%</span>
             </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsDataLoaded(false);
    setTransactions(INITIAL_TRANSACTIONS); 
  };

  if (!currentUser) {
    return <AuthScreen onLogin={(user) => setCurrentUser(user)} />;
  }

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-slate-400 animate-pulse">Syncing Secure Database...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Sidebar - Control Panel / Auto Summaries */}
      <div className="w-80 flex-shrink-0 z-20 shadow-2xl border-r border-slate-800">
        <ControlPanel 
          summaries={timeSummaries} 
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between px-6 z-10">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-2 rounded-lg">
              <Home className="text-white" size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">Realty<span className="text-emerald-400 font-light">Dash</span></h1>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-lg border border-slate-700">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === 'dashboard' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <LayoutDashboard size={16} /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm transition-all ${activeTab === 'ledger' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Table size={16} /> Spreadsheet
              </button>
            </div>

            <div className="h-6 w-px bg-slate-700 mx-2"></div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-300">
                 <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 border border-indigo-500/30">
                   <UserIcon size={16} />
                 </div>
                 <span className="font-medium hidden md:block">{currentUser}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 transition-colors p-2 hover:bg-slate-800 rounded-full"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <main className="flex-1 overflow-y-auto p-6 scroll-smooth">
          
          {/* Top Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={48} className="text-emerald-500" />
              </div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Net Income (Post-Tax)</p>
              <h3 className="text-2xl font-bold text-white font-mono">${metrics.netIncome.toLocaleString()}</h3>
              <div className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                 Adjusted for {settings.taxRate}% Tax
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign size={48} className="text-indigo-500" />
              </div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Revenue</p>
              <h3 className="text-2xl font-bold text-indigo-400 font-mono">${metrics.totalIncome.toLocaleString()}</h3>
              <div className="mt-2 text-xs text-slate-500">
                Gross Commissions
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group hover:border-rose-500/30 transition-colors">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp size={48} className="text-rose-500" />
              </div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Total Expenses</p>
              <h3 className="text-2xl font-bold text-rose-400 font-mono">${metrics.totalExpense.toLocaleString()}</h3>
              <div className="mt-2 text-xs text-slate-500 flex justify-between">
                <span>Proj Next Yr:</span>
                <span className="text-rose-300 font-mono">${Math.round(metrics.projectedNextYearExpense).toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-sm relative overflow-hidden group hover:border-amber-500/30 transition-colors">
               <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Building size={48} className="text-amber-500" />
              </div>
              <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-1">Pending (Est. Net)</p>
              <h3 className="text-2xl font-bold text-amber-400 font-mono">${metrics.pendingCommissions.toLocaleString()}</h3>
              <div className="mt-2 text-xs text-slate-500">
                Est. Take Home after Tax
              </div>
            </div>
          </div>

          {/* Dynamic Content Switching */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
            
            {/* Main Area */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {activeTab === 'dashboard' ? (
                 <>
                   {/* Card 1: Cash Flow */}
                   <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex-1 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Cash Flow Overview</h3>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Income
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-rose-500"></span> Expense
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Net (Post-Tax)
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{fontSize: 12}} 
                              tickFormatter={(value) => `$${value/1000}k`}
                              tickLine={false} 
                              axisLine={false}
                            />
                            <Tooltip content={<CashFlowTooltip />} cursor={{fill: '#1e293b'}} />
                            <Bar dataKey="income" name="Income" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="expense" name="Expense" fill="#f43f5e" radius={[4, 4, 0, 0]} barSize={20} />
                            <Bar dataKey="netProfit" name="Net Profit (Post-Tax)" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={10} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Card 2: Tax Impact Analysis */}
                   <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex-1 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white">Tax Impact Analysis</h3>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-cyan-500"></span> Gross Profit
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-indigo-500"></span> Net Profit (After Tax)
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                            <defs>
                              <linearGradient id="colorGross" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                              </linearGradient>
                              <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="date" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{fontSize: 12}} 
                              tickFormatter={(value) => `$${value/1000}k`}
                              tickLine={false} 
                              axisLine={false}
                            />
                            <Tooltip content={<TaxTooltip />} />
                            <Area 
                              type="monotone" 
                              dataKey="grossProfit" 
                              name="Gross Profit" 
                              stroke="#06b6d4" 
                              fillOpacity={1} 
                              fill="url(#colorGross)" 
                            />
                            <Area 
                              type="monotone" 
                              dataKey="netProfit" 
                              name="Net Profit (Post-Tax)" 
                              stroke="#6366f1" 
                              fillOpacity={1} 
                              fill="url(#colorNet)" 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                   </div>

                   {/* Card 3: 12-Month Forecast */}
                   <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex-1 flex flex-col min-h-[400px]">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                           <Activity size={18} className="text-emerald-400"/>
                           12-Month Income Forecast
                        </h3>
                        <div className="flex gap-4 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-0.5 bg-emerald-500"></span> Predicted
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-0.5 bg-slate-500 border-t border-dashed"></span> Baseline Avg
                          </div>
                        </div>
                      </div>
                      <div className="flex-1 min-h-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={projectionData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                            <XAxis dataKey="name" stroke="#64748b" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
                            <YAxis 
                              stroke="#64748b" 
                              tick={{fontSize: 12}} 
                              tickFormatter={(value) => `$${value/1000}k`}
                              tickLine={false} 
                              axisLine={false}
                            />
                            <Tooltip content={<ForecastTooltip />} />
                            <Line 
                              type="monotone" 
                              dataKey="forecast" 
                              name="Forecast Income" 
                              stroke="#10b981" 
                              strokeWidth={3}
                              dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                              activeDot={{ r: 6 }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="baseline" 
                              name="Baseline Average" 
                              stroke="#64748b" 
                              strokeWidth={2}
                              strokeDasharray="5 5"
                              dot={false}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                        <p className="text-xs text-slate-500 mt-2 text-center">
                          Projection based on historical run-rate + scheduled pending transactions.
                        </p>
                      </div>
                   </div>
                 </>
              ) : (
                <div className="h-full min-h-[600px]">
                  <PortfolioGrid transactions={transactions} setTransactions={setTransactions} />
                </div>
              )}
            </div>

            {/* Right Column: Breakdown */}
            <div className="flex flex-col gap-6">
              
              {/* Expense Breakdown */}
              <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-[400px] flex flex-col">
                 <h4 className="text-sm font-semibold text-slate-300 mb-4">Expense Breakdown</h4>
                 <div className="flex-1">
                   <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="#1e293b" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<ExpenseTooltip />} />
                        <Legend 
                           verticalAlign="bottom" 
                           height={36} 
                           iconSize={10}
                           wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
                        />
                      </PieChart>
                   </ResponsiveContainer>
                 </div>
              </div>

               {/* Quick Stats */}
               <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 flex-1">
                  <h4 className="text-sm font-semibold text-slate-300 mb-4">Transaction Stats</h4>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                        <span className="text-xs text-slate-400">Total Transactions</span>
                        <span className="text-sm font-mono text-white">{transactions.length}</span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                        <span className="text-xs text-slate-400">Avg. Commission</span>
                        <span className="text-sm font-mono text-emerald-400">
                           ${transactions.filter(t => t.type === 'income').length > 0 
                             ? Math.round(metrics.totalIncome / transactions.filter(t => t.type === 'income').length).toLocaleString() 
                             : 0}
                        </span>
                     </div>
                     <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                        <span className="text-xs text-slate-400">Pending Deals</span>
                        <span className="text-sm font-mono text-amber-400">
                           {transactions.filter(t => t.status === 'pending').length}
                        </span>
                     </div>
                  </div>
               </div>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
}