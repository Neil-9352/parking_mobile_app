/**
 * API Service
 * Configures Axios instance with base URL and auth token interceptor
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL for the backend API
// Change this to your backend server address
const API_BASE_URL = 'https://archie.tail69ea66.ts.net/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://10.232.117.50:5000/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://10.186.189.229:5000/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://192.168.1.22:5000/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://10.78.240.56:5000/api'; // Your machine's LAN IP
// const API_BASE_URL = 'http://10.0.2.2:5000/api'; // Android emulator
// const API_BASE_URL = 'http://localhost:5000/api'; // iOS simulator

// Derived host — used for static file URLs (layout images, etc.)
// This strips the /api suffix so it's not duplicated in static file paths
export const API_HOST = API_BASE_URL.replace(/\/api$/, '');

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
  /**
   * Step 1 — Create a Razorpay order for the ₹500 deposit.
   * Returns { order_id, key_id, amount, currency }.
   */
  createOrder: () => api.post('/bookings/create-order'),

  /**
   * Step 2 — Confirm booking after Razorpay SDK reports success.
   * Sends payment proof for server-side signature verification.
   * @param {Object} data - { registration_number, slot_id, expected_start_time,
   *                          expected_end_time, razorpay_order_id,
   *                          razorpay_payment_id, razorpay_signature }
   */
  createBooking: (data) => api.post('/bookings/create', data),

  /**
   * Called when Razorpay SDK fails or user dismisses checkout.
   * Deletes the PAYMENT_PENDING row to free the slot.
   * @param {number} bookingId - The pending booking_id to clean up.
   */
  handlePaymentFailed: (bookingId) => api.post(`/bookings/payment-failed/${bookingId}`),

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
