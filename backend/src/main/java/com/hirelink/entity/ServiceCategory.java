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
@Table(name = "service_categories")
@EntityListeners(AuditingEntityListener.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ServiceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "category_id")
    private Long categoryId;

    @Column(name = "category_name", nullable = false, unique = true, length = 100)
    private String categoryName;

    @Column(name = "category_slug", nullable = false, unique = true, length = 100)
    private String categorySlug;

    @Column(name = "category_description", columnDefinition = "TEXT")
    private String categoryDescription;

    @Column(name = "category_icon", length = 255)
    private String categoryIcon;

    @Column(name = "category_image_url", length = 500)
    private String categoryImageUrl;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_category_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private ServiceCategory parentCategory;

    @OneToMany(mappedBy = "parentCategory", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<ServiceCategory> subCategories;

    @Column(name = "category_level")
    @Builder.Default
    private Integer categoryLevel = 1;

    @Column(name = "display_order")
    @Builder.Default
    private Integer displayOrder = 0;

    @Column(name = "min_base_price", precision = 10, scale = 2)
    private BigDecimal minBasePrice;

    @Column(name = "max_base_price", precision = 10, scale = 2)
    private BigDecimal maxBasePrice;

    @Enumerated(EnumType.STRING)
    @Column(name = "price_unit")
    @Builder.Default
    private PriceUnit priceUnit = PriceUnit.PER_VISIT;

    @Column(name = "is_active")
    @Builder.Default
    private Boolean isActive = true;

    @Column(name = "is_featured")
    @Builder.Default
    private Boolean isFeatured = false;

    @CreatedDate
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @LastModifiedDate
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @OneToMany(mappedBy = "category", fetch = FetchType.LAZY)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private List<Service> services;

    public enum PriceUnit {
        PER_HOUR, PER_VISIT, PER_SQFT, FIXED
    }
}
