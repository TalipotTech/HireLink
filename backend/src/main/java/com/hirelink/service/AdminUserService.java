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

    @Transactional
    public void deleteUser(Long id, Long adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getUserType() == User.UserType.ADMIN || user.getUserType() == User.UserType.SUPER_ADMIN) {
            throw new RuntimeException("Cannot delete admin users");
        }

        String originalEmail = user.getEmail();
        String originalPhone = user.getPhone();

        user.setDeletedAt(java.time.LocalDateTime.now());
        user.setAccountStatus(User.AccountStatus.INACTIVE);
        user.setEmail(null);
        user.setPhone(null);
        userRepository.save(user);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("USER_DELETED")
                .actionDescription("Soft-deleted user: " + (originalEmail != null ? originalEmail : originalPhone))
                .targetType("USER")
                .targetId(id)
                .oldValues(String.format("{\"email\":\"%s\",\"phone\":\"%s\"}", originalEmail, originalPhone))
                .build());
    }

    @Transactional
    public void restoreUser(Long id, Long adminUserId) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getDeletedAt() == null) {
            throw new RuntimeException("User is not deleted");
        }

        AdminAuditLog deleteLog = auditLogRepository
                .findByTargetTypeAndTargetIdOrderByPerformedAtDesc("USER", id)
                .stream()
                .filter(log -> "USER_DELETED".equals(log.getActionType()) && log.getOldValues() != null)
                .findFirst()
                .orElse(null);

        if (deleteLog != null && deleteLog.getOldValues() != null) {
            String oldValues = deleteLog.getOldValues();
            String email = extractJsonValue(oldValues, "email");
            String phone = extractJsonValue(oldValues, "phone");
            if (email != null && !"null".equals(email)) user.setEmail(email);
            if (phone != null && !"null".equals(phone)) user.setPhone(phone);
        }

        user.setDeletedAt(null);
        user.setAccountStatus(User.AccountStatus.ACTIVE);
        userRepository.save(user);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("USER_RESTORED")
                .actionDescription("Restored user: " + (user.getEmail() != null ? user.getEmail() : user.getPhone()))
                .targetType("USER")
                .targetId(id)
                .build());
    }

    private String extractJsonValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return null;
        start += search.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return null;
        return json.substring(start, end);
    }

    private UserListItem toListItem(User u) {
        boolean deleted = u.getDeletedAt() != null;
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
                .isDeleted(deleted)
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
