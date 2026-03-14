package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.AuthDTO;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Authentication endpoints")
public class AuthController {

    private final AuthService authService;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @PostMapping("/register")
    @Operation(summary = "Register with phone + OTP verification")
    public ResponseEntity<ApiResponse<AuthDTO.AuthResponse>> register(
            @Valid @RequestBody AuthDTO.RegisterRequest request) {
        AuthDTO.AuthResponse response = authService.register(request);
        return ResponseEntity.ok(ApiResponse.success("Registration successful", response));
    }

    @PostMapping("/register-email")
    @Operation(summary = "Register with email + password (sends verification link)")
    public ResponseEntity<ApiResponse<AuthDTO.MessageResponse>> registerWithEmail(
            @Valid @RequestBody AuthDTO.EmailRegisterRequest request) {
        AuthDTO.MessageResponse response = authService.registerWithEmail(request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    @GetMapping("/verify-email")
    @Operation(summary = "Verify email via link -- redirects to frontend")
    public void verifyEmail(@RequestParam String token, HttpServletResponse response) throws IOException {
        try {
            authService.verifyEmail(token);
            log.info("Email verification succeeded for token (prefix): {}...", token.substring(0, Math.min(8, token.length())));
            response.sendRedirect(frontendUrl + "/email-verified?status=success");
        } catch (Exception e) {
            log.warn("Email verification failed: {}", e.getMessage());
            String msg = URLEncoder.encode(e.getMessage(), StandardCharsets.UTF_8);
            response.sendRedirect(frontendUrl + "/email-verified?status=error&message=" + msg);
        }
    }

    @PostMapping("/resend-verification")
    @Operation(summary = "Resend the email verification link")
    public ResponseEntity<ApiResponse<String>> resendVerification(
            @Valid @RequestBody AuthDTO.ResendVerificationRequest request) {
        authService.resendVerificationEmail(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "Verification email sent", "Please check your email for the verification link."));
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
    // Forgot / Reset Password Endpoints
    // ============================================

    @PostMapping("/forgot-password")
    @Operation(summary = "Send a password-reset link to the user's email")
    public ResponseEntity<ApiResponse<AuthDTO.MessageResponse>> forgotPassword(
            @Valid @RequestBody AuthDTO.ForgotPasswordRequest request) {
        authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(ApiResponse.success(
                "If an account exists with this email, a reset link has been sent.",
                AuthDTO.MessageResponse.builder()
                        .message("If an account exists with this email, a reset link has been sent.")
                        .build()));
    }

    @PostMapping("/reset-password")
    @Operation(summary = "Reset password using a valid reset token")
    public ResponseEntity<ApiResponse<AuthDTO.MessageResponse>> resetPassword(
            @Valid @RequestBody AuthDTO.ResetPasswordRequest request) {
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok(ApiResponse.success(
                "Password reset successfully. You can now sign in with your new password.",
                AuthDTO.MessageResponse.builder()
                        .message("Password reset successfully. You can now sign in with your new password.")
                        .build()));
    }

    // ============================================
    // OTP Authentication Endpoints
    // ============================================

    @PostMapping("/send-otp")
    @Operation(summary = "Send OTP to phone or email")
    public ResponseEntity<ApiResponse<String>> sendOtp(
            @RequestBody AuthDTO.SendOtpRequest request) {

        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            authService.sendPhoneOtp(request.getPhone(), request.getEmail());
            String msg = (request.getEmail() != null && !request.getEmail().isEmpty())
                    ? "Check your phone and email for the verification code"
                    : "Check your phone for the verification code";
            return ResponseEntity.ok(ApiResponse.success("OTP sent", msg));
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
