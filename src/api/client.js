import axios from 'axios';

const client = axios.create({
  baseURL: '/api',
});

// Attach the JWT to every outgoing request, if one is stored.
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('quiz_engine_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the backend ever returns 401 (expired/invalid token), clear the
// stored session so the app doesn't sit in a broken half-logged-in state.
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('quiz_engine_token');
      localStorage.removeItem('quiz_engine_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default client;
