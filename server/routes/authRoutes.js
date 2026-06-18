const express = require('express');
const router = express.Router();
const { registerDoctor, loginDoctor, getDoctorProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

// Public endpoints
router.post('/register', registerDoctor);
router.post('/login', loginDoctor);

// Private endpoints (requires JWT token)
router.get('/me', protect, getDoctorProfile);

module.exports = router;