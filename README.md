# WedPlan Server — Wedding Planning Platform API

Backend RESTful API server for **WedPlan**, an end-to-end wedding planning platform connecting couples with wedding vendors and service providers.

## 📌 Project Overview
WedPlan is a role-based wedding planning platform where customers can discover and book wedding services, vendors can showcase their offerings and manage booking requests, and administrators oversee platform operations, verify services, and audit transactions.

- **Client Repository**: [https://github.com/DeeDee001/WedPlan-Client](https://github.com/DeeDee001/WedPlan-Client)
- **Server Repository**: [https://github.com/DeeDee001/WedPlan-Server](https://github.com/DeeDee001/WedPlan-Server)
- **Live Deployment**: Coming soon / Deployment URL

---

## 🛠️ Technology Stack
- **Runtime**: Node.js & Express.js with TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT & Better Auth Specification with bcrypt password hashing
- **Payments**: Stripe Checkout & Stripe Webhooks
- **Validation**: Zod & Custom Express Middlewares

---

## ✨ Key Features
- **Role-Based Access Control (RBAC)**: Distinct permissions for `admin`, `vendor`, and `customer`.
- **JWT Authentication & Security**: Secure token issuance, validation middleware, and protection against unauthorized/forbidden requests.
- **Service Management with Tier Limits**:
  - Free vendors: Limited to a maximum of 3 active services.
  - Premium vendors: Unlimited service listings.
  - Admin approval workflow (`pending`, `approved`, `rejected`, `active`, `inactive`).
- **Booking Request Workflow**:
  - Customer booking request submission with date and location.
  - Prevention of duplicate active bookings for the same service and event date.
  - Vendor accept/reject workflow with state locking.
  - Customer cancellation of pending requests.
- **Stripe Checkout & Webhook Integration**:
  - Verified webhook processing for vendor premium upgrades.
  - Secure transaction logging in the `transactions` collection.
- **Admin Moderation & Analytics**:
  - User search, filtering, and block/unblock capabilities.
  - Service approval, rejection, and deletion.
  - Read-only transaction audits.
  - Platform-wide statistics.
- **Automated Admin Seeder**: Automatically provisions initial administrator credentials upon first launch.

---

## 🔐 Environment Variables
Create a `.env` file in the root directory (based on `.env.example`):

```env
PORT=5000
MONGODB_URI=
JWT_SECRET=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=http://localhost:5000
CLIENT_URL=http://localhost:3000
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
IMGBB_API_KEY=
ADMIN_EMAIL=admin@wedplan.com
ADMIN_PASSWORD=Admin123!
```

---

## 🚀 Installation & Local Development

### 1. Clone Repository
```bash
git clone https://github.com/DeeDee001/WedPlan-Server.git
cd WedPlan-Server
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment Variables
Copy `.env.example` to `.env` and fill in your MongoDB URI, JWT secret, and Stripe credentials:
```bash
cp .env.example .env
```

### 4. Run Development Server
```bash
npm run dev
```
The server will start on `http://localhost:5000` (or your configured `PORT`).

### 5. Build for Production
```bash
npm run build
npm start
```

---

## 📖 API Endpoints Summary

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register a customer or vendor account
- `POST /api/auth/login` — Sign in with email and password
- `POST /api/auth/google` — Authenticate via Google OAuth
- `GET /api/auth/me` — Fetch currently authenticated user profile

### Services (`/api/services`)
- `GET /api/services` — Public search, category/location filter, and price sort
- `GET /api/services/featured` — Get featured services for the homepage
- `GET /api/services/:id` — Get service details
- `POST /api/services` — Create service (Vendor only, max 3 on free tier)
- `GET /api/services/vendor/my-services` — Get vendor's own services
- `PUT /api/services/:id` — Update service (Vendor owner or Admin)
- `DELETE /api/services/:id` — Delete service (Vendor owner or Admin)

### Bookings (`/api/bookings`)
- `POST /api/bookings` — Submit a booking request (Customer only)
- `GET /api/bookings/customer` — Get customer's booking requests
- `PATCH /api/bookings/:id/cancel` — Cancel pending booking request (Customer only)
- `GET /api/bookings/vendor` — Get vendor's incoming booking requests
- `PATCH /api/bookings/:id/status` — Accept or reject booking (Vendor only)

### Payments (`/api/payments`)
- `POST /api/payments/create-checkout-session` — Create Stripe session for vendor upgrade
- `GET /api/payments/verify-session/:sessionId` — Verify session status with Stripe
- `POST /api/payments/webhook` — Stripe webhook receiver (verifies signature)

### Admin (`/api/admin`)
- `GET /api/admin/stats` — Platform metrics
- `GET /api/admin/users` — List and search all users
- `PATCH /api/admin/users/:id/block` — Block or unblock a user
- `GET /api/admin/services` — Moderation queue for all services
- `PATCH /api/admin/services/:id/status` — Approve or reject services
- `GET /api/admin/transactions` — Audit platform transactions

### User & Dashboard (`/api/users`)
- `PUT /api/users/profile` — Update user name, business name, and avatar
- `GET /api/users/dashboard/vendor` — Vendor metrics and subscription details
- `GET /api/users/dashboard/customer` — Customer booking metrics

---

## 🧪 Admin Credentials for Testing
- **Email**: `admin@wedplan.com` (or value of `ADMIN_EMAIL`)
- **Password**: `Admin123!` (or value of `ADMIN_PASSWORD`)
