package com.hirelink.service;

import com.hirelink.dto.AdminUserDTO.*;
import com.hirelink.entity.AdminAuditLog;
import com.hirelink.entity.User;
import com.hirelink.entity.UserRole;
import com.hirelink.repository.AdminAuditLogRepository;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ServiceProviderRepository providerRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public List<UserListItem> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    public List<UserListItem> getUsersByType(String userType) {
        return userRepository.findByUserType(User.UserType.valueOf(userType)).stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    public List<UserListItem> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword).stream()
                .map(this::toListItem)
                .collect(Collectors.toList());
    }

    public UserDetail getUserDetail(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        long bookingCount = bookingRepository.countByUserUserId(id);
        boolean hasProvider = providerRepository.findByUserUserId(id).isPresent();

        return UserDetail.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .userType(user.getUserType().name())
                .accountStatus(user.getAccountStatus().name())
                .roles(getRoleNames(user))
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL")
                .isPhoneVerified(user.getIsPhoneVerified())
                .isEmailVerified(user.getIsEmailVerified())
                .bannedReason(user.getBannedReason())
                .profileImageUrl(user.getProfileImageUrl())
                .totalBookings(bookingCount)
                .hasProviderProfile(hasProvider)
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .build();
    }

    @Transactional
    public UserDetail updateUser(Long id, UpdateUserRequest request, Long adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        String oldValues = String.format("{\"name\":\"%s\",\"phone\":\"%s\"}", user.getName(), user.getPhone());

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getEmail() != null) user.setEmail(request.getEmail());
        if (request.getUserType() != null) user.setUserType(User.UserType.valueOf(request.getUserType()));

        userRepository.save(user);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("USER_UPDATED")
                .actionDescription("Updated user profile for: " + user.getEmail())
                .targetType("USER")
                .targetId(id)
                .oldValues(oldValues)
                .newValues(String.format("{\"name\":\"%s\",\"phone\":\"%s\"}", user.getName(), user.getPhone()))
                .build());

        return getUserDetail(id);
    }

    @Transactional
    public void banUser(Long id, BanUserRequest request, Long adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountStatus(User.AccountStatus.BANNED);
        user.setBannedReason(request.getReason());
        userRepository.save(user);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("USER_BANNED")
                .actionDescription("Banned user: " + user.getEmail() + " - Reason: " + request.getReason())
                .targetType("USER")
                .targetId(id)
                .build());
    }

    @Transactional
    public void unbanUser(Long id, Long adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setAccountStatus(User.AccountStatus.ACTIVE);
        user.setBannedReason(null);
        userRepository.save(user);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("USER_UNBANNED")
                .actionDescription("Unbanned user: " + user.getEmail())
                .targetType("USER")
                .targetId(id)
                .build());
    }

    private UserListItem toListItem(User u) {
        return UserListItem.builder()
                .userId(u.getUserId())
                .name(u.getName())
                .email(u.getEmail())
                .phone(u.getPhone())
                .userType(u.getUserType().name())
                .accountStatus(u.getAccountStatus().name())
                .roles(getRoleNames(u))
                .authProvider(u.getAuthProvider() != null ? u.getAuthProvider().name() : "LOCAL")
                .isPhoneVerified(u.getIsPhoneVerified())
                .isEmailVerified(u.getIsEmailVerified())
                .createdAt(u.getCreatedAt())
                .lastLoginAt(u.getLastLoginAt())
                .build();
    }

    private List<String> getRoleNames(User user) {
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            return user.getRoles().stream()
                    .map(UserRole::getRole)
                    .collect(Collectors.toList());
        }
        return List.of(user.getUserType().name());
    }
}
