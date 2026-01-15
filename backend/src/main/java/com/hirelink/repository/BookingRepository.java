package com.hirelink.repository;

import com.hirelink.entity.Booking;
import com.hirelink.entity.Booking.BookingStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
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
}
