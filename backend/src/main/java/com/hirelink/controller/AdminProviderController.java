package com.hirelink.controller;

import com.hirelink.dto.AdminProviderDTO.ProviderItem;
import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AdminProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/providers")
@RequiredArgsConstructor
public class AdminProviderController {

    private final AdminProviderService approvalService;

    @GetMapping("/pending")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ProviderItem>>> getPending() {
        List<ProviderItem> items = approvalService.getPendingProviders().stream()
                .map(this::toProviderItem)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ProviderItem>>> getAll() {
        List<ProviderItem> items = approvalService.getAllProviders().stream()
                .map(this::toProviderItem)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
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

    private ProviderItem toProviderItem(ServiceProvider sp) {
        return ProviderItem.builder()
                .providerId(sp.getProviderId())
                .businessName(sp.getBusinessName())
                .businessDescription(sp.getBusinessDescription())
                .tagline(sp.getTagline())
                .experienceYears(sp.getExperienceYears())
                .kycStatus(sp.getKycStatus() != null ? sp.getKycStatus().name() : null)
                .kycRejectionReason(sp.getKycRejectionReason())
                .kycVerifiedAt(sp.getKycVerifiedAt())
                .averageRating(sp.getAverageRating())
                .totalReviews(sp.getTotalReviews())
                .totalBookings(sp.getTotalBookings())
                .completedBookings(sp.getCompletedBookings())
                .totalEarnings(sp.getTotalEarnings())
                .isAvailable(sp.getIsAvailable())
                .availabilityStatus(sp.getAvailabilityStatus() != null ? sp.getAvailabilityStatus().name() : null)
                .isFeatured(sp.getIsFeatured())
                .baseAddress(sp.getBaseAddress())
                .basePincode(sp.getBasePincode())
                .createdAt(sp.getCreatedAt())
                .userId(sp.getUser() != null ? sp.getUser().getUserId() : null)
                .userName(sp.getUser() != null ? sp.getUser().getName() : null)
                .userEmail(sp.getUser() != null ? sp.getUser().getEmail() : null)
                .userPhone(sp.getUser() != null ? sp.getUser().getPhone() : null)
                .userAccountStatus(sp.getUser() != null && sp.getUser().getAccountStatus() != null
                        ? sp.getUser().getAccountStatus().name() : null)
                .primaryCategoryId(sp.getPrimaryCategory() != null ? sp.getPrimaryCategory().getCategoryId() : null)
                .primaryCategoryName(sp.getPrimaryCategory() != null ? sp.getPrimaryCategory().getCategoryName() : null)
                .build();
    }
}
