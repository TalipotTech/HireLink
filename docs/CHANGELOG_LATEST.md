# HireLink — Latest Changes

**Date:** March 14, 2026
**Branch:** main

---

## 1. Razorpay Payment Integration — Bug Fixes & Enhancements

### Problems Fixed

| # | Issue | Root Cause | Fix |
|---|-------|-----------|-----|
| 1 | Razorpay checkout key mismatch | Frontend overrode the backend's key with `VITE_RAZORPAY_KEY_ID` env var. If they differed, the Razorpay order was created with one key but the checkout opened with another, causing silent failure. | Frontend now uses `orderData.keyId` from the backend response exclusively, ensuring the checkout key always matches the key used to create the order. |
| 2 | No Razorpay script load check | If `checkout.js` CDN failed to load (network issue, ad blocker), `new window.Razorpay()` threw a TypeError with no helpful message. | Added explicit `typeof window.Razorpay !== 'function'` check with user-friendly error: *"Payment gateway failed to load. Please refresh and try again."* |
| 3 | Backend mock mode detection too narrow | Only checked for `"xxxxx"` in keys. Empty, blank, or malformed keys would attempt real initialization and fail. | Expanded detection: null, blank, missing `rzp_` prefix, and `"xxxxx"` placeholder all trigger mock mode. `RazorpayClient` construction is now wrapped in try-catch for graceful fallback. |
| 4 | Razorpay secret key exposed in frontend | `VITE_RAZORPAY_KEY_SECRET` was present in `frontend/.env`. Secret keys must never be client-side. | Removed `VITE_RAZORPAY_KEY_SECRET` and `VITE_RAZORPAY_KEY_ID` from frontend `.env`. All Razorpay configuration is now managed solely in the backend's `application.properties`. |

### Amount Calculation Fix

**Before:** Razorpay was only charging the platform fee (₹8 `bookingCharge`).
**After:** Razorpay now charges **Service Fee + Platform Fee** as the total.

- `serviceFee` is taken from `booking.finalAmount` (or `estimatedAmount` as fallback).
- `totalAmount = serviceFee + bookingCharge` is sent to Razorpay.
- The Razorpay checkout description now displays: **"Service Fee ₹X + Platform Fee ₹Y"**.
- The mock/demo mode dialog also shows the fee breakdown.
- The Payment Summary sidebar on the booking detail page remains unchanged (shows service price only, as intended).

### Files Changed

| File | Change |
|------|--------|
| `backend/.../service/PaymentService.java` | Robust Razorpay init with try-catch fallback; total = service fee + platform fee; improved error logging |
| `backend/.../dto/PaymentDTO.java` | Replaced `bookingCharge` with `serviceFee` + `platformFee` in `CreateOrderResponse` |
| `frontend/src/pages/BookingDetail.jsx` | Uses backend key; Razorpay script load guard; fee breakdown in checkout description; better error messages |
| `frontend/.env` | Removed Razorpay key ID and secret (security fix) |

---

## 2. Email Verification & Password Reset

### New Features

- **Email-based registration** with verification link sent via SMTP (Gmail).
- **Email verification flow:** User registers → receives verification email → clicks link → account activated.
- **Resend verification email** endpoint for unverified users.
- **Forgot password** flow: User submits email → receives reset link → sets new password via token.
- **Password reset** with secure token validation and expiry.

### New Files

| File | Purpose |
|------|---------|
| `backend/.../entity/EmailVerificationToken.java` | JPA entity for email verification tokens |
| `backend/.../entity/PasswordResetToken.java` | JPA entity for password reset tokens |
| `backend/.../repository/EmailVerificationTokenRepository.java` | Token lookup and cleanup queries |
| `backend/.../repository/PasswordResetTokenRepository.java` | Token lookup and cleanup queries |
| `frontend/src/pages/auth/EmailVerified.jsx` | Email verified confirmation page |
| `frontend/src/pages/auth/ForgotPassword.jsx` | Forgot password form |
| `frontend/src/pages/auth/ResetPassword.jsx` | Reset password form (token-based) |
| `database/migration_email_verification.sql` | DB migration for email verification tokens |
| `database/migration_password_reset.sql` | DB migration for password reset tokens |

