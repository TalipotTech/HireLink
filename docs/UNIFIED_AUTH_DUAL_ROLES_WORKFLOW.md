# HireLink - Unified Authentication & Dual-Role Workflow

## Feature Overview

This document describes the **Unified Authentication with Dual-Role Support** feature introduced in the `feature/unified-auth-dual-roles` branch. It replaces the previous separate Customer/Provider registration and login flows with a single, streamlined authentication system that supports users holding both Customer and Provider roles simultaneously.

---

## Table of Contents

1. [Motivation](#1-motivation)
2. [Architecture Changes](#2-architecture-changes)
3. [Database Changes](#3-database-changes)
4. [Authentication Workflow](#4-authentication-workflow)
5. [Booking Workflow](#5-booking-workflow)
6. [Contact Privacy Policy](#6-contact-privacy-policy)
7. [Frontend UI Changes](#7-frontend-ui-changes)
8. [API Reference](#8-api-reference)
9. [Backend Service Changes](#9-backend-service-changes)
10. [Migration Guide](#10-migration-guide)

---

## 1. Motivation

In the previous system, Customers and Providers had completely separate registration and login flows. This caused friction when the same person wanted to act as both:

- **Two phone numbers required** — a user had to register separately as Customer and Provider with different credentials.
- **Confusing UX** — two login pages, two register pages, and no way to link accounts.
- **Data duplication** — the same person existed as two unrelated user records.

The unified system solves this by:

- A single registration and login flow for all users.
- Supporting multiple roles per account via a `user_roles` join table.
- A "Become a Provider" upgrade path for existing customers.
- OTP-verified registration for phone number ownership.

---

## 2. Architecture Changes

### Role Model: From Enum to Join Table

**Before:** Each user had a single `user_type` enum column (`CUSTOMER`, `PROVIDER`, `ADMIN`) determining their role.

**After:** A new `user_roles` table allows multiple roles per user. The `user_type` column is retained for backward compatibility but is no longer the sole source of truth for authorization.

```
users (1) ──── (*) user_roles
```

### Auth Flow: Unified Endpoints

**Before:** Separate endpoints and UI pages per role.

| Old Route             | Purpose              |
|-----------------------|----------------------|
| `/customer/login`     | Customer login page  |
| `/provider/login`     | Provider login page  |
| `/customer/register`  | Customer registration|
| `/provider/register`  | Provider registration|

**After:** Single set of routes.

| New Route            | Purpose                          |
|----------------------|----------------------------------|
| `/login`             | Unified login (all users)        |
| `/register`          | OTP-verified registration        |
| `/become-provider`   | Upgrade to Provider role         |

Old routes redirect to their new equivalents for backward compatibility.

---

## 3. Database Changes

### New Table: `user_roles`

This table enables multi-role assignment per user.

```sql
CREATE TABLE IF NOT EXISTS user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role)
);
```

**Column Details:**

| Column       | Type              | Description                                    |
|--------------|-------------------|------------------------------------------------|
| `id`         | BIGINT UNSIGNED   | Auto-increment primary key                     |
| `user_id`    | BIGINT UNSIGNED   | Foreign key to `users.user_id`                 |
| `role`       | VARCHAR(20)       | Role name: `CUSTOMER`, `PROVIDER`, or `ADMIN`  |
| `created_at` | TIMESTAMP         | When the role was assigned                     |

**Constraints:**
- `UNIQUE KEY unique_user_role (user_id, role)` — prevents duplicate role entries.
- `FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE` — cascading delete when user is removed.

### Migration Script

Located at `database/migration_user_roles.sql`. Must be run **once** to migrate existing data.

```sql
-- Step 1: Create table
CREATE TABLE IF NOT EXISTS user_roles ( ... );

-- Step 2: Populate from existing user_type data
INSERT INTO user_roles (user_id, role)
SELECT user_id, user_type FROM users
WHERE deleted_at IS NULL
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- Step 3: Existing PROVIDER users also get CUSTOMER role
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'CUSTOMER' FROM users
WHERE user_type = 'PROVIDER' AND deleted_at IS NULL
ON DUPLICATE KEY UPDATE role = VALUES(role);
```

**Important:** The `id` and `user_id` columns must be `BIGINT UNSIGNED` to match the `users.user_id` type. A signed/unsigned mismatch will cause a foreign key constraint error.

### Schema Diagram (After Migration)

```
┌──────────────────────┐       ┌──────────────────────────┐
│        users         │       │       user_roles         │
├──────────────────────┤       ├──────────────────────────┤
│ user_id (PK, UINT)   │──┐    │ id (PK, UINT)            │
│ name                 │  │    │ user_id (FK, UINT)       │
│ phone                │  └───>│ role (VARCHAR)           │
│ email                │       │ created_at (TIMESTAMP)   │
│ user_type (enum)     │       └──────────────────────────┘
│ password_hash        │
│ ...                  │       ┌──────────────────────────┐
│                      │──────>│   service_providers      │
└──────────────────────┘       └──────────────────────────┘
```

### Existing Tables — No Schema Change

The following tables are **not** altered. The `users.user_type` column remains but now serves as a "primary role" indicator while `user_roles` is the authoritative source:

- `users` — no column changes
- `service_providers` — no column changes
- `bookings` — no column changes
- `otp_verifications` — no column changes

---

## 4. Authentication Workflow

### 4.1 Registration (New Users)

All new users register as **Customer** by default. The registration is a 3-step OTP-verified flow.

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Step 1: Info   │────>│  Step 2: OTP    │────>│  Step 3: Pwd    │
│  Name + Phone   │     │  Verify Phone   │     │  Password + Email│
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │                       │
        │                       │                       │
   POST /send-otp         OTP entered             POST /register
   (phone)                locally               (name, phone, otp,
                                                 password, email?)
                                                       │
                                                       ▼
                                              User created as CUSTOMER
                                              user_roles: [CUSTOMER]
                                              Phone marked verified
                                              JWT tokens returned
```

**API Calls:**
1. `POST /api/auth/send-otp` with `{ phone: "9876543210" }` — sends 6-digit OTP via SMS.
2. User enters OTP in the UI (validated client-side before proceeding).
3. `POST /api/auth/register` with `{ name, phone, otp, password, email? }` — verifies OTP server-side, creates account.

### 4.2 Login (Existing Users)

A single login page supports multiple authentication methods:

| Method          | How It Works                                      |
|-----------------|---------------------------------------------------|
| **Password**    | Phone/Email + Password → `POST /api/auth/login`   |
| **Phone OTP**   | Phone → Send OTP → Verify → `POST /api/auth/verify-otp` |
| **Email OTP**   | Email → Send OTP → Verify → `POST /api/auth/verify-otp` |
| **Google OAuth** | Google Sign-In → `POST /api/auth/google`          |

No `userType` parameter is sent during login. The system determines the user's roles from the `user_roles` table and returns all of them in the JWT response.

### 4.3 Become a Provider (Role Upgrade)

Authenticated customers can upgrade to also hold the Provider role via `/become-provider`.

```
Customer account ──> POST /api/users/become-provider ──> Customer + Provider account
```

**Request Body:**

```json
{
  "categoryId": 1,
  "baseAddress": "123 Main St",
  "basePincode": "560001",
  "baseLatitude": 12.9716,
  "baseLongitude": 77.5946,
  "serviceCity": "Bangalore",
  "serviceState": "Karnataka"
}
```

**What happens server-side:**
1. Validates user doesn't already have the PROVIDER role.
2. Creates a `service_providers` record linked to the user.
3. Inserts a new `user_roles` row with `role = 'PROVIDER'`.
4. Updates `users.user_type` to `PROVIDER`.
5. Returns fresh JWT tokens with updated roles.

### 4.4 Auth Response Structure

All authentication endpoints return:

```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "tokenType": "Bearer",
  "expiresIn": 86400,
  "user": {
    "userId": 1,
    "name": "John Doe",
    "phone": "9876543210",
    "email": "john@email.com",
    "userType": "CUSTOMER",
    "roles": ["CUSTOMER", "PROVIDER"],
    "hasProviderProfile": true,
    "accountStatus": "ACTIVE",
    "isPhoneVerified": true,
    "isEmailVerified": false,
    "authProvider": "LOCAL",
    "hasPassword": true
  }
}
```

**Key fields:**
- `roles` — array of all roles the user holds (replaces reliance on `userType` alone).
- `hasProviderProfile` — boolean indicating whether a `service_providers` record exists.

### 4.5 Legacy User Compatibility

For users created before the `user_roles` table existed, the backend method `ensureUserHasRoles()` runs on every login:

1. If the user has no entries in `user_roles`, it creates them based on `users.user_type`.
2. If `user_type = PROVIDER`, both `PROVIDER` and `CUSTOMER` roles are created (all providers can also act as customers).

---

## 5. Booking Workflow

### 5.1 Status Flow

The booking lifecycle follows a strict state machine:

```
PENDING ──> ACCEPTED ──> (Customer Pays) ──> CONFIRMED ──> IN_PROGRESS ──> COMPLETED
   │            │                                              │
   │            │                                              ▼
   ▼            ▼                                          (Provider can mark)
CANCELLED    CANCELLED
```

**Step-by-step:**

| Step | Actor    | Action                        | Status Change           |
|------|----------|-------------------------------|-------------------------|
| 1    | Customer | Creates booking               | → `PENDING`             |
| 2    | Provider | Accepts the booking           | → `ACCEPTED`            |
| 3    | Customer | Makes payment (Razorpay)      | → `CONFIRMED` (auto)    |
| 4    | Provider | Starts the service            | → `IN_PROGRESS`         |
| 5    | Provider | Completes the service         | → `COMPLETED`           |

**Auto-confirmation on payment:** When payment status changes to `PAID`, if the booking is `ACCEPTED`, it is automatically upgraded to `CONFIRMED`. This eliminates a manual confirmation step.

### 5.2 Dual-Role Booking Access

For users who hold both Customer and Provider roles, the backend provides special access methods:

- `getBookingByIdForDualRole` / `getBookingByNumberForDualRole` — grants access if the user is **either** the customer **or** the provider of the booking.
- This prevents "Booking not found" errors when a dual-role user tries to view their own bookings from either perspective.

### 5.3 Booking List Filtering

On the `/bookings` page, the `activeRole` determines which bookings are fetched:

| Active Role | API Parameter | Returns                                   |
|-------------|---------------|-------------------------------------------|
| `CUSTOMER`  | `role=CUSTOMER` | Bookings where user is the customer       |
| `PROVIDER`  | `role=PROVIDER` | Bookings where user is the service provider|

Each booking card displays the **other party's name** for context:
- Customer view → shows Provider name
- Provider view → shows Customer name

---

## 6. Contact Privacy Policy

Contact details (phone numbers, emails) are **hidden** until payment is completed to enforce platform-centric communication.

### Backend Enforcement

In `BookingService.mapToBookingResponse()`:

```
If booking.paymentStatus != PAID:
    provider.phone = null
    customer.phone = null
    customer.email = null
```

### Frontend Enforcement

In `BookingDetail.jsx`, contact sections display a message instead of actual details:

> "Contact details will be shared once payment is completed."

Once `booking.paymentStatus === 'PAID'`, the actual phone numbers and emails are rendered.

---

## 7. Frontend UI Changes

### 7.1 Removed Pages (References Only)

The following pages are **kept in the codebase** but all routes and imports pointing to them are removed:

| Page                    | File                                       |
|-------------------------|--------------------------------------------|
| Customer Login          | `pages/auth/CustomerLogin.jsx`             |
| Provider Login          | `pages/auth/ProviderLogin.jsx`             |
| Customer Register       | `pages/auth/CustomerRegister.jsx`          |
| Provider Register       | `pages/auth/ProviderRegister.jsx`          |

### 7.2 New/Updated Pages

| Page              | File                           | Description                              |
|-------------------|--------------------------------|------------------------------------------|
| Unified Login     | `pages/auth/Login.jsx`         | Single login page with all auth methods  |
| Unified Register  | `pages/auth/Register.jsx`      | 3-step OTP-verified registration         |
| Become Provider   | `pages/BecomeProvider.jsx`     | Provider profile creation form           |

### 7.3 RoleSwitcher Component

`components/RoleSwitcher.jsx` — Context-aware role display for dual-role users.

**Behavior:**

| Location           | Single-Role User | Dual-Role User                          |
|--------------------|-------------------|-----------------------------------------|
| `/bookings` pages  | Not rendered      | Customer/Provider toggle buttons        |
| All other pages    | Not rendered      | "Also a Provider" badge (compact)       |

### 7.4 Navigation Active Styling

`MainLayout.jsx` uses React Router's `NavLink` component to highlight the currently active navigation item with distinct styling (bold text, accent underline).

### 7.5 State Management (Zustand)

The `authStore.js` manages:

| State Field    | Type     | Description                                      |
|----------------|----------|--------------------------------------------------|
| `user`         | Object   | User profile with `roles` array                  |
| `activeRole`   | String   | Currently active role view (`CUSTOMER`/`PROVIDER`)|
| `isAuthenticated` | Boolean | Login status                                  |

**Key actions:**
- `switchRole(role)` — toggles the active role for UI context.
- `becomeProvider(data)` — calls API and updates local state with new roles.
- `onRehydrateStorage` — corrects stale `activeRole` on app reload.

---

## 8. API Reference

### Authentication Endpoints

| Method | Endpoint               | Auth  | Description                     |
|--------|------------------------|-------|---------------------------------|
| POST   | `/api/auth/send-otp`   | No    | Send OTP to phone or email      |
| POST   | `/api/auth/register`   | No    | OTP-verified user registration  |
| POST   | `/api/auth/login`      | No    | Password-based login            |
| POST   | `/api/auth/verify-otp` | No    | OTP-based login                 |
| POST   | `/api/auth/google`     | No    | Google OAuth login              |
| POST   | `/api/auth/refresh`    | No    | Refresh JWT tokens              |
| POST   | `/api/auth/set-password` | Yes | Set password for OTP users      |
| POST   | `/api/auth/change-password` | Yes | Change existing password   |

### User Endpoints

| Method | Endpoint                       | Auth | Description                        |
|--------|--------------------------------|------|------------------------------------|
| GET    | `/api/users/me`                | Yes  | Get current user profile with roles|
| PUT    | `/api/users/profile`           | Yes  | Update user profile                |
| POST   | `/api/users/become-provider`   | Yes  | Upgrade account to Provider role   |

### Request/Response Schemas

**POST `/api/auth/register`**

```json
// Request
{
  "name": "John Doe",
  "phone": "9876543210",
  "otp": "123456",
  "password": "securePassword123",
  "email": "john@email.com"       // optional
}

// Response → AuthResponse (see Section 4.4)
```

**POST `/api/users/become-provider`**

```json
// Request
{
  "categoryId": 1,
  "baseAddress": "123 Main St, Koramangala",
  "basePincode": "560034",
  "baseLatitude": 12.9352,
  "baseLongitude": 77.6245,
  "serviceCity": "Bangalore",
  "serviceState": "Karnataka"
}

// Response → AuthResponse with updated roles
```

---

## 9. Backend Service Changes

### 9.1 New Entity: `UserRole`

JPA entity mapped to `user_roles` table with `@ManyToOne` relationship to `User`.

**File:** `backend/src/main/java/com/hirelink/entity/UserRole.java`

### 9.2 Updated Entity: `User`

Added `@OneToMany` association:

```java
@OneToMany(mappedBy = "user", cascade = CascadeType.ALL, fetch = FetchType.EAGER)
private List<UserRole> roles;
```

### 9.3 New Repository: `UserRoleRepository`

**File:** `backend/src/main/java/com/hirelink/repository/UserRoleRepository.java`

Key methods:
- `findByUserUserId(Long userId)` — fetch all roles for a user.
- `existsByUserUserIdAndRole(Long userId, String role)` — check if user has a specific role.

### 9.4 Updated Service: `AuthService`

| Method                | Change                                                  |
|-----------------------|---------------------------------------------------------|
| `register()`          | Now requires OTP verification, always creates CUSTOMER  |
| `login()`             | Removed `userType` parameter, calls `ensureUserHasRoles`|
| `verifyOtpAndLogin()` | Removed `userType`, always creates CUSTOMER if new      |
| `googleLogin()`       | Removed `userType`, always creates CUSTOMER if new      |
| `becomeProvider()`    | **New** — creates provider profile and assigns role     |
| `ensureUserHasRoles()`| **New** — backward-compat role population for legacy users|
| `mapToUserDTO()`      | Returns `roles` list and `hasProviderProfile` flag      |

### 9.5 Updated Service: `BookingService`

| Method                           | Change                                        |
|----------------------------------|-----------------------------------------------|
| `getBookingByIdForDualRole()`    | **New** — dual-role access validation          |
| `getBookingByNumberForDualRole()`| **New** — dual-role access validation          |
| `mapToBookingResponse()`         | Strips contact info when payment != PAID       |

### 9.6 Updated Service: `PaymentService`

| Method           | Change                                                    |
|------------------|-----------------------------------------------------------|
| `verifyPayment()`| Auto-sets booking status to `CONFIRMED` when payment = PAID and status = ACCEPTED |

### 9.7 Updated Security: `CustomUserDetails`

`getAuthorities()` now returns all roles from `user_roles` instead of just the single `user_type`:

```java
public Collection<? extends GrantedAuthority> getAuthorities() {
    if (user.getRoles() != null && !user.getRoles().isEmpty()) {
        return user.getRoles().stream()
                .map(role -> new SimpleGrantedAuthority("ROLE_" + role.getRole()))
                .collect(Collectors.toList());
    }
    return List.of(new SimpleGrantedAuthority("ROLE_" + user.getUserType().name()));
}
```

---

## 10. Migration Guide

### Prerequisites

- MySQL 8.0 running with the `hirelink_db` database.
- Backend application stopped.

### Step-by-Step

1. **Run the migration script:**

   ```bash
   mysql -u hirelink -p hirelink_db < database/migration_user_roles.sql
   ```

   This creates the `user_roles` table and populates it from existing `users.user_type` data. Existing providers automatically receive both `CUSTOMER` and `PROVIDER` roles.

2. **Start the backend:**

   The Hibernate schema validation will recognize the new `user_roles` table. The `UserRole` entity uses `columnDefinition = "bigint unsigned"` to match the existing `users.user_id` type.

3. **Verify the migration:**

   ```sql
   -- Check that all active users have at least one role
   SELECT u.user_id, u.name, u.user_type, GROUP_CONCAT(ur.role) AS roles
   FROM users u
   LEFT JOIN user_roles ur ON u.user_id = ur.user_id
   WHERE u.deleted_at IS NULL
   GROUP BY u.user_id;

   -- Check that all providers have both roles
   SELECT u.user_id, u.name, COUNT(ur.role) AS role_count
   FROM users u
   JOIN user_roles ur ON u.user_id = ur.user_id
   WHERE u.user_type = 'PROVIDER'
   GROUP BY u.user_id
   HAVING role_count < 2;
   -- Should return 0 rows
   ```

4. **Deploy the frontend:**

   The new frontend routes (`/login`, `/register`, `/become-provider`) are active. Old routes (`/customer/login`, `/provider/login`, etc.) automatically redirect.

### Rollback

If needed, the migration can be reversed:

```sql
DROP TABLE IF EXISTS user_roles;
```

The backend will fall back to `users.user_type` for role determination via the existing fallback logic in `CustomUserDetails.getAuthorities()`.

---

## Appendix: File Change Summary

### New Files

| File | Purpose |
|------|---------|
| `database/migration_user_roles.sql` | SQL migration script |
| `backend/.../entity/UserRole.java` | JPA entity for `user_roles` |
| `backend/.../repository/UserRoleRepository.java` | Data access for user roles |
| `frontend/src/pages/BecomeProvider.jsx` | Provider upgrade page |
| `frontend/src/components/RoleSwitcher.jsx` | Role toggle / badge component |

### Modified Files

| File | Key Changes |
|------|-------------|
| `backend/.../entity/User.java` | Added `@OneToMany roles` association |
| `backend/.../dto/AuthDTO.java` | Updated DTOs: `RegisterRequest` (OTP), `BecomeProviderRequest`, `UserDTO` (roles) |
| `backend/.../service/AuthService.java` | Unified register, `becomeProvider()`, `ensureUserHasRoles()` |
| `backend/.../service/BookingService.java` | Dual-role access, contact stripping |
| `backend/.../service/PaymentService.java` | Auto-confirm on payment |
| `backend/.../controller/AuthController.java` | Updated `/register` endpoint |
| `backend/.../controller/UserController.java` | Added `/become-provider` endpoint |
| `backend/.../controller/BookingController.java` | Dual-role booking access |
| `backend/.../security/CustomUserDetails.java` | Multi-role authorities |
| `frontend/src/App.jsx` | Unified routes, redirects |
| `frontend/src/pages/auth/Login.jsx` | Single unified login page |
| `frontend/src/pages/auth/Register.jsx` | 3-step OTP registration |
| `frontend/src/pages/Home.jsx` | Per-booking role-aware display |
| `frontend/src/pages/Bookings.jsx` | Role switching, relationship-based display |
| `frontend/src/pages/BookingDetail.jsx` | Contact privacy, workflow buttons |
| `frontend/src/pages/ServiceDetail.jsx` | Updated role checks |
| `frontend/src/services/api.js` | Added `becomeProvider`, unified redirect |
| `frontend/src/context/authStore.js` | `activeRole`, `switchRole`, `becomeProvider` |
| `frontend/src/components/layout/MainLayout.jsx` | RoleSwitcher, NavLink active styling |
| `frontend/src/components/layout/AuthLayout.jsx` | Removed variant prop |

### Retained (Unused) Files

| File | Status |
|------|--------|
| `frontend/src/pages/auth/CustomerLogin.jsx` | Kept, routes removed |
| `frontend/src/pages/auth/ProviderLogin.jsx` | Kept, routes removed |
| `frontend/src/pages/auth/CustomerRegister.jsx` | Kept, routes removed |
| `frontend/src/pages/auth/ProviderRegister.jsx` | Kept, routes removed |
