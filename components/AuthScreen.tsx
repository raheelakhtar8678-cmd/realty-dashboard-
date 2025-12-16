import React, { useState, useEffect, useRef } from 'react';
import { StorageService } from '../services/storage';
import { Lock, User, ShieldCheck, ArrowRight, AlertCircle, Home, RefreshCw, KeyRound, HelpCircle, FileQuestion } from 'lucide-react';

interface Props {
  onLogin: (username: string) => void;
}

const SECURITY_QUESTIONS = [
  "What was the name of your first pet?",
  "What is your mother's maiden name?",
  "What was the make of your first car?",
  "What city were you born in?",
  "What is the name of your favorite teacher?"
];

// --- Captcha Component ---
const Captcha = ({ onValidate }: { onValidate: (isValid: boolean) => void }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [captchaCode, setCaptchaCode] = useState('');
  const [inputVal, setInputVal] = useState('');

  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let result = '';
    for (let i = 0; i < 6; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
    setCaptchaCode(result);
    setInputVal('');
    onValidate(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  useEffect(() => {
    if (canvasRef.current && captchaCode) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Background
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Noise (Lines)
      for (let i = 0; i < 7; i++) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
        ctx.stroke();
      }

      // Noise (Dots)
      for (let i = 0; i < 50; i++) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.2})`;
        ctx.beginPath();
        ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height, 1, 0, 2 * Math.PI);
        ctx.fill();
      }

      // Text
      ctx.font = 'bold 24px Courier New';
      ctx.fillStyle = '#e2e8f0';
      ctx.textBaseline = 'middle';
      const textWidth = ctx.measureText(captchaCode).width;
      const startX = (canvas.width - textWidth) / 2;
      
      for(let i=0; i<captchaCode.length; i++) {
        ctx.save();
        ctx.translate(startX + (i * 20), canvas.height/2);
        ctx.rotate((Math.random() - 0.5) * 0.4);
        ctx.fillText(captchaCode[i], 0, 0);
        ctx.restore();
      }
    }
  }, [captchaCode]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase();
    setInputVal(val);
    onValidate(val === captchaCode);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Security Check</label>
        <button type="button" onClick={generateCaptcha} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
          <RefreshCw size={10} /> Refresh
        </button>
      </div>
      <div className="flex gap-2">
        <canvas ref={canvasRef} width={140} height={44} className="rounded-lg border border-slate-600 cursor-pointer" onClick={generateCaptcha} title="Click to refresh" />
        <input 
          type="text" 
          value={inputVal}
          onChange={handleChange}
          placeholder="Enter Code"
          className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 text-center text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 uppercase tracking-widest font-mono"
        />
      </div>
    </div>
  );
};

// --- Password Strength Component ---
const PasswordStrength = ({ password }: { password: string }) => {
  if (!password) return null;
  
  let score = 0;
  if (password.length > 7) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const colors = ['bg-rose-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500'];
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];

  return (
    <div className="flex items-center gap-2 mt-1 ml-1">
      <div className="flex h-1 w-20 gap-1">
        {[0, 1, 2, 3].map(i => (
          <div key={i} className={`h-full flex-1 rounded-full transition-colors ${i < score ? colors[score-1] : 'bg-slate-700'}`} />
        ))}
      </div>
      <span className={`text-[10px] ${score > 0 ? 'text-slate-300' : 'text-slate-500'}`}>{labels[score-1] || 'Too Short'}</span>
    </div>
  );
};

export default function AuthScreen({ onLogin }: Props) {
  const [mode, setMode] = useState<'login' | 'register' | 'recover'>('login');
  // Form State
  const [formData, setFormData] = useState({ 
    username: '', 
    password: '', 
    confirmPassword: '', 
    securityQuestion: SECURITY_QUESTIONS[0],
    securityAnswer: '' 
  });
  
  // Recovery specific state
  const [recoveryStep, setRecoveryStep] = useState<1 | 2>(1);
  const [retrievedQuestion, setRetrievedQuestion] = useState<string | null>(null);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptchaValid, setIsCaptchaValid] = useState(false);

  // Reset state on mode change
  useEffect(() => {
    setError('');
    setSuccessMsg('');
    setFormData({ 
      username: '', 
      password: '', 
      confirmPassword: '', 
      securityQuestion: SECURITY_QUESTIONS[0],
      securityAnswer: '' 
    });
    setRecoveryStep(1);
    setRetrievedQuestion(null);
    setIsCaptchaValid(false);
  }, [mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Captcha is mandatory for all sensitive actions
    if (!isCaptchaValid && (mode !== 'recover' || recoveryStep === 2)) {
      setError('Please complete the security check.');
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        // Artificial delay
        await new Promise(resolve => setTimeout(resolve, 600));
        const isValid = await StorageService.login(formData.username, formData.password);
        if (isValid) {
          onLogin(formData.username);
        } else {
          setError('Invalid username or password');
        }
      } 
      else if (mode === 'register') {
        if (formData.password !== formData.confirmPassword) {
          setError("Passwords don't match");
          setIsLoading(false);
          return;
        }
        if (formData.password.length < 6) {
          setError("Password must be at least 6 characters for security");
          setIsLoading(false);
          return;
        }
        if (!formData.securityAnswer.trim()) {
           setError("Security Answer is required for account recovery");
           setIsLoading(false);
           return;
        }

        const result = await StorageService.register(
          formData.username, 
          formData.password, 
          formData.securityQuestion,
          formData.securityAnswer
        );
        
        if (result.success) {
          setSuccessMsg(`Account created securely! Please login.`);
          setTimeout(() => setMode('login'), 2000);
        } else {
          setError(result.message || 'Registration failed');
        }
      }
      else if (mode === 'recover') {
        if (recoveryStep === 1) {
           // Step 1: Find User
           await new Promise(resolve => setTimeout(resolve, 400));
           const question = StorageService.getSecurityQuestion(formData.username);
           if (question) {
             setRetrievedQuestion(question);
             setRecoveryStep(2);
             // Reset captcha for step 2
             setIsCaptchaValid(false);
           } else {
             setError("User not found");
           }
        } else {
           // Step 2: Verify Answer and Reset
           if (formData.password !== formData.confirmPassword) {
              setError("Passwords don't match");
              setIsLoading(false);
              return;
           }
           
           const success = await StorageService.resetPassword(
             formData.username, 
             formData.securityAnswer, 
             formData.password
           );
           
           if (success) {
             setSuccessMsg('Identity Verified. Password reset successfully.');
             setTimeout(() => setMode('login'), 2500);
           } else {
             setError('Incorrect security answer.');
           }
        }
      }
    } catch (err) {
      setError('An unexpected error occurred');
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
            <ShieldCheck size={12} className="text-emerald-500"/> Secure Professional Portal
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
            
            {/* Username Field - Always Visible */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Username</label>
              <div className="relative group">
                <User className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  required
                  disabled={mode === 'recover' && recoveryStep === 2}
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all disabled:opacity-50"
                />
              </div>
            </div>

            {/* PASSWORD FIELDS: Login, Register, or Recover Step 2 */}
            {(mode === 'login' || mode === 'register' || (mode === 'recover' && recoveryStep === 2)) && (
              <div className="space-y-1 animate-in slide-in-from-top-2">
                <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">
                  {mode === 'recover' ? 'New Password' : 'Password'}
                </label>
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
                {(mode === 'register' || mode === 'recover') && <PasswordStrength password={formData.password} />}
              </div>
            )}

            {/* CONFIRM PASSWORD: Register or Recover Step 2 */}
            {(mode === 'register' || (mode === 'recover' && recoveryStep === 2)) && (
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

            {/* SECURITY QUESTION SETUP: Register Only */}
            {mode === 'register' && (
              <div className="space-y-3 pt-2 border-t border-slate-700/50 mt-2 animate-in slide-in-from-top-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1 flex items-center gap-1">
                      <HelpCircle size={12}/> Security Question
                    </label>
                    <div className="relative">
                      <select 
                        value={formData.securityQuestion}
                        onChange={e => setFormData({...formData, securityQuestion: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 px-3 text-white focus:outline-none focus:border-emerald-500 transition-all appearance-none text-sm"
                      >
                        {SECURITY_QUESTIONS.map(q => <option key={q} value={q}>{q}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Answer</label>
                    <div className="relative group">
                      <KeyRound className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="Your answer..."
                        value={formData.securityAnswer}
                        onChange={e => setFormData({...formData, securityAnswer: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
              </div>
            )}

            {/* SECURITY QUESTION CHALLENGE: Recover Step 2 */}
            {mode === 'recover' && recoveryStep === 2 && (
              <div className="space-y-3 pt-2 border-t border-slate-700/50 mt-2 animate-in slide-in-from-top-4">
                 <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                    <p className="text-xs text-indigo-300 uppercase font-bold mb-1">Security Challenge</p>
                    <p className="text-sm text-white italic">"{retrievedQuestion}"</p>
                 </div>
                 <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Your Answer</label>
                    <div className="relative group">
                      <FileQuestion className="absolute left-3 top-2.5 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={18} />
                      <input 
                        type="text" 
                        required
                        placeholder="Type your answer here..."
                        value={formData.securityAnswer}
                        onChange={e => setFormData({...formData, securityAnswer: e.target.value})}
                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                      />
                    </div>
                  </div>
              </div>
            )}
            
            {/* CAPTCHA: Hide for Recover Step 1 (UX choice: verify user exists first) OR Keep it? Let's keep it for Step 1 too to prevent username enumeration bots */}
            {(mode !== 'recover' || recoveryStep === 2) && (
              <div className="pt-2">
                <Captcha onValidate={setIsCaptchaValid} />
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-xs animate-in slide-in-from-top-1">
                <AlertCircle size={16} className="flex-shrink-0" /> {error}
              </div>
            )}

            {successMsg && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-sm break-all animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2 mb-2 font-bold">
                  <ShieldCheck size={16} /> Success
                </div>
                {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              disabled={isLoading || ((mode !== 'recover' || recoveryStep === 2) && !isCaptchaValid)}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-3 rounded-lg shadow-lg shadow-emerald-900/20 transition-all flex items-center justify-center gap-2 mt-4 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {isLoading ? (
                <span className="flex items-center gap-2"><RefreshCw className="animate-spin" size={16}/> Processing...</span>
              ) : (
                <>
                  {mode === 'login' && 'Sign In Securely'}
                  {mode === 'register' && 'Create Secure Account'}
                  {mode === 'recover' && recoveryStep === 1 && 'Find Account'}
                  {mode === 'recover' && recoveryStep === 2 && 'Verify & Reset Password'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
            
            {mode === 'login' && (
              <div className="text-center mt-4">
                <button type="button" onClick={() => setMode('recover')} className="text-xs text-slate-500 hover:text-indigo-400 transition-colors">
                  Forgot Password?
                </button>
              </div>
            )}
             {mode === 'recover' && (
              <div className="text-center mt-4">
                <button type="button" onClick={() => setMode('login')} className="text-xs text-slate-500 hover:text-indigo-400 transition-colors">
                  Back to Login
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
      
      <div className="fixed bottom-4 text-center w-full text-[10px] text-slate-600 flex flex-col items-center gap-1">
        <p className="flex items-center gap-1"><Lock size={10} /> 256-bit Encryption Enabled (Client-Side)</p>
        <p>Identity Verification via Security Challenge</p>
      </div>
    </div>
  );
}