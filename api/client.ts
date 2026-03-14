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

interface GoogleAuthData {
  token: string;
  email: string;
  name: string;
  googleId: string;
}

interface FacebookAuthData {
  token: string;
  email: string;
  name: string;
  facebookId: string;
}

export const auth = {
  login: (credentials: LoginCredentials) => api.post('/auth/login', credentials),
  register: (data: RegisterData) => api.post('/auth/register', data),
  registerSalonOwner: (formData: FormData) =>
    axios.post(`${API_URL}/auth/register-owner`, formData),
  googleLogin: (data: GoogleAuthData) => api.post('/auth/google', data),
  facebookLogin: (data: FacebookAuthData) => api.post('/auth/facebook', data),
  getProfile: () => api.get('/auth/me'),
  verifyToken: () => api.post('/auth/verify'),
};

export const salons = {
  getAll: () => api.get('/salons'),
  getById: (id: string) => api.get(`/salons/${id}`),
  getMySalon: () => api.get('/salons/my-salon'),
  setup: (data: any) => api.post('/salons/setup', data),
  search: (query: string) => api.get(`/salons/search/query?q=${encodeURIComponent(query)}`),
  filter: (filters: {
    query?: string;
    serviceTypes?: string[];
    minRating?: number;
    priceMin?: number;
    priceMax?: number;
    sortBy?: 'rating' | 'price' | 'name' | 'reviewCount';
    sortOrder?: 'asc' | 'desc';
  }) => api.post('/salons/filter', filters),
  getFeatured: () => api.get('/salons/featured/list'),
  getByCategory: (category: string) => api.get(`/salons/category/${category}`),
  getNearby: (lat: number, lng: number, radius?: number, limit?: number) => 
    api.get(`/salons/nearby?lat=${lat}&lng=${lng}${radius ? `&radius=${radius}` : ''}${limit ? `&limit=${limit}` : ''}`),
  getByCity: (cityName: string) => api.get(`/salons/city/${encodeURIComponent(cityName)}`),
  updateLocation: (id: string, data: { latitude: number; longitude: number; city?: string }) => 
    api.put(`/salons/${id}/location`, data),
};

export const appointments = {
  create: (data: any) => api.post('/appointments', data),
  getMy: () => api.get('/appointments/my-appointments'),
  cancel: (id: string) => api.patch(`/appointments/${id}/cancel`),
  reschedule: (id: string, data: { newDate: string; newStylistId?: string }) => 
    api.patch(`/appointments/${id}/reschedule`, data),
  getAvailableSlots: (stylistId: string, date: string, salonId: string) => 
    api.get(`/appointments/available-slots?stylistId=${stylistId}&date=${date}&salonId=${salonId}`),
  // Salon owner endpoints
  getSalonBookings: () => api.get('/appointments/salon-bookings'),
  accept: (id: string) => api.patch(`/appointments/${id}/accept`),
  reject: (id: string, reason?: string) => api.patch(`/appointments/${id}/reject`, { reason }),
  complete: (id: string) => api.patch(`/appointments/${id}/complete`),
  toggleAutoAccept: (autoAccept: boolean) => api.patch('/appointments/toggle-auto-accept', { autoAccept }),
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

// Admin API
export const admin = {
  // Statistics
  getStats: () => api.get('/admin/stats'),
  
  // User Management
  getUsers: (params?: { role?: string; search?: string; page?: number; limit?: number }) => 
    api.get('/admin/users', { params }),
  updateUserRole: (userId: string, role: string) => 
    api.put(`/admin/users/${userId}/role`, { role }),
  getPendingOwners: () =>
    api.get('/admin/pending-owners'),
  approveOwner: (userId: string) =>
    api.put(`/admin/users/${userId}/approve`),
  rejectOwner: (userId: string, reason?: string) =>
    api.put(`/admin/users/${userId}/reject`, { reason }),
  deleteUser: (userId: string) =>
    api.delete(`/admin/users/${userId}`),
  
  // Salon Management
  getSalons: (params?: { status?: string; search?: string; page?: number; limit?: number }) => 
    api.get('/admin/salons', { params }),
  approveSalon: (salonId: string) => 
    api.put(`/admin/salons/${salonId}/approve`),
  suspendSalon: (salonId: string, reason?: string) => 
    api.put(`/admin/salons/${salonId}/suspend`, { reason }),
  deleteSalon: (salonId: string) =>
    api.delete(`/admin/salons/${salonId}`),
  
  // Booking Management
  getBookings: (params?: { status?: string; search?: string; page?: number; limit?: number }) => 
    api.get('/admin/bookings', { params }),
  updateBookingStatus: (bookingId: string, status: string) => 
    api.put(`/admin/bookings/${bookingId}/status`, { status }),
  
  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (settings: any) => api.put('/admin/settings', settings),
};

// Payment API
export const payments = {
  createIntent: (data: { appointmentId?: string; amount: number; currency?: string }) => 
    api.post('/payments/create-intent', data),
  confirm: (data: { paymentIntentId: string; appointmentId?: string }) => 
    api.post('/payments/confirm', data),
  getHistory: () => api.get('/payments/history'),
  refund: (data: { paymentIntentId?: string; appointmentId?: string; reason?: string }) => 
    api.post('/payments/refund', data),
  getReceipt: (appointmentId: string) => api.get(`/payments/receipt/${appointmentId}`),
};

// Loyalty Program API
export const loyalty = {
  getStatus: () => api.get('/loyalty/status'),
  getHistory: () => api.get('/loyalty/history'),
  earn: (data: { amount: number; appointmentId?: string }) => 
    api.post('/loyalty/earn', data),
  redeem: (data: { points: number; appointmentId?: string }) => 
    api.post('/loyalty/redeem', data),
  getInfo: () => api.get('/loyalty/info'),
};

// Membership API
export const membership = {
  getPlans: () => api.get('/membership/plans'),
  getStatus: () => api.get('/membership/status'),
  upgrade: (data: { targetTier: string; paymentMethod?: string }) => 
    api.post('/membership/upgrade', data),
  downgrade: (data: { targetTier: string }) => 
    api.post('/membership/downgrade', data),
  getBenefits: () => api.get('/membership/benefits'),
  calculateDiscount: (originalPrice: number) => 
    api.post('/membership/calculate-discount', { originalPrice }),
};

// Reviews API
export const reviews = {
  getBySalon: (salonId: string) => api.get(`/reviews/${salonId}`),
  create: (salonId: string, data: { rating: number; comment: string; appointmentId?: string }) =>
    api.post(`/reviews/${salonId}`, data),
  update: (reviewId: string, data: { rating?: number; comment?: string }) =>
    api.put(`/reviews/${reviewId}`, data),
  delete: (reviewId: string) => api.delete(`/reviews/${reviewId}`),
  canReview: (salonId: string) => api.get(`/reviews/${salonId}/can-review`),
};

// Chat API
export const chat = {
  getMessages: (salonId: string, limit?: number) =>
    api.get(`/chat/${salonId}${limit ? `?limit=${limit}` : ''}`),
  sendMessage: (salonId: string, content: string, recipientId?: string) =>
    api.post(`/chat/${salonId}`, { content, recipientId }),
  getConversations: () => api.get('/chat/conversations/my-salon'),
};

// Notifications API
export const notifications = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllAsRead: () => api.patch('/notifications/read-all'),
  delete: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;
