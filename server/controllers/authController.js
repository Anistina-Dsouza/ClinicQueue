const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');

/**
 * Generate a JWT token for standard Doctor session auth
 */
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'supersecret_token_key_here', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new doctor profile
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialization } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password, specialization)'
      });
    }

    // Check if doctor email already exists
    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      return res.status(400).json({
        success: false,
        message: 'A doctor with this email is already registered'
      });
    }

    // Create doctor in database (Password is hashed automatically in schema pre-save hook)
    const doctor = await Doctor.create({
      name,
      email,
      password,
      specialization
    });

    res.status(201).json({
      success: true,
      data: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        token: generateToken(doctor._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate doctor and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginDoctor = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    // Find doctor and explicitly request password field
    const doctor = await Doctor.findOne({ email }).select('+password');
    if (!doctor) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Match password
    const isMatch = await doctor.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        token: generateToken(doctor._id)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated doctor profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    // req.doctor is already set by the protect middleware
    res.status(200).json({
      success: true,
      data: req.doctor
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  getDoctorProfile
};
