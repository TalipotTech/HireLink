package com.hirelink.repository;

import com.hirelink.entity.ServiceProvider;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ServiceProviderRepository extends JpaRepository<ServiceProvider, Long> {
    
    Optional<ServiceProvider> findByUserUserId(Long userId);
    
    Optional<ServiceProvider> findByUserPhone(String phone);
    
    @Query("SELECT DISTINCT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user LEFT JOIN FETCH sp.services s LEFT JOIN FETCH s.category WHERE sp.isFeatured = true")
    List<ServiceProvider> findByIsFeaturedTrue();
    
    Page<ServiceProvider> findByIsAvailableTrue(Pageable pageable);
    
    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user WHERE sp.isAvailable = true AND sp.kycStatus = 'VERIFIED' ORDER BY sp.averageRating DESC")
    Page<ServiceProvider> findTopRatedProviders(Pageable pageable);
    
    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user WHERE sp.basePincode = :pincode AND sp.isAvailable = true")
    List<ServiceProvider> findByPincodeAndAvailable(@Param("pincode") String pincode);
    
    @Query("SELECT DISTINCT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user JOIN sp.services s WHERE s.category.categoryId = :categoryId AND sp.isAvailable = true")
    Page<ServiceProvider> findByCategoryId(@Param("categoryId") Long categoryId, Pageable pageable);
    
    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user WHERE sp.user.accountStatus = 'ACTIVE' AND sp.isAvailable = true ORDER BY sp.averageRating DESC, sp.completedBookings DESC")
    Page<ServiceProvider> findActiveProviders(Pageable pageable);
    
    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user LEFT JOIN FETCH sp.services WHERE sp.providerId = :id")
    Optional<ServiceProvider> findByIdWithDetails(@Param("id") Long id);
    
    // ========== Admin queries ==========

    long countByKycStatus(ServiceProvider.KycStatus kycStatus);

    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user WHERE sp.kycStatus = :status")
    List<ServiceProvider> findByKycStatus(@Param("status") ServiceProvider.KycStatus status);

    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user ORDER BY sp.createdAt DESC")
    List<ServiceProvider> findAllWithUser();

    // ========== Location-based queries ==========
    
    // Find providers within a geographic bounding box who are available
    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user " +
           "WHERE sp.baseLatitude BETWEEN :minLat AND :maxLat " +
           "AND sp.baseLongitude BETWEEN :minLng AND :maxLng " +
           "AND sp.isAvailable = true")
    List<ServiceProvider> findProvidersInArea(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng
    );
    
    // Find providers in area with category filter
    @Query("SELECT DISTINCT sp FROM ServiceProvider sp " +
           "LEFT JOIN FETCH sp.user " +
           "JOIN sp.services s " +
           "WHERE sp.baseLatitude BETWEEN :minLat AND :maxLat " +
           "AND sp.baseLongitude BETWEEN :minLng AND :maxLng " +
           "AND sp.isAvailable = true " +
           "AND s.category.categoryId = :categoryId")
    List<ServiceProvider> findProvidersInAreaByCategory(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng,
        @Param("categoryId") Long categoryId
    );
    
    // Find all providers with location data (for distance calculation)
    @Query("SELECT sp FROM ServiceProvider sp LEFT JOIN FETCH sp.user " +
           "WHERE sp.baseLatitude IS NOT NULL AND sp.baseLongitude IS NOT NULL " +
           "AND sp.isAvailable = true")
    List<ServiceProvider> findAllWithLocation();
}
