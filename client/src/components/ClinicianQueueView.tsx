import React, { useState } from 'react';
import { Patient, DepartmentLoad, ClinicMetrics } from '../types';
import { 
  BarChart, 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  Play, 
  Check, 
  RotateCcw, 
  Settings, 
  User, 
  LayoutDashboard, 
  Heart, 
  Skull, 
  AlertTriangle, 
  CheckCircle, 
  Activity, 
  Cpu, 
  Zap, 
  TrendingUp, 
  UserCheck, 
  Clock, 
  ShieldAlert,
  SlidersHorizontal,
  ChevronDown,
  Volume2
} from 'lucide-react';

interface ClinicianQueueViewProps {
  patients: Patient[];
  selectedPatient: Patient | null;
  onSelectPatient: (patient: Patient) => void;
  onCallPatient: (patient: Patient, cabin: string) => void;
  onCompletePatient: (patientId: string) => void;
  onReTriagePatient: (patientId: string, newScore: number) => void;
  patientsSeenCount: number;
}

export default function ClinicianQueueView({
  patients,
  selectedPatient,
  onSelectPatient,
  onCallPatient,
  onCompletePatient,
  onReTriagePatient,
  patientsSeenCount
}: ClinicianQueueViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState<string>('All');
  const [sortByScore, setSortByScore] = useState<boolean>(true);
  const [cabinSelection, setCabinSelection] = useState<string>('Cabin 3');
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Simple toast trigger
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleCallClick = () => {
    if (!selectedPatient) {
      triggerToast("Please select a patient from the queue first.");
      return;
    }
    onCallPatient(selectedPatient, cabinSelection);
    triggerToast(`Patient ${selectedPatient.name} (Token ${selectedPatient.id}) called to ${cabinSelection}!`);
  };

  const handleCompleteClick = () => {
    if (!selectedPatient) return;
    const completedId = selectedPatient.id;
    onCompletePatient(completedId);
    triggerToast(`Patient ${selectedPatient.name} designated as triage complete!`);
  };

  const handleReTriageClick = () => {
    if (!selectedPatient) return;
    const currentScore = selectedPatient.score;
    // Lower priority or toggle 2 <-> 5
    const newScore = currentScore === 5 ? 2 : currentScore + 1;
    onReTriagePatient(selectedPatient.id, newScore);
    triggerToast(`Patient ${selectedPatient.name} priority score updated to ${newScore}. Queue re-sorted.`);
  };

  // Perform search and filtering
  const filteredPatients = patients
    .filter(p => {
      const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.id.toLowerCase().includes(searchQuery.toLowerCase());
      const matchDept = deptFilter === 'All' || p.department === deptFilter;
      return matchQuery && matchDept;
    })
    .sort((a, b) => {
      if (sortByScore) {
        return b.score - a.score; // high score first
      }
      return a.createdTime - b.createdTime; // oldest first
    });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden relative">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-10 right-10 glass-card px-6 py-4 rounded-2xl border border-secondary/30 flex items-center gap-4 transform translate-y-0 opacity-100 transition-all duration-500 z-[100] shadow-2xl bg-surface-container-high/90">
          <div className="w-10 h-10 rounded-full bg-secondary/15 border border-secondary/25 flex items-center justify-center text-secondary">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <p className="font-bold text-sm text-on-surface">Action Processed</p>
            <p className="text-xs text-on-surface-variant mt-0.5">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Main Content Area Grid splits feed and console */}
      <div className="flex-1 flex flex-col xl:flex-row gap-8 overflow-hidden">
        
        {/* Left: Triage Queue Feed */}
        <section className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 shrink-0">
            <div>
              <h2 className="text-2xl font-black text-on-surface tracking-tight">Triage Queue</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">Priority-sorted triage roster driven by real-time clinical AI metrics.</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setSortByScore(!sortByScore)}
                className={`px-4 py-2 rounded-xl border border-white/5 transition-all text-xs font-bold whitespace-nowrap cursor-pointer ${sortByScore ? 'bg-primary/10 text-primary border-primary/25' : 'text-outline hover:text-on-surface hover:bg-white/5'}`}
              >
                Sort: {sortByScore ? 'Severity Score' : 'Oldest Waiting'}
              </button>
              
              <div className="relative">
                <button 
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2 rounded-xl border border-white/5 transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-white/5 ${deptFilter !== 'All' ? 'bg-primary/10 text-primary border-primary/25' : 'text-outline'}`}
                >
                  <span>Filter: {deptFilter}</span>
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>

                {showFilters && (
                  <div className="absolute right-0 mt-2 w-48 rounded-xl bg-surface-container-highest border border-white/10 p-1.5 shadow-2xl z-50">
                    {['All', 'Cardiology', 'Orthopedics', 'Pediatrics', 'Internal Medicine'].map(d => (
                      <button
                        key={d}
                        onClick={() => {
                          setDeptFilter(d);
                          setShowFilters(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${deptFilter === d ? 'bg-primary/10 text-primary' : 'text-outline hover:bg-white/5'}`}
                      >
                        {d}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Live Search bar */}
          <div className="mb-4 relative shrink-0">
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search patients by name or Token ID..."
              className="w-full bg-surface-container/40 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs outline-none focus:ring-1 focus:focus:ring-primary/40 focus:border-primary/40 transition-all font-semibold"
            />
            <Search className="w-4 h-4 text-outline absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          {/* Triage cards feed */}
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-1.5 pb-16">
            {filteredPatients.length > 0 ? (
              filteredPatients.map(patient => {
                const isSelected = selectedPatient?.id === patient.id;
                const isCritical = patient.score === 5;
                const isUrgent = patient.score === 4;

                // Color code based on clinical urgency
                const cardBorder = isSelected 
                  ? 'border-primary' 
                  : isCritical 
                  ? 'border-error/20 hover:border-error/45' 
                  : 'border-white/5 hover:border-white/20';

                const scoreBg = isCritical 
                  ? 'bg-error-container/20 border-error/25 text-error' 
                  : isUrgent 
                  ? 'bg-tertiary-container/20 border-tertiary/25 text-tertiary' 
                  : 'bg-surface-container-highest border-white/10 text-on-surface';

                // Display time elapsed concisely
                const elapsedMin = Math.floor(patient.waitingTimeSec / 60);
                const elapsedSec = patient.waitingTimeSec % 60;
                const elapsedStr = `${String(elapsedMin).padStart(2, '0')}:${String(elapsedSec).padStart(2, '0')}m`;

                return (
                  <div 
                    key={patient.id}
                    onClick={() => onSelectPatient(patient)}
                    className={`glass-card rounded-2xl p-5 relative overflow-hidden border cursor-pointer transition-all duration-300 ${cardBorder}`}
                  >
                    {/* Glowing WebGL-Style canvas simulation for Score 5 cards only */}
                    {isCritical && (
                      <div className="absolute inset-0 bg-gradient-to-r from-error/5 via-transparent to-transparent opacity-40 pointer-events-none" />
                    )}

                    <div className="relative z-10 flex flex-col gap-3">
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex gap-4">
                          {/* Severity indicator badge */}
                          <div className={`w-14 h-14 rounded-xl border flex flex-col items-center justify-center font-mono shrink-0 select-none ${scoreBg}`}>
                            <span className="text-[9px] font-black uppercase opacity-60">Score</span>
                            <span className="text-2xl font-black leading-none">{patient.score}</span>
                          </div>
                          <div>
                            <h3 className="text-md font-bold text-on-surface">{patient.name}</h3>
                            <p className="text-outline text-xs font-semibold uppercase tracking-wider mt-0.5">
                              {patient.age}Y · {patient.gender} · ID: {patient.id}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          {isCritical ? (
                            <span className="bg-error/15 text-error px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 border border-error/20 animate-pulse">
                              <ShieldAlert className="w-3.5 h-3.5" /> CRITICAL PRIORITY
                            </span>
                          ) : isUrgent ? (
                            <span className="bg-tertiary/15 text-tertiary px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 border border-tertiary/20">
                              <AlertTriangle className="w-3.5 h-3.5" /> HIGH URGENCY
                            </span>
                          ) : (
                            <span className="bg-outline/10 text-on-surface-variant px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider flex items-center gap-1 border border-outline/25">
                              <CheckCircle className="w-3.5 h-3.5" /> STABLE
                            </span>
                          )}
                          <span className="text-outline/70 font-bold tracking-wide font-mono text-[10px] mt-0.5">WAITING: {elapsedStr}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 border-t border-white/5 pt-3">
                        <div className="md:col-span-2">
                          <label className="text-[9px] font-black text-outline/60 uppercase tracking-widest block mb-1">Clinical Assessment Summary</label>
                          <div className="bg-surface-container-highest/30 rounded-xl p-3 border border-white/5 text-xs text-on-surface-variant font-medium leading-relaxed">
                            {patient.clinicalSummary}
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          <label className="text-[9px] font-black text-outline/60 uppercase tracking-widest block">Unit Designation</label>
                          <span className="font-bold text-sm text-primary select-none">{patient.department}</span>
                          <div className="flex flex-wrap gap-1.5">
                            {patient.tags.map(t => (
                              <span key={t} className="bg-error-container/15 text-error px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border border-error/15 uppercase">
                                {t}
                              </span>
                            ))}
                            {patient.assignedCabin && (
                              <span className="bg-primary/10 text-primary px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider border border-primary/15 uppercase">
                                {patient.assignedCabin}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                    </div>
                  </div>
                );
              })
            ) : (
              <div className="h-64 flex flex-col justify-center items-center text-center opacity-40 border-2 border-dashed border-white/5 rounded-2xl">
                <LayoutDashboard className="w-8 h-8 text-outline mb-2" />
                <p className="text-sm font-semibold">Triage queue list is empty</p>
                <p className="text-xs">Adjust search query or filter options above</p>
              </div>
            )}
          </div>
        </section>

        {/* Right: Active Console */}
        <aside className="w-full xl:w-[380px] flex flex-col gap-6 shrink-0 h-full overflow-y-auto custom-scrollbar select-none pb-24 pr-1">
          
          {/* Active Console card */}
          <div className="glass-card rounded-[2rem] p-6 border-primary/15 bg-gradient-to-br from-primary/[0.03] to-transparent relative overflow-hidden">
            <h3 className="text-xs font-black text-primary uppercase tracking-[0.2em] mb-4 flex items-center gap-1.5 opacity-90 select-none">
              <Play className="w-4 h-4 fill-primary" /> Active Console
            </h3>

            <div className="space-y-6">
              <div className="text-center py-2">
                <p className="text-outline/75 font-semibold text-xs uppercase tracking-widest mb-1.5">Up Next</p>
                <h2 className="text-2xl font-black text-white truncate max-w-full">
                  {selectedPatient ? selectedPatient.name : "Elena Rodriguez"}
                </h2>
                <p className="text-error font-extrabold text-xs tracking-wider mt-1.5 font-mono uppercase">
                  Severity Score: {selectedPatient ? selectedPatient.score : 5}/5
                </p>
              </div>

              {/* Cabin assignment selector */}
              <div className="bg-surface-container/60 rounded-2xl p-4 border border-white/5">
                <label className="text-[10px] font-black text-outline uppercase tracking-wider block mb-2">Proceed To Destination Cabin</label>
                <div className="grid grid-cols-3 gap-2">
                  {['Cabin 1', 'Cabin 2', 'Cabin 3', 'Cabin A', 'Cabin B', 'Cabin C'].map(cab => (
                    <button
                      key={cab}
                      onClick={() => setCabinSelection(cab)}
                      className={`py-1.5 text-xs font-bold rounded-lg border transition-all ${cabinSelection === cab ? 'bg-primary/20 text-primary border-primary/45 font-extrabold' : 'bg-surface-container-highest/30 text-outline hover:text-on-surface border-transparent'}`}
                    >
                      {cab}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Call button */}
              <div className="relative flex justify-center w-full">
                {selectedPatient && (
                  <div className="absolute inset-0 bg-primary/15 rounded-2xl calling-wave pointer-events-none" />
                )}
                <button 
                  onClick={handleCallClick}
                  className="relative w-full py-6 bg-primary text-on-primary rounded-2xl font-bold text-lg flex flex-col items-center justify-center gap-1 shadow-lg hover:brightness-105 active:scale-97 transition-all group overflow-hidden cursor-pointer"
                >
                  <Volume2 className="w-10 h-10 mb-1 group-hover:scale-110 transition-all duration-300" />
                  <span className="tracking-wide">CALL PATIENT</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-3.5">
                <button 
                  onClick={handleCompleteClick}
                  className="flex items-center justify-center gap-1.5 py-3.5 border border-secondary/35 bg-secondary/10 text-secondary hover:bg-secondary/20 rounded-2xl text-xs font-bold tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  <CheckCircle className="w-4 h-4" /> COMPLETE
                </button>
                <button 
                  onClick={handleReTriageClick}
                  className="flex items-center justify-center gap-1.5 py-3.5 border border-outline/25 bg-white/5 text-on-surface-variant hover:text-on-surface hover:bg-white/10 rounded-2xl text-xs font-bold tracking-wider active:scale-95 transition-all cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> RE-TRIAGE
                </button>
              </div>
            </div>
          </div>

          {/* Analytics insights sidebar widgets */}
          <div className="glass-card rounded-[2rem] p-6 flex flex-col gap-5">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-[0.2em] mb-1">Queue Health</h3>
            
            <div className="space-y-4">
              <div className="p-4 bg-surface-container rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-on-surface-variant font-bold">Patients Seen Shift</span>
                  <span className="text-white font-mono font-extrabold text-sm">{patientsSeenCount}</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-secondary w-2/3" />
                </div>
              </div>

              <div className="p-4 bg-surface-container rounded-2xl border border-white/5">
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-xs text-on-surface-variant font-bold">Avg. Triage Duration</span>
                  <span className="text-white font-mono font-extrabold text-sm">3:42m</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div className="h-full bg-primary w-1/2" />
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-start gap-3 mt-1">
              <Cpu className="w-5 h-5 text-primary shrink-0 mt-0.5 animate-pulse" />
              <div>
                <p className="text-[10px] font-black text-primary uppercase tracking-widest">AI Flow Intelligence</p>
                <p className="text-[11px] text-outline mt-0.5 leading-relaxed font-semibold">Triage velocity has stepped up by 14% this hour. Under pediatric surge alerts; coordinate cabin priority mapping.</p>
              </div>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
