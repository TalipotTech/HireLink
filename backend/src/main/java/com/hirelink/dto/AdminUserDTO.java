package com.hirelink.dto;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

public class AdminUserDTO {

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserListItem {
        private Long userId;
        private String name;
        private String email;
        private String phone;
        private String userType;
        private String accountStatus;
        private List<String> roles;
        private String authProvider;
        private Boolean isPhoneVerified;
        private Boolean isEmailVerified;
        private LocalDateTime createdAt;
        private LocalDateTime lastLoginAt;
    }

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UserDetail {
        private Long userId;
        private String name;
        private String email;
        private String phone;
        private String userType;
        private String accountStatus;
        private List<String> roles;
        private String authProvider;
        private Boolean isPhoneVerified;
        private Boolean isEmailVerified;
        private String bannedReason;
        private String profileImageUrl;
        private long totalBookings;
        private Boolean hasProviderProfile;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
        private LocalDateTime lastLoginAt;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class UpdateUserRequest {
        private String name;
        private String phone;
        private String email;
        private String userType;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class BanUserRequest {
        private String reason;
    }
}
