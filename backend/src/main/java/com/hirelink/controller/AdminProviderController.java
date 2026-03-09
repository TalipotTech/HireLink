package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AdminProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/providers")
@RequiredArgsConstructor
public class AdminProviderController {

    private final AdminProviderService approvalService;

    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<ServiceProvider>>> getPending() {
        return ResponseEntity.ok(ApiResponse.success(approvalService.getPendingProviders()));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceProvider>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(approvalService.getAllProviders()));
    }

    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<String>> approve(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        approvalService.approveProvider(id, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Provider approved"));
    }

    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<String>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        approvalService.rejectProvider(id, body.get("reason"), adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Provider rejected"));
    }
}
