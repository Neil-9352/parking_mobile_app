# Parking Booking Mobile App — Full Project Summary

## Project Overview

A full-stack mobile parking booking system that allows users to register, log in, register their vehicles, view available parking lots, check slot availability based on time, pre-book parking slots with a ₹500 refundable deposit, view/cancel bookings, and view receipts after parking is completed. Refunds are processed automatically when a vehicle exits the lot.

- **Backend**: Node.js + Express + MySQL (MariaDB)
- **Frontend**: React Native + Expo + React Native Paper (Material Design)
- **Database**: `parking_lot_final` (MySQL/MariaDB)

---

## Project Folder Structure

```
parking_app/
├── database_description.txt
├── IMPLEMENTATION_DETAILS.md
├── project_summary.md
│
├── backend/
│   ├── server.js                          # Express app entry point
│   ├── package.json                       # Backend dependencies
│   ├── .env                               # Environment variables (DB creds, JWT secret)
│   ├── .env.example                       # Template for .env
│   ├── config/
│   │   └── db.js                          # MySQL connection pool
│   ├── middleware/
│   │   └── authMiddleware.js              # JWT verification middleware
│   ├── routes/
│   │   ├── authRoutes.js                  # Auth endpoints
│   │   ├── vehicleRoutes.js               # Vehicle endpoints
│   │   ├── parkingRoutes.js               # Parking lot/slot endpoints
│   │   ├── bookingRoutes.js               # Booking endpoints
│   │   └── receiptRoutes.js               # Receipt endpoints
│   ├── controllers/
│   │   ├── authController.js              # Register/login logic
│   │   ├── vehicleController.js           # Vehicle CRUD logic
│   │   ├── parkingController.js           # Lot/slot retrieval logic
│   │   ├── bookingController.js           # Booking create/cancel logic
│   │   └── receiptController.js           # Receipt retrieval logic
│   ├── utils/
│   │   └── refundHandler.js               # Vehicle exit + refund processing
│   └── uploads/
│       └── layouts/                       # Parking lot layout images
│           ├── Lot_1_layout.png
│           └── Lot_2_layout.png
│
├── frontend/
│   ├── App.js                             # Root component
│   ├── app.json                           # Expo configuration
│   ├── package.json                       # Frontend dependencies
│   ├── navigation/
│   │   └── AppNavigator.js                # Stack navigator
│   ├── screens/
│   │   ├── LoginScreen.js                 # Login form
│   │   ├── RegisterScreen.js              # Registration form
│   │   ├── DashboardScreen.js             # Main dashboard hub
│   │   ├── DateSelectionScreen.js         # Date/time picker for parking
│   │   ├── ParkingLotsScreen.js           # List of parking lots
│   │   ├── SlotSelectionScreen.js         # Slot grid + layout image
│   │   ├── BookingScreen.js               # Booking confirmation
│   │   ├── MyBookingsScreen.js            # User's bookings list
│   │   ├── ReceiptsScreen.js              # Parking receipts
│   │   └── VehicleScreen.js               # Vehicle management
│   ├── components/
│   │   ├── ParkingCard.js                 # Lot card component
│   │   └── BookingCard.js                 # Booking card component
│   └── services/
│       └── api.js                         # Axios instance + all API calls
```

---

## Database Schema

Database name: `parking_lot_final`

### Tables

#### `user`
| Column     | Type         | Key | Extra          |
|------------|-------------|-----|----------------|
| `user_id`  | int(11)      | PRI | auto_increment |
| `username` | varchar(50)  | UNI |                |
| `password` | varchar(255) |     |                |
| `name`     | varchar(100) |     |                |
| `phone`    | varchar(15)  |     |                |

#### `admin`
| Column     | Type         | Key | Extra          |
|------------|-------------|-----|----------------|
| `id`       | int(11)      | PRI | auto_increment |
| `username` | varchar(50)  | UNI |                |
| `password` | varchar(255) |     |                |

#### `vehicle`
| Column                | Type                          | Key | Extra |
|-----------------------|-------------------------------|-----|-------|
| `registration_number` | varchar(20)                   | PRI |       |
| `type`                | enum('2-wheeler','4-wheeler') |     |       |
| `user_id`             | int(11)                       | MUL | FK → user.user_id |

