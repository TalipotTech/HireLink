package com.hirelink.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@hirelink.com}")
    private String fromEmail;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${app.backend-url:http://localhost:8080}")
    private String backendUrl;

    public void sendVerificationEmail(String toEmail, String token) {
        String verificationLink = backendUrl + "/api/auth/verify-email?token=" + token;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("HireLink - Verify Your Email Address");
            message.setText(buildVerificationEmailBody(verificationLink));

            mailSender.send(message);
            log.info("Verification email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send verification email to {}: {}", toEmail, e.getMessage());
            logVerificationFallback(toEmail, verificationLink);
            throw new RuntimeException("Failed to send verification email. Please try again.", e);
        }
    }

    private String buildVerificationEmailBody(String link) {
        return """
            Hello,

            Welcome to HireLink! Please verify your email address by clicking the link below:

            %s

            This link will expire in 24 hours.

            If you didn't create an account on HireLink, please ignore this email.

            Best regards,
            HireLink Team

            ---
            This is an automated message. Please do not reply.
            """.formatted(link);
    }

    public void sendOtpEmail(String toEmail, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("HireLink - Your Verification Code");
            message.setText(buildOtpEmailBody(otp));

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            logOtpFallback(toEmail, otp);
            throw new RuntimeException("Failed to send verification email. Please try again.", e);
        }
    }

    private String buildOtpEmailBody(String otp) {
        return """
            Hello,

            Your HireLink verification code is:

            %s

            This code will expire in 10 minutes.

            If you didn't request this code, please ignore this email.

            Best regards,
            HireLink Team

            ---
            This is an automated message. Please do not reply.
            """.formatted(otp);
    }

    public void sendPasswordResetEmail(String toEmail, String token) {
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(toEmail);
            message.setSubject("HireLink - Reset Your Password");
            message.setText(buildPasswordResetEmailBody(resetLink));

            mailSender.send(message);
            log.info("Password reset email sent successfully to: {}", toEmail);

        } catch (Exception e) {
            log.error("Failed to send password reset email to {}: {}", toEmail, e.getMessage());
            logPasswordResetFallback(toEmail, resetLink);
            throw new RuntimeException("Failed to send password reset email. Please try again.", e);
        }
    }

    private String buildPasswordResetEmailBody(String link) {
        return """
            Hello,

            We received a request to reset your HireLink password. Click the link below to set a new password:

            %s

            This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.

            Best regards,
            HireLink Team

            ---
            This is an automated message. Please do not reply.
            """.formatted(link);
    }

    private void logPasswordResetFallback(String email, String link) {
        log.warn("");
        log.warn("==============================================================");
        log.warn("  PASSWORD RESET FALLBACK (DEV)");
        log.warn("==============================================================");
        log.warn("  Email failed to send. Reset link for development:");
        log.warn("  Email: {}", email);
        log.warn("  Link:  {}", link);
        log.warn("==============================================================");
        log.warn("");
    }

    private void logVerificationFallback(String email, String link) {
        log.warn("");
        log.warn("==============================================================");
        log.warn("  EMAIL VERIFICATION FALLBACK (DEV)");
        log.warn("==============================================================");
        log.warn("  Email failed to send. Verification link for development:");
        log.warn("  Email: {}", email);
        log.warn("  Link:  {}", link);
        log.warn("==============================================================");
        log.warn("");
    }

    private void logOtpFallback(String email, String otp) {
        log.warn("");
        log.warn("==============================================================");
        log.warn("  EMAIL OTP FALLBACK (DEV)");
        log.warn("==============================================================");
        log.warn("  Email failed to send. OTP for development:");
        log.warn("  Email: {}", email);
        log.warn("  OTP:   {}", otp);
        log.warn("==============================================================");
        log.warn("");
    }

    public boolean isValidEmail(String email) {
        if (email == null || email.isEmpty()) {
            return false;
        }
        return email.matches("^[A-Za-z0-9+_.-]+@(.+)$");
    }
}
