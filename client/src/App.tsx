import React, { useState, useEffect } from 'react';
import { Patient, AppView } from './types';
import { INITIAL_PATIENTS } from './data/initialPatients';
import ClinicianQueueView from './components/ClinicianQueueView';
import PatientPortalView from './components/PatientPortalView';
import LobbyDisplayView from './components/LobbyDisplayView';
import ClinicAnalyticsView from './components/ClinicAnalyticsView';
import LandingView from './components/LandingView';
import LoginView from './components/LoginView';
import { socket } from './services/socket';
import { 
  BarChart, 
  Search, 
  Bell, 
  HelpCircle, 
  ChevronRight, 
  LayoutDashboard, 
  Heart, 
  CheckCircle, 
  Cpu, 
  Volume2, 
  BarChart3, 
  Compass, 
  ShieldAlert, 
  Clock, 
  Zap,
  Activity,
  Award,
  LogOut,
  Sparkles,
  Settings
} from 'lucide-react';

export default function App() {
  const [appView, setAppView] = useState<AppView>('Landing');
  const [patients, setPatients] = useState<Patient[]>(INITIAL_PATIENTS);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(INITIAL_PATIENTS[0]);
  const [doctor, setDoctor] = useState<any | null>(null);
  
  // Real-time voice parameters
  const [calledPatient, setCalledPatient] = useState<Patient | null>(null);
  const [calledCabin, setCalledCabin] = useState<string>('Cabin 3');
  
  const [patientsSeenCount, setPatientsSeenCount] = useState<number>(12);
  const [currentTimeStr, setCurrentTimeStr] = useState('');

  // Fetch live queue from backend
  const fetchQueue = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/queue/live');
      const json = await res.json();
      if (json.success) {
        const mappedPatients: Patient[] = json.data.map((entry: any) => {
          const patientId = entry.patientId || {};
          const triageRecord = entry.triageRecordId || {};
          const severity = triageRecord.severityScore || 2;
          let status: 'STABLE' | 'HIGH URGENCY' | 'CRITICAL PRIORITY' = 'STABLE';
          if (severity === 5) status = 'CRITICAL PRIORITY';
          else if (severity === 4) status = 'HIGH URGENCY';

          let assignedCabin = entry.assignedCabin || '';
          if (!assignedCabin) {
            if (triageRecord.recommendedDepartment === 'Cardiology') assignedCabin = 'Cabin 3';
            else if (triageRecord.recommendedDepartment === 'Pediatrics') assignedCabin = 'Cabin 2';
            else if (triageRecord.recommendedDepartment === 'Emergency') assignedCabin = 'Cabin 3';
            else if (triageRecord.recommendedDepartment === 'Orthopedics') assignedCabin = 'Cabin 1';
            else assignedCabin = 'Cabin B';
          }

          const createdTimeMs = new Date(entry.checkInTime || entry.createdTime).getTime();
          const waitingTimeSec = Math.floor((Date.now() - createdTimeMs) / 1000);

          return {
            id: entry.tokenNumber || entry._id,
            name: patientId.name || 'Unknown',
            age: patientId.age || 0,
            gender: patientId.gender ? (patientId.gender.charAt(0).toUpperCase() + patientId.gender.slice(1)) : 'Female',
            score: severity,
            status,
            clinicalSummary: triageRecord.clinicalSummary || triageRecord.rawSymptomText || '',
            department: triageRecord.recommendedDepartment || 'General Medicine',
            tags: triageRecord.criticalSymptoms || [],
            createdTime: createdTimeMs,
            waitingTimeSec: waitingTimeSec > 0 ? waitingTimeSec : 0,
            assignedCabin,
            dbEntryId: entry._id
          };
        });
        setPatients(mappedPatients);
      }
    } catch (err) {
      console.warn('[App] Failed to fetch live queue from server. Using mock/local data.', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('doctorToken');
    setDoctor(null);
    setAppView('Landing');
  };

  // Sync selectedPatient when patients list changes
  useEffect(() => {
    if (patients.length > 0) {
      if (!selectedPatient || !patients.some(p => p.id === selectedPatient.id)) {
        const sorted = [...patients].sort((a, b) => b.score - a.score);
        setSelectedPatient(sorted[0]);
      } else {
        const updated = patients.find(p => p.id === selectedPatient.id);
        if (updated) {
          setSelectedPatient(updated);
        }
      }
    } else {
      setSelectedPatient(null);
    }
  }, [patients]);

  // Auth checking and Socket lifecycle
  useEffect(() => {
    // 1. Initial auth verification from token
    const checkAuth = async () => {
      const token = localStorage.getItem('doctorToken');
      if (token) {
        if (token === 'mock-developer-jwt-token') {
          setDoctor({
            _id: 'mock-doctor-id-999',
            name: "Dr. Anistina D'Souza",
            email: 'test@clinic.com',
            specialization: 'Pediatrics',
            token: 'mock-developer-jwt-token'
          });
          return;
        }
        try {
          const res = await fetch('http://localhost:5000/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          const json = await res.json();
          if (res.ok && json.success) {
            setDoctor({ ...json.data, token });
          } else {
            localStorage.removeItem('doctorToken');
          }
        } catch (err) {
          console.warn('[App] Failed to verify auth token with server:', err);
        }
      }
    };
    checkAuth();

    // 2. Connect Socket and Register listeners
    socket.connect();

    const onQueueUpdated = () => {
      console.log('[App] Socket: queueUpdated event received, fetching fresh list...');
      fetchQueue();
    };

    const onPatientCalled = (data: { tokenNumber: string; patientName: string; cabinName: string }) => {
      console.log('[App] Socket: patientCalled event received:', data);
      setPatients(prev => {
        const found = prev.find(p => p.id === data.tokenNumber);
        if (found) {
          setCalledPatient(found);
        } else {
          setCalledPatient({
            id: data.tokenNumber,
            name: data.patientName,
            age: 30,
            gender: 'Female',
            score: 3,
            status: 'STABLE',
            clinicalSummary: '',
            department: 'General Medicine',
            tags: [],
            createdTime: Date.now(),
            waitingTimeSec: 0,
            assignedCabin: data.cabinName
          });
        }
        return prev;
      });
      setCalledCabin(data.cabinName);
    };

    socket.on('queueUpdated', onQueueUpdated);
    socket.on('patientCalled', onPatientCalled);

    fetchQueue();

    return () => {
      socket.off('queueUpdated', onQueueUpdated);
      socket.off('patientCalled', onPatientCalled);
      socket.disconnect();
    };
  }, []);

  // Update current header time tick
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Increment wait timers of all active patients in queue in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setPatients(prev => 
        prev.map(p => ({
          ...p,
          waitingTimeSec: p.waitingTimeSec + 1
        }))
      );
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Register Patient callback handler
  const handleRegisterPatient = (newPatient: Patient) => {
    // If backend is running, the socket 'queueUpdated' event will handle fetching
    // If offline, we manually append to local state
    setPatients(prev => {
      if (prev.some(p => p.id === newPatient.id)) return prev;
      return [...prev, newPatient];
    });
  };

  // Called Patient callback handler
  const handleCallPatient = async (patient: Patient, cabin: string) => {
    const token = localStorage.getItem('doctorToken');
    try {
      const res = await fetch('http://localhost:5000/api/queue/call-next', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ cabinName: cabin })
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to call patient on backend');
      }
    } catch (err: any) {
      console.warn('[App] callNext API failed, falling back to local simulation:', err.message);
      setCalledPatient(patient);
      setCalledCabin(cabin);
      setPatients(prev => prev.filter(p => p.id !== patient.id));
      setPatientsSeenCount(prev => prev + 1);
    }
  };

  // Completed Patient callback handler
  const handleCompletePatient = async (patientId: string) => {
    const patient = patients.find(p => p.id === patientId);
    const dbId = (patient as any)?.dbEntryId || patientId;
    const token = localStorage.getItem('doctorToken');

    try {
      const res = await fetch(`http://localhost:5000/api/queue/${dbId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Failed to complete patient on backend');
      }
    } catch (err: any) {
      console.warn('[App] complete patient API failed, falling back to local simulation:', err.message);
      const freshList = patients.filter(p => p.id !== patientId);
      setPatients(freshList);
      setPatientsSeenCount(prev => prev + 1);
    }
  };

  // Re-Triage Patient callback handler
  const handleReTriagePatient = (patientId: string, newScore: number) => {
    setPatients(prev => 
      prev.map(p => {
        if (p.id === patientId) {
          let status: 'STABLE' | 'HIGH URGENCY' | 'CRITICAL PRIORITY' = 'STABLE';
          if (newScore === 5) status = 'CRITICAL PRIORITY';
          else if (newScore === 4) status = 'HIGH URGENCY';
          
          return {
            ...p,
            score: newScore,
            status
          };
        }
        return p;
      })
    );
  };


  return (
    <div className="min-h-screen bg-background flex text-on-surface select-none font-sans">
      
      {/* GLOBAL HUD SIDEBAR LAYOUT (Matches screenshots exactly) */}
      {appView !== 'LobbyDisplay' && appView !== 'PatientPortal' && appView !== 'Landing' && appView !== 'Login' && (
        <aside className="hidden lg:flex w-72 bg-surface-container-lowest border-r border-white/5 flex-col justify-between shrink-0 select-none z-10">
          <div className="flex flex-col gap-8 p-6">
            
            {/* App Branding Brand */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-sans text-lg font-black tracking-tighter text-white">ClinicQueue</span>
                <span className="text-[9px] font-black tracking-widest text-primary uppercase">Triage Platform</span>
              </div>
            </div>

            {/* Navigation options */}
            <nav className="flex flex-col gap-2">
              <button 
                onClick={() => setAppView('ClinicianQueue')}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${appView === 'ClinicianQueue' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-outline hover:text-on-surface hover:bg-white/5'}`}
              >
                <LayoutDashboard className="w-5 h-5 shrink-0" />
                <span>CLINICIAN QUEUE</span>
              </button>

              <button 
                onClick={() => setAppView('PatientPortal')}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${appView === 'PatientPortal' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-outline hover:text-on-surface hover:bg-white/5'}`}
              >
                <Cpu className="w-5 h-5 shrink-0" />
                <span>PATIENT PORTAL</span>
              </button>

              <button 
                onClick={() => setAppView('LobbyDisplay')}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${appView === 'LobbyDisplay' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-outline hover:text-on-surface hover:bg-white/5'}`}
              >
                <Volume2 className="w-5 h-5 shrink-0 animate-pulse" />
                <span>LOBBY MONITOR</span>
              </button>

              <button 
                onClick={() => setAppView('ClinicAnalytics')}
                className={`flex items-center gap-3.5 px-4 py-3.5 rounded-xl font-bold text-xs tracking-wider transition-all cursor-pointer ${appView === 'ClinicAnalytics' ? 'bg-primary/10 text-primary border-l-4 border-primary' : 'text-outline hover:text-on-surface hover:bg-white/5'}`}
              >
                <BarChart3 className="w-5 h-5 shrink-0" />
                <span>FLOW ANALYTICS</span>
              </button>
            </nav>
          </div>

          {/* Personalized User Profile Block */}
          <div className="p-6 border-t border-white/5 select-none bg-surface-container-low/30">
            <div className="flex items-center gap-3.5">
              <div className="relative w-11 h-11">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center font-bold text-on-primary">
                  {doctor ? doctor.name.split(' ').map((n: string) => n[0]).join('') : 'CD'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-secondary rounded-full border-2 border-surface-container-lowest" />
              </div>
              <div className="flex items-center justify-between flex-1 min-w-0">
                <div className="flex flex-col min-w-0">
                  <span className="font-bold text-sm text-on-surface truncate">{doctor?.name || "Anistina D'Souza"}</span>
                  <span className="text-[10px] text-outline font-semibold tracking-wide">{doctor?.specialization || "Primary NP NP-C"}</span>
                </div>
                <LogOut 
                  onClick={handleLogout}
                  className="w-4 h-4 text-outline/50 hover:text-error transition-colors cursor-pointer shrink-0 ml-2" 
                />
              </div>
            </div>
            
            <div className="mt-4 flex justify-between items-center text-[10px] font-bold text-outline uppercase tracking-wider">
              <span>Shift Load: Stable</span>
            </div>
          </div>
        </aside>
      )}

      {/* VIEW SWITCHER OVERLAY (For Mobile / Small screens, and quick swapping) */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        
        {/* Floating Quick Navigation Hub */}
        {(appView === 'LobbyDisplay' || appView === 'PatientPortal') && (
          <div className="fixed top-4 right-4 z-[999] flex gap-2">
            <button 
              onClick={() => setAppView(doctor ? 'ClinicianQueue' : 'Landing')}
              className="px-4 py-2.5 rounded-xl bg-surface-container-high/90 backdrop-blur border border-white/10 hover:border-primary/40 text-xs font-bold text-primary flex items-center gap-1.5 shadow-2xl transition-all cursor-pointer"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>{doctor ? 'Back to Console' : 'Back to Home'}</span>
            </button>
          </div>
        )}

        {/* Clinician Dashboard Header HUD */}
        {appView !== 'LobbyDisplay' && appView !== 'PatientPortal' && appView !== 'Landing' && appView !== 'Login' && (
          <header className="h-20 bg-surface-container-lowest/40 backdrop-blur border-b border-white/5 flex items-center justify-between px-6 md:px-10 shrink-0 select-none">
            {/* Left Header Info */}
            <div className="flex items-center gap-4">
              <div className="lg:hidden flex items-center gap-2">
                <span className="font-sans text-xl font-black text-primary tracking-tighter">ClinicQueue</span>
              </div>
              <div className="hidden lg:flex items-center gap-6 text-sm">
                <div className="flex items-center gap-1 text-on-surface font-semibold">
                  <span>Triage Center:</span>
                  <span className="text-secondary font-bold font-mono">STABLE</span>
                </div>
                <div className="flex items-center gap-1 text-on-surface font-semibold">
                  <span>Live Queue load:</span>
                  <span className="text-primary font-mono font-bold">{patients.length} active</span>
                </div>
              </div>
            </div>

            {/* Mobile Nav buttons */}
            <div className="lg:hidden flex bg-surface-container-highest/25 p-1 rounded-xl gap-1">
              <button 
                onClick={() => setAppView('ClinicianQueue')} 
                className={`p-2 rounded-lg ${appView === 'ClinicianQueue' ? 'bg-primary/10 text-primary' : 'text-outline'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setAppView('PatientPortal')} 
                className={`p-2 rounded-lg ${appView === 'PatientPortal' ? 'bg-primary/10 text-primary' : 'text-outline'}`}
              >
                <Cpu className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setAppView('LobbyDisplay')} 
                className={`p-2 rounded-lg ${appView === 'LobbyDisplay' ? 'bg-primary/10 text-primary' : 'text-outline'}`}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setAppView('ClinicAnalytics')} 
                className={`p-2 rounded-lg ${appView === 'ClinicAnalytics' ? 'bg-primary/10 text-primary' : 'text-outline'}`}
              >
                <BarChart3 className="w-4 h-4" />
              </button>
            </div>

            {/* Right Status Actions */}
            <div className="flex items-center gap-6">
              <div className="hidden md:flex flex-col items-end">
                <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-outline">Server Clock</span>
                <span className="text-sm font-bold font-mono">{currentTimeStr || "12:00"}</span>
              </div>
              <div className="flex items-center gap-3">
                <button className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-outline cursor-pointer relative">
                  <Bell className="w-4 h-4" />
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-error rounded-full" />
                </button>
                <button className="w-10 h-10 rounded-xl bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-outline cursor-pointer">
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>
          </header>
        )}

        {/* View Switch router canvas */}
        <div className="flex-1 p-6 md:p-10 overflow-hidden">
          {appView === 'Landing' && (
            <LandingView onNavigate={setAppView} />
          )}

          {appView === 'Login' && (
            <LoginView 
              onNavigate={setAppView} 
              onLoginSuccess={(doc) => {
                setDoctor(doc);
                setAppView('ClinicianQueue');
              }} 
            />
          )}

          {appView === 'ClinicianQueue' && (
            <ClinicianQueueView 
              patients={patients}
              selectedPatient={selectedPatient}
              onSelectPatient={setSelectedPatient}
              onCallPatient={handleCallPatient}
              onCompletePatient={handleCompletePatient}
              onReTriagePatient={handleReTriagePatient}
              patientsSeenCount={patientsSeenCount}
            />
          )}

          {appView === 'PatientPortal' && (
            <PatientPortalView 
              onRegisterPatient={handleRegisterPatient}
              patients={patients}
            />
          )}

          {appView === 'LobbyDisplay' && (
            <LobbyDisplayView 
              patients={patients}
              calledPatient={calledPatient}
              calledCabin={calledCabin}
            />
          )}

          {appView === 'ClinicAnalytics' && (
            <ClinicAnalyticsView 
              patients={patients}
            />
          )}
        </div>

      </div>
    </div>
  );
}
