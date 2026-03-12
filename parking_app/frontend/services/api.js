/**
 * API Service
 * Configures Axios instance with base URL and auth token interceptor
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
// Change this to your backend server address
const API_BASE_URL = 'http://172.16.1.93:5000/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://10.232.117.50:5000/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// const API_BASE_URL = 'http://localhost:5000/api'; // iOS simulator

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor — attach JWT token to every request
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle 401 (token expired / invalid)
      if (error.response.status === 401) {
        AsyncStorage.removeItem('token');
        AsyncStorage.removeItem('user');
        // Navigation to login would be handled by the app's auth state
      }
    }
    return Promise.reject(error);
  }
);

// ========================
// Auth API calls
// ========================
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// ========================
// Vehicle API calls
// ========================
export const vehicleAPI = {
  addVehicle: (data) => api.post('/vehicles/add', data),
  getMyVehicles: () => api.get('/vehicles/my'),
};

// ========================
// Parking API calls
// ========================
export const parkingAPI = {
  getLots: (startTime, endTime) => {
    const params = {};
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;
    return api.get('/parking/lots', { params });
  },
  getSlots: (lotId, startTime, endTime) => {
    const params = {};
    if (startTime) params.start_time = startTime;
    if (endTime) params.end_time = endTime;
    return api.get(`/parking/slots/${lotId}`, { params });
  },
};

// ========================
// Booking API calls
// ========================
export const bookingAPI = {
  createBooking: (data) => api.post('/bookings/create', data),
  getMyBookings: () => api.get('/bookings/my'),
  cancelBooking: (bookingId) => api.post(`/bookings/cancel/${bookingId}`),
};

// ========================
// Receipt API calls
// ========================
export const receiptAPI = {
  getUserReceipts: (userId) => api.get(`/receipts/user/${userId}`),
};

export default api;
