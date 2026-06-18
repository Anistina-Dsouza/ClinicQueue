import React, { useState } from 'react';
import { DepartmentLoad, ClinicMetrics, Patient } from '../types';
import { 
  TrendingUp, 
  Clock, 
  Users, 
  BarChart3, 
  Sparkles, 
  ShieldCheck, 
  AlertCircle, 
  Info, 
  Maximize2,
  CheckCircle,
  HelpCircle,
  Flame,
  UserCheck
} from 'lucide-react';

interface ClinicAnalyticsViewProps {
  patients: Patient[];
}

export default function ClinicAnalyticsView({ patients }: ClinicAnalyticsViewProps) {
  const [filterMode, setFilterMode] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [hoveredBar, setHoveredBar] = useState<number | null>(null);

  // Dynamic calculations based on live state
  const activeCount = patients.length;
  // Base stats influenced by register count
  const baseAvgWait = activeCount >= 4 ? 18 : 14;
  const livePatientsToday = 125 + activeCount;
  const liveQueueUtil = Math.min(98, 70 + activeCount * 6);

  // Department Perf mapping
  const departments: DepartmentLoad[] = [
    { name: 'Cardiology', pts: patients.filter(p => p.department === 'Cardiology').length + 3, avgTriage: 8, status: 'STABLE' },
    { name: 'Orthopedics', pts: patients.filter(p => p.department === 'Orthopedics').length + 2, avgTriage: 14, status: 'STABLE' },
    { name: 'Pediatrics', pts: patients.filter(p => p.department === 'Pediatrics').length + 6, avgTriage: 22, status: 'STAFF ALERT' },
    { name: 'Internal Medicine', pts: patients.filter(p => p.department === 'Internal Medicine').length + 5, avgTriage: 11, status: 'OPTIMIZED' }
  ];

  // Simulated sparkline paths for styling
  const trendsData = [
    { label: '08:00', height: '42%' },
    { label: '10:00', height: '62%' },
    { label: '12:00', height: '52%' },
    { label: '14:00 (Current)', height: '88%', live: true },
    { label: '16:00', height: '70%', forecast: true },
    { label: '18:00', height: '60%', forecast: true },
    { label: '20:00', height: '48%', forecast: true },
  ];

  // Custom Peak hour heatmap data values
  const days = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const times = ['08:00', '12:00', '16:00', '20:00'];
  
  // Matrix data for cells (opacity mapping)
  const heatmapCells = [
    [0.9, 0.4, 0.3, 0.2, 0.4, 0.1, 0.1], // 08:00 row
    [0.6, 0.8, 0.6, 0.5, 0.7, 0.2, 0.3], // 12:00 row
    [0.3, 0.2, 0.4, 0.9, 0.6, 0.1, 0.1], // 16:00 row
    [0.1, 0.1, 0.2, 0.1, 0.3, 0.5, 0.4]  // 20:00 row
  ];

  return (
    <div className="bg-surface text-on-surface min-h-screen pb-16">
      {/* Header and Filter */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-on-surface">Clinic Analytics</h1>
          <p className="text-on-surface-variant text-sm mt-1">Real-time clinical intelligence command center &amp; predictive flow forecasting.</p>
        </div>
        <div className="flex bg-surface-container p-1.5 rounded-lg border border-white/5 self-start">
          <button 
            onClick={() => setFilterMode('daily')}
            className={`px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${filterMode === 'daily' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            DAILY
          </button>
          <button 
            onClick={() => setFilterMode('weekly')}
            className={`px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${filterMode === 'weekly' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            WEEKLY
          </button>
          <button 
            onClick={() => setFilterMode('monthly')}
            className={`px-4 py-1.5 text-xs font-bold rounded cursor-pointer transition-all ${filterMode === 'monthly' ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:text-on-surface'}`}
          >
            MONTHLY
          </button>
        </div>
      </div>

      {/* Overview Stats Dashboard Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Average Wait Time */}
        <div className="glass-card p-6 rounded-2xl relative overflow-hidden">
          <div className="scanline" />
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Avg Wait Time</span>
            <Clock className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-extrabold text-primary font-mono">{baseAvgWait}<span className="text-lg font-normal ml-0.5">m</span></h2>
            <span className="text-secondary text-xs font-bold flex items-center bg-secondary/10 px-1.5 py-0.5 rounded-full">
              <TrendingUp className="w-3" /> -12%
            </span>
          </div>
          {/* Sparkline simulation bars */}
          <div className="mt-5 h-10 w-full flex items-end gap-1.5">
            <div className="w-full bg-primary/20 h-5 rounded-xs" />
            <div className="w-full bg-primary/20 h-7 rounded-xs" />
            <div className="w-full bg-primary h-10 rounded-xs relative group-hover:scale-y-110 transition-transform" />
            <div className="w-full bg-primary/45 h-6 rounded-xs" />
            <div className="w-full bg-primary/20 h-4 rounded-xs" />
          </div>
        </div>

        {/* Patients seen Today */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Patients Today</span>
            <UserCheck className="w-5 h-5 text-secondary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-extrabold text-secondary font-mono">{livePatientsToday}</h2>
            <span className="text-secondary text-xs font-bold flex items-center bg-secondary/10 px-1.5 py-0.5 rounded-full">
              <TrendingUp className="w-3" /> +4%
            </span>
          </div>
          <div className="mt-5 h-10 w-full flex items-end gap-1.5 opacity-55">
            <div className="w-full bg-secondary/35 h-3 rounded-xs" />
            <div className="w-full bg-secondary/35 h-6 rounded-xs" />
            <div className="w-full bg-secondary/35 h-8 rounded-xs" />
            <div className="w-full bg-secondary/35 h-5 rounded-xs" />
            <div className="w-full bg-secondary/35 h-7 rounded-xs" />
          </div>
        </div>

        {/* Queue Utilization capacity */}
        <div className="glass-card p-6 rounded-2xl">
          <div className="flex justify-between items-start mb-2">
            <span className="text-xs text-on-surface-variant uppercase tracking-widest font-bold">Queue Utilization</span>
            <BarChart3 className="w-5 h-5 text-tertiary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-extrabold text-tertiary font-mono">{liveQueueUtil}%</h2>
            <span className="text-error text-xs font-bold flex items-center bg-error/10 px-1.5 py-0.5 rounded-full animate-pulse">
              <AlertCircle className="w-3 h-3 mr-0.5" /> High
            </span>
          </div>
          <div className="mt-6 w-full bg-surface-container-highest rounded-full h-2 overflow-hidden shadow-inner">
            <div 
              className="h-full bg-tertiary rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_#e79400]" 
              style={{ width: `${liveQueueUtil}%` }} 
            />
          </div>
        </div>

        {/* AI Triage Accuracy */}
        <div className="glass-card p-6 rounded-2xl border border-primary/20 bg-primary/5">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-primary uppercase tracking-widest font-semibold">Triage Accuracy</span>
              <span className="text-[9px] font-black tracking-widest bg-primary/20 text-primary px-1.5 py-0.5 rounded">PREMIUM</span>
            </div>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-extrabold text-primary font-mono">96<span className="text-xl ml-0.5 font-normal">%</span></h2>
            <span className="text-primary text-xs font-bold flex items-center bg-primary/15 px-1.5 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5 mr-0.5" /> Verified
            </span>
          </div>
          <div className="mt-6 flex justify-between items-center text-[10px] text-primary/60 font-semibold uppercase tracking-wider">
            <span>Core Model Stability</span>
            <span className="tracking-widest font-extrabold">STABLE 100%</span>
          </div>
        </div>
      </div>

      {/* Main visual charting grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Wait Time Trends Column */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          <div className="glass-card rounded-[2rem] p-6 h-[400px] flex flex-col relative overflow-hidden border border-white/5">
            <div className="flex justify-between items-center mb-6">
              <div className="flex flex-col md:flex-row md:items-center gap-3">
                <h3 className="text-lg font-bold text-on-surface tracking-tight">Wait Time Trends</h3>
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                    <span className="w-3 h-3 rounded-full bg-primary" />
                    <span>Live Intakes</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-on-surface-variant font-medium">
                    <span className="w-4 border-t border-primary border-dashed" />
                    <span>AI Model Forecast</span>
                  </div>
                </div>
              </div>
              <button className="text-on-surface-variant hover:text-primary transition-colors">
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Chart representation */}
            <div className="flex-1 flex items-end justify-between px-2 border-b border-white/10 pb-2 relative">
              {trendsData.map((bar, i) => {
                const isLive = bar.live;
                const isForecast = bar.forecast;
                const barHeight = i === 3 ? `${50 + activeCount * 8}%` : bar.height;

                return (
                  <div 
                    key={bar.label}
                    onMouseEnter={() => setHoveredBar(i)}
                    onMouseLeave={() => setHoveredBar(null)}
                    className="flex flex-col items-center w-12 group cursor-pointer relative"
                  >
                    {/* Tooltip on hover */}
                    {hoveredBar === i && (
                      <div className="absolute -top-10 bg-surface-container-high border border-white/10 rounded-lg px-2.5 py-1 text-[11px] font-bold shadow-xl animate-in fade-in duration-200 z-10">
                        {isForecast ? "Predicted: " : "Actual: "} 
                        <span className="text-primary font-mono">
                          {isLive ? `${10 + activeCount * 2}min` : `${12 + (i % 3) * 4}min`}
                        </span>
                      </div>
                    )}

                    {/* Chart Pillar */}
                    <div 
                      className={`w-10 rounded-t-lg transition-all duration-500 origin-bottom ${
                        isLive 
                          ? 'bg-primary shadow-[0_0_20px_rgba(76,215,246,0.35)] hover:scale-x-105' 
                          : isForecast 
                          ? 'border-2 border-dashed border-primary/40 bg-primary/5 hover:bg-primary/10' 
                          : 'bg-primary/45 hover:bg-primary/60'
                      }`}
                      style={{ height: barHeight }}
                    />
                  </div>
                );
              })}
            </div>

            {/* Chart X Labels */}
            <div className="flex justify-between mt-3 text-xs text-on-surface-variant font-bold px-1 tabular-nums select-none">
              {trendsData.map(bar => (
                <span key={bar.label} className={bar.live ? 'text-primary font-bold' : ''}>
                  {bar.label}
                </span>
              ))}
            </div>
          </div>

          {/* Department Performance grid sub-elements */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {departments.map(dept => {
              const isAlert = dept.status === 'STAFF ALERT';
              const isOpt = dept.status === 'OPTIMIZED';

              return (
                <div 
                  key={dept.name} 
                  className={`glass-card p-5 rounded-2xl border transition-all ${isAlert ? 'border-error/45 bg-error/[0.03] pulse-emergency' : 'border-white/5'}`}
                >
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-extrabold tracking-wide text-on-surface">{dept.name}</h4>
                    <span className={`text-[9px] font-black tracking-widest px-2 py-0.5 rounded ${
                      isAlert 
                        ? 'bg-error-container text-error border border-error/20' 
                        : isOpt 
                        ? 'bg-secondary/15 text-secondary border border-secondary/25' 
                        : 'bg-surface-container-highest text-outline border border-white/5'
                    }`}>
                      {dept.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Current Load</p>
                      <p className={`text-xl font-black font-mono mt-0.5 ${isAlert ? 'text-error' : 'text-on-surface'}`}>
                        {dept.pts} <span className="text-xs font-normal text-outline">patients</span>
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-on-surface-variant uppercase font-bold tracking-wider">Avg Triage Wait</p>
                      <p className={`text-xl font-black font-mono mt-0.5 ${isAlert ? 'text-error' : 'text-on-surface'}`}>
                        {dept.avgTriage} <span className="text-xs font-normal text-outline">min</span>
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar predictions columns (Predictive Alert, optimization, resources, heatmap) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          {/* AI Insights Board */}
          <div className="glass-card rounded-[2rem] p-6 border border-primary/10 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-12 translate-x-12" />
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-8 h-8 rounded-lg bg-primary/20 border border-primary/25 flex items-center justify-center text-primary">
                <Sparkles className="w-4 h-4" />
              </div>
              <h3 className="text-md font-bold text-on-surface tracking-tight">AI Flow Insights</h3>
            </div>

            <div className="flex flex-col gap-4">
              <div className="p-4 bg-primary/5 border-l-4 border-primary rounded-r-xl text-xs flex flex-col gap-1 select-none">
                <span className="text-[10px] font-black text-primary uppercase tracking-widest block">Predictive Alert</span>
                <p className="leading-relaxed text-outline">
                  Triage volumes in <span className="font-bold text-on-surface">Pediatrics</span> are modeled to inflate by <span className="text-primary font-bold">20%</span> over the next hour. Recommend reassigning 1 active nurse from Internal Medicine.
                </p>
              </div>

              <div className="p-4 bg-white/5 border-l-4 border-secondary/45 rounded-r-xl text-xs flex flex-col gap-1 select-none">
                <span className="text-[10px] font-black text-secondary uppercase tracking-widest block">Optimization Tip</span>
                <p className="leading-relaxed text-outline">
                  Patient processing in cardiology is <span className="text-secondary font-bold">5m faster</span> than average. Opportunity to route minor/stable patients directly to Room 4B to balance workflow.
                </p>
              </div>

              <div className="p-4 bg-white/5 border-l-4 border-outline/35 rounded-r-xl text-xs flex flex-col gap-1 select-none">
                <span className="text-[10px] font-black text-outline uppercase tracking-widest block">Resource Forecast</span>
                <p className="leading-relaxed text-outline">
                  Intake spikes expected in <span className="font-bold text-on-surface">Orthopedics</span> around 17:00 due to sports/school traffic. Ensure radiology technicians remain on active standby.
                </p>
              </div>
            </div>

            <button className="w-full mt-6 py-2 rounded-xl bg-surface-container/30 hover:bg-surface-container-highest border border-white/5 text-xs font-bold text-primary transition-all text-center flex items-center justify-center gap-1">
              <span>View Detailed Flow Reports</span>
              <Maximize2 className="w-3 h-3" />
            </button>
          </div>

          {/* Peak hour Heatmap */}
          <div className="glass-card rounded-[2rem] p-6 border border-white/5 select-none">
            <div className="flex justify-between items-center mb-6 px-1">
              <h3 className="text-md font-bold text-on-surface tracking-tight">Peak Load Heatmap</h3>
              <Info className="w-4 h-4 text-outline" />
            </div>

            <div className="grid grid-cols-8 gap-2">
              <div className="h-6" /> {/* Offset cell */}
              {days.map(d => (
                <div key={d} className="text-[10px] font-black text-center text-outline/60">{d}</div>
              ))}

              {times.map((timeLabel, timeIdx) => (
                <React.Fragment key={timeLabel}>
                  <div className="text-[10px] font-bold text-outline/75 flex items-center pr-1 tracking-tight">{timeLabel}</div>
                  {heatmapCells[timeIdx].map((val, cellIdx) => {
                    // Match color with primary neon cyan at variable opacity
                    return (
                      <div 
                        key={cellIdx}
                        className="h-6 rounded-sm relative group cursor-pointer transition-all hover:scale-115 hover:z-10"
                        style={{ 
                          backgroundColor: `rgba(76, 215, 246, ${val})`,
                          boxShadow: val >= 0.8 ? '0 0 10px rgba(76, 215, 246, 0.4)' : 'none'
                        }}
                      >
                        {/* Cell Tooltip mapping */}
                        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-highest border border-white/10 rounded-md py-1 px-1.5 text-[9px] font-black pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          Intake load: {Math.floor(val * 100)}%
                        </div>
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
            </div>

            <div className="flex justify-between mt-4 text-[9px] font-black text-outline uppercase tracking-wider px-1">
              <span>Low Traffic</span>
              <span>Peak Influx</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
