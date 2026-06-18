import React, { useState } from 'react';
import { AppView } from '../types';
import { 
  Activity, 
  Mail, 
  Lock, 
  ArrowLeft, 
  ArrowRight,
  ShieldAlert,
  User,
  Phone,
  Hash
} from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (userData: any) => void;
  onNavigate: (view: AppView) => void;
}

export default function LoginView({ onLoginSuccess, onNavigate }: LoginViewProps) {
  const [role, setRole] = useState<'patient' | 'doctor' | 'admin'>('doctor');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [tokenNumber, setTokenNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // 1. Local Development Offline Bypass Logic
    if (role === 'doctor' && email.trim().toLowerCase() === 'test@clinic.com' && password === 'password') {
      console.log('[Login View] Logging in using local developer Doctor credentials.');
      setTimeout(() => {
        const mockDoctor = {
          _id: 'mock-doctor-id-999',
          name: "Dr. Anistina D'Souza",
          email: 'test@clinic.com',
          specialization: 'Pediatrics',
          role: 'doctor',
          token: 'mock-developer-jwt-token-doctor'
        };
        localStorage.setItem('doctorToken', mockDoctor.token);
        onLoginSuccess(mockDoctor);
        setLoading(false);
      }, 600);
      return;
    }

    if (role === 'admin' && email.trim().toLowerCase() === 'admin@clinic.com' && password === 'password') {
      console.log('[Login View] Logging in using local developer Admin credentials.');
      setTimeout(() => {
        const mockAdmin = {
          _id: 'mock-admin-id-999',
          name: 'System Admin',
          email: 'admin@clinic.com',
          specialization: 'Operations',
          role: 'admin',
          token: 'mock-developer-jwt-token-admin'
        };
        localStorage.setItem('doctorToken', mockAdmin.token);
        onLoginSuccess(mockAdmin);
        setLoading(false);
      }, 600);
      return;
    }

    if (role === 'patient' && (tokenNumber.trim().toUpperCase() === 'Q-111' || contactNumber.trim() === '111')) {
      console.log('[Login View] Logging in using local developer Patient credentials.');
      setTimeout(() => {
        const mockPatient = {
          _id: 'mock-patient-id-111',
          name: 'Mock Patient User',
          age: 40,
          gender: 'Female',
          contactNumber: '+919999911111',
          role: 'patient',
          tokenNumber: 'Q-111',
          token: 'mock-developer-jwt-token-patient'
        };
        localStorage.setItem('doctorToken', mockPatient.token);
        onLoginSuccess(mockPatient);
        setLoading(false);
      }, 600);
      return;
    }

    // 2. Live REST API Calls
    try {
      let response;
      let bodyData = {};

      if (role === 'patient') {
        const serverUrl = 'http://localhost:5000/api/auth/patient/login';
        bodyData = tokenNumber.trim() ? { tokenNumber: tokenNumber.trim() } : { contactNumber: contactNumber.trim() };
        response = await fetch(serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      } else {
        const serverUrl = 'http://localhost:5000/api/auth/login';
        bodyData = { email: email.trim(), password, role };
        response = await fetch(serverUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(bodyData)
        });
      }

      const json = await response.json();

      if (response.ok && json.success) {
        console.log(`[Login View] Server login successful for role: ${role}`);
        localStorage.setItem('doctorToken', json.data.token);
        onLoginSuccess(json.data);
      } else {
        setError(json.message || 'Authentication credentials rejected.');
      }
    } catch (err: any) {
      console.warn(`[Login View] Server connection failed: ${err.message}. Showing local bypass tip.`);
      if (role === 'patient') {
        setError('Server connection failed. (Type Q-111 or contact 111 to bypass offline)');
      } else if (role === 'admin') {
        setError('Server connection failed. (Use admin@clinic.com / password to bypass offline)');
      } else {
        setError('Server connection failed. (Use test@clinic.com / password to bypass offline)');
      }
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
        <header className="flex flex-col items-center gap-4 text-center mb-6">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1">
            <h2 className="text-2xl font-black tracking-tight">ClinicQueue Login</h2>
            <p className="text-outline text-xs leading-relaxed max-w-[280px]">
              Secure gateway for patients, clinical doctors, and operations administrators.
            </p>
          </div>
        </header>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 bg-surface-container-high/30 p-1.5 rounded-xl border border-white/5 mb-6">
          {(['patient', 'doctor', 'admin'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => {
                setRole(r);
                setError(null);
              }}
              className={`py-2 text-xs font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${role === r ? 'bg-primary/25 text-primary font-black border border-primary/20 shadow-md' : 'text-outline hover:text-on-surface'}`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Error Alert Box */}
        {error && (
          <div className="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 text-error flex items-start gap-3 text-xs leading-normal animate-in slide-in-from-top duration-300">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Input Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {role === 'patient' ? (
            <>
              {/* Patient Token input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-outline font-semibold">Triage Token ID</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={tokenNumber}
                    onChange={e => {
                      setTokenNumber(e.target.value);
                      if (e.target.value) setContactNumber('');
                    }}
                    placeholder="e.g. Q-005 (or leave blank if using contact)"
                    className="w-full bg-surface-container-highest/20 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all font-mono uppercase"
                    disabled={loading}
                  />
                  <Hash className="w-4 h-4 text-outline/50 absolute left-4 pointer-events-none" />
                </div>
              </div>

              <div className="text-center text-[10px] text-outline/40 font-bold uppercase tracking-wider">
                — OR —
              </div>

              {/* Patient Contact number input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-outline font-semibold">Registered Contact Number</label>
                <div className="relative flex items-center">
                  <input 
                    type="text" 
                    value={contactNumber}
                    onChange={e => {
                      setContactNumber(e.target.value);
                      if (e.target.value) setTokenNumber('');
                    }}
                    placeholder="e.g. +919999900000"
                    className="w-full bg-surface-container-highest/20 border border-white/5 rounded-xl pl-11 pr-4 py-3.5 text-sm placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 outline-none transition-all"
                    disabled={loading}
                  />
                  <Phone className="w-4 h-4 text-outline/50 absolute left-4 pointer-events-none" />
                </div>
              </div>
            </>
          ) : (
            <>
              {/* Email input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs text-outline font-semibold">Email Address</label>
                <div className="relative flex items-center">
                  <input 
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={role === 'admin' ? "admin@clinic.com" : "doctor@clinic.com"}
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
            </>
          )}

          {/* Helper caption */}
          <p className="text-[10px] text-outline/70 leading-normal text-center mt-1">
            {role === 'patient' ? (
              <span>Tip: Enter token ID **`Q-111`** or contact **`111`** to bypass offline.</span>
            ) : role === 'admin' ? (
              <span>Tip: Use email **`admin@clinic.com`** and password **`password`** to bypass offline.</span>
            ) : (
              <span>Tip: Use email **`test@clinic.com`** and password **`password`** to bypass offline.</span>
            )}
          </p>

          {/* Submit Button */}
          <button 
            type="submit"
            disabled={loading || (role === 'patient' ? (!contactNumber.trim() && !tokenNumber.trim()) : (!email.trim() || !password))}
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
