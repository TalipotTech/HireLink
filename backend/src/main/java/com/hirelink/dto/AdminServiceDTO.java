package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class AdminServiceDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CategoryItem {
        private Long categoryId;
        private String categoryName;
        private String categorySlug;
        private String categoryDescription;
        private String categoryIcon;
        private String categoryImageUrl;
        private Long parentCategoryId;
        private String parentCategoryName;
        private Integer categoryLevel;
        private Integer displayOrder;
        private Boolean isActive;
        private Boolean isFeatured;
        private BigDecimal minBasePrice;
        private BigDecimal maxBasePrice;
        private String priceUnit;
        private LocalDateTime createdAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ServiceItem {
        private Long serviceId;
        private String serviceName;
        private String serviceDescription;
        private BigDecimal basePrice;
        private String priceType;
        private Integer estimatedDurationMinutes;
        private Boolean isActive;
        private Boolean isFeatured;
        private BigDecimal averageRating;
        private Integer totalReviews;
        private Integer timesBooked;
        private Long categoryId;
        private String categoryName;
        private Long providerId;
        private String providerBusinessName;
        private LocalDateTime createdAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateCategoryRequest {
        private String categoryName;
        private String categorySlug;
        private String categoryDescription;
        private String categoryIcon;
        private String categoryImageUrl;
        private Long parentCategoryId;
        private Integer displayOrder;
        private Boolean isFeatured;
        private BigDecimal minBasePrice;
        private BigDecimal maxBasePrice;
        private String priceUnit;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class CreateServiceRequest {
        private String serviceName;
        private String serviceDescription;
        private BigDecimal basePrice;
        private String priceType;
        private Integer estimatedDurationMinutes;
        private Long categoryId;
        private Long providerId;
        private Boolean isFeatured;
    }
}
