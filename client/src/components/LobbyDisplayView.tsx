import React, { useState, useEffect, useRef } from 'react';
import { Patient } from '../types';
import { 
  Heart, 
  Wifi, 
  Cloud, 
  Volume2, 
  VolumeX, 
  Clock, 
  CheckCircle2, 
  ChevronRight, 
  AlertTriangle,
  Flame,
  Activity,
  Award
} from 'lucide-react';

interface LobbyDisplayViewProps {
  patients: Patient[];
  calledPatient: Patient | null;
  calledCabin: string;
}

export default function LobbyDisplayView({ patients, calledPatient, calledCabin }: LobbyDisplayViewProps) {
  const [time, setTime] = useState('');
  const [audioEnabled, setAudioEnabled] = useState(true);
  const prevCalledIdRef = useRef<string | null>(null);

  // Sync state to update local clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', { 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Text-to-Speech triggers whenever calledPatient changes
  useEffect(() => {
    if (calledPatient && calledPatient.id !== prevCalledIdRef.current) {
      prevCalledIdRef.current = calledPatient.id;
      
      if (audioEnabled) {
        // Play Chime
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        if (audioContext) {
          const osc1 = audioContext.createOscillator();
          const osc2 = audioContext.createOscillator();
          const gainNode = audioContext.createGain();

          osc1.connect(gainNode);
          osc2.connect(gainNode);
          gainNode.connect(audioContext.destination);

          // Classic hospital chime frequencies
          osc1.frequency.setValueAtTime(440, audioContext.currentTime); // A4
          osc1.type = 'sine';
          osc2.frequency.setValueAtTime(554.37, audioContext.currentTime); // C#5
          osc2.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 1.2);

          osc1.start();
          osc2.start();
          osc1.stop(audioContext.currentTime + 1.2);
          osc2.stop(audioContext.currentTime + 1.2);
        }

        // Trigger SpeechSynthesis after chime completes
        setTimeout(() => {
          if ('speechSynthesis' in window) {
            // Cancel current speaker
            window.speechSynthesis.cancel();
            
            const sanitizedId = calledPatient.id.split('').join(' '); // Speaks "Q - 0 0 2" instead of "Q002"
            const synthMsg = new SpeechSynthesisUtterance(
              `Now serving patient ${calledPatient.name}. Token ${sanitizedId}. Please proceed immediately to ${calledCabin}.`
            );
            synthMsg.rate = 0.95;
            window.speechSynthesis.speak(synthMsg);
          }
        }, 800);
      }
    }
  }, [calledPatient, calledCabin, audioEnabled]);

  // Filter next patience - those that are not called or still pending triage queue
  // In our simple simulation, we can show patients waiting (excluding the called patient if calledPatient is Elena)
  const nextUpPatients = patients.filter(p => !calledPatient || p.id !== calledPatient.id);

  return (
    <div className="bg-surface-container-low text-on-surface min-h-screen w-full flex flex-col overflow-hidden select-none">
      {/* Header Status Bar */}
      <header className="h-24 w-full flex items-center justify-between px-10 bg-surface-container-lowest/80 border-b border-white/5 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
            <Activity className="w-5 h-5" />
          </div>
          <h1 className="text-2xl font-black text-primary tracking-tighter uppercase opacity-90">St. Jude Medical</h1>
        </div>
        <div className="flex items-center gap-8">
          <div className="flex flex-col items-end">
            <span className="text-outline text-xs uppercase tracking-[0.15em] font-bold opacity-80">Emergency Department</span>
            <span className="text-2xl text-on-surface font-mono font-bold">{time || "14:45:00"}</span>
          </div>

          {/* Audio toggle overlay */}
          <button 
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="flex items-center gap-2 bg-surface-container/60 hover:bg-surface-container px-4 py-2.5 rounded-xl border border-white/5 transition-all text-xs font-semibold cursor-pointer"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-primary animate-pulse" />
                <span className="text-primary uppercase tracking-wider font-bold">Audio Active</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-outline" />
                <span className="text-outline uppercase tracking-wider font-bold">MUTED</span>
              </>
            )}
          </button>

          <div className="w-12 h-12 rounded-full glass-panel flex items-center justify-center border border-white/10 text-secondary">
            <Wifi className="w-5 h-5" />
          </div>
        </div>
      </header>

      {/* Main Content Area: Split 2-Column layout */}
      <main className="flex-1 flex p-10 gap-10 overflow-hidden">
        {/* Left column: NOW SERVING (High Readability 20ft+) */}
        <section className="flex-[1.4] flex flex-col gap-6 scrollbar-none">
          <div className="glass-panel animate-now-serving rounded-[2.5rem] p-8 flex-1 flex flex-col justify-center items-center text-center border-2 border-primary/15 relative overflow-hidden">
            <span className="text-primary uppercase tracking-[0.52em] text-xs font-black opacity-90">Now Serving</span>
            
            <div className="text-[170px] leading-none font-black text-white neon-text-cyan my-3 tracking-tighter truncate max-w-full drop-shadow-[0_4px_16px_rgba(76,215,246,0.35)]">
              {calledPatient ? calledPatient.id : "Q-002"}
            </div>

            <div className="h-1 w-72 bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-full mb-6" />

            <div className="flex flex-col gap-1">
              <span className="text-2xl font-bold text-secondary neon-text-emerald uppercase tracking-[0.16em] flex items-center justify-center gap-1.5">
                Proceed to {calledCabin}
              </span>
              <span className="text-md font-black text-outline/60 uppercase tracking-[0.25em] font-mono">
                {calledPatient ? calledPatient.department : "Pediatrics"}
              </span>
              {calledPatient && (
                <span className="text-sm text-outline/40 uppercase tracking-widest mt-1">
                  PATIENT: {calledPatient.name} ({calledPatient.age}Y · {calledPatient.gender})
                </span>
              )}
            </div>
          </div>

          {/* Urgent Safety advisory ticker banner */}
          <div className="h-28 glass-panel rounded-2xl flex items-center px-8 border-l-8 border-error-container/60 overflow-hidden emergency-pulse-border shrink-0">
            <div className="w-12 h-12 rounded-xl bg-error/15 border border-error/25 text-error flex items-center justify-center animate-pulse mr-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-black text-error uppercase tracking-[0.15em]">Safety Advisory</span>
              <span className="text-md font-medium text-on-surface opacity-95">Please have your Photo Identification and Health Insurance cards ready for the triage intake nurse.</span>
            </div>
          </div>
        </section>

        {/* Right column: Queue Waiting List */}
        <section className="flex-1 flex flex-col gap-6 overflow-hidden">
          <div className="flex justify-between items-end px-2 shrink-0">
            <h2 className="text-xl font-bold text-on-surface uppercase tracking-wider">Next in Queue</h2>
            <span className="text-xs text-outline uppercase tracking-wider font-semibold">Est. Wait</span>
          </div>

          <div className="flex-1 flex flex-col gap-3.5 overflow-y-auto pr-1 select-none custom-scrollbar pb-6">
            {nextUpPatients.length > 0 ? (
              nextUpPatients.map((patient, idx) => {
                // Assign a mockup waiting estimate
                const waitEst = patient.score >= 4 ? 4 + idx * 3 : 10 + idx * 5;
                const scoreColors = {
                  5: 'border-error/40 bg-error/5 text-error',
                  4: 'border-tertiary/40 bg-tertiary/5 text-tertiary',
                  3: 'border-primary/40 bg-primary/5 text-primary',
                  2: 'border-outline/40 bg-white/5 text-on-surface',
                };
                const colorClass = scoreColors[patient.score as keyof typeof scoreColors] || scoreColors[2];

                return (
                  <div 
                    key={patient.id} 
                    className="glass-panel rounded-2xl p-4.5 flex items-center justify-between border-l-4 border-white/10 hover:bg-white/5 transition-all duration-300 transform"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      <div className={`w-14 h-14 rounded-xl border flex items-center justify-center font-bold font-mono text-md shrink-0 ${colorClass}`}>
                        {patient.id}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-bold text-on-surface truncate pr-1">{patient.department}</span>
                        <span className="text-xs text-outline tracking-wide font-semibold mt-0.5">Triage Station {patient.assignedCabin?.slice(-1) || 'A'}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0 font-mono">
                      <span className="text-xl font-black text-secondary font-mono">{String(waitEst).padStart(2, '0')}</span>
                      <span className="text-[10px] text-outline uppercase font-bold tracking-wide">min</span>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col justify-center items-center text-center opacity-40 glass-panel rounded-2xl p-6">
                <CheckCircle2 className="w-8 h-8 text-secondary mb-2" />
                <p className="text-sm font-semibold">All Patients Served</p>
                <p className="text-xs mt-1">Ready for next triage registrations</p>
              </div>
            )}
          </div>

          <div className="glass-panel rounded-2xl p-4 flex justify-around items-center bg-surface-container-lowest/30 border border-white/5 shrink-0 text-[10px]">
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[9px] text-outline">
              <span className="w-2.5 h-2.5 rounded-full bg-secondary shadow-[0_0_8px_rgba(78,222,163,0.5)]" />
              <span>Available Soon</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[9px] text-outline">
              <span className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(76,215,246,0.5)]" />
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold uppercase tracking-widest text-[9px] text-outline">
              <span className="w-2.5 h-2.5 rounded-full bg-error shadow-[0_0_8px_rgba(255,180,171,0.5)]" />
              <span>Delayed</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer scrolling marquee ticket tape */}
      <footer className="h-16 w-full bg-surface-container-lowest flex items-center px-10 gap-10 overflow-hidden border-t border-white/5 backdrop-blur-xl shrink-0 select-none">
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black text-outline uppercase tracking-wider opacity-60">Powered By</span>
          <span className="text-sm font-bold text-primary tracking-tighter italic font-sans flex items-center gap-1">
            ClinicQueue AI <Award className="w-3.5 h-3.5 text-primary" />
          </span>
        </div>

        {/* Dynamic marquee scrolling */}
        <div className="flex-1 overflow-hidden relative">
          <div className="flex whitespace-nowrap gap-12 items-center animate-marquee-custom">
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              NEW: Virtual smart check-in token generation is now available on our web portal under the 'Patient Portal' tab.
            </span>
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Influenza & COVID-19 vaccine updates are available daily from 09:00 AM to 04:00 PM in levels 2 & 4.
            </span>
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Please help keep a quiet and serene diagnostic environment for patient healing. Thank you.
            </span>
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Free Guest high-speed Wi-Fi network: "Clinic_Guest_Secure" (No registration password requested).
            </span>

            {/* Repeat content for continuous loops */}
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              NEW: Virtual smart check-in token generation is now available on our web portal under the 'Patient Portal' tab.
            </span>
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Influenza & COVID-19 vaccine updates are available daily from 09:00 AM to 04:00 PM in levels 2 & 4.
            </span>
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Please help keep a quiet and serene diagnostic environment for patient healing. Thank you.
            </span>
            <span className="text-xs text-outline font-semibold flex items-center gap-1.5 shrink-0 select-none">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary" />
              Free Guest high-speed Wi-Fi network: "Clinic_Guest_Secure" (No registration password requested).
            </span>
          </div>
        </div>

        <div className="flex items-center gap-6 shrink-0">
          <span className="text-outline text-xs uppercase tracking-wider font-semibold">Local Environment</span>
          <div className="flex items-center gap-1.5 text-on-surface font-mono font-bold text-sm">
            <Cloud className="w-4 h-4 text-primary animate-pulse" />
            <span>22°C</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
