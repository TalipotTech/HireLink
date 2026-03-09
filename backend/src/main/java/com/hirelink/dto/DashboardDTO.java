package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class DashboardDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DashboardStats {
        private long totalBookings;
        private long pendingBookings;
        private long completedBookings;
        private long cancelledBookings;
        private long totalCustomers;
        private long totalProviders;
        private long pendingKycApprovals;
        private long totalServices;
        private long totalCategories;
        private BigDecimal totalRevenue;
        private BigDecimal revenueThisMonth;
        private List<BookingsByStatus> bookingsByStatus;
        private List<MonthlyBookingCount> monthlyTrend;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BookingsByStatus {
        private String status;
        private long count;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class MonthlyBookingCount {
        private String month;
        private long count;
    }
}