#### `parking_lot`
| Column              | Type         | Key | Extra          |
|---------------------|-------------|-----|----------------|
| `lot_id`            | int(11)      | PRI | auto_increment |
| `lot_name`          | varchar(100) |     |                |
| `address`           | varchar(255) |     |                |
| `layout_image_path` | varchar(255) |     |                |

#### `parking_slot`
| Column    | Type                                   | Key | Extra          |
|-----------|---------------------------------------|-----|----------------|
| `slot_id` | int(11)                                | PRI | auto_increment |
| `slot_no` | int(11)                                |     |                |
| `status`  | enum('occupied','unoccupied','booked') |     | default: unoccupied |
| `lot_id`  | int(11)                                | MUL | FK → parking_lot.lot_id |

> **Note:** `parking_slot.status` is used only for **real-time physical occupancy tracking** (occupied = vehicle physically parked, unoccupied = empty). Booking availability is determined from the `books` table via time overlap checks, NOT from this column.

#### `books`
| Column                | Type                                             | Key | Extra          |
|-----------------------|-------------------------------------------------|-----|----------------|
| `booking_id`          | int(11)                                          | PRI | auto_increment |
| `user_id`             | int(11)                                          | MUL | FK → user.user_id |
| `registration_number` | varchar(20)                                      | MUL | FK → vehicle.registration_number |
| `slot_id`             | int(11)                                          | MUL | FK → parking_slot.slot_id |
| `booking_time`        | timestamp                                        |     | default: current_timestamp |
| `expected_start_time` | datetime                                         |     |                |
| `expected_end_time`   | datetime                                         |     |                |
| `booking_amount`      | decimal(10,2)                                    |     |                |
| `booking_status`      | enum('ACTIVE','CANCELLED','COMPLETED','NO_SHOW') |     | default: ACTIVE |
| `refund_status`       | enum('PENDING','REFUNDED','NOT_APPLICABLE')      |     | default: PENDING |

**Index:** `idx_booking_slot_time` on `(slot_id, expected_start_time, expected_end_time)` for fast overlap queries.

#### `parks_in`
| Column                | Type          | Key | Extra          |
|-----------------------|--------------|-----|----------------|
| `id`                  | int(11)       | PRI | auto_increment |
| `registration_number` | varchar(20)   | MUL | FK → vehicle |
| `slot_id`             | int(11)       | MUL | FK → parking_slot |
| `lot_id`              | int(11)       | MUL | FK → parking_lot |
| `fee_id`              | int(11)       | MUL | FK → fee |
| `in_time`             | datetime      |     |                |
| `out_time`            | datetime      |     | nullable       |
| `fee`                 | decimal(10,2) |     | nullable       |
| `receipt_path`        | varchar(255)  |     | nullable       |

#### `fee`
| Column              | Type                          | Key | Extra          |
|---------------------|-------------------------------|-----|----------------|
| `fee_id`            | int(11)                       | PRI | auto_increment |
| `lot_id`            | int(11)                       | MUL | FK → parking_lot |
| `vehicle_type`      | enum('2-wheeler','4-wheeler') |     |                |
| `first_hour_charge` | decimal(10,2)                 |     |                |
| `rest_hour_charge`  | decimal(10,2)                 |     |                |
| `created_at`        | timestamp                     |     | default: current_timestamp |

---

## Backend Details

### Server Setup (`server.js`)

- **Framework**: Express.js
- **Port**: `process.env.PORT` or `5000`
- **Middleware**: CORS, JSON body parser, URL-encoded parser
- **Static files**: `/uploads` → serves `uploads/` directory (parking lot layout images)
- **Route mounting**:
  - `/api/auth` → authRoutes
  - `/api/vehicles` → vehicleRoutes
  - `/api/parking` → parkingRoutes
  - `/api/bookings` → bookingRoutes
  - `/api/receipts` → receiptRoutes
- **Health check**: `GET /api/health` → returns `{ success: true, message, timestamp }`
- **404 handler**: returns `{ success: false, message }` for unknown routes
- **Error handler**: global catch-all for unhandled errors

### Database Connection (`config/db.js`)

- Uses `mysql2/promise` with a connection pool
- Pool config: 10 connections max, no queue limit
- Tests connection on startup and logs success/failure
- Reads credentials from `.env`:
  - `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT`

### Environment Variables (`.env`)

