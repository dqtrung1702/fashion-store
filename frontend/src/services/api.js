import axios from 'axios';
import useAuthStore from '../store/authStore';

const API = axios.create({
  baseURL: '/api',
});

// Add token to requests
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    const requestUrl = error?.config?.url || '';
    const hadToken = Boolean(localStorage.getItem('token'));
    const isLoginRequest = requestUrl.includes('/auth/login');

    if (status === 401 && hadToken && !isLoginRequest) {
      useAuthStore.getState().logout();

      const currentPath = `${window.location.pathname}${window.location.search}`;
      const shouldRedirect =
        !window.location.pathname.startsWith('/login') &&
        ['/admin', '/account', '/orders', '/checkout'].some((path) =>
          window.location.pathname.startsWith(path)
        );

      if (shouldRedirect) {
        window.location.assign(
          `/login?next=${encodeURIComponent(currentPath)}&reason=session-expired`
        );
      }
    }

    return Promise.reject(error);
  }
);

export default API;
