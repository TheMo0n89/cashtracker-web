import axios from 'axios';
import { useAuthStore } from '@/store/auth';

const API_URL = '/v1';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Crucial for sending/receiving the HTTPOnly refresh token
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach the access token if available
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    typeof config.headers.set === 'function'
      ? config.headers.set('Authorization', `Bearer ${token}`)
      : (config.headers.Authorization = `Bearer ${token}`);
  }
  return config;
});

// Response Interceptor: Handle 401 Unauthorized errors to automatically refresh tokens
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and it's not the refresh or login endpoint itself
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/login') &&
      !originalRequest.url?.includes('/auth/refresh')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (originalRequest.headers) {
              typeof originalRequest.headers.set === 'function' 
                ? originalRequest.headers.set('Authorization', `Bearer ${token}`)
                : (originalRequest.headers.Authorization = `Bearer ${token}`);
            }
            return api(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt to refresh the token using the HTTPOnly cookie
        const { data } = await axios.post(`${API_URL}/auth/refresh`, {}, {
          withCredentials: true, // Must send the cookie
        });

        // Backend TransformInterceptor wraps response in { data: { accessToken: "..." } }
        const newAccessToken = data.data?.accessToken || data.accessToken;
        
        // Update the global store
        useAuthStore.getState().setAccessToken(newAccessToken);

        processQueue(null, newAccessToken);
        
        if (originalRequest.headers) {
          typeof originalRequest.headers.set === 'function' 
            ? originalRequest.headers.set('Authorization', `Bearer ${newAccessToken}`)
            : (originalRequest.headers.Authorization = `Bearer ${newAccessToken}`);
        }
        
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Force logout if refresh fails
        useAuthStore.getState().logout();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);