```
DB_HOST=localhost
DB_USER=<username>
DB_PASSWORD=<password>
DB_NAME=parking_lot_final
DB_PORT=3306
JWT_SECRET=<secret_key>
JWT_EXPIRES_IN=24h
PORT=5000
```

### Authentication Middleware (`middleware/authMiddleware.js`)

- Extracts JWT from `Authorization: Bearer <token>` header
- Verifies token with `process.env.JWT_SECRET`
- Sets `req.user = { id, username, name }` from decoded token payload
- Returns 401 for: missing token, expired token, invalid token
- Applied to all routes except auth and health check

---

## API Endpoints — Full Detail

### 1. Authentication

#### `POST /api/auth/register`

**Auth required:** No

**Request body:**
```json
{
  "name": "John Doe",
  "username": "johndoe",
  "password": "secret123",
  "phone": "9876543210"
}
```

**Logic:**
1. Validate all 4 fields are present
2. Check if username already exists in `user` table
3. Hash password with bcrypt (10 salt rounds)
4. Insert into `user(username, password, name, phone)`
5. Return the new `user_id`

**Success response (201):**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user_id": 1,
    "name": "John Doe",
    "username": "johndoe",
    "phone": "9876543210"
  }
}
```

**Error responses:**
- 400: Missing required fields
- 409: Username already exists
- 500: Internal server error

---

#### `POST /api/auth/login`

**Auth required:** No

**Request body:**
```json
{
  "username": "johndoe",
  "password": "secret123"
}
```

**Logic:**
1. Validate username and password are present
2. Query `SELECT * FROM user WHERE username = ?`
3. Compare password with bcrypt
4. Generate JWT with payload `{ id: user.user_id, username, name }`
5. Token expires in `JWT_EXPIRES_IN` (default 24h)

**Success response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": 1,
      "name": "John Doe",
      "username": "johndoe",
      "phone": "9876543210"
    }
  }
}
```

**Error responses:**
- 400: Missing fields
- 401: Invalid username or password
- 500: Internal server error

---

### 2. Vehicles

#### `POST /api/vehicles/add`

**Auth required:** Yes (JWT)

**Request body:**
```json
{
  "registration_number": "KA01AB1234",
  "type": "4-wheeler"
}
```

**Logic:**
1. Extract `user_id` from JWT
2. Validate `registration_number` and `type` are present
3. Validate `type` is either `"2-wheeler"` or `"4-wheeler"`
4. Check if vehicle exists:
   - **Not found** → Insert new vehicle with `user_id`
   - **Found with `user_id = NULL`** → Update to link the current user (returns 200)
   - **Found with a `user_id`** → Return 409 conflict
5. Return the vehicle data

**Success response (201 for new, 200 for linked):**
```json
{
  "success": true,
  "message": "Vehicle registered successfully",
  "data": {
    "registration_number": "KA01AB1234",
    "type": "4-wheeler",
    "user_id": 1
  }
}
```

**Error responses:**
- 400: Missing fields or invalid type
- 409: Vehicle already registered to another user
- 500: Internal server error

---

#### `GET /api/vehicles/my`

**Auth required:** Yes (JWT)

**Logic:**
1. Extract `user_id` from JWT
2. Query `SELECT registration_number, type, user_id FROM vehicle WHERE user_id = ?`

**Success response (200):**
```json
{
  "success": true,
  "message": "Vehicles retrieved successfully",
  "data": [
    { "registration_number": "KA01AB1234", "type": "4-wheeler", "user_id": 1 },
    { "registration_number": "KA01CD5678", "type": "2-wheeler", "user_id": 1 }
  ]
}
```

---

### 3. Parking Lots & Slots

#### `GET /api/parking/lots`

**Auth required:** Yes (JWT)

**Query parameters (optional):**
- `start_time` — e.g. `2026-03-10 14:00`
- `end_time` — e.g. `2026-03-10 16:00`

**Logic:**
- **With time params**: Counts `available_slots` as slots that do **NOT** have an overlapping ACTIVE booking:
  ```sql
  SUM(
    CASE WHEN ps.slot_id NOT IN (
      SELECT b.slot_id FROM books b
      WHERE b.booking_status = 'ACTIVE'
        AND b.expected_start_time < <end_time>
        AND b.expected_end_time > <start_time>
    ) THEN 1 ELSE 0 END
  ) AS available_slots
  ```
- **Without time params**: Fallback to counting slots where `status = 'unoccupied'`
- Also returns `layout_image_path` for each lot

