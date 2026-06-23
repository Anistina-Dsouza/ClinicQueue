const express = require('express');
const router = express.Router();
const { checkInPatient, transcribeAudio } = require('../controllers/patientController');

// Public patient registration & checkin endpoint
router.post('/checkin', checkInPatient);

// Voice transcription endpoint (accepts base64 audio blob → returns Whisper transcription)
router.post('/transcribe', transcribeAudio);

module.exports = router;