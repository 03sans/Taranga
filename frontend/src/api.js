import axios from 'axios';

// All backend routes start with /api in the frontend due to the Vite Proxy.
// The Vite proxy strips /api and routes it to http://localhost:8000
const API_BASE = '/api';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor to add JWT Auth Token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Auth APIs
export const loginUser = async (email, password) => {
  // FastAPI expects form-data for OAuth2PasswordRequestForm
  const formData = new URLSearchParams();
  formData.append('username', email); // OAuth2 expects 'username', not 'email'
  formData.append('password', password);

  const response = await api.post('/auth/login', formData, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });
  return response.data; // { access_token, token_type }
};

export const registerUser = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Screening APIs
export const submitNLPNotes = async (studentId, notes) => {
  const response = await api.post('/screening/nlp', {
    student_id: studentId,
    assessor_id: 1, // Mock assessor ID 
    notes: notes
  });
  return response.data;
};

export const submitAdaptiveScreening = async (studentId, answers) => {
  const response = await api.post('/screening/adaptive', {
    student_id: studentId,
    assessor_id: 1,
    answers: answers
  });
  return response.data;
};

export const fetchResults = async (studentId) => {
  const response = await api.get(`/screening/results/${studentId}`);
  return response.data;
};
