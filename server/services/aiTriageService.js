const OpenAI = require('openai');
const triagePrompt = require('../prompts/triagePrompt');

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'dummy-key-to-prevent-sdk-constructor-error'
});

/**
 * Perform AI triage on a patient's symptoms
 * @param {string} symptomText - Symptoms described by the patient (text or voice transcript)
 * @returns {Promise<Object>} Triage assessment containing severityScore, clinicalSummary, recommendedDepartment, and criticalSymptoms
 */
const performTriage = async (symptomText) => {
  // Safe default fallback object
  const fallbackResult = {
    severityScore: 2,
    clinicalSummary: 'Symptom logs recorded. (Triage evaluated via local fallback client)',
    recommendedDepartment: 'General Medicine',
    criticalSymptoms: []
  };

  // Check if API key is not configured or is a placeholder
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('your_openai_api_key')) {
    console.warn('[AI Triage Service] OpenAI API Key is missing or default. Returning fallback triage assessment.');
    return fallbackResult;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: triagePrompt },
        { role: 'user', content: symptomText }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0].message.content;
    const result = JSON.parse(content);

    // Validate and sanitize response fields
    const severityScore = typeof result.severityScore === 'number' 
      ? Math.max(1, Math.min(5, result.severityScore)) 
      : parseInt(result.severityScore) || 2;
      
    const clinicalSummary = typeof result.clinicalSummary === 'string' && result.clinicalSummary.trim().length > 0
      ? result.clinicalSummary.trim()
      : 'Patient reported symptoms: ' + symptomText.substring(0, 50) + '...';

    const recommendedDepartment = typeof result.recommendedDepartment === 'string' && result.recommendedDepartment.trim().length > 0
      ? result.recommendedDepartment.trim()
      : 'General Medicine';

    const criticalSymptoms = Array.isArray(result.criticalSymptoms)
      ? result.criticalSymptoms.filter(item => typeof item === 'string')
      : [];

    return {
      severityScore,
      clinicalSummary,
      recommendedDepartment,
      criticalSymptoms
    };

  } catch (error) {
    console.error(`[AI Triage Service Error] Failed calling OpenAI API: ${error.message}`);
    return fallbackResult;
  }
};

module.exports = {
  performTriage
};
