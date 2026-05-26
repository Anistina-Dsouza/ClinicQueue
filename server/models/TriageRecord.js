const mongoose = require('mongoose');

const triageRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  rawSymptomText: {
    type: String,
    required: [true, 'Please add symptom text']
  },
  transcribedText: {
    type: String,
    trim: true
  },
  severityScore: {
    type: Number,
    required: [true, 'Severity score (1-5) is required'],
    min: [1, 'Severity score must be at least 1'],
    max: [5, 'Severity score cannot exceed 5']
  },
  clinicalSummary: {
    type: String,
    trim: true
  },
  recommendedDepartment: {
    type: String,
    trim: true
  },
  criticalSymptoms: {
    type: [String],
    default: []
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('TriageRecord', triageRecordSchema);
