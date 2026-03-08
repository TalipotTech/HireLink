package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.AuthDTO;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Register a new user (OTP-verified)")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request) {
        AuthDTO.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/login")
    @Operation(summary = "Login with phone/email and password")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> login(
            @Valid @RequestBody AuthDTO.LoginRequest request) {
        AuthDTO.AuthResponse response = authService.login(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    @PostMapping("/set-password")
    @Operation(summary = "Set password for verified users (requires authentication)")
    public ResponseEntity<ApiResponse<Void>> setPassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AuthDTO.SetPasswordRequest request) {
        authService.setPassword(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password set successfully"));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> refreshToken(
            @Valid @RequestBody AuthDTO.RefreshTokenRequest request) {
        AuthDTO.AuthResponse response = authService.refreshToken(request.getRefreshToken());
        return ResponseEntity.ok(ApiResponse.success("Token refreshed", response));
    }

    @PostMapping("/change-password")
    @Operation(summary = "Change password")
    public ResponseEntity<ApiResponse<Void>> changePassword(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AuthDTO.ChangePasswordRequest request) {
        authService.changePassword(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed successfully"));
    }

    // ============================================
    // OTP Authentication Endpoints
    // ============================================

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP to phone or email")
    public ResponseEntity<ApiResponse<String>> sendOtp(
            @RequestBody AuthDTO.SendOtpRequest request) {

        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            authService.sendPhoneOtp(request.getPhone());
            return ResponseEntity.ok(ApiResponse.success("OTP sent to phone", "Check your phone for the verification code"));
        } else if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            authService.sendEmailOtp(request.getEmail());
            return ResponseEntity.ok(ApiResponse.success("OTP sent to email", "Check your email for the verification code"));
        } else {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Phone or email is required"));
        }
    }

    @PostMapping("/verify-otp")
    @Operation(summary = "Verify OTP and login")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> verifyOtp(
            @Valid @RequestBody AuthDTO.VerifyOtpRequest request) {
        AuthDTO.AuthResponse response = authService.verifyOtpAndLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }

    // ============================================
    // Google OAuth Endpoint
    // ============================================

    @PostMapping("/google")
    @Operation(summary = "Login with Google OAuth")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> googleLogin(
            @Valid @RequestBody AuthDTO.GoogleLoginRequest request) {
        AuthDTO.AuthResponse response = authService.googleLogin(request);
        return ResponseEntity.ok(ApiResponse.success("Login successful", response));
    }
}
