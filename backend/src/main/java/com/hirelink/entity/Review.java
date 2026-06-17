package com.hirelink.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "review_id")
    private Long reviewId;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "booking_id", nullable = false, unique = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private Booking booking;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_provider_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ServiceProvider revieweeProvider;

    @Column(name = "overall_rating", nullable = false, precision = 3, scale = 2)
    private BigDecimal overallRating;

    @Column(name = "quality_rating", precision = 3, scale = 2)
    private BigDecimal qualityRating;

    @Column(name = "punctuality_rating", precision = 3, scale = 2)
    private BigDecimal punctualityRating;

    @Column(name = "professionalism_rating", precision = 3, scale = 2)
    private BigDecimal professionalismRating;

    @Column(name = "value_for_money_rating", precision = 3, scale = 2)
    private BigDecimal valueForMoneyRating;

    @Column(name = "review_title")
    private String reviewTitle;

    @Column(name = "review_text", columnDefinition = "TEXT")
    private String reviewText;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "review_images")
    private String reviewImages;

    @Column(name = "provider_response", columnDefinition = "TEXT")
    private String providerResponse;

    @Column(name = "provider_responded_at")
    private LocalDateTime providerRespondedAt;

    @Enumerated(EnumType.STRING)
    @Column(name = "moderation_status")
    @Builder.Default
    private ModerationStatus moderationStatus = ModerationStatus.APPROVED;

    @Column(name = "is_visible")
    @Builder.Default
    private Boolean isVisible = true;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @Column(name = "helpful_count")
    @Builder.Default
    private Integer helpfulCount = 0;

    @Column(name = "not_helpful_count")
    @Builder.Default
    private Integer notHelpfulCount = 0;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public enum ModerationStatus {
        PENDING, APPROVED, REJECTED, FLAGGED
    }
}
