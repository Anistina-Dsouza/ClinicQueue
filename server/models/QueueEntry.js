const mongoose = require('mongoose');

const queueEntrySchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Patient',
    required: true
  },
  triageRecordId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TriageRecord',
    required: true
  },
  tokenNumber: {
    type: String,
    required: [true, 'Token number is required']
  },
  priorityScore: {
    type: Number,
    required: [true, 'Priority score is required']
  },
  status: {
    type: String,
    default: 'waiting',
    enum: ['waiting', 'called', 'completed', 'cancelled']
  },
  checkInTime: {
    type: Date,
    default: Date.now
  },
  calledTime: {
    type: Date
  },
  completedTime: {
    type: Date
  }
});

module.exports = mongoose.model('QueueEntry', queueEntrySchema);