**Success response (200):**
```json
{
  "success": true,
  "message": "Parking lots retrieved successfully",
  "data": [
    {
      "lot_id": 1,
      "lot_name": "Lot 1",
      "address": "Jalukbari",
      "layout_image_path": "uploads/layouts/Lot_1_layout.png",
      "total_slots": 20,
      "available_slots": 15
    }
  ]
}
```

---

#### `GET /api/parking/slots/:lot_id`

**Auth required:** Yes (JWT)

**URL params:**
- `lot_id` — the parking lot ID

**Query parameters (optional):**
- `start_time` — e.g. `2026-03-10 14:00`
- `end_time` — e.g. `2026-03-10 16:00`

**Logic:**
1. Verify lot exists, return `lot_id`, `lot_name`, `layout_image_path`
2. **With time params**: Each slot is returned with an `available` boolean (1 or 0):
   ```sql
   CASE WHEN ps.slot_id IN (
     SELECT b.slot_id FROM books b
     WHERE b.booking_status = 'ACTIVE'
       AND b.expected_start_time < <end_time>
       AND b.expected_end_time > <start_time>
   ) THEN 0 ELSE 1 END AS available
   ```
3. **Without time params**: Fallback — `available = 1` if `status = 'unoccupied'`

**Success response (200):**
```json
{
  "success": true,
  "message": "Slots retrieved successfully",
  "data": {
    "lot": { "lot_id": 1, "lot_name": "Lot 1", "layout_image_path": "uploads/layouts/Lot_1_layout.png" },
    "slots": [
      { "slot_id": 1, "slot_no": 1, "status": "unoccupied", "available": 1 },
      { "slot_id": 2, "slot_no": 2, "status": "unoccupied", "available": 0 },
      { "slot_id": 3, "slot_no": 3, "status": "occupied", "available": 0 }
    ]
  }
}
```

**Error responses:**
- 404: Parking lot not found
- 500: Internal server error

---

### 4. Bookings

#### `POST /api/bookings/create`

**Auth required:** Yes (JWT)

**Request body:**
```json
{
  "registration_number": "KA01AB1234",
  "slot_id": 5,
  "expected_start_time": "2026-03-10 14:00",
  "expected_end_time": "2026-03-10 16:00"
}
```

**Logic (uses transaction):**
1. Validate all 4 fields
2. Begin transaction
3. Verify vehicle belongs to the user: `SELECT FROM vehicle WHERE registration_number = ? AND user_id = ?`
4. Verify slot exists: `SELECT FROM parking_slot WHERE slot_id = ?`
5. Check for overlapping ACTIVE bookings on this slot:
   ```sql
   SELECT booking_id FROM books
   WHERE slot_id = ? AND booking_status = 'ACTIVE'
     AND expected_start_time < <end_time>
     AND expected_end_time > <start_time>
   ```
6. If overlap → rollback, return 400
7. Insert into `books` with `booking_status = 'ACTIVE'`, `refund_status = 'PENDING'`, `booking_amount = 500`
8. **Does NOT update `parking_slot.status`**
9. Commit transaction

**Success response (201):**
```json
{
  "success": true,
  "message": "Booking created successfully",
  "data": {
    "booking_id": 1,
    "user_id": 1,
    "registration_number": "KA01AB1234",
    "slot_id": 5,
    "slot_no": 5,
    "expected_start_time": "2026-03-10 14:00",
    "expected_end_time": "2026-03-10 16:00",
    "booking_amount": 500,
    "booking_status": "ACTIVE",
    "refund_status": "PENDING"
  }
}
```

**Error responses:**
- 400: Missing fields, slot has overlapping booking
- 404: Vehicle not found / slot not found
- 500: Internal server error

---

#### `GET /api/bookings/my`

**Auth required:** Yes (JWT)

**Logic:**
1. Extract `user_id` from JWT
2. Query books joined with parking_slot and parking_lot:
   ```sql
   SELECT b.booking_id, b.registration_number, b.booking_time,
          b.expected_start_time, b.expected_end_time,
          b.booking_amount, b.booking_status, b.refund_status,
          ps.slot_no, ps.slot_id, pl.lot_name, pl.lot_id
   FROM books b
   JOIN parking_slot ps ON b.slot_id = ps.slot_id
   JOIN parking_lot pl ON ps.lot_id = pl.lot_id
   WHERE b.user_id = ?
   ORDER BY b.booking_time DESC
   ```