### Modified Files

| File | Change |
|------|--------|
| `backend/.../controller/AuthController.java` | New endpoints: register-email, verify-email, resend-verification, forgot-password, reset-password |
| `backend/.../service/AuthService.java` | Email registration, token generation/validation, password reset logic |
| `backend/.../service/EmailService.java` | HTML email templates for verification and password reset |
| `backend/.../dto/AuthDTO.java` | New DTOs: EmailRegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, ResendVerificationRequest |
| `frontend/src/pages/auth/Register.jsx` | Reworked registration UI with email-based option |
| `frontend/src/pages/auth/Login.jsx` | Added "Forgot Password" link |
| `frontend/src/App.jsx` | New routes: /email-verified, /forgot-password, /reset-password |
| `frontend/src/services/api.js` | New API methods: registerEmail, resendVerification, forgotPassword, resetPassword |
| `backend/src/main/resources/application.properties` | Added SMTP config and frontend/backend URL settings |

---

## 3. User Profile & Role Management Enhancements

### Changes

- **Profile page overhaul:** Added email verification status display, send verification link, and edit profile capabilities.
- **Become Provider flow:** Improved form validation and submission UX.
- **Role Switcher:** Enhanced dual-role switching between Customer and Provider views.
- **Main Layout:** Updated navigation for role-aware menu items.
- **Auth Store:** Extended state management to support email verification status and role switching.

### Files Changed

| File | Change |
|------|--------|
| `frontend/src/pages/Profile.jsx` | Email verification status, send verification link, profile editing |
| `frontend/src/pages/BecomeProvider.jsx` | Improved become-provider form and flow |
| `frontend/src/components/RoleSwitcher.jsx` | Enhanced role switching UI |
| `frontend/src/components/layout/MainLayout.jsx` | Role-aware navigation updates |
| `frontend/src/context/authStore.js` | Extended auth state for verification and roles |
| `backend/.../controller/UserController.java` | Profile update and email verification endpoints |
| `backend/.../repository/UserRepository.java` | Updated user queries |

---

## 4. Admin Module Enhancements

### Changes

- **User Management:** Enhanced admin user list with ban/unban and role update capabilities.
- **Provider Approvals:** Added provider KYC rejection reason support.
- **Admin User Service:** New service methods for user CRUD operations.

### Files Changed

| File | Change |
|------|--------|
| `backend/.../controller/AdminUserController.java` | New admin user management endpoints |
| `backend/.../dto/AdminUserDTO.java` | Added fields for admin user operations |
| `backend/.../service/AdminUserService.java` | User ban/unban, role update, detail retrieval |
| `backend/.../service/AdminProviderService.java` | Provider approval with rejection reason |
| `frontend/src/pages/admin/UserManagement.jsx` | Enhanced admin UI for user management |

---

## Configuration

### Backend (`application.properties`)

```properties
# Razorpay — replace with your own test/live keys
razorpay.key-id=${RAZORPAY_KEY_ID:rzp_test_YOUR_KEY}
razorpay.key-secret=${RAZORPAY_KEY_SECRET:YOUR_SECRET}

# Platform booking charge (added to service fee for total payment)
hirelink.booking-charge=8

# Email SMTP
spring.mail.host=smtp.gmail.com
spring.mail.port=587
spring.mail.username=${MAIL_USERNAME:your@email.com}
spring.mail.password=${MAIL_PASSWORD:your-app-password}

# App URLs (used in email links)
app.frontend-url=${FRONTEND_URL:http://localhost:3000}
app.backend-url=${BACKEND_URL:http://localhost:8080}
```

### Database Migrations Required

Run these SQL scripts if upgrading from a previous version:

1. `database/migration_email_verification.sql` — Creates `email_verification_tokens` table
2. `database/migration_password_reset.sql` — Creates `password_reset_tokens` table
