export interface Patient {
  id: string; // e.g., Q-005 or Q-8821
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  score: number; // 1 to 5
  status: 'STABLE' | 'HIGH URGENCY' | 'CRITICAL PRIORITY';
  clinicalSummary: string;
  department: string;
  tags: string[]; // e.g. ["CHEST PAIN", "LOW O2"]
  createdTime: number; // timestamp
  waitingTimeSec: number; // counts up
  assignedCabin?: string; // Cabin A, Cabin B, Cabin 3
}

export interface DepartmentLoad {
  name: string;
  pts: number;
  avgTriage: number; // in mins
  status: 'STABLE' | 'OPTIMIZED' | 'STAFF ALERT';
}

export interface ClinicMetrics {
  avgWaitTime: number; // mins
  queueUtilization: number; // percent
  patientsSeen: number;
  avgTriageDurationSec: number;
  criticalRedirects: number;
}

export type AppView = 'Landing' | 'Login' | 'ClinicianQueue' | 'PatientPortal' | 'LobbyDisplay' | 'ClinicAnalytics';