**Success response (200):**
```json
{
  "success": true,
  "message": "Bookings retrieved successfully",
  "data": [
    {
      "booking_id": 1,
      "registration_number": "KA01AB1234",
      "booking_time": "2026-03-10T08:00:00.000Z",
      "expected_start_time": "2026-03-10T08:30:00.000Z",
      "expected_end_time": "2026-03-10T10:30:00.000Z",
      "booking_amount": "500.00",
      "booking_status": "ACTIVE",
      "refund_status": "PENDING",
      "slot_no": 5,
      "slot_id": 5,
      "lot_name": "Lot 1",
      "lot_id": 1
    }
  ]
}
```

---

#### `POST /api/bookings/cancel/:booking_id`

**Auth required:** Yes (JWT)

**URL params:**
- `booking_id` — the booking to cancel

**Logic (uses transaction):**
1. Begin transaction
2. Fetch booking with `FOR UPDATE` lock: `WHERE booking_id = ? AND user_id = ?`
3. Verify booking exists and belongs to user
4. Verify booking status is `ACTIVE`
5. Update booking: `booking_status = 'CANCELLED'`, `refund_status = 'REFUNDED'`
6. **Does NOT update `parking_slot.status`**
7. Commit transaction

**Success response (200):**
```json
{
  "success": true,
  "message": "Booking cancelled successfully. Refund of ₹500 will be processed.",
  "data": {
    "booking_id": 1,
    "booking_status": "CANCELLED",
    "refund_status": "REFUNDED",
    "refund_amount": 500
  }
}
```

**Error responses:**
- 400: Booking not in ACTIVE status
- 404: Booking not found or doesn't belong to user
- 500: Internal server error

---

### 5. Receipts

#### `GET /api/receipts/user/:user_id`

**Auth required:** Yes (JWT)

**URL params:**
- `user_id` — the user to fetch receipts for

**Logic:**
```sql
SELECT pi.id, pi.registration_number, pi.slot_id, pi.lot_id,
       pi.fee_id, pi.in_time, pi.out_time, pi.fee, pi.receipt_path,
       pl.lot_name, ps.slot_no
FROM parks_in pi
JOIN vehicle v ON pi.registration_number = v.registration_number
JOIN parking_lot pl ON pi.lot_id = pl.lot_id
JOIN parking_slot ps ON pi.slot_id = ps.slot_id
WHERE v.user_id = ?
ORDER BY pi.in_time DESC
```

**Success response (200):**
```json
{
  "success": true,
  "message": "Receipts retrieved successfully",
  "data": [
    {
      "id": 1,
      "registration_number": "KA01AB1234",
      "slot_id": 5,
      "lot_id": 1,
      "fee_id": 1,
      "in_time": "2026-03-10T08:30:00.000Z",
      "out_time": "2026-03-10T10:30:00.000Z",
      "fee": "50.00",
      "receipt_path": null,
      "lot_name": "Lot 1",
      "slot_no": 5
    }
  ]
}
```

---

### 6. Health Check

#### `GET /api/health`

**Auth required:** No

**Response (200):**
```json
{
  "success": true,
  "message": "Parking Management System API is running",
  "timestamp": "2026-03-10T05:13:28.000Z"
}
```

---

### 7. Static Files

**`GET /uploads/<path>`**

Serves static files from `backend/uploads/`. Used for parking lot layout images.

Example: `http://<host>:5000/uploads/layouts/Lot_1_layout.png`

---

### 8. Refund Handler (Utility — `utils/refundHandler.js`)

Not exposed as an API endpoint. Called programmatically when a vehicle exits.

**Function:** `processVehicleExit(registration_number, slot_id, parking_record_id)`

**Logic (uses transaction):**
1. Update `parks_in` → set `out_time = NOW()`
2. Find the active booking for this vehicle + slot
3. Update booking → `booking_status = 'COMPLETED'`, `refund_status = 'REFUNDED'`
4. Update `parking_slot.status = 'unoccupied'` (real-time occupancy only)
5. Commit

---

## Frontend Details

### Technology Stack

- **React Native** with **Expo**
- **React Navigation** (native stack navigator)
- **React Native Paper** (Material Design UI components)
- **Axios** (HTTP client with JWT interceptors)
- **AsyncStorage** (local token/user persistence)
- **@react-native-community/datetimepicker** (native date/time pickers)

