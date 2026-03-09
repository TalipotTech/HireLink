package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public class AdminBookingDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AdminBookingListItem {
        private Long bookingId;
        private String bookingNumber;
        private String customerName;
        private String customerEmail;
        private String providerBusinessName;
        private String serviceName;
        private String bookingStatus;
        private String paymentStatus;
        private LocalDate scheduledDate;
        private LocalTime scheduledTime;
        private BigDecimal estimatedAmount;
        private BigDecimal finalAmount;
        private String serviceCity;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class OverrideStatusRequest {
        private String status;
        private String adminNote;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AssignProviderRequest {
        private Long providerId;
    }
}
