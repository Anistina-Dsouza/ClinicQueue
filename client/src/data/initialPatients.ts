import { Patient } from '../types';

export const INITIAL_PATIENTS: Patient[] = [
  {
    id: "Q-8821",
    name: "Elena Rodriguez",
    age: 42,
    gender: "Female",
    score: 5,
    status: "CRITICAL PRIORITY",
    clinicalSummary: "Suspected acute myocardial infarction. Patient presents with severe retrosternal chest pain radiating to left arm. SpO2: 91%. History of hypertension.",
    department: "Cardiology",
    tags: ["CHEST PAIN", "LOW O2"],
    createdTime: Date.now() - 252000, // 4mins 12sec ago
    waitingTimeSec: 252,
    assignedCabin: "Cabin 3"
  },
  {
    id: "Q-8822",
    name: "Marcus Thorne",
    age: 29,
    gender: "Male",
    score: 4,
    status: "HIGH URGENCY",
    clinicalSummary: "Closed fracture of right tibia. Significant edema present. Pain level 8/10. Administered initial analgesic protocol.",
    department: "Orthopedics",
    tags: ["FRACTURE"],
    createdTime: Date.now() - 765000, // 12mins 45sec ago
    waitingTimeSec: 765,
    assignedCabin: "Cabin 1"
  },
  {
    id: "Q-8825",
    name: "Sarah Chen",
    age: 64,
    gender: "Female",
    score: 2,
    status: "STABLE",
    clinicalSummary: "Routine follow-up post-bronchitis. Slight cough persisting. Vitals within normal ranges. Requires brief assessment.",
    department: "Internal Medicine",
    tags: [],
    createdTime: Date.now() - 1690000, // 28mins 10sec ago
    waitingTimeSec: 1690,
    assignedCabin: "Cabin B"
  }
];
