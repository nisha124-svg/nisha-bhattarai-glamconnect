import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

let twilioClient: twilio.Twilio | null = null;

// Only initialize if credentials are provided
if (accountSid && authToken && accountSid.length > 0 && authToken.length > 0) {
  try {
    twilioClient = twilio(accountSid, authToken);
    console.log('Twilio client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Twilio client:', error);
  }
}

interface BookingDetails {
  userName: string;
  serviceName: string;
  salonName: string;
  date: Date | string;
  price: number;
}

interface ReminderDetails {
  userName: string;
  serviceName: string;
  salonName: string;
  date: Date | string;
  salonAddress?: string;
}

/**
 * Send SMS booking confirmation
 */
export const sendBookingSMS = async (phoneNumber: string, details: BookingDetails): Promise<boolean> => {
  const { userName, serviceName, salonName, date, price } = details;
  const formattedDate = new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const message = `Hi ${userName}! Your appointment at ${salonName} is confirmed.\n\n` +
    `Service: ${serviceName}\n` +
    `Date: ${formattedDate}\n` +
    `Price: NPR ${price}\n\n` +
    `- GlamConnect`;

  return sendSMS(phoneNumber, message);
};

/**
 * Send SMS appointment reminder (24 hours before)
 */
export const sendAppointmentReminder = async (phoneNumber: string, details: ReminderDetails): Promise<boolean> => {
  const { userName, serviceName, salonName, date, salonAddress } = details;
  const formattedDate = new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  let message = `Reminder: Hi ${userName}, your appointment at ${salonName} is tomorrow!\n\n` +
    `Service: ${serviceName}\n` +
    `Time: ${formattedDate}`;

  if (salonAddress) {
    message += `\nAddress: ${salonAddress}`;
  }

  message += '\n\n- GlamConnect';

  return sendSMS(phoneNumber, message);
};

/**
 * Send SMS cancellation notification
 */
export const sendCancellationSMS = async (phoneNumber: string, details: BookingDetails): Promise<boolean> => {
  const { userName, serviceName, salonName, date } = details;
  const formattedDate = new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const message = `Hi ${userName}, your appointment at ${salonName} has been cancelled.\n\n` +
    `Service: ${serviceName}\n` +
    `Was scheduled: ${formattedDate}\n\n` +
    `We hope to see you again soon!\n- GlamConnect`;

  return sendSMS(phoneNumber, message);
};

/**
 * Send SMS rescheduling notification
 */
export const sendRescheduleSMS = async (
  phoneNumber: string, 
  details: BookingDetails & { newDate: Date | string }
): Promise<boolean> => {
  const { userName, serviceName, salonName, date, newDate } = details;
  const oldFormattedDate = new Date(date).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
  const newFormattedDate = new Date(newDate).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });

  const message = `Hi ${userName}, your appointment at ${salonName} has been rescheduled.\n\n` +
    `Service: ${serviceName}\n` +
    `Old time: ${oldFormattedDate}\n` +
    `New time: ${newFormattedDate}\n\n` +
    `- GlamConnect`;

  return sendSMS(phoneNumber, message);
};

/**
 * Send promotional SMS
 */
export const sendPromoSMS = async (phoneNumber: string, promoMessage: string): Promise<boolean> => {
  const message = `GlamConnect Special Offer!\n\n${promoMessage}\n\nBook now at GlamConnect!`;
  return sendSMS(phoneNumber, message);
};

/**
 * Core SMS sending function
 */
const sendSMS = async (to: string, body: string): Promise<boolean> => {
  // Validate phone number format (basic validation)
  if (!to || to.length < 10) {
    console.log('Invalid phone number provided:', to);
    return false;
  }

  // Ensure phone number has country code
  let formattedNumber = to;
  if (!to.startsWith('+')) {
    // Assume Nepal country code if not provided
    formattedNumber = `+977${to.replace(/^0/, '')}`;
  }

  if (!twilioClient || !twilioPhoneNumber) {
    console.log('Twilio not configured. Would have sent SMS to:', formattedNumber);
    console.log('Message:', body);
    return false;
  }

  try {
    const message = await twilioClient.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedNumber
    });

    console.log('SMS sent successfully. SID:', message.sid);
    return true;
  } catch (error: any) {
    console.error('Error sending SMS:', error.message);
    return false;
  }
};

/**
 * Schedule appointment reminders
 * This function should be called by a cron job or scheduler
 */
export const scheduleReminders = async (): Promise<void> => {
  // This would typically be called by a scheduler like node-cron
  // to send reminders 24 hours before appointments
  console.log('Reminder scheduling would be implemented with a job scheduler');
};

export default {
  sendBookingSMS,
  sendAppointmentReminder,
  sendCancellationSMS,
  sendRescheduleSMS,
  sendPromoSMS
};
