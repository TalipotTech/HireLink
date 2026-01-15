package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.BookingDTO;
import com.hirelink.entity.User;
import com.hirelink.exception.BadRequestException;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.BookingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
@Tag(name = "Bookings", description = "Booking management endpoints")
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    @Operation(summary = "Create a new booking (Customers only)")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> createBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BookingDTO.CreateBookingRequest request) {
        // Only customers can create bookings
        if (userDetails.getUserType() != User.UserType.CUSTOMER) {
            throw new BadRequestException("Only customers can create bookings");
        }
        BookingDTO.BookingResponse response = bookingService.createBooking(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Booking created successfully", response));
    }

    @GetMapping("/my-bookings")
    @Operation(summary = "Get current user's bookings based on their role")
    public ResponseEntity<ApiResponse<BookingDTO.BookingListResponse>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        BookingDTO.BookingListResponse response = bookingService.getBookingsForUser(
                userDetails.getUserId(), userDetails.getUserType(), status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent bookings for dashboard (PENDING first)")
    public ResponseEntity<ApiResponse<List<BookingDTO.BookingResponse>>> getRecentBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(defaultValue = "3") int limit) {
        List<BookingDTO.BookingResponse> response = bookingService.getRecentBookingsForUser(
                userDetails.getUserId(), userDetails.getUserType(), limit);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAnyRole('ADMIN', 'SUPER_ADMIN')")
    @Operation(summary = "Get all bookings (Admin only)")
    public ResponseEntity<ApiResponse<BookingDTO.BookingListResponse>> getAllBookings(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        BookingDTO.BookingListResponse response = bookingService.getAllBookings(status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get booking by ID")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> getBookingById(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        BookingDTO.BookingResponse response = bookingService.getBookingByIdForUser(
                id, userDetails.getUserId(), userDetails.getUserType());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/number/{bookingNumber}")
    @Operation(summary = "Get booking by booking number")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> getBookingByNumber(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String bookingNumber) {
        BookingDTO.BookingResponse response = bookingService.getBookingByNumberForUser(
                bookingNumber, userDetails.getUserId(), userDetails.getUserType());
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update booking status")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> updateBookingStatus(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BookingDTO.UpdateBookingStatusRequest request) {
        BookingDTO.BookingResponse response = bookingService.updateBookingStatus(id, userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Booking status updated", response));
    }

    @PostMapping("/{id}/review")
    @Operation(summary = "Add review for completed booking (Customers only)")
    public ResponseEntity<ApiResponse<Void>> addReview(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BookingDTO.AddReviewRequest request) {
        // Only customers can add reviews
        if (userDetails.getUserType() != User.UserType.CUSTOMER) {
            throw new BadRequestException("Only customers can add reviews");
        }
        bookingService.addReview(id, userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Review added successfully"));
    }
}