### API Service (`services/api.js`)

- **Base URL**: `http://172.16.1.21:5000/api` (configurable LAN IP)
- **Axios instance** with 10-second timeout
- **Request interceptor**: reads JWT from AsyncStorage, attaches as `Authorization: Bearer <token>`
- **Response interceptor**: on 401, clears token/user from AsyncStorage

**Exported API modules:**

| Module       | Method                              | HTTP Call                                     |
|-------------|-------------------------------------|-----------------------------------------------|
| `authAPI`    | `register(data)`                   | `POST /auth/register`                         |
| `authAPI`    | `login(data)`                      | `POST /auth/login`                            |
| `vehicleAPI` | `addVehicle(data)`                | `POST /vehicles/add`                          |
| `vehicleAPI` | `getMyVehicles()`                 | `GET /vehicles/my`                            |
| `parkingAPI` | `getLots(startTime, endTime)`     | `GET /parking/lots?start_time=...&end_time=...` |
| `parkingAPI` | `getSlots(lotId, startTime, endTime)` | `GET /parking/slots/:lotId?start_time=...&end_time=...` |
| `bookingAPI` | `createBooking(data)`             | `POST /bookings/create`                       |
| `bookingAPI` | `getMyBookings()`                 | `GET /bookings/my`                            |
| `bookingAPI` | `cancelBooking(bookingId)`        | `POST /bookings/cancel/:bookingId`            |
| `receiptAPI` | `getUserReceipts(userId)`         | `GET /receipts/user/:userId`                  |

---

### Navigation (`navigation/AppNavigator.js`)

**Navigator type:** Native Stack Navigator

**Screen stack:**

| Route Name        | Screen Component      | Header Title      | Notes                     |
|-------------------|-----------------------|-------------------|---------------------------|
| `Login`           | LoginScreen           | *(hidden)*        | Initial route             |
| `Register`        | RegisterScreen        | *(hidden)*        |                           |
| `Dashboard`       | DashboardScreen       | "Dashboard"       | No back button to login   |
| `DateSelection`   | DateSelectionScreen   | "Select Duration" |                           |
| `ParkingLots`     | ParkingLotsScreen     | "Available Lots"  |                           |
| `SlotSelection`   | SlotSelectionScreen   | "Select a Slot"   |                           |
| `Booking`         | BookingScreen         | "Confirm Booking" |                           |
| `MyBookings`      | MyBookingsScreen      | "My Bookings"     |                           |
| `Receipts`        | ReceiptsScreen        | "Receipts"        |                           |
| `Vehicles`        | VehicleScreen         | "My Vehicles"     |                           |

**Header style:** Blue background (`#1a73e8`), white text, bold title.

---

### Screens — Detailed Description

#### 1. LoginScreen

- Text inputs: **Username**, **Password**
- "Login" button → calls `authAPI.login({ username, password })`
- On success: stores `token` and `user` in AsyncStorage, navigates to `Dashboard`
- "Don't have an account? Register" link → navigates to `Register`

#### 2. RegisterScreen

- Text inputs: **Name**, **Username**, **Password**, **Phone**
- "Register" button → calls `authAPI.register({ name, username, password, phone })`
- On success: shows success alert, navigates to `Login`
- "Already have an account? Login" link → navigates to `Login`

#### 3. DashboardScreen

- **Welcome card**: Shows "Hello, {name} 👋"
- **Stats row**: Two cards showing `Active Bookings` count and `My Vehicles` count
  - Fetches from `bookingAPI.getMyBookings()` and `vehicleAPI.getMyVehicles()` in parallel
  - Active bookings = bookings where `booking_status === 'ACTIVE'`
- **Quick action cards** (tappable):
  - 🅿️ **Find Parking** → navigates to `DateSelection`
  - 📋 **My Bookings** → navigates to `MyBookings` (shows badge if active bookings > 0)
  - 🚘 **My Vehicles** → navigates to `Vehicles`
  - 🧾 **Receipts** → navigates to `Receipts`
- **Logout button**: clears AsyncStorage, resets navigation to `Login`
- Pull-to-refresh refreshes stats

#### 4. DateSelectionScreen

