package com.hirelink.repository;

import com.hirelink.entity.Booking;
import com.hirelink.entity.Booking.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.bookingNumber = :bookingNumber")
    Optional<Booking> findByBookingNumber(@Param("bookingNumber") String bookingNumber);
    
    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.user.userId = :userId ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.userId = :userId")
    Page<Booking> findByUserUserIdOrderByCreatedAtDesc(@Param("userId") Long userId, Pageable pageable);
    
    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.provider.providerId = :providerId ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.provider.providerId = :providerId")
    Page<Booking> findByProviderProviderIdOrderByCreatedAtDesc(@Param("providerId") Long providerId, Pageable pageable);
    
    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.user.userId = :userId AND b.bookingStatus = :status ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.userId = :userId AND b.bookingStatus = :status")
    Page<Booking> findByUserUserIdAndBookingStatusOrderByCreatedAtDesc(@Param("userId") Long userId, @Param("status") BookingStatus status, Pageable pageable);
    
    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.provider.providerId = :providerId AND b.bookingStatus = :status ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.provider.providerId = :providerId AND b.bookingStatus = :status")
    Page<Booking> findByProviderProviderIdAndBookingStatusOrderByCreatedAtDesc(@Param("providerId") Long providerId, @Param("status") BookingStatus status, Pageable pageable);
    
    List<Booking> findByProviderProviderIdAndScheduledDateAndBookingStatusIn(Long providerId, LocalDate date, List<BookingStatus> statuses);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.user.userId = :userId AND b.bookingStatus = :status")
    Long countByUserAndStatus(@Param("userId") Long userId, @Param("status") BookingStatus status);
    
    @Query("SELECT COUNT(b) FROM Booking b WHERE b.provider.providerId = :providerId AND b.bookingStatus = :status")
    Long countByProviderAndStatus(@Param("providerId") Long providerId, @Param("status") BookingStatus status);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.scheduledDate = :date AND b.bookingStatus IN :statuses ORDER BY b.scheduledTime ASC")
    List<Booking> findByDateAndStatuses(@Param("date") LocalDate date, @Param("statuses") List<BookingStatus> statuses);
    
    boolean existsByUserUserIdAndServiceServiceIdAndBookingStatusIn(Long userId, Long serviceId, List<BookingStatus> statuses);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.bookingId = :id")
    Optional<Booking> findByIdWithDetails(@Param("id") Long id);
    
    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b")
    Page<Booking> findAllByOrderByCreatedAtDesc(Pageable pageable);
    
    @Query(value = "SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.bookingStatus = :status ORDER BY b.createdAt DESC",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.bookingStatus = :status")
    Page<Booking> findByBookingStatusOrderByCreatedAtDesc(@Param("status") BookingStatus status, Pageable pageable);
    
    // Recent bookings for dashboard - sorted by PENDING first, then by date
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.user.userId = :userId ORDER BY CASE WHEN b.bookingStatus = 'PENDING' THEN 0 WHEN b.bookingStatus = 'ACCEPTED' THEN 1 WHEN b.bookingStatus = 'CONFIRMED' THEN 2 WHEN b.bookingStatus = 'IN_PROGRESS' THEN 3 ELSE 4 END, b.createdAt DESC")
    List<Booking> findRecentByUserIdPendingFirst(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT b FROM Booking b LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category WHERE b.provider.providerId = :providerId ORDER BY CASE WHEN b.bookingStatus = 'PENDING' THEN 0 WHEN b.bookingStatus = 'ACCEPTED' THEN 1 WHEN b.bookingStatus = 'CONFIRMED' THEN 2 WHEN b.bookingStatus = 'IN_PROGRESS' THEN 3 ELSE 4 END, b.createdAt DESC")
    List<Booking> findRecentByProviderIdPendingFirst(@Param("providerId") Long providerId, Pageable pageable);
    
    // Search bookings by keyword (booking number, service name, customer name)
    @Query(value = "SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user u " +
           "LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE b.user.userId = :userId AND (" +
           "LOWER(b.bookingNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.businessName) LIKE LOWER(CONCAT('%', :keyword, '%')))",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.user.userId = :userId AND (" +
           "LOWER(b.bookingNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.service.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.provider.businessName) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Booking> searchUserBookings(@Param("userId") Long userId, @Param("keyword") String keyword, Pageable pageable);
    
    // Search bookings for provider
    @Query(value = "SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user u " +
           "LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE b.provider.providerId = :providerId AND (" +
           "LOWER(b.bookingNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')))",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE b.provider.providerId = :providerId AND (" +
           "LOWER(b.bookingNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.service.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.user.name) LIKE LOWER(CONCAT('%', :keyword, '%')))")
    Page<Booking> searchProviderBookings(@Param("providerId") Long providerId, @Param("keyword") String keyword, Pageable pageable);
    
    // Search all bookings (for admin)
    @Query(value = "SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user u " +
           "LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE LOWER(b.bookingNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(s.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(p.businessName) LIKE LOWER(CONCAT('%', :keyword, '%'))",
           countQuery = "SELECT COUNT(b) FROM Booking b WHERE " +
           "LOWER(b.bookingNumber) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.service.serviceName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.user.name) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
           "LOWER(b.provider.businessName) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    Page<Booking> searchAllBookings(@Param("keyword") String keyword, Pageable pageable);
    
    // ========== Admin dashboard queries ==========

    long countByBookingStatus(BookingStatus status);

    @Query("SELECT COALESCE(SUM(b.finalAmount), 0) FROM Booking b WHERE b.bookingStatus = 'COMPLETED'")
    BigDecimal sumCompletedRevenue();

    @Query("SELECT COALESCE(SUM(b.finalAmount), 0) FROM Booking b " +
           "WHERE b.bookingStatus = 'COMPLETED' " +
           "AND MONTH(b.createdAt) = MONTH(CURRENT_DATE) " +
           "AND YEAR(b.createdAt) = YEAR(CURRENT_DATE)")
    BigDecimal sumRevenueThisMonth();

    @Query("SELECT FUNCTION('DATE_FORMAT', b.createdAt, '%Y-%m') AS month, COUNT(b) " +
           "FROM Booking b " +
           "WHERE b.createdAt >= :since " +
           "GROUP BY FUNCTION('DATE_FORMAT', b.createdAt, '%Y-%m') " +
           "ORDER BY month")
    List<Object[]> countBookingsByMonth(@Param("since") LocalDateTime since);

    long countByUserUserId(Long userId);

    // ========== Admin report queries ==========

    @Query("SELECT b.service.serviceName, COUNT(b), COALESCE(SUM(b.finalAmount), 0) " +
           "FROM Booking b " +
           "WHERE b.bookingStatus = 'COMPLETED' " +
           "AND b.createdAt BETWEEN :fromDate AND :toDate " +
           "GROUP BY b.service.serviceName " +
           "ORDER BY SUM(b.finalAmount) DESC")
    List<Object[]> revenueByService(@Param("fromDate") LocalDateTime fromDate, @Param("toDate") LocalDateTime toDate);

    @Query("SELECT b.provider.providerId, b.provider.businessName, COUNT(b), COALESCE(SUM(b.finalAmount), 0), b.provider.averageRating " +
           "FROM Booking b " +
           "WHERE b.bookingStatus = 'COMPLETED' " +
           "GROUP BY b.provider.providerId, b.provider.businessName, b.provider.averageRating " +
           "ORDER BY COUNT(b) DESC")
    List<Object[]> topProviders();

    // ========== Location-based queries ==========
    
    // Find bookings within a geographic bounding box
    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE b.serviceLatitude BETWEEN :minLat AND :maxLat " +
           "AND b.serviceLongitude BETWEEN :minLng AND :maxLng")
    List<Booking> findBookingsInArea(
        @Param("minLat") BigDecimal minLat,
        @Param("maxLat") BigDecimal maxLat,
        @Param("minLng") BigDecimal minLng,
        @Param("maxLng") BigDecimal maxLng
    );
    
    // Find bookings by city
    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE LOWER(b.serviceCity) = LOWER(:city)")
    List<Booking> findByServiceCity(@Param("city") String city);
    
    // Find bookings by city and status
    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE LOWER(b.serviceCity) = LOWER(:city) AND b.bookingStatus = :status")
    List<Booking> findByServiceCityAndStatus(
        @Param("city") String city, 
        @Param("status") BookingStatus status
    );
    
    // Find bookings by state
    @Query("SELECT b FROM Booking b " +
           "LEFT JOIN FETCH b.user LEFT JOIN FETCH b.provider p LEFT JOIN FETCH p.user " +
           "LEFT JOIN FETCH b.service s LEFT JOIN FETCH s.category " +
           "WHERE LOWER(b.serviceState) = LOWER(:state)")
    List<Booking> findByServiceState(@Param("state") String state);
}
