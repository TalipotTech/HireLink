package com.hirelink.repository;

import com.hirelink.entity.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {

    Optional<Payment> findByBooking_BookingId(Long bookingId);

    Optional<Payment> findByGatewayOrderId(String gatewayOrderId);
}
