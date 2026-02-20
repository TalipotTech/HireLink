package com.hirelink.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;

public class BookingDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateBookingRequest {
        @NotNull(message = "Service ID is required")
        private Long serviceId;

        @NotNull(message = "Provider ID is required")
        private Long providerId;

        @NotNull(message = "Scheduled date is required")
        @Future(message = "Scheduled date must be in the future")
        private LocalDate scheduledDate;

        @NotNull(message = "Scheduled time is required")
        private LocalTime scheduledTime;

        @NotBlank(message = "Service address is required")
        private String serviceAddress;

        private String serviceLandmark;

        @NotBlank(message = "Pincode is required")
        @Pattern(regexp = "^[0-9]{6}$", message = "Invalid pincode format")
        private String servicePincode;

        private BigDecimal serviceLatitude;
        private BigDecimal serviceLongitude;
        private String serviceCity;
        private String serviceState;

        private String issueTitle;
        private String issueDescription;
        private List<String> issueImages;
        private String urgencyLevel;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingResponse {
        private Long bookingId;
        private String bookingNumber;
        private LocalDate scheduledDate;
        private LocalTime scheduledTime;
        private LocalTime scheduledEndTime;
        private String serviceAddress;
        private String serviceLandmark;
        private String servicePincode;
        private BigDecimal serviceLatitude;
        private BigDecimal serviceLongitude;
        private String serviceCity;
        private String serviceState;
        private String issueTitle;
        private String issueDescription;
        private List<String> issueImages;
        private String urgencyLevel;
        private BigDecimal estimatedAmount;
        private BigDecimal materialCost;
        private BigDecimal laborCost;
        private BigDecimal travelCharge;
        private BigDecimal discountAmount;
        private BigDecimal taxAmount;
        private BigDecimal finalAmount;
        private String bookingStatus;
        private String paymentStatus;
        private String cancelledBy;
        private String cancellationReason;
        private LocalDateTime cancelledAt;
        private String providerNotes;
        private String workSummary;
        private BigDecimal userRating;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private ServiceSummary service;
        private ProviderInfo provider;
        private CustomerInfo customer;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceSummary {
        private Long serviceId;
        private String serviceName;
        private BigDecimal basePrice;
        private String priceType;
        private Integer estimatedDurationMinutes;
        private String categoryName;
        private String categoryIcon;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderInfo {
        private Long providerId;
        private String businessName;
        private String providerName;
        private String phone;
        private String profileImageUrl;
        private BigDecimal averageRating;
        private Integer completedBookings;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CustomerInfo {
        private Long userId;
        private String name;
        private String phone;
        private String email;
        private String profileImageUrl;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateBookingStatusRequest {
        @NotBlank(message = "Status is required")
        private String status;
        
        private String reason;
        private String notes;
        private BigDecimal finalAmount;
        private String workSummary;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingListResponse {
        private List<BookingResponse> bookings;
        private Integer page;
        private Integer size;
        private Long total;
        private Integer totalPages;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class AddReviewRequest {
        @NotNull(message = "Overall rating is required")
        @DecimalMin(value = "1.0", message = "Rating must be at least 1")
        @DecimalMax(value = "5.0", message = "Rating cannot exceed 5")
        private BigDecimal overallRating;

        private BigDecimal qualityRating;
        private BigDecimal punctualityRating;
        private BigDecimal professionalismRating;
        private BigDecimal valueForMoneyRating;
        private String reviewTitle;
        private String reviewText;
        private List<String> reviewImages;
    }
}
