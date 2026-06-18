import React, { useState } from 'react';
import { AppView } from '../types';
import { 
  Activity, 
  Mail, 
  Lock, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (doctorData: any) => void;
  onNavigate: (view: AppView) => void;
}

export default function LoginView({ onLoginSuccess, onNavigate }: LoginViewProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;

    setError(null);
    setLoading(true);

    // 1. Local Development Fallback Bypass
    if (email.trim().toLowerCase() === 'test@clinic.com' && password === 'password') {
      console.log('[Login View] Logging in using local developer fallback credentials.');
      setTimeout(() => {
        const mockDoctor = {
          _id: 'mock-doctor-id-999',
          name: "Dr. Anistina D'Souza",
          email: 'test@clinic.com',
          specialization: 'Pediatrics',
          token: 'mock-developer-jwt-token'
        };
        localStorage.setItem('doctorToken', mockDoctor.token);
        onLoginSuccess(mockDoctor);
        setLoading(false);
      }, 800);
      return;
    }

    // 2. Live API server login call
    try {
      const serverUrl = 'http://localhost:5000/api/auth/login';
      const response = await fetch(serverUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.trim(), password })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        console.log('[Login View] Server login successful!');
        localStorage.setItem('doctorToken', json.data.token);
        onLoginSuccess(json.data);
      } else {
        setError(json.message || 'Invalid email or password credentials');
      }
    } catch (err: any) {
      console.warn(`[Login View] Server connection failed: ${err.message}. Showing local offline suggestion.`);
      setError('Connection to backend server failed. (Use test@clinic.com / password to bypass locally)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-center items-center p-6 relative font-sans select-none">
      
      {/* Background Neon Glowing Radials */}
      <div className="absolute top-[-20%] left-[-20%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[50vw] h-[50vw] rounded-full bg-secondary/5 blur-[100px] pointer-events-none" />

      {/* Back Button */}
      <button 
        onClick={() => onNavigate('Landing')}
        className="absolute top-8 left-8 flex items-center gap-2 text-xs font-bold text-outline hover:text-white uppercase transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Home</span>
      </button>

      {/* Login Card Canvas */}
      <main className="w-full max-w-md glass-panel rounded-3xl p-8 border border-white/5 shadow-2xl relative overflow-hidden animate-in fade-in duration-500">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
        
        {/* Brand Header */}
        <header className="flex flex-col items-center gap-4 text-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black tracking-tight">Clinician Console</h2>
            <p className="text-outline text-xs leading-relaxed max-w-[280px]">
              Access the AI-triage patient priority list and consultation dashboards.
            </p>
          </div>
        </header>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 text-xs leading-normal animate-in slide-in-from-top duration-300">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Email input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-outline font-semibold">Email Address</label>
            <div className="relative flex items-center">
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="e.g. nurse@clinic.com"
                className="w-full bg-surface-container-highest/20 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                required
                disabled={loading}
              />
              <Mail className="w-4 h-4 text-outline/50 absolute left-4 pointer-events-none" />
            </div>
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-outline font-semibold">Password</label>
            <div className="relative flex items-center">
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface-container-highest/20 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                required
                disabled={loading}
              />
              <Lock className="w-4 h-4 text-outline/50 absolute left-4 pointer-events-none" />
            </div>
          </div>

          {/* Helper caption */}
          <p className="text-[10px] text-outline/70 leading-normal text-center mt-1">
            Tip: You can use **`test@clinic.com`** and password **`password`** to bypass credentials offline during local development.
          </p>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading || !email.trim() || !password}
            className="mt-4 w-full bg-primary text-on-primary py-4 rounded-xl font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Verifying Credentials...' : 'Sign In'}</span>
            {!loading && <ArrowRight className="w-4 h-4" />}
          </button>
        </form>
      </main>

    </div>
  );
}
