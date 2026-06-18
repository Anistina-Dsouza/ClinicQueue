const express = require('express');
const router = express.Router();
const { checkInPatient } = require('../controllers/patientController');

// Public patient registration & checkin endpoint
router.post('/checkin', checkInPatient);

module.exports = router;