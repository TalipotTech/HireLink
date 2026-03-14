package com.hirelink.controller;

import com.hirelink.dto.AdminUserDTO.*;
import com.hirelink.dto.ApiResponse;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<UserListItem>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {

        List<UserListItem> users;
        if (search != null && !search.isBlank()) {
            users = adminUserService.searchUsers(search);
        } else if (role != null && !role.isBlank()) {
            users = adminUserService.getUsersByType(role);
        } else {
            users = adminUserService.getAllUsers();
        }
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetail>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getUserDetail(id)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetail>> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        return ResponseEntity.ok(ApiResponse.success("User updated",
                adminUserService.updateUser(id, request, adminUser.getUserId())));
    }

    @PostMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<String>> banUser(
            @PathVariable Long id,
            @RequestBody BanUserRequest request,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        adminUserService.banUser(id, request, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("User banned"));
    }

    @PostMapping("/{id}/unban")
    public ResponseEntity<ApiResponse<String>> unbanUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        adminUserService.unbanUser(id, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("User unbanned"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        adminUserService.deleteUser(id, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("User deleted"));
    }

    @PostMapping("/{id}/restore")
    public ResponseEntity<ApiResponse<String>> restoreUser(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        adminUserService.restoreUser(id, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("User restored"));
    }
}
