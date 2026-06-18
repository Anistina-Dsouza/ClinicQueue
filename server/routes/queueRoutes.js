const express = require('express');
const router = express.Router();
const { getLiveQueue, callNextPatient, completePatient, cancelPatient } = require('../controllers/queueController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoint to view live priority queue
router.get('/live', getLiveQueue);

// Protected endpoints (requires doctor auth token)
router.post('/call-next', protect, callNextPatient);
router.patch('/:id/complete', protect, completePatient);
router.patch('/:id/cancel', protect, cancelPatient);

module.exports = router;