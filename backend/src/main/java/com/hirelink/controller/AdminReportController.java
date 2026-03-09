package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.ReportDTO.*;
import com.hirelink.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@RequiredArgsConstructor
public class AdminReportController {

    private final BookingRepository bookingRepository;

    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueReport>> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        LocalDateTime fromDateTime = from.atStartOfDay();
        LocalDateTime toDateTime = to.atTime(LocalTime.MAX);

        List<Object[]> raw = bookingRepository.revenueByService(fromDateTime, toDateTime);

        BigDecimal total = BigDecimal.ZERO;
        long count = 0;
        List<ServiceRevenue> breakdown = raw.stream().map(r -> ServiceRevenue.builder()
                .serviceName((String) r[0])
                .bookingCount((Long) r[1])
                .revenue((BigDecimal) r[2])
                .build()).collect(Collectors.toList());

        for (ServiceRevenue sr : breakdown) {
            total = total.add(sr.getRevenue());
            count += sr.getBookingCount();
        }

        BigDecimal avg = count > 0
                ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        return ResponseEntity.ok(ApiResponse.success(RevenueReport.builder()
                .totalRevenue(total)
                .averageBookingValue(avg)
                .totalCompletedBookings(count)
                .revenueByService(breakdown)
                .build()));
    }

    @GetMapping("/top-providers")
    public ResponseEntity<ApiResponse<List<TopProvider>>> getTopProviders() {
        List<Object[]> raw = bookingRepository.topProviders();
        List<TopProvider> providers = raw.stream()
                .limit(10)
                .map(r -> TopProvider.builder()
                        .providerId((Long) r[0])
                        .businessName((String) r[1])
                        .completedBookings((Long) r[2])
                        .totalEarnings((BigDecimal) r[3])
                        .averageRating((BigDecimal) r[4])
                        .build())
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(providers));
    }
}
