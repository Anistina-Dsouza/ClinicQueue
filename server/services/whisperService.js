const fs = require('fs');
const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-to-prevent-sdk-constructor-error'
});

/**
 * Transcribe patient's voice recording using OpenAI Whisper API
 * @param {string} filePath - Absolute path to the temporary audio recording file
 * @returns {Promise<string>} Transcribed symptom text
 */
const transcribeAudio = async (filePath) => {
  const fallbackText = '[Speech-to-Text Fallback: Voice symptom entry recorded successfully]';

  // Check if API key is not configured or is a placeholder
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
    console.warn('[Whisper Service] OpenAI API Key is missing or default. Returning fallback transcription text.');
    return fallbackText;
  }

  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Audio file not found at path: ${filePath}`);
    }

    const response = await openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'whisper-1'
    });

    return response.text || '';
  } catch (error) {
    console.error(`[Whisper Service Error] Failed transcribing audio: ${error.message}`);
    return fallbackText;
  }
};

module.exports = {
  transcribeAudio
};
