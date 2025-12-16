import React, { useState, useMemo, useEffect } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, Legend } from 'recharts';
import { INITIAL_TRANSACTIONS, INITIAL_SETTINGS } from './constants';
import { Transaction, GlobalSettings } from './types';
import { calculateMetrics, getChartData, getCategoryData, getTimeSummaries, getIncomeProjection } from './services/financialEngine';
import { StorageService } from './services/storage';
import ControlPanel from './components/ControlPanel';
import PortfolioGrid from './components/PortfolioGrid';
import AuthScreen from './components/AuthScreen';
import { LayoutDashboard, Table, Building, Wallet, TrendingUp, TrendingDown, DollarSign, Home, Activity, LogOut, User as UserIcon, Loader2, AlertCircle, Menu, X, ChevronUp, ChevronDown } from 'lucide-react';

const SESSION_KEY = 'realty_current_user';

export default function App() {
  // Auth State
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  // App State
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [settings, setSettings] = useState<GlobalSettings>(INITIAL_SETTINGS);
  const [showAnalytics, setShowAnalytics] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  // Mobile UI State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem(SESSION_KEY);
    if (savedUser) {
      setCurrentUser(savedUser);
    }
    setIsAuthChecking(false);
  }, []);

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

  useEffect(() => {
    if (currentUser && isDataLoaded) {
      const timer = setTimeout(() => {
        StorageService.saveData(currentUser, { transactions, settings });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [transactions, settings, currentUser, isDataLoaded]);

  const metrics = useMemo(() => calculateMetrics(transactions, settings), [transactions, settings]);
  const chartData = useMemo(() => getChartData(transactions, settings), [transactions, settings]);
  const categoryData = useMemo(() => getCategoryData(transactions), [transactions]);
  const timeSummaries = useMemo(() => getTimeSummaries(transactions, settings), [transactions, settings]);
  const projectionData = useMemo(() => getIncomeProjection(transactions), [transactions]);

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
             <div className="flex justify-between gap-4 border-t border-slate-700 pt-1 mt-1"><span className="text-indigo-400">Net</span><span className="text-white font-mono">${net.toLocaleString()}</span></div>
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
        
        {/* Top Navigation */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/95 backdrop-blur flex items-center justify-between px-4 lg:px-6 z-10 shrink-0">
           <div className="flex items-center gap-4">
              <button 
                onClick={() => setShowAnalytics(!showAnalytics)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wide transition-all border ${showAnalytics ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' : 'text-slate-400 border-transparent hover:bg-slate-800'}`}
              >
                <Activity size={14} /> {showAnalytics ? 'Hide Analytics' : 'Show Analytics'}
              </button>
           </div>

           <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-300 bg-slate-800 py-1 px-3 rounded-full border border-slate-700">
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

        {/* Scrollable Work Area */}
        <main className="flex-1 overflow-y-auto p-0 scroll-smooth flex flex-col">
          
          {/* Analytics Deck */}
          <div className={`
            bg-slate-900 border-b border-slate-800 transition-all duration-500 ease-in-out overflow-hidden
            ${showAnalytics ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}
          `}>
             <div className="p-4 lg:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Chart 1: Cash Flow */}
                <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 shadow-sm col-span-1 lg:col-span-2 relative group flex flex-col">
                   <div className="flex justify-between items-center mb-4">
                      <h3 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                        <TrendingUp size={16} className="text-emerald-500" /> Performance
                      </h3>
                      <div className="flex gap-2 text-[10px] text-slate-400 font-mono">
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-emerald-500"></div>INC</span>
                        <span className="flex items-center gap-1"><div className="w-2 h-2 rounded bg-rose-500"></div>EXP</span>
                      </div>
                   </div>
                   <div className="h-[250px] lg:h-[350px] w-full flex-1">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} opacity={0.5} />
                          <XAxis 
                             dataKey="date" 
                             stroke="#64748b" 
                             tick={{fontSize: 10}} 
                             tickLine={false} 
                             axisLine={false} 
                             tickMargin={10}
                          />
                          <YAxis 
                             stroke="#64748b" 
                             tick={{fontSize: 10}} 
                             tickFormatter={(v) => `${v/1000}k`} 
                             tickLine={false} 
                             axisLine={false}
                             width={35}
                          />
                          <Tooltip content={<CashFlowTooltip />} cursor={{fill: '#1e293b', opacity: 0.5}} />
                          <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={50} />
                          <Bar dataKey="expense" fill="#f43f5e" radius={[4, 4, 0, 0]} maxBarSize={50} />
                        </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Chart 2: Forecast */}
                <div className="flex flex-col gap-4">
                   <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 shadow-sm flex-1 flex flex-col">
                      <h3 className="text-sm font-semibold text-slate-200 mb-2 flex items-center gap-2">
                         <Activity size={16} className="text-indigo-500" /> Forecast
                      </h3>
                      <div className="h-[160px] lg:h-auto lg:flex-1 w-full min-h-[160px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={projectionData} margin={{top: 10, right: 0, left: 0, bottom: 0}}>
                             <defs>
                                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                             </defs>
                             <CartesianGrid stroke="#334155" vertical={false} opacity={0.3} />
                             <XAxis dataKey="name" hide />
                             <YAxis hide domain={['dataMin', 'dataMax']} />
                             <Tooltip 
                                contentStyle={{background:'#0f172a', border:'1px solid #334155', borderRadius:'8px', fontSize:'12px'}} 
                                itemStyle={{color:'#e2e8f0'}}
                                labelStyle={{color:'#94a3b8'}}
                             />
                             <Area type="monotone" dataKey="forecast" stroke="#6366f1" strokeWidth={3} fill="url(#colorForecast)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-between items-end mt-2">
                         <div>
                            <span className="text-xs text-slate-500">Proj. Annual</span>
                            <div className="text-lg font-mono font-bold text-white">${(metrics.totalIncome / (transactions.length||1) * 12).toLocaleString(undefined, {maximumFractionDigits:0})}</div>
                         </div>
                         <div className="text-right">
                            <span className="text-xs text-slate-500">Growth</span>
                            <div className="text-sm font-mono text-emerald-400">+12.5%</div>
                         </div>
                      </div>
                   </div>

                   <div className="bg-slate-800/50 rounded-xl border border-slate-700 p-4 flex justify-between items-center">
                      <div>
                        <div className="text-xs text-slate-500 uppercase">Pending Deals</div>
                        <div className="text-xl font-mono font-bold text-amber-400">${metrics.pendingCommissions.toLocaleString()}</div>
                      </div>
                      <Building className="text-amber-500/20" size={32} />
                   </div>
                </div>

             </div>
          </div>
          
          {/* Main Spreadsheet */}
          <div className="flex-1 min-h-[500px] p-4 lg:p-6 bg-slate-900">
             <div className="h-full flex flex-col">
                <div className="mb-3 flex items-center justify-between">
                   <h2 className="text-lg font-bold text-white flex items-center gap-2">
                     <Table size={18} className="text-emerald-500"/> Master Ledger
                   </h2>
                   <div className="text-xs text-slate-500 hidden sm:block bg-slate-800 px-2 py-1 rounded border border-slate-700">
                      Real-time sync enabled
                   </div>
                </div>
                <div className="flex-1 shadow-2xl rounded-xl overflow-hidden border border-slate-700 flex flex-col">
                   <PortfolioGrid transactions={transactions} setTransactions={setTransactions} />
                </div>
             </div>
          </div>

        </main>
      </div>
    </div>
  );
}