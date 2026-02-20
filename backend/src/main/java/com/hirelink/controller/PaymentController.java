package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.PaymentDTO;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.PaymentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Tag(name = "Payments", description = "Razorpay payment endpoints")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/create-order")
    @Operation(summary = "Create a Razorpay order for a confirmed booking")
    public ResponseEntity<ApiResponse<PaymentDTO.CreateOrderResponse>> createOrder(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody PaymentDTO.CreateOrderRequest request) {
        PaymentDTO.CreateOrderResponse response = paymentService.createOrder(
                userDetails.getUserId(), request.getBookingId());
        return ResponseEntity.ok(ApiResponse.success("Payment order created", response));
    }

    @PostMapping("/verify")
    @Operation(summary = "Verify Razorpay payment after checkout")
    public ResponseEntity<ApiResponse<PaymentDTO.PaymentResponse>> verifyPayment(
            @Valid @RequestBody PaymentDTO.VerifyPaymentRequest request) {
        PaymentDTO.PaymentResponse response = paymentService.verifyPayment(request);
        return ResponseEntity.ok(ApiResponse.success("Payment verified successfully", response));
    }

    @GetMapping("/booking/{bookingId}")
    @Operation(summary = "Get payment details for a booking")
    public ResponseEntity<ApiResponse<PaymentDTO.PaymentResponse>> getPaymentByBooking(
            @PathVariable Long bookingId) {
        PaymentDTO.PaymentResponse response = paymentService.getPaymentByBookingId(bookingId);
        return ResponseEntity.ok(ApiResponse.success(response));
    }
}
