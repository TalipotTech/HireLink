package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminProviderDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProviderItem {
        private Long providerId;
        private String businessName;
        private String businessDescription;
        private String tagline;
        private Integer experienceYears;
        private String kycStatus;
        private String kycRejectionReason;
        private LocalDateTime kycVerifiedAt;
        private BigDecimal averageRating;
        private Integer totalReviews;
        private Integer totalBookings;
        private Integer completedBookings;
        private BigDecimal totalEarnings;
        private Boolean isAvailable;
        private String availabilityStatus;
        private Boolean isFeatured;
        private String baseAddress;
        private String basePincode;
        private LocalDateTime createdAt;

        // User info (flattened)
        private Long userId;
        private String userName;
        private String userEmail;
        private String userPhone;
        private String userAccountStatus;

        // Category info
        private Long primaryCategoryId;
        private String primaryCategoryName;
    }
}
