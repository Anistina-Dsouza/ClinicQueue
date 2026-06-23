const fs = require('fs');
const OpenAI = require('openai');

/**
 * Groq-powered Whisper transcription service.
 * Uses Groq's free API (OpenAI-compatible) with whisper-large-v3-turbo model.
 * Free tier: 7,200 seconds of audio per day — no credit card required.
 */
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY || 'dummy-key',
  baseURL: 'https://api.groq.com/openai/v1'
});

/**
 * Transcribe patient's voice recording using Groq Whisper API
 * @param {string} filePath - Absolute path to the temporary audio recording file
 * @returns {Promise<string>} Transcribed symptom text
 */
const transcribeAudio = async (filePath) => {
  const fallbackText = '[Speech-to-Text Fallback: Voice symptom entry recorded successfully]';

  // Check if Groq API key is configured
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'dummy-key') {
    console.warn('[Whisper Service] GROQ_API_KEY is missing. Returning fallback transcription text.');
    return fallbackText;
  }

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found at path: ${filePath}`);
    }

    console.log(`[Whisper Service] Sending audio to Groq Whisper (whisper-large-v3-turbo)...`);

    const response = await groq.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en'
    });

    const text = response.text || '';
    console.log(`[Whisper Service] Groq transcription complete: "${text.substring(0, 80)}"`);
    return text;

  } catch (error) {
    console.error(`[Whisper Service Error] Groq transcription failed: ${error.message}`);
    return fallbackText;
  }
};

module.exports = {
  transcribeAudio
};
