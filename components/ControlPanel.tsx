import React, { useState } from 'react';
import { Target, Calendar, TrendingUp, Settings, TrendingDown, Percent, DollarSign, Calculator, Info, PiggyBank, Briefcase } from 'lucide-react';
import { DateSummary, GlobalSettings } from '../types';

interface Props {
  summaries: {
    day: DateSummary;
    week: DateSummary;
    month: DateSummary;
  };
  settings: GlobalSettings;
  onSettingsChange: (newSettings: GlobalSettings) => void;
}

const SummaryCard = ({ title, summary, target, goalType }: { title: string, summary: DateSummary, target?: number, goalType?: 'revenue' | 'savings' }) => (
  <div className="bg-slate-700/50 rounded-lg p-3 border border-slate-600 transition-all hover:border-slate-500">
    <h4 className="text-slate-400 text-[10px] uppercase tracking-wider mb-2 font-semibold flex items-center justify-between">
      <span className="flex items-center gap-1.5"><Calendar size={10} /> {title}</span>
      {target && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20">Target Active</span>}
    </h4>
    <div className="space-y-1.5">
       <div className="flex justify-between items-center text-xs">
         <span className="text-slate-400">Income</span>
         <span className="text-emerald-400 font-mono">${summary.income.toLocaleString()}</span>
       </div>
       <div className="flex justify-between items-center text-xs">
         <span className="text-slate-400">Spending</span>
         <span className="text-rose-400 font-mono">${summary.expense.toLocaleString()}</span>
       </div>
       {summary.withdrawal > 0 && (
          <div className="flex justify-between items-center text-xs">
           <span className="text-slate-400">Withdrawn</span>
           <span className="text-purple-400 font-mono">${summary.withdrawal.toLocaleString()}</span>
         </div>
       )}
       {summary.saving > 0 && (
          <div className="flex justify-between items-center text-xs">
           <span className="text-slate-400">Saved</span>
           <span className="text-cyan-400 font-mono">${summary.saving.toLocaleString()}</span>
         </div>
       )}
       <div className="h-px bg-slate-600 my-1.5"></div>
       <div className="flex justify-between items-center">
         <span className="text-slate-200 text-xs font-medium">Net Flow</span>
         <span className={`font-mono text-sm font-bold ${summary.net >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
           {summary.net >= 0 ? '+' : ''}${summary.net.toLocaleString()}
         </span>
       </div>

       {/* Monthly Target Integration */}
       {target && (
         <div className="pt-2 mt-1 border-t border-slate-600/50">
            <div className="flex justify-between items-end mb-1">
               <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                 <Target size={10} /> {goalType === 'savings' ? 'Savings Goal' : 'Revenue Goal'}
               </span>
               <span className="text-[9px] text-white font-mono">${target.toLocaleString()}</span>
            </div>
            {goalType === 'revenue' ? (
                <>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                     <div 
                       className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                       style={{ width: `${Math.min((summary.income / target) * 100, 100)}%` }}
                     ></div>
                  </div>
                  <div className="text-right mt-1">
                     <span className="text-[9px] text-emerald-400 font-medium">{Math.round((summary.income / target) * 100)}% Achieved</span>
                  </div>
                </>
            ) : (
                <>
                  <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-700">
                     <div 
                       className="bg-cyan-500 h-full rounded-full transition-all duration-1000" 
                       style={{ width: `${Math.min((summary.saving / target) * 100, 100)}%` }}
                     ></div>
                  </div>
                  <div className="text-right mt-1">
                     <span className="text-[9px] text-cyan-400 font-medium">{Math.round((summary.saving / target) * 100)}% Saved</span>
                  </div>
                </>
            )}
         </div>
       )}
    </div>
  </div>
);

const Tooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-block ml-2">
    <Info size={14} className="text-slate-500 hover:text-indigo-400 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-slate-950/95 backdrop-blur border border-slate-700 rounded-lg text-xs text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
      {text}
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-950 border-r border-b border-slate-700 transform rotate-45"></div>
    </div>
  </div>
);

const ControlPanel: React.FC<Props> = ({ summaries, settings, onSettingsChange }) => {
  const [activeTab, setActiveTab] = useState<'insights' | 'scenarios'>('insights');

  const handleChange = (key: keyof GlobalSettings, value: any) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Simple projection based on current month * 12
  const projectedAnnualNet = summaries.month.net * 12;
  const currentNet = Math.max(projectedAnnualNet, 0); // avoid compounding debt
  
  // 10 Year Wealth Calculation
  // We assume monthly contribution = current month net
  // This calculates future value of a series (FV) + future value of current savings (not tracked here, assuming 0 start for simplicity or just flow)
  const annualContribution = currentNet;
  const r = settings.reinvestmentRate / 100; // Simplified return rate of portfolio (e.g., 7% market) * reinvestment %
  const marketReturn = 0.08; // Fixed assumption for "market"
  const effectiveRate = marketReturn; 
  
  // FV of annuity formula: P * (((1+r)^n - 1) / r)
  // But adjusted for tax and inflation in the UI
  const years = 10;
  // Let's do a simple accumulation loop
  let totalWealth = 0;
  for(let i=1; i<=years; i++) {
     const yearlyGrowth = totalWealth * effectiveRate;
     const yearlyContribution = annualContribution; // Assuming constant income
     const taxHit = (yearlyGrowth + yearlyContribution) * (settings.taxRate / 100);
     totalWealth = totalWealth + yearlyGrowth + yearlyContribution - taxHit;
     // Apply annual withdrawal
     totalWealth -= settings.annualWithdrawal;
  }
  
  // Adjust final for inflation purchasing power
  const inflationAdjWealth = totalWealth / Math.pow(1 + (settings.inflationRate/100), years);

  return (
    <div className="bg-slate-800 border-l border-slate-700 h-full flex flex-col text-slate-200">
      
      {/* Sidebar Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-900/50">
        <button
          onClick={() => setActiveTab('insights')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'insights' 
              ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-400' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <TrendingUp size={14} /> Insights
        </button>
        <button
          onClick={() => setActiveTab('scenarios')}
          className={`flex-1 py-3 text-xs font-semibold uppercase tracking-wide flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'scenarios' 
              ? 'bg-slate-800 text-indigo-400 border-b-2 border-indigo-400' 
              : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
          }`}
        >
          <Settings size={14} /> Scenarios
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 scroll-smooth">
        {activeTab === 'insights' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Performance
            </div>
            
            <SummaryCard title="Today" summary={summaries.day} />
            <SummaryCard title="This Week" summary={summaries.week} />
            <SummaryCard title="This Month" summary={summaries.month} target={settings.monthlyRevenueGoal} goalType={settings.goalType} />
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* The "Missing One" - Scenario Result */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 p-4 rounded-xl border border-indigo-500/30 shadow-lg">
                <div className="flex items-center gap-2 mb-3 text-indigo-300 text-xs font-bold uppercase tracking-wider">
                   <Briefcase size={14} /> Future Wealth (10Y)
                </div>
                <div className="text-2xl font-bold text-white font-mono tracking-tight">
                   ${Math.max(0, Math.round(inflationAdjWealth)).toLocaleString()}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 flex justify-between">
                   <span>Purchasing Power (Adj. Inflation)</span>
                   <span className="text-indigo-400">Est.</span>
                </div>
            </div>

            {/* Goal Setting */}
            <div className="space-y-3 pb-4 border-b border-slate-700">
                <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-white flex items-center">
                      <Target size={16} className="text-cyan-400 mr-2" /> 
                      Monthly Goal
                    </label>
                </div>
                
                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-700">
                   <button 
                     onClick={() => handleChange('goalType', 'revenue')}
                     className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all ${settings.goalType === 'revenue' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Revenue
                   </button>
                   <button 
                     onClick={() => handleChange('goalType', 'savings')}
                     className={`flex-1 py-1.5 text-[10px] uppercase font-bold rounded transition-all ${settings.goalType === 'savings' ? 'bg-cyan-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}
                   >
                     Savings
                   </button>
                </div>

                <div className="relative group">
                   <span className="absolute left-3 top-2.5 text-slate-500">$</span>
                   <input
                     type="number"
                     value={settings.monthlyRevenueGoal}
                     onChange={(e) => handleChange('monthlyRevenueGoal', Number(e.target.value))}
                     className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 pl-7 text-sm text-white focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500 outline-none"
                   />
                </div>
            </div>

            <div className="space-y-6">
                {/* Inflation */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center">
                      <TrendingDown size={16} className="text-rose-500 mr-2" /> 
                      Inflation
                    </label>
                    <span className="text-rose-400 font-mono font-bold bg-rose-500/10 px-2 py-0.5 rounded text-xs">{settings.inflationRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="10"
                    step="0.1"
                    value={settings.inflationRate}
                    onChange={(e) => handleChange('inflationRate', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:accent-rose-400 transition-all"
                  />
                </div>

                {/* Tax Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center">
                      <Percent size={16} className="text-amber-500 mr-2" /> 
                      Tax Rate
                    </label>
                    <span className="text-amber-400 font-mono font-bold bg-amber-500/10 px-2 py-0.5 rounded text-xs">{settings.taxRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="50"
                    step="1"
                    value={settings.taxRate}
                    onChange={(e) => handleChange('taxRate', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500 hover:accent-amber-400 transition-all"
                  />
                </div>

                {/* Withdrawals */}
                <div className="space-y-3 pt-4 border-t border-slate-700">
                   <label className="text-sm font-medium text-slate-300 flex items-center mb-2">
                      <DollarSign size={16} className="text-indigo-500 mr-2" /> 
                      Annual Draw
                    </label>
                    <div className="relative group">
                      <span className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-indigo-400 transition-colors">$</span>
                      <input
                        type="number"
                        value={settings.annualWithdrawal}
                        onChange={(e) => handleChange('annualWithdrawal', Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 pl-7 text-sm text-white focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all placeholder-slate-600 shadow-sm"
                        placeholder="0"
                      />
                    </div>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ControlPanel;