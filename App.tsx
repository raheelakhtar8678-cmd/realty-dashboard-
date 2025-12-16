import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from './constants';
import { Transaction, GlobalSettings } from './types';
import { calculateMetrics, getChartData, getCategoryData, getTimeSummaries, getIncomeProjection } from './services/financialEngine';
import { StorageService } from './services/storage';
import ControlPanel from './components/ControlPanel';
import PortfolioGrid from './components/PortfolioGrid';
import AuthScreen from './components/AuthScreen';
import { LayoutDashboard, Table, Building, Wallet, TrendingUp, TrendingDown, DollarSign, Home, Activity, LogOut, User as UserIcon, Loader2, AlertCircle, Menu, X, PieChart as PieIcon, Clock, ArrowUpRight, ArrowDownLeft, Target } from 'lucide-react';

const SESSION_KEY = 'realty_current_user';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [activeTab, setActiveTab] = useState<'overview' | 'ledger'>('overview');
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Mobile UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // 1. Check for existing session on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(SESSION_KEY);
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsAuthChecking(false);
  }, []);

  // 2. Load User Data when currentUser changes
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

  // 3. Auto-save Data
  useEffect(() => {
    if (currentUser && isDataLoaded) {
      const timer = setTimeout(() => {
        StorageService.saveData(currentUser, { transactions, settings });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, settings, currentUser, isDataLoaded]);

  // Derived State
  const metrics = useMemo(() => calculateMetrics(transactions, settings), [transactions, settings]);
  const chartData = useMemo(() => getChartData(transactions, settings), [transactions, settings]);
  const categoryData = useMemo(() => getCategoryData(transactions), [transactions]);
  const timeSummaries = useMemo(() => getTimeSummaries(transactions, settings), [transactions, settings]);
  const projectionData = useMemo(() => getIncomeProjection(transactions, settings), [transactions, settings]);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

  const CashFlowTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const income = payload.find((p: any) => p.dataKey === 'income')?.value || 0;
      const expense = payload.find((p: any) => p.dataKey === 'expense')?.value || 0;
      const net = payload.find((p: any) => p.dataKey === 'netProfit')?.value || 0;
      
      return (
        <div className="bg-slate-900/95 backdrop-blur border border-slate-700 p-3 rounded-lg shadow-xl text-xs z-50">
          <p className="text-slate-400 font-semibold mb-2">{label}</p>
          <div className="space-y-1">
             <div className="flex justify-between gap-4"><span className="text-emerald-400">Income</span><span className="text-white font-mono">${income.toLocaleString()}</span></div>
             <div className="flex justify-between gap-4"><span className="text-rose-400">Expense</span><span className="text-white font-mono">${expense.toLocaleString()}</span></div>
             <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1"><span className="text-indigo-400">Net Profit</span><span className="text-white font-mono">${net.toLocaleString()}</span></div>
          </div>
        </div>
      );
    }
    return null;
  };

  const handleLogin = (user: string) => {
    setCurrentUser(user);
    localStorage.setItem(SESSION_KEY, user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setIsDataLoaded(false);
    setTransactions(INITIAL_TRANSACTIONS); 
    localStorage.removeItem(SESSION_KEY);
  };

  if (isAuthChecking) {
     return <div className="min-h-screen bg-slate-900 flex items-center justify-center"><Loader2 className="animate-spin text-emerald-500"/></div>;
  }

  if (!currentUser) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  if (isDataLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center flex-col gap-4">
        <Loader2 className="animate-spin text-emerald-500" size={48} />
        <p className="text-slate-400 animate-pulse">Syncing Dashboard...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-900 text-slate-100 overflow-hidden font-sans">
      
      {/* Mobile Header */}
      <div className="lg:hidden h-14 bg-slate-950 border-b border-slate-800 flex items-center justify-between px-4 z-50 shrink-0">
        <div className="flex items-center gap-2">
            <div className="bg-emerald-600 p-1 rounded-md">
              <Home className="text-white" size={16} />
            </div>
            <h1 className="text-sm font-bold tracking-tight text-white">Realty<span className="text-emerald-400 font-light">Dash</span></h1>
        </div>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="text-slate-300 p-2 hover:bg-slate-800 rounded-lg transition-colors"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Menu Drawer */}
      <div className={`
        fixed inset-0 z-40 bg-slate-900/95 backdrop-blur-sm lg:hidden transition-opacity duration-300
        ${isMobileMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
      `}>
         <div className={`
           h-full w-4/5 max-w-sm bg-slate-900 border-r border-slate-800 shadow-2xl transform transition-transform duration-300
           ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
         `}>
            <div className="flex flex-col h-full pt-16 lg:pt-0">
               <ControlPanel 
                  summaries={timeSummaries} 
                  settings={settings}
                  onSettingsChange={setSettings}
                />
            </div>
         </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex w-72 flex-shrink-0 z-20 shadow-2xl border-r border-slate-800 flex-col bg-slate-900">
        <div className="p-4 border-b border-slate-700 bg-slate-950">
           <div className="flex items-center gap-2 mb-4">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Home className="text-white" size={20} />
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">Realty<span className="text-emerald-400 font-light">Dash</span></h1>
           </div>
           <div className="text-xs text-slate-500 font-mono">Professional Edition v2.0</div>
        </div>
        <ControlPanel 
          summaries={timeSummaries} 
          settings={settings}
          onSettingsChange={setSettings}
        />
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-900">
        
        {/* Top Navigation Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between px-4 lg:px-6 z-10 shrink-0">
           
           {/* Navigation Tabs */}
           <div className="flex items-center gap-1 bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
              <button 
                onClick={() => setActiveTab('overview')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${activeTab === 'overview' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                <LayoutDashboard size={14} /> Overview
              </button>
              <button 
                onClick={() => setActiveTab('ledger')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all ${activeTab === 'ledger' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
              >
                <Table size={14} /> Transactions
              </button>
           </div>

           <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300 bg-slate-800 py-1 px-3 rounded-full border border-slate-700">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="font-medium">{currentUser}</span>
              </div>
              <button 
                onClick={handleLogout}
                className="text-slate-500 hover:text-rose-400 transition-colors p-1.5 hover:bg-slate-800 rounded-md"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
           </div>
        </header>

        {/* Work Area */}
        <main className="flex-1 overflow-y-auto p-0 scroll-smooth flex flex-col relative">
          
          {/* View: OVERVIEW */}
          {activeTab === 'overview' && (
             <div className="p-4 lg:p-8 max-w-7xl mx-auto w-full space-y-6 animate-in fade-in zoom-in-95 duration-300">
                
                {/* Monthly Target Header - Moved here for visibility */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700 shadow-lg flex flex-col md:flex-row items-center gap-4 relative overflow-hidden">
                   <div className="absolute left-0 top-0 h-full w-1 bg-emerald-500"></div>
                   <div className="flex items-center gap-3 min-w-[200px]">
                      <div className="p-2 bg-emerald-500/10 rounded-full">
                         <Target size={24} className="text-emerald-500" />
                      </div>
                      <div>
                         <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">Monthly Target</div>
                         <div className="text-lg font-bold text-white font-mono">$20,000</div>
                      </div>
                   </div>
                   
                   <div className="flex-1 w-full">
                      <div className="flex justify-between items-end mb-1">
                         <span className="text-xs text-emerald-400 font-medium">{Math.round((timeSummaries.month.income / 20000) * 100)}% Achieved</span>
                         <span className="text-xs text-slate-500 font-mono">${timeSummaries.month.income.toLocaleString()} / $20,000</span>
                      </div>
                      <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden border border-slate-700">
                        <div 
                          className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                          style={{ width: `${Math.min((timeSummaries.month.income / 20000) * 100, 100)}%` }}
                        ></div>
                      </div>
                   </div>
                </div>

                {/* Metrics Grid - Optimized for Mobile */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
                   <div className="bg-slate-800 p-3 lg:p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-emerald-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingUp size={40} className="text-emerald-500"/>
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Gross Revenue</div>
                      <div className="text-xl lg:text-3xl font-bold text-white font-mono tracking-tight">${metrics.totalIncome.toLocaleString()}</div>
                      <div className="text-[10px] lg:text-xs text-emerald-400 mt-2 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded w-fit">+12% vs last month</div>
                   </div>
                   <div className="bg-slate-800 p-3 lg:p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-rose-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <TrendingDown size={40} className="text-rose-500"/>
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Expenses</div>
                      <div className="text-xl lg:text-3xl font-bold text-white font-mono tracking-tight">${metrics.totalExpense.toLocaleString()}</div>
                      <div className="text-[10px] lg:text-xs text-rose-400 mt-2 font-medium bg-rose-500/10 px-1.5 py-0.5 rounded w-fit">High marketing spend</div>
                   </div>
                   <div className="bg-slate-800 p-3 lg:p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-indigo-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Wallet size={40} className="text-indigo-500"/>
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Net Income (Est)</div>
                      <div className="text-xl lg:text-3xl font-bold text-white font-mono tracking-tight">${metrics.netIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] lg:text-xs text-indigo-400 mt-2 font-medium bg-indigo-500/10 px-1.5 py-0.5 rounded w-fit">Post-tax estimate</div>
                   </div>
                   <div className="bg-slate-800 p-3 lg:p-5 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden group hover:border-purple-500/30 transition-colors">
                      <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={40} className="text-purple-500"/>
                      </div>
                      <div className="text-[10px] lg:text-xs text-slate-400 uppercase tracking-wider font-bold mb-1">Net Cash Flow</div>
                      <div className="text-xl lg:text-3xl font-bold text-white font-mono tracking-tight">${metrics.netCashFlow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</div>
                      <div className="text-[10px] lg:text-xs text-purple-400 mt-2 font-medium bg-purple-500/10 px-1.5 py-0.5 rounded w-fit">After Withdrawals</div>
                   </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Bar Chart */}
                    <div className="lg:col-span-2 bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm">
                       <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                         <Activity size={18} className="text-emerald-500"/> Cash Flow Performance
                       </h3>
                       <div className="h-[250px] lg:h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                              <XAxis dataKey="date" stroke="#94a3b8" tick={{fontSize: 10}} tickLine={false} axisLine={false} />
                              <YAxis stroke="#94a3b8" tick={{fontSize: 10}} tickFormatter={(v) => `$${v/1000}k`} tickLine={false} axisLine={false} />
                              <Tooltip content={<CashFlowTooltip />} cursor={{fill: '#1e293b', opacity: 0.5}} />
                              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                              <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                            </BarChart>
                          </ResponsiveContainer>
                       </div>
                    </div>

                    {/* Forecast Area Chart */}
                    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-sm flex flex-col">
                       <h3 className="text-base font-bold text-white mb-6 flex items-center gap-2">
                         <TrendingUp size={18} className="text-indigo-500"/> 
                         <span className="flex-1">Scenario Forecast</span>
                         {settings.inflationRate > 3 && <span className="text-[10px] text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">High Infl.</span>}
                       </h3>
                       <div className="flex-1 w-full min-h-[200px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={projectionData}>
                               <defs>
                                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                  </linearGradient>
                               </defs>
                               <CartesianGrid stroke="#334155" vertical={false} opacity={0.3} />
                               <XAxis dataKey="name" hide />
                               <YAxis hide domain={['dataMin', 'dataMax']} />
                               <Tooltip contentStyle={{background:'#0f172a', border:'1px solid #334155', borderRadius:'8px'}} itemStyle={{color:'#e2e8f0'}}/>
                               <Area type="monotone" dataKey="forecast" name="Projected Income" stroke="#6366f1" strokeWidth={3} fill="url(#colorForecast)" />
                               <Area type="monotone" dataKey="projectedExpense" name="Proj. Expense (Inflation)" stroke="#f43f5e" strokeWidth={2} fill="transparent" strokeDasharray="4 4" />
                            </AreaChart>
                          </ResponsiveContainer>
                       </div>
                       <div className="mt-4 pt-4 border-t border-slate-700">
                          <div className="flex justify-between items-center text-sm">
                             <span className="text-slate-400 text-xs">Projected Annual Net (Scenario)</span>
                             <div className="text-right">
                                <div className="text-white font-mono font-bold text-lg">${Math.round(metrics.projectedScenarioNet).toLocaleString()}</div>
                                <div className="text-[10px] text-slate-500">Adj. for Inflation ({settings.inflationRate}%) & Tax ({settings.taxRate}%)</div>
                             </div>
                          </div>
                       </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {/* Category Breakdown (Detailed) */}
                   <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col">
                      <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                        <PieIcon size={18} className="text-amber-500"/> Expense Allocation
                      </h3>
                      <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="h-[180px] w-[180px] flex-shrink-0 relative">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                  <Pie
                                    data={categoryData}
                                    innerRadius={50}
                                    outerRadius={70}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {categoryData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{background:'#0f172a', border:'1px solid #334155', borderRadius:'8px', fontSize:'12px'}} 
                                    itemStyle={{color:'#e2e8f0'}} 
                                    formatter={(value: number) => `$${value.toLocaleString()}`}
                                  />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                               <div className="text-center">
                                  <div className="text-xs text-slate-500">Total</div>
                                  <div className="text-sm font-bold text-white">${metrics.totalExpense.toLocaleString()}</div>
                               </div>
                            </div>
                        </div>
                        
                        {/* Detailed List */}
                        <div className="flex-1 w-full space-y-3">
                           {categoryData.slice(0, 4).map((cat, index) => {
                             const percent = (cat.value / metrics.totalExpense) * 100;
                             return (
                               <div key={cat.name} className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-2">
                                     <div className="w-2 h-2 rounded-full" style={{ background: COLORS[index % COLORS.length] }}></div>
                                     <span className="text-slate-300 font-medium">{cat.name}</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                     <span className="text-slate-500 w-8 text-right">{Math.round(percent)}%</span>
                                     <span className="text-white font-mono w-16 text-right">${cat.value.toLocaleString()}</span>
                                  </div>
                               </div>
                             );
                           })}
                           {categoryData.length > 4 && (
                             <div className="text-center pt-2 text-[10px] text-slate-500 italic">
                               + {categoryData.length - 4} other categories
                             </div>
                           )}
                        </div>
                      </div>
                   </div>
                   
                   {/* Recent Transactions List (Mini) */}
                   <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 overflow-hidden flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                         <h3 className="text-base font-bold text-white flex items-center gap-2">
                           <Clock size={18} className="text-slate-400"/> Recent Activity
                         </h3>
                         <button onClick={() => setActiveTab('ledger')} className="text-xs text-emerald-400 hover:text-emerald-300 font-medium">View All</button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                         {transactions.slice(0, 5).map(t => (
                            <div key={t.id} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700/50">
                               <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-full 
                                     ${t.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' 
                                     : t.type === 'expense' ? 'bg-rose-500/10 text-rose-500'
                                     : 'bg-purple-500/10 text-purple-500'}`}>
                                     {t.type === 'income' && <ArrowUpRight size={14} />}
                                     {t.type === 'expense' && <ArrowDownLeft size={14} />}
                                     {t.type === 'withdrawal' && <DollarSign size={14} />}
                                  </div>
                                  <div>
                                     <div className="text-sm font-medium text-slate-200">{t.description}</div>
                                     <div className="text-xs text-slate-500">{t.date}</div>
                                  </div>
                               </div>
                               <div className={`font-mono font-bold text-sm 
                                  ${t.type === 'income' ? 'text-emerald-400' 
                                  : t.type === 'expense' ? 'text-slate-200' 
                                  : 'text-purple-400'}`}>
                                  {t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}
                               </div>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          )}

          {/* View: LEDGER */}
          {activeTab === 'ledger' && (
             <div className="flex-1 flex flex-col h-full bg-slate-900 p-4 lg:p-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-4">
                   <h2 className="text-xl font-bold text-white flex items-center gap-2">
                     <Table size={24} className="text-emerald-500"/> Master Ledger
                   </h2>
                </div>
                <div className="flex-1 shadow-2xl rounded-xl overflow-hidden border border-slate-700 flex flex-col bg-slate-800">
                   <PortfolioGrid transactions={transactions} setTransactions={setTransactions} />
                </div>
             </div>
          )}

        </main>
      </div>
    </div>
  );
}