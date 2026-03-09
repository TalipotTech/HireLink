# HireLink - Admin Module Implementation

## Feature Overview

This document describes the **Admin Module** introduced in the `feature/admin-module` branch. It provides a complete administrative interface for managing the HireLink platform, including user management, booking oversight, service/category CRUD, provider KYC verification, and analytics reporting. The module is accessible only to users with `ADMIN` or `SUPER_ADMIN` roles.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Database Changes](#2-database-changes)
3. [Authentication & Authorization](#3-authentication--authorization)
4. [Backend Implementation](#4-backend-implementation)
5. [Frontend Implementation](#5-frontend-implementation)
6. [API Reference](#6-api-reference)
7. [Admin Access & Navigation](#7-admin-access--navigation)
8. [Feature Details](#8-feature-details)
9. [File Inventory](#9-file-inventory)

---

## 1. Architecture Overview

The admin module follows the same architecture as the rest of the HireLink application:

- **Backend:** Spring Boot 3.x REST controllers secured by Spring Security's role-based access control.
- **Frontend:** React 18 SPA with a dedicated admin layout, Zustand for auth state, and Axios for API calls.
- **Data Flow:** All admin API calls go through `/api/admin/**`, which is locked behind `ADMIN`/`SUPER_ADMIN` role checks at the Spring Security filter chain level.

```
┌─────────────────────────────────────────────────────────────┐
│  Frontend (React)                                           │
│                                                             │
│  ┌──────────────┐  ┌──────────────────────────────────────┐ │
│  │ AdminRoute   │→ │ AdminLayout (sidebar + <Outlet />)   │ │
│  │ (role guard) │  │                                      │ │
│  └──────────────┘  │  ┌────────────┐  ┌───────────────┐  │ │
│                     │  │ Dashboard  │  │ UserManagement│  │ │
│                     │  ├────────────┤  ├───────────────┤  │ │
│                     │  │ Bookings   │  │ Services      │  │ │
│                     │  ├────────────┤  ├───────────────┤  │ │
│                     │  │ Providers  │  │ Reports       │  │ │
│                     │  └────────────┘  └───────────────┘  │ │
│                     └──────────────────────────────────────┘ │
│                              │ Axios (adminApi.js)           │
└──────────────────────────────┼───────────────────────────────┘
                               │ JWT Bearer Token
┌──────────────────────────────┼───────────────────────────────┐
│  Backend (Spring Boot)       ▼                               │
│                                                              │
│  SecurityConfig: /api/admin/** → hasAnyRole(ADMIN,SUPER_ADMIN)│
│                                                              │
│  ┌────────────────────┐  ┌────────────────────┐             │
│  │ AdminDashboard     │  │ AdminUser           │             │
│  │   Controller       │  │   Controller        │             │
│  ├────────────────────┤  ├────────────────────┤             │
│  │ AdminBooking       │  │ AdminService        │             │
│  │   Controller       │  │   Controller        │             │
│  ├────────────────────┤  ├────────────────────┤             │
│  │ AdminProvider      │  │ AdminReport         │             │
│  │   Controller       │  │   Controller        │             │
│  └────────┬───────────┘  └────────┬───────────┘             │
│           │  Services + DTOs      │                          │
│           └──────────┬────────────┘                          │
│                      ▼                                       │
│           Repositories (JPA) → MySQL                         │
│           AdminAuditLog for audit trail                      │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. Database Changes

### Modified Tables

| Table | Change | Purpose |
|-------|--------|---------|
| `users` | Added `banned_reason VARCHAR(500)` column | Stores reason when admin bans a user |

### Existing Tables Used (No Changes)

| Table | Admin Usage |
|-------|-------------|
| `admin_audit_logs` | New JPA entity `AdminAuditLog` maps to this pre-existing table for audit trail |
| `users` / `user_roles` | User listing, search, ban/unban, role-based filtering |
| `bookings` | Booking listing, status override, provider assignment |
| `service_categories` | Category CRUD, activation/deactivation |
| `services` | Service CRUD, activation/deactivation |
| `service_providers` | Provider listing, KYC approval/rejection |

No new tables were created. The only schema change is the `banned_reason` column added to `users` (applied automatically via JPA `ddl-auto=update`).

---

## 3. Authentication & Authorization

### Backend Security

All admin endpoints are protected at the Spring Security configuration level:

```java
// SecurityConfig.java
.requestMatchers("/api/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
```

This means every request to `/api/admin/**` must include a valid JWT token belonging to a user with `ROLE_ADMIN` or `ROLE_SUPER_ADMIN` in their granted authorities.

### Frontend Route Guard

The `AdminRoute` component wraps the admin layout and checks:

```javascript
const isAdmin = user?.roles?.includes('ADMIN') ||
                user?.roles?.includes('SUPER_ADMIN') ||
                user?.userType === 'ADMIN' ||
                user?.userType === 'SUPER_ADMIN'
```

- **Not authenticated** → redirect to `/login`
- **Authenticated but not admin** → redirect to `/`
- **Admin** → render admin layout

### Seeded Admin Users

Admin credentials are pre-seeded via `database/init.sql`:

| Email | Password | Role |
|-------|----------|------|
| `admin@hirelink.in` | `password123` | ADMIN |
| `superadmin@hirelink.in` | `password123` | SUPER_ADMIN |

---

## 4. Backend Implementation

### 4.1 Entity: AdminAuditLog

Maps to the existing `admin_audit_logs` table. Records every admin action for accountability.

| Field | Type | Description |
|-------|------|-------------|
| `logId` | Long | Auto-generated primary key |
| `adminUserId` | Long | ID of the admin who performed the action |
| `actionType` | String | Category (e.g., `BOOKING_STATUS_OVERRIDE`, `KYC_APPROVED`, `USER_BANNED`) |
| `actionDescription` | String | Human-readable description |
| `targetType` | String | Entity type (`BOOKING`, `PROVIDER`, `USER`) |
| `targetId` | Long | ID of the affected entity |
| `oldValues` | String (JSON) | Previous state |
| `newValues` | String (JSON) | New state |
| `ipAddress` | String | Client IP address |
| `userAgent` | String | Client user agent |
| `performedAt` | LocalDateTime | Timestamp (auto-set on persist) |

### 4.2 DTOs

All admin endpoints return flat DTOs to avoid circular JSON serialization issues caused by bidirectional JPA relationships (e.g., `ServiceProvider` ↔ `User` ↔ `Booking` ↔ `Service`).

| DTO Class | Inner Classes |
|-----------|---------------|
| `DashboardDTO` | `DashboardStats`, `BookingsByStatus`, `MonthlyBookingCount` |
| `AdminUserDTO` | `UserListItem`, `UserDetail`, `UpdateUserRequest`, `BanUserRequest` |
| `AdminBookingDTO` | `AdminBookingListItem`, `OverrideStatusRequest`, `AssignProviderRequest` |
| `AdminServiceDTO` | `CategoryItem`, `ServiceItem`, `CreateCategoryRequest`, `CreateServiceRequest` |
| `AdminProviderDTO` | `ProviderItem` |
| `ReportDTO` | `RevenueReport`, `ServiceRevenue`, `TopProvider` |

### 4.3 Services

| Service | Key Methods |
|---------|-------------|
| `AdminDashboardService` | `getDashboardStats()` — aggregates booking counts, user counts, revenue, KYC pending count, and monthly trends |
| `AdminUserService` | `getAllUsers()`, `getUsersByType()`, `searchUsers()`, `getUserDetail()`, `updateUser()`, `banUser()`, `unbanUser()` |
| `AdminBookingService` | `getAllBookings()`, `getBookingsByStatus()`, `searchBookings()`, `overrideStatus()`, `assignProvider()`, `getAuditTrail()` |
| `AdminProviderService` | `getPendingProviders()`, `getAllProviders()`, `approveProvider()`, `rejectProvider()` |

### 4.4 Repository Queries Added

**BookingRepository** — dashboard stats & reporting:
- `countByBookingStatus(status)` — count bookings by status
- `sumCompletedRevenue()` — total revenue from completed bookings
- `sumRevenueThisMonth()` — revenue for current month
- `countBookingsByMonth(since)` — monthly booking trend
- `revenueByService(from, to)` — revenue breakdown by service
- `topProviders()` — top providers by completed booking count

**UserRepository** — user management:
- `countByUserType(type)` — count users by type
- `findByUserType(type)` — list users by type
- `searchUsers(keyword)` — search by name, email, or phone

**ServiceProviderRepository** — provider management:
- `countByKycStatus(status)` — count providers by KYC status
- `findByKycStatus(status)` — list providers by KYC status (with user JOIN FETCH)
- `findAllWithUser()` — all providers with eagerly loaded user data

---

## 5. Frontend Implementation

### 5.1 Admin Axios Instance (`adminApi.js`)

A dedicated Axios instance configured with:
- **Base URL:** `${VITE_API_URL}/admin` (defaults to `/api/admin`)
- **Request interceptor:** Attaches `Authorization: Bearer <token>` from localStorage
- **Response interceptor:** On 401/403, clears tokens and redirects to `/login`

### 5.2 Admin Layout (`AdminLayout.jsx`)

A fixed-position sidebar layout with:
- Dark sidebar (`bg-gray-900`) with navigation links
- Main content area with `<Outlet />` for nested routes
- User info and logout button at the bottom
- "Back to Site" link to return to the main application

**Navigation Items:**

| Route | Label | Icon |
|-------|-------|------|
| `/admin` | Dashboard | ChartBarIcon |
| `/admin/users` | Users | UsersIcon |
| `/admin/bookings` | Bookings | CalendarDaysIcon |
| `/admin/services` | Services | WrenchScrewdriverIcon |
| `/admin/providers` | Provider Approvals | ShieldCheckIcon |
| `/admin/reports` | Reports | DocumentChartBarIcon |

### 5.3 Route Registration (`App.jsx`)

```jsx
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<UserManagement />} />
  <Route path="bookings" element={<BookingManagement />} />
  <Route path="services" element={<ServiceManagement />} />
  <Route path="providers" element={<ProviderApprovals />} />
  <Route path="reports" element={<Reports />} />
</Route>
```

### 5.4 Admin Panel Link in Header

The main site header (`MainLayout.jsx`) conditionally shows an "Admin Panel" link:
- **Desktop:** Amber-styled nav link with gear icon, appears after "My Bookings"
- **Mobile:** Same link in the collapsible mobile menu
- **Visibility:** Only when the logged-in user has `ADMIN` or `SUPER_ADMIN` role

---

## 6. API Reference

### Dashboard

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/dashboard/stats` | Dashboard statistics |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List users (query params: `role`, `search`) |
| GET | `/api/admin/users/{id}` | Get user details |
| PUT | `/api/admin/users/{id}` | Update user profile |
| POST | `/api/admin/users/{id}/ban` | Ban user (body: `{ reason }`) |
| POST | `/api/admin/users/{id}/unban` | Unban user |

### Booking Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/bookings` | List bookings (query params: `page`, `size`, `status`, `search`) |
| PATCH | `/api/admin/bookings/{id}/status` | Override booking status (body: `{ status, adminNote }`) |
| PATCH | `/api/admin/bookings/{id}/assign` | Assign provider (body: `{ providerId }`) |
| GET | `/api/admin/bookings/{id}/audit` | Get audit trail for a booking |

### Service & Category Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/services/categories` | List all categories |
| POST | `/api/admin/services/categories` | Create category |
| PUT | `/api/admin/services/categories/{id}` | Update category |
| PUT | `/api/admin/services/categories/{id}/toggle-active` | Toggle category active status |
| GET | `/api/admin/services` | List all services |
| POST | `/api/admin/services` | Create service |
| PUT | `/api/admin/services/{id}` | Update service |
| PUT | `/api/admin/services/{id}/toggle-active` | Toggle service active status |
| DELETE | `/api/admin/services/{id}` | Soft-delete (deactivate) service |

### Provider Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/providers` | List all providers |
| GET | `/api/admin/providers/pending` | List providers with pending KYC |
| POST | `/api/admin/providers/{id}/approve` | Approve provider KYC |
| POST | `/api/admin/providers/{id}/reject` | Reject provider KYC (body: `{ reason }`) |

### Reports

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/reports/revenue` | Revenue report (query params: `from`, `to`) |
| GET | `/api/admin/reports/top-providers` | Top providers by completed bookings |

---

## 7. Admin Access & Navigation

### How to Access the Admin Panel

1. **Login** at `/login` using admin credentials (e.g., `admin@hirelink.in` / `password123`).
2. An **"Admin Panel"** link appears in the header navigation (amber-colored with gear icon).
3. Click it or navigate directly to `/admin`.

### Admin Navigation Flow

```
/login → authenticate with ADMIN credentials
  │
  ▼
Main Site Header shows "Admin Panel" link (amber)
  │
  ▼
/admin → AdminRoute guard checks role → AdminLayout renders
  │
  ├── /admin          → Dashboard (stats, revenue, trends)
  ├── /admin/users    → User Management (list, search, ban/unban)
  ├── /admin/bookings → Booking Management (list, status override, audit)
  ├── /admin/services → Service & Category Management (CRUD, toggle)
  ├── /admin/providers→ Provider Approvals (KYC approve/reject)
  └── /admin/reports  → Reports & Analytics (revenue, top providers)
```

### Security Layers

| Layer | Check | Failure Action |
|-------|-------|----------------|
| Frontend route | `AdminRoute` checks `user.roles` for ADMIN/SUPER_ADMIN | Redirect to `/login` or `/` |
| Axios interceptor | Attaches JWT; handles 401/403 | Clears tokens, redirects to `/login` |
| Spring Security | `hasAnyRole("ADMIN", "SUPER_ADMIN")` on `/api/admin/**` | Returns 403 Forbidden |

---

## 8. Feature Details

### 8.1 Dashboard

Provides a real-time overview of platform activity:
- **Stat Cards:** Total/pending/completed/cancelled bookings, customer count, provider count, service count, category count
- **Revenue Cards:** Total revenue (all-time), revenue this month
- **Pending KYC Alert:** Shown when providers are awaiting verification
- **Bookings by Status:** Breakdown of booking counts per status
- **Monthly Trend:** Booking volume for the last 6 months

### 8.2 User Management

Full user lifecycle management:
- **List & Search:** View all users, filter by role (Customer/Provider/Admin), search by name/email/phone
- **Ban/Unban:** Ban a user (sets `accountStatus=BANNED` and records `bannedReason`), or unban (sets `accountStatus=ACTIVE`)
- **Safeguard:** Admin/Super Admin users cannot be banned through the UI
- **Audit Trail:** All ban/unban actions are logged to `admin_audit_logs`

### 8.3 Booking Management

Oversight and intervention capabilities:
- **List & Filter:** Paginated listing with status and keyword search filters
- **Status Override:** Admin can override a booking's status (e.g., force-cancel, mark complete) with an admin note
- **Provider Assignment:** Admin can assign/reassign a provider to a booking
- **Audit Trail:** View the full history of admin actions on any booking

### 8.4 Service & Category Management

CRUD operations for the service catalog:
- **Categories:** Create, edit, toggle active/inactive. Fields include name, slug (auto-generated), description, icon, price range, display order, featured flag
- **Services:** Create, edit, toggle active/inactive, soft-delete. Fields include name, description, base price, price type, duration, category assignment, provider assignment, featured flag
- **Provider Dropdown:** When creating a service, only KYC-verified providers appear in the dropdown

### 8.5 Provider Verification (KYC)

KYC approval workflow:
- **Filter Tabs:** All / Pending / Verified / Rejected / Not Submitted
- **Provider Cards:** Show business name, owner info, KYC status, experience, location, rating, booking stats
- **Approve:** Sets `kycStatus=VERIFIED` and records `kycVerifiedAt` timestamp
- **Reject:** Sets `kycStatus=REJECTED` with a rejection reason
- **Re-approve:** Rejected providers can be approved again
- **Audit Trail:** All KYC decisions are logged

### 8.6 Reports & Analytics

Data-driven insights:
- **Revenue Report:** Configurable date range, shows total revenue, average booking value, completed booking count, and per-service revenue breakdown
- **Top Providers:** Ranked list of providers by completed bookings, including total earnings and average rating

---

## 9. File Inventory

### New Backend Files (17 files)

| Category | File | Purpose |
|----------|------|---------|
| Entity | `entity/AdminAuditLog.java` | Audit log entity mapping to `admin_audit_logs` |
| Repository | `repository/AdminAuditLogRepository.java` | Audit log queries |
| DTO | `dto/DashboardDTO.java` | Dashboard statistics DTOs |
| DTO | `dto/AdminUserDTO.java` | User management DTOs |
| DTO | `dto/AdminBookingDTO.java` | Booking management DTOs |
| DTO | `dto/AdminServiceDTO.java` | Service/category management DTOs |
| DTO | `dto/AdminProviderDTO.java` | Provider management DTOs |
| DTO | `dto/ReportDTO.java` | Report/analytics DTOs |
| Service | `service/AdminDashboardService.java` | Dashboard data aggregation |
| Service | `service/AdminUserService.java` | User CRUD and ban/unban logic |
| Service | `service/AdminBookingService.java` | Booking management and audit |
| Service | `service/AdminProviderService.java` | KYC approval/rejection |
| Controller | `controller/AdminDashboardController.java` | Dashboard API endpoints |
| Controller | `controller/AdminUserController.java` | User management API endpoints |
| Controller | `controller/AdminBookingController.java` | Booking management API endpoints |
| Controller | `controller/AdminServiceController.java` | Service/category CRUD API endpoints |
| Controller | `controller/AdminProviderController.java` | Provider KYC API endpoints |
| Controller | `controller/AdminReportController.java` | Reports API endpoints |

### New Frontend Files (9 files)

| Category | File | Purpose |
|----------|------|---------|
| Guard | `components/AdminRoute.jsx` | Role-based route protection |
| Layout | `layouts/AdminLayout.jsx` | Sidebar layout with navigation |
| API | `services/adminApi.js` | Axios instance for admin endpoints |
| Page | `pages/admin/Dashboard.jsx` | Dashboard with stats and trends |
| Page | `pages/admin/UserManagement.jsx` | User listing, search, ban/unban |
| Page | `pages/admin/BookingManagement.jsx` | Booking listing, status override, audit |
| Page | `pages/admin/ServiceManagement.jsx` | Category/service CRUD with modals |
| Page | `pages/admin/ProviderApprovals.jsx` | KYC approval workflow |
| Page | `pages/admin/Reports.jsx` | Revenue reports and top providers |

### Modified Files

| File | Change |
|------|--------|
| `entity/User.java` | Added `bannedReason` field |
| `repository/BookingRepository.java` | Added admin dashboard and report queries |
| `repository/UserRepository.java` | Added `countByUserType`, `findByUserType`, `searchUsers` |
| `repository/ServiceProviderRepository.java` | Added `countByKycStatus`, `findByKycStatus`, `findAllWithUser` |
| `frontend/src/App.jsx` | Added admin route block with `AdminRoute` guard and `AdminLayout` |
| `frontend/src/components/layout/MainLayout.jsx` | Added "Admin Panel" link (desktop + mobile) for admin users |
| `frontend/src/components/RoleSwitcher.jsx` | Added "Become a Provider" link for customer-only users |
| `frontend/src/pages/Profile.jsx` | Added "Become a Provider" CTA card for customer-only users |
