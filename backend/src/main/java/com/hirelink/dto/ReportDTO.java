package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class ReportDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RevenueReport {
        private BigDecimal totalRevenue;
        private BigDecimal averageBookingValue;
        private long totalCompletedBookings;
        private List<ServiceRevenue> revenueByService;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceRevenue {
        private String serviceName;
        private long bookingCount;
        private BigDecimal revenue;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopProvider {
        private Long providerId;
        private String providerName;
        private String businessName;
        private long completedBookings;
        private BigDecimal totalEarnings;
        private BigDecimal averageRating;
    }
}
