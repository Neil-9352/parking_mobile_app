# Parking Mobile Booking System — Implementation Details

**Database**: `parking_lot_final` (MySQL/MariaDB) — schema defined in `database_desctiption.txt`

---

## Status Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Completed |
| 🔄 | In Progress |
| ⬜ | Not Started |

---

## Backend (`parking_app/backend/`)

| # | File | Status | Notes |
|---|------|--------|-------|
| 1 | `package.json` | ✅ | express, mysql2, cors, bcrypt, jsonwebtoken, dotenv, nodemon |
| 2 | `.env.example` | ✅ | DB credentials, JWT secret, port |
| 3 | `server.js` | ✅ | Express entry point, mounts all routes under `/api` |
| 4 | `config/db.js` | ✅ | MySQL connection pool via `mysql2/promise` |
| 5 | `middleware/authMiddleware.js` | ✅ | JWT token verification, attaches `req.user` |
| 6 | `controllers/authController.js` | ✅ | `register` (bcrypt hash), `login` (JWT) |
| 7 | `routes/authRoutes.js` | ✅ | POST `/register`, POST `/login` |
| 8 | `controllers/vehicleController.js` | ✅ | `addVehicle`, `getMyVehicles` |
| 9 | `routes/vehicleRoutes.js` | ✅ | POST `/add`, GET `/my` |
| 10 | `controllers/parkingController.js` | ✅ | `getLots`, `getSlots` |
| 11 | `routes/parkingRoutes.js` | ✅ | GET `/lots`, GET `/slots/:lot_id` |
| 12 | `controllers/bookingController.js` | ✅ | `createBooking` (₹500 deposit), `getMyBookings`, `cancelBooking` |
| 13 | `routes/bookingRoutes.js` | ✅ | POST `/create`, GET `/my`, POST `/cancel/:booking_id` |
| 14 | `controllers/receiptController.js` | ✅ | `getUserReceipts` from `parks_in` table |
| 15 | `routes/receiptRoutes.js` | ✅ | GET `/user/:user_id` |
| 16 | `utils/refundHandler.js` | ✅ | `processVehicleExit` — booking→COMPLETED, refund→REFUNDED, slot→unoccupied |

**Dependencies installed**: express, mysql2, cors, bcrypt, jsonwebtoken, dotenv, nodemon (122 packages, 0 vulnerabilities)

---

## Frontend (`parking_app/frontend/`)

| # | File | Status | Notes |
|---|------|--------|-------|
| 1 | `package.json` | ✅ | Expo, react-navigation, axios, react-native-paper |
| 2 | `App.js` | ✅ | Root component with PaperProvider + AppNavigator |
| 3 | `services/api.js` | ✅ | Axios instance, base URL, auth token interceptor |
| 4 | `navigation/AppNavigator.js` | ✅ | Stack navigator for all screens |
| 5 | `screens/LoginScreen.js` | ✅ | Email + password login |
| 6 | `screens/RegisterScreen.js` | ✅ | Name, email, password, phone |
| 7 | `screens/DashboardScreen.js` | ✅ | My bookings, available lots, vehicles summary |
| 8 | `screens/ParkingLotsScreen.js` | ✅ | List all lots with available slot count |
| 9 | `screens/SlotSelectionScreen.js` | ✅ | Grid view — green/yellow/red color coding |
| 10 | `screens/BookingScreen.js` | ✅ | Slot + vehicle + times + ₹500 deposit → Confirm |
| 11 | `screens/MyBookingsScreen.js` | ✅ | All bookings with lot, slot, vehicle, status, refund |
| 12 | `screens/ReceiptsScreen.js` | ✅ | Vehicle, entry/exit time, fee, download receipt |
| 13 | `screens/VehicleScreen.js` | ✅ | Add vehicle + list user's vehicles |
| 14 | `components/ParkingCard.js` | ✅ | Reusable card for parking lot display |
| 15 | `components/BookingCard.js` | ✅ | Reusable card for booking display |

**Dependencies installed**: expo, expo-status-bar, react-navigation, react-native-paper, axios, async-storage, react-native-screens, react-native-safe-area-context, react-native-vector-icons (635 packages, 0 vulnerabilities)

---

## Other Files

| File | Status | Notes |
|------|--------|-------|
| `parking_app/database_description.txt` | ✅ | Copy of schema file into project folder |

---

## Business Logic Summary

- **Booking deposit**: ₹500 (refundable)
- **Refund trigger**: Vehicle exit (`out_time` set in `parks_in`)
- **Booking statuses**: `ACTIVE`, `CANCELLED`, `COMPLETED`, `NO_SHOW`
- **Refund statuses**: `PENDING`, `REFUNDED`, `NOT_APPLICABLE`
- **Slot statuses**: `occupied`, `unoccupied`, `booked`

---

## Setup Instructions

### Backend
```bash
cd parking_app/backend
cp .env.example .env        # Edit with your MySQL credentials
npm run dev                  # Start with nodemon (hot-reload)
```

### Frontend
```bash
cd parking_app/frontend
npx expo start               # Start Expo dev server
```

> **Note**: Update `API_BASE_URL` in `frontend/services/api.js` to match your backend address.

---

## Verification

| Check | Status |
|-------|--------|
| Backend starts without errors | ⬜ (needs `.env` with DB credentials) |
| Frontend (Expo) starts without errors | ⬜ |
| All API endpoints respond correctly | ⬜ |
