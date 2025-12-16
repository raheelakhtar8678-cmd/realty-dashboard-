import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { resetSupabaseConfig } from '../services/supabaseClient';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Home, RefreshCw, Cloud, CloudOff, Database, Key, Terminal, Check, Copy } from 'lucide-react';

interface Props {
  onLogin: (email: string) => void;
}

export default function AuthScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [showSetup, setShowSetup] = useState(false);
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: ''
  });
  
  const [setupData, setSetupData] = useState({
      url: localStorage.getItem('MANUAL_SUPABASE_URL') || '',
      key: localStorage.getItem('MANUAL_SUPABASE_KEY') || ''
  });

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      if (mode === 'login') {
        const result = await StorageService.login(formData.email, formData.password);
        if (result.success) {
          onLogin(formData.email);
        } else {
          setError(result.message || 'Invalid credentials');
        }
      } 
      else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters");
          setIsLoading(false);
          return;
        }

        const result = await StorageService.register(formData.email, formData.password);
        if (result.success) {
          setSuccessMsg('Account created! Logging you in...');
          setTimeout(() => {
             onLogin(formData.email);
          }, 1500);
        } else {
          setError(result.message || 'Registration failed');
        }
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveConnection = () => {
      localStorage.setItem('MANUAL_SUPABASE_URL', setupData.url.trim());
      localStorage.setItem('MANUAL_SUPABASE_KEY', setupData.key.trim());
      window.location.reload();
  };

  const copySQL = () => {
      const sql = `
-- 1. Create Data Table
create table if not exists user_data (
  user_id uuid references auth.users not null primary key,
  content jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Enable Security
alter table user_data enable row level security;

-- 3. Add Policies (Access Control)
create policy "Users can read own data" on user_data for select using (auth.uid() = user_id);
create policy "Users can insert own data" on user_data for insert with check (auth.uid() = user_id);
create policy "Users can update own data" on user_data for update using (auth.uid() = user_id);
      `;
      navigator.clipboard.writeText(sql);
      alert("SQL Copied to clipboard! Paste this in Supabase SQL Editor.");
  };

  if (showSetup) {
      return (
          <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
              <div className="max-w-2xl w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-950/50">
                      <h2 className="text-lg font-bold text-white flex items-center gap-2">
                          <Database className="text-emerald-500" size={20}/> Setup Cloud Database
                      </h2>
                      <button onClick={() => setShowSetup(false)} className="text-slate-400 hover:text-white"><CloudOff size={20}/></button>
                  </div>
                  <div className="p-6 space-y-6">
                      
                      {/* Step 1: SQL */}
                      <div className="space-y-3">
                          <div className="flex items-center justify-between">
                             <h3 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                                <Terminal size={16}/> Step 1: Initialize Database
                             </h3>
                             <button onClick={copySQL} className="text-xs flex items-center gap-1 text-slate-400 hover:text-white bg-slate-700 px-2 py-1 rounded">
                                <Copy size={12}/> Copy SQL
                             </button>
                          </div>
                          <div className="bg-slate-950 p-4 rounded-lg border border-slate-700 text-xs font-mono text-slate-300 overflow-x-auto">
                              <pre>{`-- Run this in Supabase SQL Editor
create table if not exists user_data (
  user_id uuid references auth.users not null primary key,
  content jsonb,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table user_data enable row level security;

create policy "Users can read own data" on user_data for select using (auth.uid() = user_id);
create policy "Users can insert own data" on user_data for insert with check (auth.uid() = user_id);
create policy "Users can update own data" on user_data for update using (auth.uid() = user_id);`}</pre>
                          </div>
                          <p className="text-[10px] text-slate-500">
                             Go to your Supabase Project &gt; SQL Editor &gt; New Query &gt; Paste & Run.
                          </p>
                      </div>

                      {/* Step 2: Keys */}
                      <div className="space-y-3 pt-4 border-t border-slate-700">
                          <h3 className="text-sm font-semibold text-indigo-400 uppercase tracking-wider flex items-center gap-2">
                                <Key size={16}/> Step 2: Connect App
                          </h3>
                          <p className="text-xs text-slate-400">
                              Enter your project credentials found in Project Settings &gt; API.
                          </p>
                          <div className="grid gap-4">
                              <div>
                                  <label className="text-xs font-bold text-slate-500 mb-1 block">Project URL</label>
                                  <input 
                                    type="text" 
                                    placeholder="https://xyz.supabase.co"
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                                    value={setupData.url}
                                    onChange={e => setSetupData({...setupData, url: e.target.value})}
                                  />
                              </div>
                              <div>
                                  <label className="text-xs font-bold text-slate-500 mb-1 block">Anon Key (Public)</label>
                                  <input 
                                    type="password" 
                                    placeholder="eyJh..."
                                    className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-2 text-white text-sm"
                                    value={setupData.key}
                                    onChange={e => setSetupData({...setupData, key: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>

                      <div className="pt-4 flex justify-end gap-3">
                          <button onClick={() => setShowSetup(false)} className="px-4 py-2 text-sm text-slate-400 hover:text-white">Cancel</button>
                          <button 
                            onClick={saveConnection}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-lg shadow-emerald-900/20 flex items-center gap-2"
                          >
                             <Check size={16} /> Save & Connect
                          </button>
                      </div>

                  </div>
              </div>
          </div>
      );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-md w-full bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 overflow-hidden relative z-10">
        
        {/* Header */}
        <div className="bg-slate-900/80 p-8 text-center border-b border-slate-700 backdrop-blur-sm">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-emerald-900/20 group">
            <Home className="text-white group-hover:scale-110 transition-transform" size={24} />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Realty<span className="text-emerald-400 font-light">Dash</span></h1>
          <p className="text-slate-400 text-sm mt-2 flex items-center justify-center gap-1">
            <ShieldCheck size={12} className="text-emerald-500"/> Professional Cloud Portal
          </p>
        </div>

        {/* Form */}
        <div className="p-8">
          <div className="flex gap-4 mb-6 bg-slate-900/50 p-1 rounded-lg">
             <button 
               onClick={() => setMode('login')}
               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'login' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
               Login
             </button>
             <button 
               onClick={() => setMode('register')}
               className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${mode === 'register' ? 'bg-slate-700 text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
             >
               Register
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <Mail className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="email" 
                  required
                  placeholder="name@agency.com"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <Lock className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Confirm Password</label>
                <div className="relative group">
                  <ShieldCheck className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                  <input 
                    type="password" 
                    required
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  />
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs animate-in slide-in-from-top-1">
                <AlertCircle size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <ShieldCheck size={16} /> Success
                </div>
                {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16}/> Processing...</span>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            
            <div className="mt-6 border-t border-slate-700/50 pt-4 w-full">
               <div className="flex justify-center mb-2">
                 <button
                   type="button" 
                   onClick={() => setShowSetup(true)}
                   className={`flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border transition-all hover:scale-105 active:scale-95 ${StorageService.isOnline() ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500 hover:text-white'}`}
                  >
                   {StorageService.isOnline() ? (
                     <><Cloud size={10} className="text-emerald-500"/> Cloud Sync Active (Click to Config)</>
                   ) : (
                     <><CloudOff size={10} className="text-amber-500"/> Offline Mode • Connect Cloud</>
                   )}
                 </button>
               </div>
               
               {!StorageService.isOnline() && (
                 <p className="text-[10px] text-slate-500 text-center mx-auto max-w-[280px] leading-relaxed">
                   Data is currently local. Click "Connect Cloud" above to setup database for mobile sync.
                 </p>
               )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}