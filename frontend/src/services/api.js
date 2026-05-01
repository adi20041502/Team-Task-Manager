import axios from 'axios';
import { clearSession, getToken } from '../utils/auth';

const rawBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const baseURL = rawBaseUrl.endsWith('/api') ? rawBaseUrl : `${rawBaseUrl}/api`;

const API = axios.create({ baseURL });

API.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export default API;
