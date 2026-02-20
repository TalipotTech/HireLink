package com.hirelink.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PaymentDTO {

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrderRequest {
        @NotNull(message = "Booking ID is required")
        private Long bookingId;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateOrderResponse {
        private String orderId;
        private Long amount;
        private String currency;
        private String keyId;
        private String bookingNumber;
        private String customerName;
        private String customerEmail;
        private String customerPhone;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class VerifyPaymentRequest {
        @NotNull(message = "Razorpay order ID is required")
        private String razorpayOrderId;

        @NotNull(message = "Razorpay payment ID is required")
        private String razorpayPaymentId;

        @NotNull(message = "Razorpay signature is required")
        private String razorpaySignature;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PaymentResponse {
        private Long paymentId;
        private String paymentNumber;
        private Long bookingId;
        private String bookingNumber;
        private BigDecimal grossAmount;
        private BigDecimal netAmount;
        private String currency;
        private String paymentMethod;
        private String paymentGateway;
        private String gatewayPaymentId;
        private String paymentStatus;
        private LocalDateTime initiatedAt;
        private LocalDateTime completedAt;
    }
}
