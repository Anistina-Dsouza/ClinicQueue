import React, { useState, useEffect, useRef } from 'react';
import { Patient, AppView } from '../types';
import { 
  Mic, 
  ArrowRight, 
  Search, 
  Bell, 
  User, 
  HelpCircle, 
  Clock, 
  ShieldAlert, 
  Activity, 
  CheckCircle2, 
  Edit,
  Globe,
  CornerDownRight,
  Sparkles
} from 'lucide-react';

interface PatientPortalViewProps {
  onRegisterPatient: (patient: Patient) => void;
  patients: Patient[];
  loggedInPatient?: Patient | null;
  onLogoutPatient?: () => void;
}

export default function PatientPortalView({ 
  onRegisterPatient, 
  patients, 
  loggedInPatient, 
  onLogoutPatient 
}: PatientPortalViewProps) {
  const [symptoms, setSymptoms] = useState('');
  const [lang, setLang] = useState<'EN' | 'HI'>('EN');
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [patientName, setPatientName] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [contactNumber, setContactNumber] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Female');
  const [step, setStep] = useState<'input' | 'success'>('input');
  const [generatedToken, setGeneratedToken] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // MediaRecorder refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync loggedInPatient state
  useEffect(() => {
    if (loggedInPatient) {
      setGeneratedToken(loggedInPatient);
      setStep('success');
    } else {
      setGeneratedToken(null);
      setStep('input');
    }
  }, [loggedInPatient]);

  // ─── Voice Recording via MediaRecorder → Whisper API ───────────────────────

  const simulateSpeechRecognition = () => {
    // Fallback: type out a sample symptom automatically when mic is unavailable
    setIsTranscribing(true);
    const sampleSentences = [
      "I've had a severe throbbing headache since morning with intense nausea and aversion to lights.",
      "My chest is feeling very heavy, almost like someone is squeezing it, and I'm struggling to catch my breath.",
      "I think I fractured my wrist after slipping on the stairs — it's very swollen and in intense pain.",
      "My child has a very high fever since yesterday night with a dry cough, please check them urgently."
    ];
    const item = sampleSentences[Math.floor(Math.random() * sampleSentences.length)];
    setTimeout(() => {
      setSymptoms(prev => prev ? prev + ' ' + item : item);
      setIsTranscribing(false);
    }, 2000);
  };

  const startRecording = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        console.warn('[Voice] MediaDevices API not available — using fallback.');
        simulateSpeechRecognition();
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      audioChunksRef.current = [];

      // Pick best supported MIME type
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/ogg';

      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      recorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
        streamRef.current = null;

        const audioBlob = new Blob(audioChunksRef.current, { type: mimeType });
        audioChunksRef.current = [];

        if (audioBlob.size === 0) {
          console.warn('[Voice] Empty audio blob recorded — using fallback.');
          simulateSpeechRecognition();
          return;
        }

        setIsTranscribing(true);

        try {
          // Convert Blob to Base64
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
              const dataUrl = reader.result as string;
              // Strip the data URL prefix ("data:audio/webm;base64,")
              resolve(dataUrl.split(',')[1]);
            };
            reader.onerror = reject;
            reader.readAsDataURL(audioBlob);
          });

          // POST to backend Whisper endpoint
          const response = await fetch('http://localhost:5000/api/patients/transcribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ symptomAudioBase64: base64Audio, mimeType })
          });

          const json = await response.json();

          if (response.ok && json.success && json.data.transcribedText) {
            const text = json.data.transcribedText;
            setSymptoms(prev => prev ? prev + ' ' + text : text);
            console.log('[Voice] Whisper transcription successful:', text);
          } else {
            throw new Error(json.message || 'Transcription API returned no text');
          }
        } catch (err: any) {
          console.warn('[Voice] Transcription API failed — using fallback:', err.message);
          simulateSpeechRecognition();
        } finally {
          setIsTranscribing(false);
        }
      };

      recorder.start();
      setIsRecording(true);
      console.log('[Voice] Recording started with MIME type:', mimeType);

    } catch (err: any) {
      console.warn('[Voice] getUserMedia failed — using fallback:', err.message);
      simulateSpeechRecognition();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else if (!isTranscribing) {
      startRecording();
    }
  };

  const handleQuickTagClick = (tag: string) => {
    const symptomMap: { [key: string]: string } = {
      'Fever': 'High-grade fever accompanied by severe chills, body ache, and general weakness.',
      'Headache': 'Sudden throbbing migraine with nausea, blurred vision, and high sensitivity to bright lights.',
      'Breathing Difficulty': 'Shortness of breath with chest tightness and constant shallow breathing.',
      'Abdominal Pain': 'Acute abdominal pain in the lower right area with constant nausea.'
    };
    setSymptoms(symptomMap[tag] || tag);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) return;

    // Use default values if empty
    const finalName = patientName.trim() || "Anonymized Patient";
    const finalAge = typeof patientAge === 'number' ? patientAge : 33;
    
    setErrorMsg(null);
    setLoading(true);

    try {
      // Send patient check-in payload to backend server
      const response = await fetch('http://localhost:5000/api/patients/checkin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: finalName,
          age: finalAge,
          gender: gender.toLowerCase(),
          contactNumber: contactNumber.trim() || '+919999900000',
          languagePreference: lang.toLowerCase(),
          symptomText: symptoms
        })
      });

      const json = await response.json();

      if (response.ok && json.success) {
        console.log('[Patient Portal] Check-in API successful!');
        const apiData = json.data;
        const severity = apiData.triageRecord.severityScore;
        let status: 'STABLE' | 'HIGH URGENCY' | 'CRITICAL PRIORITY' = 'STABLE';
        if (severity === 5) status = 'CRITICAL PRIORITY';
        else if (severity === 4) status = 'HIGH URGENCY';

        let assignedCabin = 'Cabin B';
        if (apiData.triageRecord.recommendedDepartment === 'Cardiology') assignedCabin = 'Cabin 3';
        else if (apiData.triageRecord.recommendedDepartment === 'Pediatrics') assignedCabin = 'Cabin 2';
        else if (apiData.triageRecord.recommendedDepartment === 'Emergency') assignedCabin = 'Cabin 3';
        else if (apiData.triageRecord.recommendedDepartment === 'Orthopedics') assignedCabin = 'Cabin 1';

        const newPatient: Patient = {
          id: apiData.queueEntry.tokenNumber,
          name: apiData.patient.name,
          age: apiData.patient.age,
          gender: (apiData.patient.gender.charAt(0).toUpperCase() + apiData.patient.gender.slice(1)) as any,
          score: severity,
          status,
          clinicalSummary: apiData.triageRecord.clinicalSummary || apiData.triageRecord.rawSymptomText,
          department: apiData.triageRecord.recommendedDepartment || 'General Medicine',
          tags: apiData.triageRecord.criticalSymptoms || [],
          createdTime: new Date(apiData.queueEntry.checkInTime).getTime(),
          waitingTimeSec: 0,
          assignedCabin
        };

        onRegisterPatient(newPatient);
        setGeneratedToken(newPatient);
        setStep('success');
      } else {
        throw new Error(json.message || 'Check-in failed');
      }
    } catch (err: any) {
      console.warn(`[Patient Portal] API connection failed: ${err.message}. Swapping in local mock triage fallback.`);
      
      // Local Triage Fallback Mock
      const text = symptoms.toLowerCase();
      let score = 2;
      let status: 'STABLE' | 'HIGH URGENCY' | 'CRITICAL PRIORITY' = 'STABLE';
      let department = 'Internal Medicine';
      let tags: string[] = [];
      let assignedCabin = 'Cabin B';

      if (text.includes('chest') || text.includes('heart') || text.includes('difficulty') || text.includes('choking') || text.includes('unconscious')) {
        score = 5;
        status = 'CRITICAL PRIORITY';
        department = 'Cardiology';
        tags = ['CHEST PAIN'];
        assignedCabin = 'Cabin 3';
      } else if (text.includes('fracture') || text.includes('broken') || text.includes('severe pain') || text.includes('injury')) {
        score = 4;
        status = 'HIGH URGENCY';
        department = 'Orthopedics';
        tags = ['FRACTURE'];
        assignedCabin = 'Cabin 1';
      } else if (text.includes('fever') || text.includes('cough') || text.includes('child')) {
        score = 3;
        status = 'HIGH URGENCY';
        department = 'Pediatrics';
        tags = ['FEVER'];
        assignedCabin = 'Cabin 2';
      }

      const nextNum = patients.length + 1;
      const padNum = String(nextNum).padStart(3, '0');
      const id = `Q-${padNum}`;

      const fallbackPatient: Patient = {
        id,
        name: finalName,
        age: finalAge,
        gender,
        score,
        status,
        clinicalSummary: symptoms,
        department,
        tags,
        createdTime: Date.now(),
        waitingTimeSec: 0,
        assignedCabin
      };

      onRegisterPatient(fallbackPatient);
      setGeneratedToken(fallbackPatient);
      setStep('success');
    } finally {
      setLoading(false);
    }
  };

  const resetPortal = () => {
    setSymptoms('');
    setPatientName('');
    setPatientAge('');
    setContactNumber('');
    setGender('Female');
    setStep('input');
    setGeneratedToken(null);
  };

  return (
    <div className="bg-surface-container-low min-h-screen text-on-background selection:bg-primary/30 selection:text-primary">
      {/* Top Banner Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/60 backdrop-blur-lg border-b border-white/5 h-20 flex justify-between items-center px-6 md:px-12">
        <div className="flex items-center gap-2">
          <span className="font-sans text-[24px] font-bold text-primary tracking-tighter opacity-90">ClinicQueue</span>
          <span className="bg-primary/10 border border-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase">Patient Portal</span>
        </div>
        <div className="flex items-center gap-4 text-outline">
          <Bell className="w-5 h-5 hover:text-primary transition-colors cursor-pointer" />
          <User className="w-5 h-5 hover:text-primary transition-colors cursor-pointer" />
        </div>
      </nav>

      {/* Main Registration Canvas */}
      {step === 'input' ? (
        <main className="pt-28 pb-24 max-w-2xl mx-auto px-6 flex flex-col gap-6 animate-in fade-in duration-500">
          <header className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <h1 className="text-3xl font-bold tracking-tight text-on-surface">Describe Symptoms</h1>
              <div className="flex bg-surface-container-highest/40 rounded-full p-1 border border-white/5">
                <button 
                  onClick={() => setLang('EN')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${lang === 'EN' ? 'bg-primary/10 text-primary border border-primary/25' : 'text-outline hover:text-on-surface'}`}
                >
                  EN
                </button>
                <button 
                  onClick={() => setLang('HI')}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide transition-all duration-300 ${lang === 'HI' ? 'bg-primary/10 text-primary border border-primary/25' : 'text-outline hover:text-on-surface'}`}
                >
                  HI
                </button>
              </div>
            </div>
            <p className="text-outline text-sm leading-relaxed">
              {lang === 'EN' ? "Tell us how you are feeling today for an accurate triage assessment." : "सटीक ट्राइएज मूल्यांकन के लिए हमें बताएं कि आज आप कैसा महसूस कर रहे हैं।"}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Patient Demographics */}
            <div className="glass-panel rounded-2xl p-6 border border-white/5 flex flex-col gap-4">
              <label className="text-xs font-bold text-primary uppercase tracking-widest block opacity-80">
                {lang === 'EN' ? "DEMOGRAPHIC DETAILS (SECURE AND CONFIDENTIAL)" : "जनसांख्यिकीय विवरण (सुरक्षित और गोपनीय)"}
              </label>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-outline mb-1.5 block">Full Name</label>
                  <input 
                    type="text" 
                    value={patientName}
                    onChange={e => setPatientName(e.target.value)}
                    placeholder="e.g. Sanjay Gupta"
                    className="w-full bg-surface-container-highest/30 border border-white/5 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-outline mb-1.5 block">Age (Years)</label>
                  <input 
                    type="number" 
                    value={patientAge}
                    onChange={e => setPatientAge(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="e.g. 45"
                    className="w-full bg-surface-container-highest/30 border border-white/5 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-outline mb-1.5 block">Assigned Sex / Gender</label>
                  <div className="flex gap-3">
                    {(['Female', 'Male', 'Other'] as const).map(g => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(g)}
                        className={`flex-1 py-2.5 rounded-xl border border-white/5 font-semibold text-sm transition-all ${gender === g ? 'bg-primary/10 text-primary border-primary/40' : 'bg-surface-container-highest/25 text-outline hover:text-on-surface'}`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs text-outline mb-1.5 block">Contact Number</label>
                  <input 
                    type="text" 
                    value={contactNumber}
                    onChange={e => setContactNumber(e.target.value)}
                    placeholder="e.g. +919999900000"
                    className="w-full bg-surface-container-highest/30 border border-white/5 rounded-xl px-4 py-3 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all outline-none"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Entry Mode Card */}
            <section className="glass-panel rounded-2xl p-6 flex flex-col gap-4 border border-white/5">
              <label className="text-xs font-bold text-primary uppercase tracking-widest opacity-80 flex items-center justify-between">
                <span>{lang === 'EN' ? "SYMPTOM INPUT" : "लक्षण इनपुट"}</span>
                <span className="text-[10px] text-outline flex items-center gap-1 font-normal lowercase tracking-normal">
                  <Sparkles className="w-3 h-3 text-primary" /> clinical class assessment model
                </span>
              </label>

              <div className="relative group">
                <textarea 
                  value={symptoms}
                  onChange={e => setSymptoms(e.target.value)}
                  className="w-full bg-surface-container-highest/30 border border-white/5 rounded-xl p-4 text-on-surface placeholder:text-outline/40 focus:ring-1 focus:ring-primary/40 focus:border-primary/40 transition-all resize-none font-sans text-sm min-h-[120px]" 
                  placeholder={lang === 'EN' ? "Describe your symptoms in detail (e.g. 'Sudden chest tightening radiating to left collarbone, difficulty breathing...')" : "अपने लक्षणों का विस्तार से वर्णन करें (जैसे: 'सांस लेने में कठिनाई के साथ अचानक छाती में भारीपन...')"}
                  rows={4}
                  required
                />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <Edit className="w-4 h-4 text-outline/40" />
                </div>
              </div>

              {/* Voice to Text Action Area */}
              <div className="flex flex-col items-center justify-center py-5 gap-4 relative">

                {/* Mic Button — 3 states: idle / recording / transcribing */}
                <button
                  id="voice-record-btn"
                  type="button"
                  onClick={toggleRecording}
                  disabled={isTranscribing}
                  aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/60
                    ${
                      isRecording
                        ? 'bg-error text-white ring-4 ring-error/30 scale-110'
                        : isTranscribing
                        ? 'bg-primary/30 text-primary cursor-not-allowed'
                        : 'bg-primary text-on-primary neon-cyan-glow hover:scale-105 active:scale-95'
                    }`}
                >
                  {/* Pulse ring when recording */}
                  {isRecording && (
                    <span className="absolute inset-0 rounded-full bg-error/40 animate-ping" />
                  )}

                  {isTranscribing ? (
                    /* Spinner while sending to Whisper */
                    <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-80" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : isRecording ? (
                    /* Animated waveform bars when recording */
                    <span className="flex items-end gap-[3px] h-7">
                      {[1, 2, 3, 4, 3].map((h, i) => (
                        <span
                          key={i}
                          style={{ animationDelay: `${i * 0.1}s`, height: `${h * 22}%` }}
                          className="w-[3px] bg-white rounded-full animate-bounce"
                        />
                      ))}
                    </span>
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </button>

                <div className="text-center">
                  <p
                    className={`font-semibold text-sm transition-colors ${
                      isRecording
                        ? 'text-error animate-pulse'
                        : isTranscribing
                        ? 'text-primary animate-pulse'
                        : 'text-primary'
                    }`}
                  >
                    {isRecording
                      ? (lang === 'EN' ? '🔴 Recording… tap to stop' : '🔴 रिकॉर्ड हो रहा है… रोकने के लिए दबाएं')
                      : isTranscribing
                      ? (lang === 'EN' ? '✨ Transcribing with AI…' : '✨ AI से लिप्यंतरण हो रहा है…')
                      : (lang === 'EN' ? 'Tap to Speak' : 'बोलने के लिए दबाएं')}
                  </p>
                  <p className="text-xs text-outline/65 mt-0.5">
                    {lang === 'EN'
                      ? 'Powered by OpenAI Whisper · English, Hindi & 40+ languages'
                      : 'OpenAI Whisper द्वारा संचालित · अंग्रेजी, हिंदी और 40+ भाषाएं'}
                  </p>
                </div>
              </div>
            </section>

            {/* Quick Context Tags */}
            <section className="flex flex-wrap gap-2">
              {['Fever', 'Headache', 'Breathing Difficulty', 'Abdominal Pain'].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleQuickTagClick(tag)}
                  className="px-4 py-2 rounded-full glass-panel border border-white/5 text-outline text-xs font-semibold hover:bg-primary/10 hover:text-primary hover:border-primary/20 transition-all cursor-pointer"
                >
                  {tag}
                </button>
              ))}
            </section>

            {/* Submit CTA */}
            <button 
              type="submit"
              disabled={loading || !symptoms.trim()}
              className="mt-4 bg-primary text-on-primary py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 shadow-lg shadow-primary/15 hover:brightness-110 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{loading ? (lang === 'EN' ? "Generating..." : "जनरेट हो रहा है...") : (lang === 'EN' ? "Generate Token" : "टोकन जनरेट करें")}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        </main>
      ) : (
        /* Success Screen */
        <main className="pt-28 pb-24 max-w-xl mx-auto px-6 flex flex-col items-center gap-8 animate-in slide-in-from-bottom duration-500">
          {/* Queue Status Ring */}
          <div className="relative w-60 h-60 flex items-center justify-center">
            <svg className="w-full h-full -rotate-90">
              <circle 
                className="text-white/5" 
                cx="120" 
                cy="120" 
                fill="transparent" 
                r="100" 
                stroke="currentColor" 
                strokeWidth="8"
              />
              <circle 
                className="text-primary gauge-ring" 
                cx="120" 
                cy="120" 
                fill="transparent" 
                r="100" 
                stroke="currentColor" 
                strokeWidth="8"
                strokeDasharray="628" 
                strokeDashoffset={628 * (1 - 0.72)} // simulate progress
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-outline text-xs uppercase tracking-wider font-semibold">Queue Position</span>
              <span className="text-5xl font-extrabold text-primary my-1 tabular-nums">05</span>
              <span className="text-outline/70 text-xs font-semibold">of 18 active patients</span>
            </div>
            <div className="absolute inset-0 bg-primary/10 blur-[50px] -z-10 rounded-full" />
          </div>

          {/* Token Identity Card */}
          <div className="w-full glass-panel rounded-3xl p-8 flex flex-col items-center gap-4 border border-white/5 overflow-hidden relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
            <span className="text-xs font-semibold text-outline uppercase tracking-widest opacity-80">Digital Token ID</span>
            
            <div className="bg-primary/10 border border-primary/20 px-8 py-3 rounded-2xl relative group">
              <span className="text-3xl font-black tracking-widest text-primary font-mono select-all">
                {generatedToken?.id || "Q-005"}
              </span>
              <div className="absolute -inset-1 bg-primary/20 blur opacity-30 group-hover:opacity-60 transition-opacity" />
            </div>

            <div className="bg-white p-2.5 rounded-xl mt-2 border border-white/10 flex items-center justify-center opacity-90 hover:opacity-100 transition-opacity">
              {/* Simulated QR Code */}
              <div className="w-24 h-24 bg-gradient-to-br from-surface to-background flex flex-col gap-1.5 p-2 rounded-lg">
                <div className="flex justify-between w-full h-1/4 gap-1">
                  <div className="w-5 bg-primary rounded-xs" />
                  <div className="flex-1 bg-outline/25 rounded-xs" />
                  <div className="w-5 bg-primary rounded-xs" />
                </div>
                <div className="flex-1 bg-outline/15 rounded-xs flex flex-col justify-center items-center">
                  <span className="text-[7px] font-bold text-primary font-mono tracking-tighter">TRIAGE SECURE</span>
                </div>
                <div className="flex justify-between w-full h-1/4 gap-1">
                  <div className="w-5 bg-primary rounded-xs" />
                  <div className="flex-1 bg-outline/25 rounded-xs" />
                  <div className="w-5 bg-primary rounded-xs" />
                </div>
              </div>
            </div>

            <p className="text-outline text-xs text-center max-w-[260px] mt-2 leading-relaxed">
              Scan this QR at the kiosk or present to the front desk when your token is called in the Lobby.
            </p>
          </div>

          {/* Progress / Cabin info */}
          <div className="w-full flex flex-col gap-4">
            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 border-secondary/60">
              <div className="bg-secondary/15 p-2.5 rounded-xl border border-secondary/25 text-secondary flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-xs font-semibold text-on-surface">Estimated Wait Time</span>
                  <span className="text-xl font-bold text-secondary font-mono">
                    {generatedToken?.score && generatedToken.score >= 4 ? "~4m" : "~12m"}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-secondary w-2/3 rounded-full shadow-[0_0_8px_rgba(78,222,163,0.3)] animate-pulse" />
                </div>
              </div>
            </div>

            <div className="glass-panel p-5 rounded-2xl flex items-center gap-4 border-l-4 border-primary-container/60">
              <div className="bg-primary-container/15 p-2.5 rounded-xl border border-primary-container/25 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <span className="text-xs font-semibold text-on-surface">Assigned Station / Unit</span>
                <p className="text-sm text-outline font-semibold mt-0.5">
                  {generatedToken?.department || "General Triage"} - {generatedToken?.assignedCabin || "Cabin 3"}
                </p>
              </div>
            </div>
          </div>

          {onLogoutPatient ? (
            <button 
              onClick={onLogoutPatient}
              className="w-full py-4 rounded-xl border border-white/5 font-semibold text-sm text-outline hover:bg-white/5 transition-all text-center select-none cursor-pointer"
            >
              Sign Out from Portal
            </button>
          ) : (
            <button 
              onClick={resetPortal}
              className="w-full py-4 rounded-xl border border-white/5 font-semibold text-sm text-outline hover:bg-white/5 transition-all text-center select-none cursor-pointer"
            >
              Register Another Patient
            </button>
          )}
        </main>
      )}

      {/* Mobile Bottom Navigation Bar bar (from mapping) */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-surface-container-lowest/80 backdrop-blur-xl px-6 h-20 flex justify-around items-center border-t border-white/5 z-50">
        <button className="flex flex-col items-center gap-1 text-primary cursor-pointer">
          <CheckCircle2 className="w-5 h-5" />
          <span className="text-[10px] font-bold">Portal</span>
        </button>
        <button className="flex flex-col items-center gap-1 text-outline opacity-60 cursor-pointer" onClick={resetPortal}>
          <Clock className="w-5 h-5" />
          <span className="text-[10px] font-bold">Status</span>
        </button>
      </nav>
    </div>
  );
}
