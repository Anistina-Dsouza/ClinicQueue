const QueueEntry = require('../models/QueueEntry');

// Load Services
const queueService = require('../services/queueService');
const smsService = require('../services/smsService');

/**
 * @desc    Get live sorted priority queue
 * @route   GET /api/queue/live
 * @access  Public
 */
const getLiveQueue = async (req, res, next) => {
  try {
    const queue = await queueService.getLiveQueue();
    res.status(200).json({
      success: true,
      count: queue.length,
      data: queue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Call next patient in priority list
 * @route   POST /api/queue/call-next
 * @access  Private (Doctor only)
 */
const callNextPatient = async (req, res, next) => {
  try {
    const { cabinName } = req.body;
    const assignedCabin = cabinName || (req.doctor ? `Cabin: ${req.doctor.specialization}` : 'Cabin 1');

    // 1. Fetch live queue
    const liveQueue = await queueService.getLiveQueue();
    if (liveQueue.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'The patient queue is currently empty'
      });
    }

    // 2. Select first (highest priority) patient
    const nextPatientEntry = liveQueue[0];

    // 3. Find and update Mongoose QueueEntry
    const queueEntry = await QueueEntry.findById(nextPatientEntry._id).populate('patientId');
    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    // Update status
    queueEntry.status = 'called';
    queueEntry.calledTime = new Date();
    await queueEntry.save();

    // 4. Remove from Redis sorted set queue
    await queueService.removeFromQueue(queueEntry.patientId._id);

    // 5. Send Twilio SMS Notification
    await smsService.sendCalledNotification(
      queueEntry.patientId.contactNumber,
      queueEntry.tokenNumber,
      assignedCabin
    );

    // 6. Emit Socket.io updates for real-time screens & audio calls
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
      io.emit('patientCalled', {
        tokenNumber: queueEntry.tokenNumber,
        patientName: queueEntry.patientId.name,
        cabinName: assignedCabin
      });
      console.log(`[Queue Controller] Emitted patientCalled for ${queueEntry.tokenNumber}`);
    }

    res.status(200).json({
      success: true,
      message: `Called patient with token ${queueEntry.tokenNumber}`,
      data: queueEntry
    });

  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mark a patient's consultation as completed
 * @route   PATCH /api/queue/:id/complete
 * @access  Private (Doctor only)
 */
const completePatient = async (req, res, next) => {
  try {
    const queueEntry = await QueueEntry.findById(req.params.id);
    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    queueEntry.status = 'completed';
    queueEntry.completedTime = new Date();
    await queueEntry.save();

    // Remove from Redis just in case they were not called first
    await queueService.removeFromQueue(queueEntry.patientId);

    // Emit Socket.io update
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
    }

    res.status(200).json({
      success: true,
      message: 'Consultation marked as completed',
      data: queueEntry
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel a patient's queue placement
 * @route   PATCH /api/queue/:id/cancel
 * @access  Private (Doctor only)
 */
const cancelPatient = async (req, res, next) => {
  try {
    const queueEntry = await QueueEntry.findById(req.params.id);
    if (!queueEntry) {
      return res.status(404).json({
        success: false,
        message: 'Queue entry not found'
      });
    }

    queueEntry.status = 'cancelled';
    await queueEntry.save();

    // Remove from Redis queue
    await queueService.removeFromQueue(queueEntry.patientId);

    // Emit Socket.io update
    const io = req.app.get('io');
    if (io) {
      io.emit('queueUpdated');
    }

    res.status(200).json({
      success: true,
      message: 'Queue placement cancelled successfully',
      data: queueEntry
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveQueue,
  callNextPatient,
  completePatient,
  cancelPatient
};
