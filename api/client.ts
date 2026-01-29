import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Optionally redirect to login
      if (window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }
    return Promise.reject(error);
  }
);

interface LoginCredentials {
  email: string;
  password: string;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role?: 'USER' | 'ADMIN' | 'SALON_OWNER';
}

export const auth = {
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  register: (data: RegisterData) => api.post('/auth/register', data),
  getProfile: () => api.get('/auth/me'),
  verifyToken: () => api.post('/auth/verify'),
};

export const salons = {
  getAll: () => api.get('/salons'),
  getById: (id: string) => api.get(`/salons/${id}`),
  search: (query: string) => api.get(`/salons/search/query?q=${encodeURIComponent(query)}`),
};

export const appointments = {
  create: (data: any) => api.post('/appointments', data),
  getMy: () => api.get('/appointments/my-appointments'),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
};

// Dashboard Analytics API
export const dashboard = {
  getAnalytics: () => api.get('/dashboard/analytics'),
  getSchedule: (date?: string) => api.get(`/dashboard/schedule${date ? `?date=${date}` : ''}`),
  updateStaffSchedule: (stylistId: string, data: any) => api.put(`/dashboard/schedule/${stylistId}`, data),
};

// Service Management API
export const services = {
  getBySalon: (salonId: string) => api.get(`/services/${salonId}`),
  create: (data: any) => api.post('/services', data),
  update: (id: string, data: any) => api.put(`/services/${id}`, data),
  delete: (id: string) => api.delete(`/services/${id}`),
};

// Customer History API
export const customers = {
  getAll: () => api.get('/customers'),
  getById: (userId: string) => api.get(`/customers/${userId}`),
  update: (userId: string, data: any) => api.put(`/customers/${userId}`, data),
};

// Promo Codes API
export const promos = {
  getAll: () => api.get('/promos'),
  create: (data: any) => api.post('/promos', data),
  update: (id: string, data: any) => api.put(`/promos/${id}`, data),
  delete: (id: string) => api.delete(`/promos/${id}`),
  validate: (code: string, salonId: string, purchaseAmount: number) => 
    api.post('/promos/validate', { code, salonId, purchaseAmount }),
};

export default api;
