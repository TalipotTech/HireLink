package com.hirelink.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.util.Random;

@Entity
@Table(name = "bookings")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Booking {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "booking_id")
    private Long bookingId;

    @Column(name = "booking_number", nullable = false, unique = true, length = 20)
    private String bookingNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id", nullable = false)
    @ToString.Exclude
    private ServiceProvider provider;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "service_id", nullable = false)
    @ToString.Exclude
    private Service service;

    @Column(name = "scheduled_date", nullable = false)
    private LocalDate scheduledDate;

    @Column(name = "scheduled_time", nullable = false)
    private LocalTime scheduledTime;

    @Column(name = "scheduled_end_time")
    private LocalTime scheduledEndTime;

    @Column(name = "actual_start_time")
    private LocalDateTime actualStartTime;

    @Column(name = "actual_end_time")
    private LocalDateTime actualEndTime;

    @Column(name = "service_address", nullable = false, columnDefinition = "TEXT")
    private String serviceAddress;

    @Column(name = "service_landmark")
    private String serviceLandmark;

    @Column(name = "service_pincode", nullable = false, length = 6)
    private String servicePincode;

    @Column(name = "service_latitude", precision = 10, scale = 8)
    private BigDecimal serviceLatitude;

    @Column(name = "service_longitude", precision = 11, scale = 8)
    private BigDecimal serviceLongitude;

    @Column(name = "service_city", length = 100)
    private String serviceCity;

    @Column(name = "service_state", length = 100)
    private String serviceState;

    @Column(name = "issue_title", length = 255)
    private String issueTitle;

    @Column(name = "issue_description", columnDefinition = "TEXT")
    private String issueDescription;

    @Column(name = "issue_images", columnDefinition = "JSON")
    private String issueImages;

    @Enumerated(EnumType.STRING)
    @Column(name = "urgency_level")
    @Builder.Default
    private UrgencyLevel urgencyLevel = UrgencyLevel.MEDIUM;

    @Column(name = "estimated_amount", precision = 10, scale = 2)
    private BigDecimal estimatedAmount;

    @Column(name = "material_cost", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal materialCost = BigDecimal.ZERO;

    @Column(name = "labor_cost", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal laborCost = BigDecimal.ZERO;

    @Column(name = "travel_charge", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal travelCharge = BigDecimal.ZERO;

    @Column(name = "discount_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal discountAmount = BigDecimal.ZERO;

    @Column(name = "tax_amount", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;

    @Column(name = "final_amount", precision = 10, scale = 2)
    private BigDecimal finalAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "booking_status")
    @Builder.Default
    private BookingStatus bookingStatus = BookingStatus.PENDING;

    @Enumerated(EnumType.STRING)
    @Column(name = "payment_status")
    @Builder.Default
    private PaymentStatus paymentStatus = PaymentStatus.UNPAID;

    @Enumerated(EnumType.STRING)
    @Column(name = "cancelled_by")
    private CancelledBy cancelledBy;

    @Column(name = "cancellation_reason", columnDefinition = "TEXT")
    private String cancellationReason;

    @Column(name = "cancellation_charge", precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal cancellationCharge = BigDecimal.ZERO;

    @Column(name = "cancelled_at")
    private LocalDateTime cancelledAt;

    @Column(name = "provider_response_at")
    private LocalDateTime providerResponseAt;

    @Column(name = "provider_notes", columnDefinition = "TEXT")
    private String providerNotes;

    @Column(name = "work_summary", columnDefinition = "TEXT")
    private String workSummary;

    @Column(name = "completion_images", columnDefinition = "JSON")
    private String completionImages;

    @Column(name = "user_rating", precision = 3, scale = 2)
    private BigDecimal userRating;

    @Column(name = "provider_rating", precision = 3, scale = 2)
    private BigDecimal providerRating;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    public void generateBookingNumber() {
        if (this.bookingNumber == null || this.bookingNumber.isEmpty()) {
            String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
            String randomPart = String.format("%05d", new Random().nextInt(100000));
            this.bookingNumber = "HL" + datePart + randomPart;
        }
    }

    public enum BookingStatus {
        PENDING, ACCEPTED, REJECTED, CONFIRMED, IN_PROGRESS, PAUSED, COMPLETED, CANCELLED, DISPUTED, REFUNDED
    }

    public enum UrgencyLevel {
        LOW, MEDIUM, HIGH, EMERGENCY
    }

    public enum CancelledBy {
        USER, PROVIDER, ADMIN, SYSTEM
    }

    public enum PaymentStatus {
        UNPAID, PAID, REFUNDED
    }
}
