import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and not a retry and not a login/refresh request
    if (
      error.response?.status === 401 && 
      !originalRequest._retry && 
      originalRequest.url &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh-token')
    ) {
      originalRequest._retry = true;
      try {
        // Use the main API instance to benefit from interceptors if needed, 
        // but avoid recursion by checking URL above.
        const res = await api.post('/auth/refresh-token');
        const { accessToken } = res.data;
        
        useAuthStore.getState().setAccessToken(accessToken);
        
        // Update authorization header and retry original request
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, logout
        useAuthStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);
