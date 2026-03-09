package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.DashboardDTO.DashboardStats;
import com.hirelink.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStats>> getStats() {
        return ResponseEntity.ok(ApiResponse.success("Dashboard loaded", dashboardService.getDashboardStats()));
    }
}
