import React from 'react';
import { AppView } from '../types';
import { 
  Activity, 
  UserPlus, 
  MonitorPlay, 
  Stethoscope, 
  Cpu, 
  Clock, 
  MessageSquare, 
  ShieldAlert 
} from 'lucide-react';

interface LandingViewProps {
  onNavigate: (view: AppView) => void;
}

export default function LandingView({ onNavigate }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[#0b0f19] text-white overflow-hidden relative flex flex-col font-sans select-none">
      
      {/* Background Neon Glowing Radials */}
      <div className="absolute top-[-10%] left-[-20%] w-[60vw] h-[60vw] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-20%] w-[60vw] h-[60vw] rounded-full bg-secondary/5 blur-[120px] pointer-events-none" />

      {/* Main Header */}
      <header className="h-20 bg-[#0b0f19]/40 backdrop-blur-md border-b border-white/5 flex items-center justify-between px-6 md:px-12 shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-lg font-black tracking-tighter">ClinicQueue</span>
            <span className="text-[9px] font-black tracking-widest text-primary uppercase">Triage Platform</span>
          </div>
        </div>
        <div>
          <button 
            onClick={() => onNavigate('Login')}
            className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-bold tracking-wider uppercase transition-all cursor-pointer"
          >
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Content Canvas */}
      <main className="flex-1 max-w-6xl mx-auto px-6 pt-12 pb-20 flex flex-col items-center justify-center gap-12 z-10">
        
        {/* Title Brand Area */}
        <section className="text-center flex flex-col gap-4 max-w-3xl">
          <div className="inline-flex self-center items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold tracking-widest uppercase animate-pulse">
            <Cpu className="w-3.5 h-3.5" /> AI-Powered Patient Prioritization
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white leading-tight">
            Smart Queue Management <br />
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Driven by Real-Time Triage
            </span>
          </h1>
          <p className="text-outline text-sm md:text-base max-w-2xl mx-auto leading-relaxed mt-2">
            ClinicQueue replaces standard first-come-first-serve lines with clinical AI symptom classification, ensuring emergency and critical cases receive immediate medical attention.
          </p>
        </section>

        {/* Call-to-Actions (CTA) Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
          
          {/* Card 1: Patient Check-in Kiosk */}
          <div 
            onClick={() => onNavigate('PatientPortal')}
            className="glass-panel group border border-white/5 hover:border-primary/30 p-8 rounded-3xl flex flex-col justify-between h-72 shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-2xl rounded-full" />
            <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <UserPlus className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-lg text-white">Patient Check-in</h3>
              <p className="text-outline text-xs leading-relaxed">
                Describe symptoms via text or voice recording to register and receive your priority queue token.
              </p>
            </div>
          </div>

          {/* Card 2: Clinician Dashboard Console */}
          <div 
            onClick={() => onNavigate('Login')}
            className="glass-panel group border border-white/5 hover:border-secondary/30 p-8 rounded-3xl flex flex-col justify-between h-72 shadow-2xl hover:shadow-secondary/5 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-24 h-24 bg-secondary/5 blur-2xl rounded-full" />
            <div className="w-12 h-12 rounded-2xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-lg text-white">Clinician Console</h3>
              <p className="text-outline text-xs leading-relaxed">
                Secure portal for doctors and triage nurses to monitor queues, re-evaluate patients, and call tokens.
              </p>
            </div>
          </div>

          {/* Card 3: Lobby Monitor Screen */}
          <div 
            onClick={() => onNavigate('LobbyDisplay')}
            className="glass-panel group border border-white/5 hover:border-white/20 p-8 rounded-3xl flex flex-col justify-between h-72 shadow-2xl hover:shadow-white/2 transition-all duration-300 cursor-pointer relative overflow-hidden"
          >
            <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-outline group-hover:scale-110 transition-transform">
              <MonitorPlay className="w-6 h-6" />
            </div>
            <div className="flex flex-col gap-1.5">
              <h3 className="font-bold text-lg text-white">Lobby Live Board</h3>
              <p className="text-outline text-xs leading-relaxed">
                Public waiting-room queue board showing active calls, cabins, and upcoming tokens.
              </p>
            </div>
          </div>

        </section>

        {/* Feature Highlights Section */}
        <section className="w-full max-w-4xl border-t border-white/5 pt-12 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          <div className="flex gap-3">
            <Cpu className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs">AI Symptom Triage</span>
              <span className="text-[10px] text-outline">Precise severity scoring using LLMs.</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Clock className="w-5 h-5 text-secondary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs">Dynamic Scheduling</span>
              <span className="text-[10px] text-outline">Redis sorted-set priority queue.</span>
            </div>
          </div>
          <div className="flex gap-3">
            <MessageSquare className="w-5 h-5 text-primary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs">Smart SMS Alerts</span>
              <span className="text-[10px] text-outline">Twilio updates on wait times.</span>
            </div>
          </div>
          <div className="flex gap-3">
            <ShieldAlert className="w-5 h-5 text-secondary shrink-0" />
            <div className="flex flex-col gap-0.5">
              <span className="font-bold text-xs">Clinical Fail-safe</span>
              <span className="text-[10px] text-outline">Graceful API & offline cache fallbacks.</span>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="h-16 border-t border-white/5 flex items-center justify-center text-[10px] font-bold text-outline tracking-wider uppercase shrink-0">
        <span>© 2026 ClinicQueue Healthcare System Inc.</span>
      </footer>

    </div>
  );
}
