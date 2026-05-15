import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Inject token automatically if present
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('cb_token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401/403 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    
    if (typeof window !== 'undefined') {
      if (status === 401) {
        localStorage.removeItem('cb_token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      
      // Se for 403 e estivermos carregando a página, vamos apenas logar no console 
      // para evitar o popup vermelho do Next.js no dev mode
      if (status === 403) {
        console.warn('[API] Access forbidden. Check agency association.');
      }
    }
    
    return Promise.reject(error);
  }
);

export const authApi = {
  login: (email: string, pass: string) => api.post('/auth/login', { email, pass }),
  logout: () => {
    localStorage.removeItem('cb_token');
    window.location.href = '/login';
  },
};
