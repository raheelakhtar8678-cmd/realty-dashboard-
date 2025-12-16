import React, { useState, useEffect } from 'react';
import { StorageService } from '../services/storage';
import { Lock, Mail, ShieldCheck, ArrowRight, AlertCircle, Home, RefreshCw, Cloud, CloudOff } from 'lucide-react';

interface Props {
  onLogin: (email: string) => void;
}

export default function AuthScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    confirmPassword: ''
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
                 <span className={`flex items-center gap-1.5 text-[10px] px-3 py-1 rounded-full border ${StorageService.isOnline() ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-slate-800 border-slate-700 text-slate-500'}`}>
                   {StorageService.isOnline() ? (
                     <><Cloud size={10} className="text-emerald-500"/> Cloud Sync Active</>
                   ) : (
                     <><CloudOff size={10} className="text-amber-500"/> Offline Mode (Local Only)</>
                   )}
                 </span>
               </div>
               
               {!StorageService.isOnline() && (
                 <p className="text-[10px] text-slate-500 text-center mx-auto max-w-[280px] leading-relaxed">
                   <AlertCircle size={10} className="inline mr-1 text-slate-400"/>
                   Your data is currently saved to <strong>this browser only</strong>. 
                   To sync between mobile and desktop, you must configure your Supabase connection keys.
                 </p>
               )}
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}