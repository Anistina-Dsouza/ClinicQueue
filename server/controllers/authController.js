const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');
const QueueEntry = require('../models/QueueEntry');

/**
 * Generate a JWT token for standard session auth
 */
const generateToken = (id, role) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET || 'supersecret_token_key_here', {
    expiresIn: '30d'
  });
};

/**
 * @desc    Register a new doctor or admin profile
 * @route   POST /api/auth/register
 * @access  Public
 */
const registerDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialization, role } = req.body;

    if (!name || !email || !password || !specialization) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields (name, email, password, specialization)'
      });
    }

    // Check if email already exists
    const doctorExists = await Doctor.findOne({ email });
    if (doctorExists) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email is already registered'
      });
    }

    // Create doctor in database (Password is hashed automatically in schema pre-save hook)
    const doctor = await Doctor.create({
      name,
      email,
      password,
      specialization,
      role: role || 'doctor'
    });

    res.status(201).json({
      success: true,
      data: {
        _id: doctor._id,
        name: doctor.name,
        email: doctor.email,
        specialization: doctor.specialization,
        role: doctor.role,
        token: generateToken(doctor._id, doctor.role)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate doctor or admin and get token
 * @route   POST /api/auth/login
 * @access  Public
 */
const loginDoctor = async (req, res, next) => {
  try {
    const { email, password, role } = req.body;

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

    // Check role mismatch if client explicitly asked for a specific role
    if (role && doctor.role !== role) {
      return res.status(401).json({
        success: false,
        message: `This account is registered as ${doctor.role}, not ${role}`
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
        role: doctor.role,
        token: generateToken(doctor._id, doctor.role)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Authenticate patient using contact number or token number
 * @route   POST /api/auth/patient/login
 * @access  Public
 */
const loginPatient = async (req, res, next) => {
  try {
    const { contactNumber, tokenNumber } = req.body;

    if (!contactNumber && !tokenNumber) {
      return res.status(400).json({
        success: false,
        message: 'Please provide either a contact number or a token number to login'
      });
    }

    let patient = null;
    let queueEntry = null;

    if (tokenNumber) {
      queueEntry = await QueueEntry.findOne({ tokenNumber: tokenNumber.trim() }).populate('patientId');
      if (!queueEntry) {
        return res.status(404).json({
          success: false,
          message: `No active patient queue entry found for token: ${tokenNumber}`
        });
      }
      patient = queueEntry.patientId;
    } else if (contactNumber) {
      patient = await Patient.findOne({ contactNumber: contactNumber.trim() });
      if (!patient) {
        return res.status(404).json({
          success: false,
          message: `No patient found with contact number: ${contactNumber}`
        });
      }
      queueEntry = await QueueEntry.findOne({ patientId: patient._id });
    }

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: 'Patient profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: patient._id,
        name: patient.name,
        age: patient.age,
        gender: patient.gender,
        contactNumber: patient.contactNumber,
        role: 'patient',
        tokenNumber: queueEntry ? queueEntry.tokenNumber : null,
        token: generateToken(patient._id, 'patient')
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get currently authenticated profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getDoctorProfile = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        ...req.user.toObject(),
        role: req.role
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
  loginDoctor,
  loginPatient,
  getDoctorProfile
};
