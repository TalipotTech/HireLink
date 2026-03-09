package com.hirelink.controller;

import com.hirelink.dto.AdminBookingDTO.*;
import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.AdminAuditLog;
import com.hirelink.entity.Booking.BookingStatus;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AdminBookingService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    @GetMapping
    public ResponseEntity<ApiResponse<Page<AdminBookingListItem>>> getAll(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<AdminBookingListItem> bookings;

        if (search != null && !search.isBlank()) {
            bookings = adminBookingService.searchBookings(search, pageable);
        } else if (status != null && !status.isBlank()) {
            bookings = adminBookingService.getBookingsByStatus(BookingStatus.valueOf(status), pageable);
        } else {
            bookings = adminBookingService.getAllBookings(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(bookings));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> overrideStatus(
            @PathVariable Long id,
            @RequestBody OverrideStatusRequest request,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        adminBookingService.overrideStatus(id, request, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Booking status overridden"));
    }

    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<String>> assignProvider(
            @PathVariable Long id,
            @RequestBody AssignProviderRequest request,
            @AuthenticationPrincipal CustomUserDetails adminUser) {
        adminBookingService.assignProvider(id, request, adminUser.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Provider assigned"));
    }

    @GetMapping("/{id}/audit")
    public ResponseEntity<ApiResponse<List<AdminAuditLog>>> getAudit(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminBookingService.getAuditTrail(id)));
    }
}
