const express = require('express');
const router = express.Router();
const { performTriage } = require('../services/aiTriageService');

// Public symptom triage evaluation endpoint (direct text diagnostic)
router.post('/', async (req, res, next) => {
  try {
    const { symptomText } = req.body;
    if (!symptomText) {
      return res.status(400).json({
        success: false,
        message: 'Please provide symptomText'
      });
    }

    const triageResult = await performTriage(symptomText);
    res.status(200).json({
      success: true,
      data: triageResult
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;