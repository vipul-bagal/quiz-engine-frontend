import axios from 'axios';

const client = axios.create({ baseURL: '/api' });

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('quiz_engine_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Avoid re-triggering this for a login attempt itself (wrong password
      // is also a 401, but that's not a session expiry — it shouldn't
      // bounce someone off the login page they're already on).
      const isLoginRequest = error.config?.url?.includes('/auth/login');
      if (!isLoginRequest) {
        const hadToken = Boolean(localStorage.getItem('quiz_engine_token'));
        localStorage.removeItem('quiz_engine_token');
        localStorage.removeItem('quiz_engine_user');
        if (hadToken) {
          sessionStorage.setItem('session_expired_message', 'Your session expired. Please log in again — nothing you were working on was lost.');
        }
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default client;