- **Standalone page** — only date/time pickers, no lot listing
- Two rows: **FROM** (start date + time) and **TO** (end date + time)
- Each date/time button opens a **native DateTimePicker** (`@react-native-community/datetimepicker`)
- After selecting a date, the time picker auto-opens
- Default: start = now, end = now + 2 hours
- Minimum date for start = now; minimum date for end = start
- **"Find Available Lots" button** → validates end > start, then navigates to `ParkingLots` with params:
  - `start_time`, `end_time` (formatted as `YYYY-MM-DD HH:mm`)
  - `display_start`, `display_end` (human-readable strings)

#### 5. ParkingLotsScreen

- Receives `start_time`, `end_time`, `display_start`, `display_end` from params
- **Duration banner** at top showing selected start/end as chips
- Calls `parkingAPI.getLots(start_time, end_time)` → date-aware availability
- Shows `FlatList` of `ParkingCard` components
- Each card shows: lot name, address, `X of Y free` (date-aware count)
- Tapping a lot navigates to `SlotSelection` with:
  - `lot_id`, `lot_name`, `layout_image_path`, `start_time`, `end_time`
- Pull-to-refresh refetches lots

#### 6. SlotSelectionScreen

- Receives `lot_id`, `lot_name`, `layout_image_path`, `start_time`, `end_time` from params
- Calls `parkingAPI.getSlots(lot_id, start_time, end_time)` → each slot has `available` boolean
- **Header**: lot name + "X of Y slots available for selected time"
- **"View Parking Lot Layout" button** (shown if `layout_image_path` exists):
  - Opens a **Modal** with the lot layout image loaded from `http://<host>:5000/<layout_image_path>`
  - Image rendered with `resizeMode="contain"`
  - Close button in modal header
  - Error handler shows alert if image fails to load
- **Legend**: Green = Available, Red = Unavailable
- **Slot grid**: 4-column FlatList
  - **Green slots** (`available = true`): shows slot number + 🚗 emoji, tappable
  - **Red slots** (`available = false`): shows slot number + 🚫 emoji, shows alert on tap
- Tapping an available slot navigates to `Booking` with:
  - `slot_id`, `slot_no`, `lot_id`, `lot_name`, `start_time`, `end_time`

#### 7. BookingScreen

- Receives `slot_id`, `slot_no`, `lot_id`, `lot_name`, `start_time`, `end_time` from params
- **Booking summary card**: parking lot, slot number, start time, end time
- **Vehicle selector**: fetches `vehicleAPI.getMyVehicles()`, shows radio buttons
  - If no vehicles: shows "Add Vehicle" button → navigates to `Vehicles`
  - Auto-selects first vehicle
- **Deposit card**: shows ₹500 with "fully refundable" note
- **"Confirm Booking" button**:
  - Shows confirmation Alert with summary
  - On confirm: calls `bookingAPI.createBooking({ registration_number, slot_id, expected_start_time, expected_end_time })`
  - On success: shows success Alert → "View Bookings" → navigates to `MyBookings`

#### 8. MyBookingsScreen

- Calls `bookingAPI.getMyBookings()` on screen focus (via `useFocusEffect`)
- Shows FlatList of `BookingCard` components
- **Cancel booking**: only shown for ACTIVE bookings
  - Confirmation Alert → calls `bookingAPI.cancelBooking(bookingId)` → refetches list
- Pull-to-refresh

#### 9. ReceiptsScreen

- Reads `user.id` from AsyncStorage
- Calls `receiptAPI.getUserReceipts(userId)`
- Shows FlatList of receipt cards, each showing:
  - Vehicle registration number, fee amount
  - Lot name, slot number, entry time, exit time
  - "Download Receipt" button if `receipt_path` exists (opens URL via `Linking`)
- Pull-to-refresh

#### 10. VehicleScreen

- Calls `vehicleAPI.getMyVehicles()` on screen focus (via `useFocusEffect`)
- **"Add New Vehicle" button** → toggles add form
- **Add form**:
  - Text input: Registration Number (auto-capitalize)
  - Radio buttons: 2-Wheeler / 4-Wheeler (default: 4-wheeler)
  - Submit → calls `vehicleAPI.addVehicle({ registration_number, type })`
- **Vehicle list**: FlatList showing each vehicle with registration number and type chip
- Pull-to-refresh

---

### Reusable Components

#### ParkingCard (`components/ParkingCard.js`)

Props: `lot`, `onPress`

