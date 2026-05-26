const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a patient name'],
    trim: true
  },
  age: {
    type: Number,
    required: [true, 'Please add the patient\'s age'],
    min: [0, 'Age cannot be negative']
  },
  gender: {
    type: String,
    required: [true, 'Please add a patient gender'],
    enum: ['male', 'female', 'other']
  },
  contactNumber: {
    type: String,
    required: [true, 'Please add a contact number'],
    trim: true
  },
  languagePreference: {
    type: String,
    default: 'en',
    enum: ['en', 'hi']
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Patient', patientSchema);
