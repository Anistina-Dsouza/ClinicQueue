const { redisClient } = require('../config/redis');
const QueueEntry = require('../models/QueueEntry');
const Patient = require('../models/Patient');

const QUEUE_KEY = 'clinic:queue';

/**
 * Calculates priority score combining severity and time.
 * Score = (Severity * 1e11) - checkInTimestampInSeconds
 * This allows higher severity to take precedence, and ties are broken by earlier check-in.
 */
const calculatePriorityScore = (severityScore, checkInTime) => {
  const timestamp = Math.floor(new Date(checkInTime).getTime() / 1000);
  return (severityScore * 100000000000) - timestamp;
};

/**
 * Add a patient to the Redis priority queue
 * @param {string} patientId 
 * @param {number} severityScore (1-5)
 * @param {Date|string} checkInTime 
 */
const addToQueue = async (patientId, severityScore, checkInTime) => {
  try {
    const score = calculatePriorityScore(severityScore, checkInTime);
    await redisClient.zAdd(QUEUE_KEY, {
      score: score,
      value: patientId.toString()
    });
    console.log(`Added patient ${patientId} to Redis queue with priority score: ${score}`);
    return score;
  } catch (error) {
    console.error(`Error adding to Redis queue: ${error.message}`);
    throw error;
  }
};

/**
 * Get live queue populated with Patient and Triage details, sorted by priority
 */
const getLiveQueue = async () => {
  try {
    // Fetch sorted list of patientIds from Redis in descending order (highest score first)
    const redisResults = await redisClient.zRangeWithScores(QUEUE_KEY, 0, -1, { REV: true });
    
    if (redisResults.length === 0) {
      return [];
    }

    const patientIds = redisResults.map(item => item.value);

    // Fetch corresponding records from MongoDB
    const dbEntries = await QueueEntry.find({ patientId: { $in: patientIds } })
      .populate('patientId')
      .populate('triageRecordId');

    // Map DB entries by patientId for fast lookup
    const entryMap = new Map();
    dbEntries.forEach(entry => {
      if (entry.patientId) {
        entryMap.set(entry.patientId._id.toString(), entry);
      }
    });

    // Reconstruct list in the exact order returned by Redis
    const sortedQueue = [];
    redisResults.forEach(redisItem => {
      const dbEntry = entryMap.get(redisItem.value);
      if (dbEntry) {
        // Append calculated score and rank
        const queueObj = dbEntry.toObject();
        queueObj.calculatedPriority = redisItem.score;
        sortedQueue.push(queueObj);
      }
    });

    return sortedQueue;
  } catch (error) {
    console.error(`Error getting live queue: ${error.message}`);
    throw error;
  }
};

/**
 * Update a patient's rank/score in the queue
 */
const updatePriority = async (patientId, severityScore, checkInTime) => {
  try {
    const score = calculatePriorityScore(severityScore, checkInTime);
    await redisClient.zAdd(QUEUE_KEY, {
      score: score,
      value: patientId.toString()
    }, { XX: false }); // Update or insert
    console.log(`Updated patient ${patientId} priority score to: ${score}`);
    return score;
  } catch (error) {
    console.error(`Error updating Redis queue priority: ${error.message}`);
    throw error;
  }
};

/**
 * Remove a patient from the queue (e.g. when called or completed)
 */
const removeFromQueue = async (patientId) => {
  try {
    const result = await redisClient.zRem(QUEUE_KEY, patientId.toString());
    console.log(`Removed patient ${patientId} from Redis queue (Result: ${result})`);
    return result > 0;
  } catch (error) {
    console.error(`Error removing from Redis queue: ${error.message}`);
    throw error;
  }
};

/**
 * Clear the entire Redis queue (useful for resetting/tests)
 */
const clearQueue = async () => {
  try {
    await redisClient.del(QUEUE_KEY);
    console.log('Cleared entire Redis queue.');
  } catch (error) {
    console.error(`Error clearing Redis queue: ${error.message}`);
    throw error;
  }
};

module.exports = {
  addToQueue,
  getLiveQueue,
  updatePriority,
  removeFromQueue,
  clearQueue,
  calculatePriorityScore
};