Displays:
- Lot name and address (with 📍 icon)
- Available/total slot count (green if > 0, red if 0)
- Status chip: "Slots Available" (green) or "Full" (red)

#### BookingCard (`components/BookingCard.js`)

Props: `booking`, `onCancel`

Displays:
- Lot name, slot number, vehicle registration
- Booking status chip with colors:
  - ACTIVE → blue, CANCELLED → red, COMPLETED → green, NO_SHOW → orange
- Booking time, start time, end time, deposit amount
- Refund status chip:
  - PENDING → orange, REFUNDED → green, NOT_APPLICABLE → grey
- "Cancel Booking" button (only for ACTIVE status, red outline)

---

## Complete User Flow

```
1. REGISTER → POST /api/auth/register
2. LOGIN → POST /api/auth/login → get JWT token
3. DASHBOARD → view stats (active bookings, vehicles)
4. FIND PARKING → DateSelectionScreen
   ↓ pick start/end date+time
5. AVAILABLE LOTS → GET /api/parking/lots?start_time=...&end_time=...
   ↓ select a lot
6. SELECT SLOT → GET /api/parking/slots/:lot_id?start_time=...&end_time=...
   ↓ (optional) view lot layout image
   ↓ tap available slot
7. CONFIRM BOOKING → POST /api/bookings/create
   ↓ select vehicle, confirm ₹500 deposit
8. VIEW BOOKINGS → GET /api/bookings/my
9. CANCEL BOOKING → POST /api/bookings/cancel/:booking_id
10. VIEW RECEIPTS → GET /api/receipts/user/:user_id
```

---

## Key Design Decisions

### Time-Based Slot Availability

Slot availability is determined by **booking time overlaps**, not by `parking_slot.status`. The overlap condition is:

```
existing_start < requested_end AND existing_end > requested_start
```

This allows:
- Multiple bookings on the same slot at different times
- Correct availability for future dates
- No stale "booked" status blocking future bookings

`parking_slot.status` is only used for **real-time physical occupancy** (tracked by the refund handler when vehicles physically enter/exit).

### Vehicle Linking

When adding a vehicle:
- If it doesn't exist → create with user_id
- If it exists with `user_id = NULL` → link to current user
- If it exists with a user_id → reject (409)

This handles vehicles that were pre-existing in the database without an associated user.

### Transaction Safety

`createBooking` and `cancelBooking` use MySQL transactions with `BEGIN`/`COMMIT`/`ROLLBACK` to ensure atomicity. The createBooking endpoint uses `FOR UPDATE` row-level locking to prevent race conditions.

### Security

- Passwords hashed with **bcrypt** (10 salt rounds)
- **JWT** for stateless authentication (24h expiry)
- Auth middleware on all protected routes
- Booking ownership verified (`user_id` from JWT must match)

---

## How to Run

### Backend

```bash
cd parking_app/backend
cp .env.example .env          # Fill in DB credentials and JWT secret
npm install
npm run dev                   # Starts with nodemon on port 5000
```

### Frontend

```bash
cd parking_app/frontend
npm install
npx expo start --clear        # Scan QR code with Expo Go
```

> **Important**: Update `API_BASE_URL` in `frontend/services/api.js` and `API_HOST` in `frontend/screens/SlotSelectionScreen.js` to your machine's LAN IP.

---

## Dependencies

### Backend

| Package       | Purpose                          |
|--------------|----------------------------------|
| express       | Web framework                    |
| mysql2        | MySQL driver (promise-based)     |
| cors          | Cross-origin request handling    |
| bcrypt        | Password hashing                 |
| jsonwebtoken  | JWT generation/verification      |
| dotenv        | Environment variable loading     |
| nodemon       | Auto-restart on file changes     |

### Frontend

| Package                                    | Purpose                            |
|--------------------------------------------|------------------------------------|
| expo                                       | React Native development platform  |
| react-native                               | Mobile UI framework                |
| react-native-paper                         | Material Design components         |
| @react-navigation/native                   | Navigation container               |
| @react-navigation/native-stack             | Native stack navigator             |
| axios                                      | HTTP client                        |
| @react-native-async-storage/async-storage  | Local storage for JWT/user data    |
| @react-native-community/datetimepicker     | Native date/time pickers           |
| react-native-screens                       | Optimized screen containers        |
| react-native-safe-area-context             | Safe area insets                   |
| react-native-vector-icons                  | Icon library for Paper             |
