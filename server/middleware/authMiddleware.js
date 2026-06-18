const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

/**
 * Route protection middleware to authenticate patient, doctor, or admin requests via JWT
 */
const protect = async (req, res, next) => {
  let token;

  // Check for Token in the Authorization header (Bearer token)
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Extract token from Bearer <token>
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecret_token_key_here');

      if (decoded.role === 'patient') {
        // Fetch patient from database and attach to request
        req.patient = await Patient.findById(decoded.id);
        if (!req.patient) {
          return res.status(401).json({
            success: false,
            message: 'Not authorized, patient profile not found'
          });
        }
        req.user = req.patient;
        req.role = 'patient';
      } else {
        // Fetch doctor from database and attach to request object (excluding password)
        req.doctor = await Doctor.findById(decoded.id).select('-password');
        
        if (!req.doctor) {
          return res.status(401).json({
            success: false,
            message: 'Not authorized, profile not found'
          });
        }

        if (!req.doctor.isActive) {
          return res.status(401).json({
            success: false,
            message: 'Not authorized, this profile is deactivated'
          });
        }

        req.user = req.doctor;
        req.role = decoded.role || req.doctor.role || 'doctor';
      }

      next();
    } catch (error) {
      console.error(`[Auth Middleware Error] ${error.message}`);
      return res.status(401).json({
        success: false,
        message: 'Not authorized, token validation failed'
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, authorization token is missing'
    });
  }
};

module.exports = {
  protect
};

