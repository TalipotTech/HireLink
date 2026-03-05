package com.hirelink.entity;

import jakarta.persistence.*;
import lombok.*;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "service_providers")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceProvider {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "provider_id")
    private Long providerId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @ToString.Exclude
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "primary_category_id")
    @ToString.Exclude
    private ServiceCategory primaryCategory;

    @Column(name = "business_name", length = 200)
    private String businessName;

    @Column(name = "business_description", columnDefinition = "TEXT")
    private String businessDescription;

    @Column(length = 255)
    private String tagline;

    @Column(name = "experience_years")
    @Builder.Default
    private Integer experienceYears = 0;

    @Column(columnDefinition = "JSON")
    private String specializations;

    @Column(columnDefinition = "JSON")
    private String certifications;

    @Column(name = "base_latitude", precision = 10, scale = 8)
    private BigDecimal baseLatitude;

    @Column(name = "base_longitude", precision = 11, scale = 8)
    private BigDecimal baseLongitude;

    @Column(name = "base_address", columnDefinition = "TEXT")
    private String baseAddress;

    @Column(name = "base_pincode", length = 6)
    private String basePincode;

    @Column(name = "service_radius_km")
    @Builder.Default
    private Integer serviceRadiusKm = 10;

    @Column(name = "aadhaar_number_encrypted", length = 500)
    private String aadhaarNumberEncrypted;

    @Column(name = "pan_number_encrypted", length = 500)
    private String panNumberEncrypted;

    @Enumerated(EnumType.STRING)
    @Column(name = "kyc_status")
    @Builder.Default
    private KycStatus kycStatus = KycStatus.NOT_SUBMITTED;

    @Column(name = "kyc_verified_at")
    private LocalDateTime kycVerifiedAt;

    @Column(name = "kyc_rejection_reason")
    private String kycRejectionReason;

    @Column(name = "average_rating", precision = 3, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    @Column(name = "total_ratings")
    @Builder.Default
    private Integer totalRatings = 0;

    @Column(name = "total_reviews")
    @Builder.Default
    private Integer totalReviews = 0;

    @Column(name = "total_bookings")
    @Builder.Default
    private Integer totalBookings = 0;

    @Column(name = "completed_bookings")
    @Builder.Default
    private Integer completedBookings = 0;

    @Column(name = "cancelled_bookings")
    @Builder.Default
    private Integer cancelledBookings = 0;

    @Column(name = "completion_rate", precision = 5, scale = 2)
    @Builder.Default
    private BigDecimal completionRate = BigDecimal.ZERO;

    @Column(name = "total_earnings", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal totalEarnings = BigDecimal.ZERO;

    @Column(name = "wallet_balance", precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal walletBalance = BigDecimal.ZERO;

    @Column(name = "is_available")
    @Builder.Default
    private Boolean isAvailable = true;

    @Enumerated(EnumType.STRING)
    @Column(name = "availability_status")
    @Builder.Default
    private AvailabilityStatus availabilityStatus = AvailabilityStatus.OFFLINE;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "profile_completion_percentage")
    @Builder.Default
    private Integer profileCompletionPercentage = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Service> services;

    @OneToMany(mappedBy = "provider", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    @ToString.Exclude
    private List<Booking> bookings;

    public enum KycStatus {
        NOT_SUBMITTED, PENDING, VERIFIED, REJECTED, EXPIRED
    }

    public enum AvailabilityStatus {
        ONLINE, OFFLINE, BUSY, ON_BREAK
    }
}
