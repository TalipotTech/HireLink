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
    private final BigDecimal bookingCharge;

    public PaymentService(
            PaymentRepository paymentRepository,
            BookingRepository bookingRepository,
            @Value("${razorpay.key-id}") String razorpayKeyId,
            @Value("${razorpay.key-secret}") String razorpayKeySecret,
            @Value("${hirelink.booking-charge:8}") BigDecimal bookingCharge) {
        this.paymentRepository = paymentRepository;
        this.bookingRepository = bookingRepository;
        this.razorpayKeyId = razorpayKeyId;
        this.razorpayKeySecret = razorpayKeySecret;
        this.bookingCharge = bookingCharge;

        boolean shouldMock = razorpayKeyId == null || razorpayKeySecret == null
                || razorpayKeyId.isBlank() || razorpayKeySecret.isBlank()
                || razorpayKeyId.contains("xxxxx") || razorpayKeySecret.contains("xxxxx")
                || !razorpayKeyId.startsWith("rzp_");

        if (shouldMock) {
            log.warn("Razorpay keys are missing or invalid -- running in MOCK payment mode. "
                    + "Set valid keys in application.properties for real payments.");
            this.razorpayClient = null;
            this.mockMode = true;
        } else {
            RazorpayClient client = null;
            boolean mock = false;
            try {
                client = new RazorpayClient(razorpayKeyId, razorpayKeySecret);
                String masked = razorpayKeyId.length() > 12
                        ? razorpayKeyId.substring(0, 8) + "..." + razorpayKeyId.substring(razorpayKeyId.length() - 4)
                        : "***";
                log.info("Razorpay client initialized with key: {}", masked);
            } catch (Exception e) {
                log.warn("Failed to initialize Razorpay client: {} -- falling back to MOCK mode", e.getMessage());
                mock = true;
            }
            this.razorpayClient = client;
            this.mockMode = mock;
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

        BigDecimal serviceFee = booking.getFinalAmount() != null ? booking.getFinalAmount()
                : booking.getEstimatedAmount() != null ? booking.getEstimatedAmount() : BigDecimal.ZERO;
        BigDecimal totalAmount = serviceFee.add(bookingCharge);

        long amountInPaise = totalAmount.multiply(BigDecimal.valueOf(100)).longValue();

        if (mockMode) {
            return createMockOrder(booking, totalAmount, serviceFee, amountInPaise);
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
                    .grossAmount(totalAmount)
                    .netAmount(totalAmount)
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
                    .serviceFee(serviceFee)
                    .platformFee(bookingCharge)
                    .build();

        } catch (RazorpayException e) {
            log.error("Razorpay API call failed for booking {}: {} -- falling back to mock mode", bookingId, e.getMessage(), e);
            return createMockOrder(booking, totalAmount, serviceFee, amountInPaise);
        } catch (Exception e) {
            log.error("Unexpected error creating Razorpay order for booking {}: {}", bookingId, e.getMessage(), e);
            return createMockOrder(booking, totalAmount, serviceFee, amountInPaise);
        }
    }

    private PaymentDTO.CreateOrderResponse createMockOrder(Booking booking, BigDecimal totalAmount, BigDecimal serviceFee, long amountInPaise) {
        String mockOrderId = "mock_order_" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"))
                + "_" + String.format("%04d", new Random().nextInt(10000));

        log.info("[MOCK] Created mock payment order {} for booking {} amount={}",
                mockOrderId, booking.getBookingNumber(), totalAmount);

        Payment payment = Payment.builder()
                .booking(booking)
                .payerUser(booking.getUser())
                .payeeProvider(booking.getProvider())
                .grossAmount(totalAmount)
                .netAmount(totalAmount)
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
                .serviceFee(serviceFee)
                .platformFee(bookingCharge)
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
        if (booking.getBookingStatus() == Booking.BookingStatus.ACCEPTED) {
            booking.setBookingStatus(Booking.BookingStatus.CONFIRMED);
        }
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
