import React, { useState } from 'react';
import { Target, Calendar, TrendingUp, Settings, TrendingDown, Percent, DollarSign, Calculator, Info } from 'lucide-react';
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

const SummaryCard = ({ title, summary, target }: { title: string, summary: DateSummary, target?: number }) => (
  <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 transition-all hover:border-slate-500">
    <h4 className="text-slate-400 text-xs uppercase tracking-wider mb-3 font-semibold flex items-center justify-between">
      <span className="flex items-center gap-2"><Calendar size={12} /> {title}</span>
      {target && <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">Target Active</span>}
    </h4>
    <div className="space-y-2">
       <div className="flex justify-between items-center text-sm">
         <span className="text-slate-400">Income</span>
         <span className="text-emerald-400 font-mono">${summary.income.toLocaleString()}</span>
       </div>
       <div className="flex justify-between items-center text-sm">
         <span className="text-slate-400">Spending</span>
         <span className="text-rose-400 font-mono">${summary.expense.toLocaleString()}</span>
       </div>
       {summary.withdrawal > 0 && (
          <div className="flex justify-between items-center text-sm">
           <span className="text-slate-400">Withdrawn</span>
           <span className="text-purple-400 font-mono">${summary.withdrawal.toLocaleString()}</span>
         </div>
       )}
       <div className="h-px bg-slate-600 my-2"></div>
       <div className="flex justify-between items-center">
         <span className="text-slate-200 font-medium">Net Flow</span>
         <span className={`font-mono font-bold ${summary.net >= 0 ? 'text-indigo-400' : 'text-rose-400'}`}>
           {summary.net >= 0 ? '+' : ''}${summary.net.toLocaleString()}
         </span>
       </div>

       {/* Monthly Target Integration */}
       {target && (
         <div className="pt-3 mt-2 border-t border-slate-600/50">
            <div className="flex justify-between items-end mb-1.5">
               <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                 <Target size={10} /> Monthly Goal
               </span>
               <span className="text-[10px] text-white font-mono">${target.toLocaleString()}</span>
            </div>
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-700">
               <div 
                 className="bg-emerald-500 h-full rounded-full transition-all duration-1000" 
                 style={{ width: `${Math.min((summary.income / target) * 100, 100)}%` }}
               ></div>
            </div>
            <div className="text-right mt-1">
               <span className="text-[10px] text-emerald-400 font-medium">{Math.round((summary.income / target) * 100)}% Achieved</span>
            </div>
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

  const handleChange = (key: keyof GlobalSettings, value: number) => {
    onSettingsChange({ ...settings, [key]: value });
  };

  // Simple projection based on current month * 12
  const projectedAnnualNet = summaries.month.net * 12;
  const projectedWealth10Y = Array.from({length: 10}).reduce<number>((acc) => {
    // Basic compound interest calc using settings
    const afterTax = (acc + projectedAnnualNet) * (1 - settings.taxRate/100);
    const growth = afterTax * (1 + settings.reinvestmentRate/100 * 0.07); // Assume 7% market return on reinvested portion
    const inflationAdj = growth / (1 + settings.inflationRate/100);
    return inflationAdj;
  }, 0);

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

      <div className="flex-1 overflow-y-auto p-6 scroll-smooth">
        {activeTab === 'insights' ? (
          <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
            <div className="text-sm text-slate-400 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Breakdown
            </div>
            
            <SummaryCard title="Today" summary={summaries.day} />
            <SummaryCard title="This Week" summary={summaries.week} />
            <SummaryCard title="This Month" summary={summaries.month} target={20000} />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            
            {/* Mini Calculator Display */}
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900 border border-indigo-500/30 p-4 rounded-lg shadow-inner">
               <div className="flex items-center gap-2 text-indigo-300 mb-2">
                 <Calculator size={14} />
                 <span className="text-xs font-bold uppercase tracking-wider">Wealth Projection (10y)</span>
               </div>
               <div className="text-3xl font-mono font-bold text-white tracking-tight">
                 ${Math.round(projectedWealth10Y).toLocaleString()}
               </div>
               <div className="mt-3 flex items-start gap-2 p-2 bg-indigo-500/10 rounded text-[10px] text-indigo-200 border border-indigo-500/20">
                 <Info size={12} className="mt-0.5 flex-shrink-0" />
                 <p className="leading-relaxed">
                   Projected value of invested savings over 10 years, assuming a 7% market return compounded annually, adjusted for your selected inflation rate.
                 </p>
               </div>
            </div>

            <div className="space-y-6">
                {/* Reinvestment */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center">
                      <TrendingUp size={16} className="text-emerald-500 mr-2" /> 
                      Savings Rate
                      <Tooltip text="The percentage of your post-tax net income that you reinvest into the business or personal savings accounts for growth." />
                    </label>
                    <span className="text-emerald-400 font-mono font-bold bg-emerald-500/10 px-2 py-0.5 rounded text-xs">{settings.reinvestmentRate}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={settings.reinvestmentRate}
                    onChange={(e) => handleChange('reinvestmentRate', Number(e.target.value))}
                    className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-500 hover:accent-emerald-400 transition-all"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Spend All)</span>
                    <span>100% (Save All)</span>
                  </div>
                </div>

                {/* Inflation */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center">
                      <TrendingDown size={16} className="text-rose-500 mr-2" /> 
                      Inflation Rate
                      <Tooltip text="The estimated annual rate at which purchasing power declines. This adjusts your future expense projections upwards." />
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
                   <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0%</span>
                    <span>10% (High)</span>
                  </div>
                </div>

                {/* Tax Rate */}
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-300 flex items-center">
                      <Percent size={16} className="text-amber-500 mr-2" /> 
                      Effective Tax Rate
                      <Tooltip text="The estimated percentage of your gross profit reserved for taxes. Adjusts your 'Net Income' and 'Pending' values." />
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
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                    <span>0% (Tax Free)</span>
                    <span>50% (Heavy)</span>
                  </div>
                </div>

                {/* Withdrawals */}
                <div className="space-y-3 pt-4 border-t border-slate-700">
                   <label className="text-sm font-medium text-slate-300 flex items-center mb-2">
                      <DollarSign size={16} className="text-indigo-500 mr-2" /> 
                      Annual Owner's Draw
                      <Tooltip text="A fixed salary amount you plan to withdraw from the business annually, regardless of performance." />
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