const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = require('./db');
const { connectRedis, redisClient } = require('./redis');

// Models
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const TriageRecord = require('../models/TriageRecord');
const QueueEntry = require('../models/QueueEntry');
const queueService = require('../services/queueService');

const mockPatientsData = [
  {
    name: "Elena Rodriguez",
    age: 42,
    gender: "female",
    contactNumber: "+919999900001",
    symptoms: "Chest tightness radiating to the left arm with severe shortness of breath.",
    department: "Cardiology",
    severity: 5,
    tags: ["CHEST PAIN", "DYSPNEA"],
    status: "waiting",
    checkInOffsetMins: -30
  },
  {
    name: "Marcus Chen",
    age: 8,
    gender: "male",
    contactNumber: "+919999900002",
    symptoms: "High fever (103F) with rapid breathing, barking cough and lethargy.",
    department: "Pediatrics",
    severity: 4,
    tags: ["HIGH FEVER", "STRIDOR"],
    status: "waiting",
    checkInOffsetMins: -20
  },
  {
    name: "Sarah Jenkins",
    age: 67,
    gender: "female",
    contactNumber: "+919999900003",
    symptoms: "Sudden onset of numbness in right arm and difficulty forming coherent sentences.",
    department: "Emergency",
    severity: 5,
    tags: ["STROKE ALERT", "APHASIA"],
    status: "waiting",
    checkInOffsetMins: -15
  },
  {
    name: "David Miller",
    age: 31,
    gender: "male",
    contactNumber: "+919999900004",
    symptoms: "Severe deep laceration on right forearm from glass shards, active bleeding but controlled.",
    department: "Orthopedics",
    severity: 3,
    tags: ["LACERATION", "BLEEDING"],
    status: "waiting",
    checkInOffsetMins: -10
  },
  {
    name: "Priya Sharma",
    age: 25,
    gender: "female",
    contactNumber: "+919999900005",
    symptoms: "Acute lower right quadrant abdominal pain with fever, nausea and vomiting.",
    department: "Internal Medicine",
    severity: 4,
    tags: ["APPENDICITIS?"],
    status: "waiting",
    checkInOffsetMins: -5
  },
  {
    name: "Thomas Wright",
    age: 71,
    gender: "male",
    contactNumber: "+919999900008",
    symptoms: "Dizziness and lightheadedness, history of high blood pressure.",
    department: "Cardiology",
    severity: 3,
    tags: ["HYPERTENSION"],
    status: "called",
    cabin: "Cabin 3",
    checkInOffsetMins: -45,
    calledOffsetMins: -10
  },
  {
    name: "Liam Murphy",
    age: 12,
    gender: "male",
    contactNumber: "+919999900006",
    symptoms: "Routine ear infection, pain in left ear for 3 days.",
    department: "Pediatrics",
    severity: 2,
    tags: ["OTITIS"],
    status: "completed",
    checkInOffsetMins: -60,
    completedOffsetMins: -20
  },
  {
    name: "Chloe Zhao",
    age: 55,
    gender: "female",
    contactNumber: "+919999900007",
    symptoms: "Mild chronic back pain flare up after lifting heavy groceries.",
    department: "Orthopedics",
    severity: 2,
    tags: ["BACK PAIN"],
    status: "completed",
    checkInOffsetMins: -75,
    completedOffsetMins: -35
  }
];

async function seedDatabase() {
  try {
    console.log('Connecting to database and cache...');
    await connectDB();
    await connectRedis();

    // 1. Wipe collections
    console.log('Cleaning existing database collections...');
    await Doctor.deleteMany({});
    await Patient.deleteMany({});
    await TriageRecord.deleteMany({});
    await QueueEntry.deleteMany({});
    
    console.log('Cleaning Redis sorted set queue...');
    await queueService.clearQueue();

    // 2. Seed Doctors/Admins
    console.log('Seeding clinicians and admins...');
    const seededDoctors = await Doctor.create([
      {
        name: "Dr. Anistina D'Souza",
        email: 'test@clinic.com',
        password: 'password',
        specialization: 'Pediatrics',
        role: 'doctor'
      },
      {
        name: 'System Admin',
        email: 'admin@clinic.com',
        password: 'password',
        specialization: 'Operations',
        role: 'admin'
      },
      {
        name: 'Dr. Sanjay Gupta',
        email: 'cardio@clinic.com',
        password: 'password',
        specialization: 'Cardiology',
        role: 'doctor'
      },
      {
        name: 'Dr. Chloe Zhao',
        email: 'ortho@clinic.com',
        password: 'password',
        specialization: 'Orthopedics',
        role: 'doctor'
      }
    ]);
    console.log(`Seeded ${seededDoctors.length} doctors and admins.`);

    // 3. Seed Patients, TriageRecords, and QueueEntries
    console.log('Seeding patients and triage assessments...');
    
    let tokenCounter = 1;
    const now = new Date();

    for (const patientData of mockPatientsData) {
      // a. Create Patient
      const patient = await Patient.create({
        name: patientData.name,
        age: patientData.age,
        gender: patientData.gender,
        contactNumber: patientData.contactNumber,
        languagePreference: 'en'
      });

      // b. Create Triage Record
      const triageRecord = await TriageRecord.create({
        patientId: patient._id,
        rawSymptomText: patientData.symptoms,
        severityScore: patientData.severity,
        clinicalSummary: `AI triaged: ${patientData.symptoms}`,
        recommendedDepartment: patientData.department,
        criticalSymptoms: patientData.tags
      });

      // c. Calculate check-in time
      const checkInTime = new Date(now.getTime() + patientData.checkInOffsetMins * 60 * 1000);
      
      // d. Create Queue Entry
      const tokenNumber = `Q-${String(tokenCounter++).padStart(3, '0')}`;
      const priorityScore = queueService.calculatePriorityScore(patientData.severity, checkInTime);

      const queueEntryData = {
        patientId: patient._id,
        triageRecordId: triageRecord._id,
        tokenNumber,
        priorityScore,
        status: patientData.status,
        checkInTime
      };

      if (patientData.status === 'called') {
        queueEntryData.calledTime = new Date(now.getTime() + patientData.calledOffsetMins * 60 * 1000);
        queueEntryData.assignedCabin = patientData.cabin || 'Cabin 3';
      } else if (patientData.status === 'completed') {
        queueEntryData.completedTime = new Date(now.getTime() + patientData.completedOffsetMins * 60 * 1000);
      }

      const queueEntry = await QueueEntry.create(queueEntryData);

      // e. Add to Redis priority queue if status is waiting
      if (patientData.status === 'waiting') {
        await queueService.addToQueue(patient._id, patientData.severity, checkInTime);
        console.log(`Seeded WAITING patient: ${patient.name} (Token: ${tokenNumber})`);
      } else {
        console.log(`Seeded ${patientData.status.toUpperCase()} patient: ${patient.name} (Token: ${tokenNumber})`);
      }
    }

    console.log('\nDatabase and Cache seeding completed successfully! 🎉');
    process.exit(0);

  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
}

seedDatabase();
