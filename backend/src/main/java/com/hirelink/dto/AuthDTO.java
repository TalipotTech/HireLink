package com.hirelink.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

public class AuthDTO {

    /**
     * OTP-verified registration (phone + OTP flow).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
        private String phone;

        @NotBlank(message = "OTP is required")
        private String otp;

        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;
    }

    /**
     * Email-verified registration (email + password + verification link).
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class EmailRegisterRequest {
        @NotBlank(message = "Name is required")
        @Size(min = 2, max = 100, message = "Name must be between 2 and 100 characters")
        private String name;

        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;

        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;

        @Pattern(regexp = "^[+]?[0-9]{10,15}$", message = "Invalid phone number format")
        private String phone;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResendVerificationRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    /**
     * Request to upgrade a CUSTOMER account to also have PROVIDER role.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BecomeProviderRequest {
        @NotNull(message = "Category ID is required")
        private Long categoryId;

        @NotBlank(message = "Base address is required")
        private String baseAddress;

        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "Invalid 6-digit pincode")
        private String basePincode;

        private BigDecimal baseLatitude;
        private BigDecimal baseLongitude;
        private String serviceCity;
        private String serviceState;
    }

    /**
     * Login with phone/email and password.
     * Provide either phone OR email, not both.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class LoginRequest {
        private String phone;   // Login with phone + password
        private String email;   // Login with email + password

        @NotBlank(message = "Password is required")
        private String password;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AuthResponse {
        private String accessToken;
        private String refreshToken;
        private String tokenType;
        private Long expiresIn;
        private UserDTO user;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RefreshTokenRequest {
        @NotBlank(message = "Refresh token is required")
        private String refreshToken;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ChangePasswordRequest {
        @NotBlank(message = "Current password is required")
        private String currentPassword;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "New password must be at least 8 characters")
        private String newPassword;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDTO {
        private Long userId;
        private String name;
        private String email;
        private String phone;
        private String profileImageUrl;
        private String userType;
        private List<String> roles;
        private Boolean hasProviderProfile;
        private String providerApplicationStatus;
        private String accountStatus;
        private Boolean isEmailVerified;
        private Boolean isPhoneVerified;
        private String authProvider;
        private Boolean hasPassword;
    }

    /**
     * Request to set password for OTP-verified users.
     * Users who verified via OTP can set a password for future logins.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SetPasswordRequest {
        @NotBlank(message = "Password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String password;
    }

    // ============================================
    // OTP Authentication DTOs
    // ============================================

    /**
     * Request to send OTP to phone or email.
     * Provide either phone OR email, not both.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SendOtpRequest {
        private String phone;   // For SMS OTP
        private String email;   // For Email OTP
    }

    /**
     * Request to verify OTP and login.
     * Provide the same identifier (phone or email) used in SendOtpRequest.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyOtpRequest {
        private String phone;   // For SMS OTP
        private String email;   // For Email OTP
        
        @NotBlank(message = "OTP is required")
        private String otp;
        
        private String name;
    }

    // ============================================
    // Google OAuth DTOs
    // ============================================

    /**
     * Request for Google OAuth login.
     * Contains user info from Google's OAuth response.
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class GoogleLoginRequest {
        @NotBlank(message = "Google ID is required")
        private String googleId;
        
        @NotBlank(message = "Email is required")
        private String email;
        
        private String name;
        private String imageUrl;
    }

    // ============================================
    // Forgot / Reset Password DTOs
    // ============================================

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ForgotPasswordRequest {
        @NotBlank(message = "Email is required")
        @Email(message = "Invalid email format")
        private String email;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResetPasswordRequest {
        @NotBlank(message = "Token is required")
        private String token;

        @NotBlank(message = "New password is required")
        @Size(min = 8, message = "Password must be at least 8 characters")
        private String newPassword;
    }

    /**
     * Simple message response for OTP sending
     */
    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MessageResponse {
        private String message;
    }
}
