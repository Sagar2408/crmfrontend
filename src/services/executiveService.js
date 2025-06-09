import axios from 'axios';

const API_BASE_URL = 'https://crmbackend-yho0.onrender.com/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// ✅ Get headers with token + company ID
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${getToken()}`,
  'x-company-id': 'f515cb0e-450f-11f0-bcd7-a2aa1a8f1119', // ⬅️ Hardcoded company ID
});

/**
 * Record when executive starts work (login)
 */
export const recordStartWork = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const ExecutiveId = userData?.id;
    const executiveName = userData?.username;

    const payload = { ExecutiveId, executiveName };

    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/startWork`,
      payload,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error('❌ Error recording start work:', error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to record work start');
  }
};

/**
 * Record when executive stops work (logout)
 */
export const recordStopWork = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const ExecutiveId = userData?.id;
    const executiveName = userData?.username;

    const payload = { ExecutiveId, executiveName };

    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/stopWork`,
      payload,
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error('Error recording stop work:', error);
    throw new Error(error.response?.data?.message || 'Failed to record work stop');
  }
};

/**
 * Record when executive starts a break
 */
export const recordStartBreak = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const ExecutiveId = userData?.id;
    const executiveName = userData?.username;

    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/startBreak`,
      { ExecutiveId, executiveName },
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error('Error recording break start:', error);
    throw new Error(error.response?.data?.message || 'Failed to record break start');
  }
};

/**
 * Record when executive stops a break
 */
export const recordStopBreak = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const ExecutiveId = userData?.id;
    const executiveName = userData?.username;

    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/stopBreak`,
      { ExecutiveId, executiveName },
      { headers: getHeaders() }
    );

    return response.data;
  } catch (error) {
    console.error('Error recording break stop:', error);
    throw new Error(error.response?.data?.message || 'Failed to record break stop');
  }
};

/**
 * Start call tracking
 */
export const startCall = async (leadId) => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/updateCallTime`,
      {
        ExecutiveId: userData.id,
        executiveName: userData.username,
        leadId,
        action: 'start',
        callDuration: 1
      },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error starting call:', error);
    throw new Error(error.response?.data?.message || 'Failed to start call');
  }
};

/**
 * End call tracking
 */
export const endCall = async (leadId) => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');
    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/updateCallTime`,
      {
        ExecutiveId: userData.id,
        executiveName: userData.username,
        leadId,
        action: 'end',
        callDuration: 1
      },
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error ending call:', error);
    throw new Error(error.response?.data?.message || 'Failed to end call');
  }
};

/**
 * Get current activity status of executive
 */
export const getActivityStatus = async () => {
  try {
    const userData = JSON.parse(localStorage.getItem("user") || '{}');

    const response = await axios.get(
      `${API_BASE_URL}/executive-activities/status/${userData.id}`,
      { headers: getHeaders() }
    );
    return response.data;
  } catch (error) {
    console.error('Error getting activity status:', error);
    throw new Error(error.response?.data?.message || 'Failed to get activity status');
  }
};

/**
 * Record visit to lead section
 */
export const leadtrackVisit = async (executiveId) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/executive-activities/trackLeadVisit`,
      { ExecutiveId: executiveId },
      { headers: getHeaders() }
    );
  } catch (error) {
    if (error.response) {
      console.error('API error:', error.response.data.message);
    } else {
      console.error('Network error:', error.message);
    }
  }
};
export const sendEmail = async ({
  templateId,
  executiveName,
  executiveEmail,
  clientEmail,
  emailBody,
  emailSubject,
}) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/email/send-email`,
      {
        templateId,
        executiveName,
        executiveEmail,
        clientEmail,
        emailBody,
        emailSubject,
      },
      {
        headers: getHeaders(), // ✅ Add this line
      }
    );
    return response.data;
  } catch (error) {
    console.error("Failed to send email:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || 'Failed to send email');
  }
};
export const getAttendance = async (startDate, endDate) => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/executive-activities/attendance`,
      {
        headers: getHeaders(),
        params: {
          startDate, // pass raw string YYYY-MM-DD
          endDate,
        },
      }
    );
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error("API error:", error.response.data.message);
    } else {
      console.error("Network error:", error.message);
    }
  }
};