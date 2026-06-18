const Patient = require('../models/Patient');
const TriageRecord = require('../models/TriageRecord');
const QueueEntry = require('../models/QueueEntry');

// Load Services
const aiTriageService = require('../services/aiTriageService');
const whisperService = require('../services/whisperService');
const smsService = require('../services/smsService');
const queueService = require('../services/queueService');

/**
 * @desc    Register a new patient and perform triage
 * @route   POST /api/patients/checkin
 * @access  Public
 */
const checkInPatient = async (req, res, next) => {
  try {
    const { name, age, gender, contactNumber, languagePreference, symptomText, symptomAudioPath } = req.body;

    if (!name || !age || !gender || !contactNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required patient details (name, age, gender, contactNumber)'
      });
    }

    // Determine raw symptom text
    let rawSymptoms = '';
    if (symptomAudioPath) {
      console.log(`[Patient Controller] Audio path provided: ${symptomAudioPath}. Starting transcription...`);
      rawSymptoms = await whisperService.transcribeAudio(symptomAudioPath);
    } else if (symptomText && symptomText.trim().length > 0) {
      rawSymptoms = symptomText.trim();
    } else {
      return res.status(400).json({
        success: false,
        message: 'Please provide either symptomText or symptomAudioPath'
      });
    }

    // 1. Perform AI Triage
    console.log(`[Patient Controller] Initiating AI triage classification for: "${rawSymptoms.substring(0, 40)}..."`);
    const triageData = await aiTriageService.performTriage(rawSymptoms);
    const severityScore = triageData.severityScore;

    // 2. Create Patient in MongoDB
    const patient = await Patient.create({
      name,
      age: Number(age),
      gender,
      contactNumber,
      languagePreference: languagePreference || 'en'
    });

    // 3. Create Triage Record in MongoDB
    const triageRecord = await TriageRecord.create({
      patientId: patient._id,
      rawSymptomText: rawSymptoms,
      transcribedText: symptomAudioPath ? rawSymptoms : undefined,
      severityScore,
      clinicalSummary: triageData.clinicalSummary,
      recommendedDepartment: triageData.recommendedDepartment,
      criticalSymptoms: triageData.criticalSymptoms
    });

    // 4. Generate daily sequential token number (e.g. Q-001, Q-002)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const dailyCount = await QueueEntry.countDocuments({
      checkInTime: { $gte: startOfToday }
    });
    const tokenNumber = `Q-${String(dailyCount + 1).padStart(3, '0')}`;

    // 5. Calculate Priority score
    const priorityScore = queueService.calculatePriorityScore(severityScore, new Date());

    // 6. Create Queue Entry in MongoDB
    const queueEntry = await QueueEntry.create({
      patientId: patient._id,
      triageRecordId: triageRecord._id,
      tokenNumber,
      priorityScore,
      status: 'waiting',
      checkInTime: new Date()
    });

    // 7. Add patient to Redis priority queue
    await queueService.addToQueue(patient._id, severityScore, queueEntry.checkInTime);

    // 8. Find position of patient in live queue
    const liveQueue = await queueService.getLiveQueue();
    const position = liveQueue.findIndex(
      (item) => item.patientId && item.patientId._id.toString() === patient._id.toString()
    ) + 1;

    // 9. Send Twilio SMS Notification
    await smsService.sendTokenNotification(contactNumber, tokenNumber, position || 1);

    // 10. Emit Socket.io update to refresh clinician dashboards
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
      console.log('[Patient Controller] Emitted queueUpdated WebSocket broadcast.');
    }

    res.status(201).json({
      success: true,
      data: {
        patient,
        triageRecord,
        queueEntry,
        position: position || 1
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  checkInPatient
};
