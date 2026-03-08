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

    private boolean hasRole(CustomUserDetails userDetails, String role) {
        return userDetails.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_" + role));
    }

    @PostMapping
    @Operation(summary = "Create a new booking (requires CUSTOMER role)")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> createBooking(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BookingDTO.CreateBookingRequest request) {
        if (!hasRole(userDetails, "CUSTOMER")) {
            throw new BadRequestException("Only customers can create bookings");
        }
        BookingDTO.BookingResponse response = bookingService.createBooking(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Booking created successfully", response));
    }

    @GetMapping("/my-bookings")
    @Operation(summary = "Get current user's bookings. Use 'role' param to specify view (CUSTOMER or PROVIDER)")
    public ResponseEntity<ApiResponse<BookingDTO.BookingListResponse>> getMyBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "CUSTOMER") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User.UserType viewAs = resolveViewRole(userDetails, role);
        BookingDTO.BookingListResponse response = bookingService.getBookingsForUser(
                userDetails.getUserId(), viewAs, status, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/search")
    @Operation(summary = "Search bookings by keyword")
    public ResponseEntity<ApiResponse<BookingDTO.BookingListResponse>> searchBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam String keyword,
            @RequestParam(required = false, defaultValue = "CUSTOMER") String role,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        User.UserType viewAs = resolveViewRole(userDetails, role);
        BookingDTO.BookingListResponse response = bookingService.searchBookingsForUser(
                userDetails.getUserId(), viewAs, keyword, page, size);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/recent")
    @Operation(summary = "Get recent bookings for dashboard")
    public ResponseEntity<ApiResponse<List<BookingDTO.BookingResponse>>> getRecentBookings(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestParam(required = false, defaultValue = "CUSTOMER") String role,
            @RequestParam(defaultValue = "3") int limit) {
        User.UserType viewAs = resolveViewRole(userDetails, role);
        List<BookingDTO.BookingResponse> response = bookingService.getRecentBookingsForUser(
                userDetails.getUserId(), viewAs, limit);
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
        boolean isDualRole = hasRole(userDetails, "CUSTOMER") && hasRole(userDetails, "PROVIDER");
        BookingDTO.BookingResponse response = isDualRole
                ? bookingService.getBookingByIdForDualRole(id, userDetails.getUserId())
                : bookingService.getBookingByIdForUser(id, userDetails.getUserId(),
                        hasRole(userDetails, "PROVIDER") ? User.UserType.PROVIDER : User.UserType.CUSTOMER);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @GetMapping("/number/{bookingNumber}")
    @Operation(summary = "Get booking by booking number")
    public ResponseEntity<ApiResponse<BookingDTO.BookingResponse>> getBookingByNumber(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable String bookingNumber) {
        boolean isDualRole = hasRole(userDetails, "CUSTOMER") && hasRole(userDetails, "PROVIDER");
        BookingDTO.BookingResponse response = isDualRole
                ? bookingService.getBookingByNumberForDualRole(bookingNumber, userDetails.getUserId())
                : bookingService.getBookingByNumberForUser(bookingNumber, userDetails.getUserId(),
                        hasRole(userDetails, "PROVIDER") ? User.UserType.PROVIDER : User.UserType.CUSTOMER);
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
    @Operation(summary = "Add review for completed booking (requires CUSTOMER role)")
    public ResponseEntity<ApiResponse<Void>> addReview(
            @PathVariable Long id,
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody BookingDTO.AddReviewRequest request) {
        if (!hasRole(userDetails, "CUSTOMER")) {
            throw new BadRequestException("Only customers can add reviews");
        }
        bookingService.addReview(id, userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Review added successfully"));
    }

    /**
     * Resolve which role the user wants to view bookings as.
     * Defaults to CUSTOMER if the requested role isn't in their authorities.
     */
    private User.UserType resolveViewRole(CustomUserDetails userDetails, String role) {
        if ("PROVIDER".equalsIgnoreCase(role) && hasRole(userDetails, "PROVIDER")) {
            return User.UserType.PROVIDER;
        }
        return User.UserType.CUSTOMER;
    }
}
