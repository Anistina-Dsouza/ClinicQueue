const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE_NUMBER;

// Helper to check if credentials are valid/configured
const isTwilioConfigured = () => {
  return (
    accountSid && 
    authToken && 
    fromPhone && 
    !accountSid.includes('your_twilio_sid') &&
    !authToken.includes('your_twilio_auth_token')
  );
};

// Initialize Twilio client only if configured
const client = isTwilioConfigured() ? twilio(accountSid, authToken) : null;

/**
 * General helper to send an SMS
 * @param {string} to - Recipient phone number (E.164 format)
 * @param {string} body - SMS message content
 * @returns {Promise<boolean>} True if sent successfully (or emulated successfully)
 */
const sendSMS = async (to, body) => {
  try {
    if (isTwilioConfigured() && client) {
      const message = await client.messages.create({
        body,
        from: fromPhone,
        to
      });
      console.log(`[SMS Service] SMS sent successfully. SID: ${message.sid}`);
      return true;
    } else {
      // Graceful emulation fallback
      console.log('\n--- 💬 [SMS Emulation Output] ---');
      console.log(`To:      ${to}`);
      console.log(`Message: ${body}`);
      console.log('---------------------------------\n');
      return true;
    }
  } catch (error) {
    console.error(`[SMS Service Error] Failed sending SMS to ${to}: ${error.message}`);
    // Return true even on failure to not break patient check-in endpoint flows
    return false;
  }
};

/**
 * Send token confirmation SMS to patient upon check-in
 */
const sendTokenNotification = async (phoneNumber, tokenNumber, position) => {
  const message = `Welcome to ClinicQueue! Your patient token is ${tokenNumber}. You are currently at position #${position} in the priority queue. We will notify you when the doctor is ready.`;
  return await sendSMS(phoneNumber, message);
};

/**
 * Send SMS alerting the patient that their token is called
 */
const sendCalledNotification = async (phoneNumber, tokenNumber, cabinName = 'Cabin 1') => {
  const message = `ClinicQueue Update: Your token ${tokenNumber} has been called. Please proceed immediately to ${cabinName} for your consultation.`;
  return await sendSMS(phoneNumber, message);
};

module.exports = {
  sendSMS,
  sendTokenNotification,
  sendCalledNotification
};
