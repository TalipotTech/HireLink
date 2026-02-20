package com.hirelink.service;

import com.hirelink.dto.PaymentDTO;
import com.hirelink.entity.Booking;
import com.hirelink.entity.Payment;
import com.hirelink.exception.BadRequestException;
import com.hirelink.exception.ResourceNotFoundException;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Formatter;
import java.util.Random;

@Service
@Slf4j
public class PaymentService {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final RazorpayClient razorpayClient;
    private final String razorpayKeyId;
    private final String razorpayKeySecret;
    private final boolean mockMode;

    public PaymentService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            @Value("${razorpay.key-id}") String razorpayKeyId,
            @Value("${razorpay.key-secret}") String razorpayKeySecret) throws RazorpayException {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
        this.mockMode = razorpayKeyId.contains("xxxxx") || razorpayKeySecret.contains("xxxxx");

        if (mockMode) {
            log.warn("Razorpay keys are placeholders -- running in MOCK payment mode. "
                    + "Replace keys in application.properties for real payments.");
            this.razorpayClient = null;
        } else {
            this.razorpayClient = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
        }
    }

    @Transactional
    public PaymentDTO.CreateOrderResponse createOrder(Long userId, Long bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        if (!booking.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only pay for your own bookings");
        }

        if (booking.getBookingStatus() != Booking.BookingStatus.ACCEPTED
                && booking.getBookingStatus() != Booking.BookingStatus.CONFIRMED) {
            throw new BadRequestException("Payment can only be made for accepted or confirmed bookings");
        }

        if (booking.getPaymentStatus() == Booking.PaymentStatus.PAID) {
            throw new BadRequestException("This booking has already been paid");
        }

        BigDecimal amount = booking.getFinalAmount() != null
                ? booking.getFinalAmount()
                : booking.getEstimatedAmount();

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("Invalid booking amount");
        }

        long amountInPaise = amount.multiply(BigDecimal.valueOf(100)).longValue();

        if (mockMode) {
            return createMockOrder(booking, amount, amountInPaise);
        }

        try {
            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", booking.getBookingNumber());

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);
            String orderId = razorpayOrder.get("id");

            Payment payment = Payment.builder()
                    .booking(booking)
                    .payerUser(booking.getUser())
                    .payeeProvider(booking.getProvider())
                    .grossAmount(amount)
                    .netAmount(amount)
                    .currency("INR")
                    .paymentGateway(Payment.PaymentGateway.RAZORPAY)
                    .gatewayOrderId(orderId)
                    .paymentStatus(Payment.PaymentStatus.PENDING)
                    .build();
            paymentRepository.save(payment);

            return PaymentDTO.CreateOrderResponse.builder()
                    .orderId(orderId)
                    .amount(amountInPaise)
                    .currency("INR")
                    .keyId(razorpayKeyId)
                    .bookingNumber(booking.getBookingNumber())
                    .customerName(booking.getUser().getName())
                    .customerEmail(booking.getUser().getEmail())
                    .customerPhone(booking.getUser().getPhone())
                    .build();

        } catch (RazorpayException e) {
            log.warn("Razorpay API call failed for booking {}: {} -- falling back to mock mode", bookingId, e.getMessage());
            return createMockOrder(booking, amount, amountInPaise);
        }
    }

    private PaymentDTO.CreateOrderResponse createMockOrder(Booking booking, BigDecimal amount, long amountInPaise) {
        String mockOrderId = "mock_order_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "_" + String.format("%04d", new Random().nextInt(10000));

        log.info("[MOCK] Created mock payment order {} for booking {} amount={}",
                mockOrderId, booking.getBookingNumber(), amount);

        Payment payment = Payment.builder()
                .booking(booking)
                .payerUser(booking.getUser())
                .payeeProvider(booking.getProvider())
                .grossAmount(amount)
                .netAmount(amount)
                .currency("INR")
                .paymentGateway(Payment.PaymentGateway.RAZORPAY)
                .gatewayOrderId(mockOrderId)
                .paymentStatus(Payment.PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        return PaymentDTO.CreateOrderResponse.builder()
                .orderId(mockOrderId)
                .amount(amountInPaise)
                .currency("INR")
                .keyId("mock")
                .bookingNumber(booking.getBookingNumber())
                .customerName(booking.getUser().getName())
                .customerEmail(booking.getUser().getEmail())
                .customerPhone(booking.getUser().getPhone())
                .build();
    }

    @Transactional
    public PaymentDTO.PaymentResponse verifyPayment(PaymentDTO.VerifyPaymentRequest request) {
        Payment payment = paymentRepository.findByGatewayOrderId(request.getRazorpayOrderId())
                .orElseThrow(() -> new ResourceNotFoundException("Payment order not found"));

        boolean isMockOrder = request.getRazorpayOrderId().startsWith("mock_order_");

        if (!isMockOrder) {
            String generatedSignature = hmacSha256(
                    request.getRazorpayOrderId() + "|" + request.getRazorpayPaymentId(),
                    razorpayKeySecret
            );

            if (!generatedSignature.equals(request.getRazorpaySignature())) {
                payment.setPaymentStatus(Payment.PaymentStatus.FAILED);
                paymentRepository.save(payment);
                throw new BadRequestException("Payment verification failed. Invalid signature.");
            }
        } else {
            log.info("[MOCK] Accepting mock payment verification for order {}", request.getRazorpayOrderId());
        }

        payment.setGatewayPaymentId(request.getRazorpayPaymentId());
        payment.setGatewaySignature(request.getRazorpaySignature());
        payment.setPaymentStatus(Payment.PaymentStatus.COMPLETED);
        payment.setCompletedAt(LocalDateTime.now());
        paymentRepository.save(payment);

        Booking booking = payment.getBooking();
        booking.setPaymentStatus(Booking.PaymentStatus.PAID);
        bookingRepository.save(booking);

        log.info("Payment verified for booking {}: paymentId={}", booking.getBookingNumber(), request.getRazorpayPaymentId());

        return toPaymentResponse(payment);
    }

    @Transactional(readOnly = true)
    public PaymentDTO.PaymentResponse getPaymentByBookingId(Long bookingId) {
        Payment payment = paymentRepository.findByBooking_BookingId(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("No payment found for this booking"));
        return toPaymentResponse(payment);
    }

    private PaymentDTO.PaymentResponse toPaymentResponse(Payment payment) {
        return PaymentDTO.PaymentResponse.builder()
                .paymentId(payment.getPaymentId())
                .paymentNumber(payment.getPaymentNumber())
                .bookingId(payment.getBooking().getBookingId())
                .bookingNumber(payment.getBooking().getBookingNumber())
                .grossAmount(payment.getGrossAmount())
                .netAmount(payment.getNetAmount())
                .currency(payment.getCurrency())
                .paymentMethod(payment.getPaymentMethod() != null ? payment.getPaymentMethod().name() : null)
                .paymentGateway(payment.getPaymentGateway().name())
                .gatewayPaymentId(payment.getGatewayPaymentId())
                .paymentStatus(payment.getPaymentStatus().name())
                .initiatedAt(payment.getInitiatedAt())
                .completedAt(payment.getCompletedAt())
                .build();
    }

    private String hmacSha256(String data, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(), "HmacSHA256");
            mac.init(secretKeySpec);
            byte[] hash = mac.doFinal(data.getBytes());
            Formatter formatter = new Formatter();
            for (byte b : hash) {
                formatter.format("%02x", b);
            }
            String result = formatter.toString();
            formatter.close();
            return result;
        } catch (Exception e) {
            throw new RuntimeException("Failed to generate HMAC", e);
        }
    }
}
