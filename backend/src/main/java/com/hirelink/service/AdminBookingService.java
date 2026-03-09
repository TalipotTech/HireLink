package com.hirelink.service;

import com.hirelink.dto.AdminBookingDTO.*;
import com.hirelink.entity.AdminAuditLog;
import com.hirelink.entity.Booking;
import com.hirelink.entity.Booking.BookingStatus;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.repository.AdminAuditLogRepository;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.ServiceProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminBookingService {

    private final BookingRepository bookingRepository;
    private final ServiceProviderRepository providerRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public Page<AdminBookingListItem> getAllBookings(Pageable pageable) {
        return bookingRepository.findAllByOrderByCreatedAtDesc(pageable)
                .map(this::toListItem);
    }

    public Page<AdminBookingListItem> getBookingsByStatus(BookingStatus status, Pageable pageable) {
        return bookingRepository.findByBookingStatusOrderByCreatedAtDesc(status, pageable)
                .map(this::toListItem);
    }

    public Page<AdminBookingListItem> searchBookings(String keyword, Pageable pageable) {
        return bookingRepository.searchAllBookings(keyword, pageable)
                .map(this::toListItem);
    }

    @Transactional
    public void overrideStatus(Long bookingId, OverrideStatusRequest req, Long adminUserId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        String oldStatus = booking.getBookingStatus().name();
        booking.setBookingStatus(BookingStatus.valueOf(req.getStatus()));
        bookingRepository.save(booking);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("BOOKING_STATUS_OVERRIDE")
                .actionDescription("Changed booking " + booking.getBookingNumber() + " status from " + oldStatus + " to " + req.getStatus())
                .targetType("BOOKING")
                .targetId(bookingId)
                .oldValues("{\"bookingStatus\":\"" + oldStatus + "\"}")
                .newValues("{\"bookingStatus\":\"" + req.getStatus() + "\",\"note\":\"" + (req.getAdminNote() != null ? req.getAdminNote() : "") + "\"}")
                .build());
    }

    @Transactional
    public void assignProvider(Long bookingId, AssignProviderRequest req, Long adminUserId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        ServiceProvider provider = providerRepository.findByIdWithDetails(req.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        String oldProvider = booking.getProvider() != null ? booking.getProvider().getBusinessName() : "None";
        booking.setProvider(provider);
        bookingRepository.save(booking);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("BOOKING_PROVIDER_ASSIGNED")
                .actionDescription("Assigned provider " + provider.getBusinessName() + " to booking " + booking.getBookingNumber())
                .targetType("BOOKING")
                .targetId(bookingId)
                .oldValues("{\"provider\":\"" + oldProvider + "\"}")
                .newValues("{\"provider\":\"" + provider.getBusinessName() + "\"}")
                .build());
    }

    public List<AdminAuditLog> getAuditTrail(Long bookingId) {
        return auditLogRepository.findByTargetTypeAndTargetIdOrderByPerformedAtDesc("BOOKING", bookingId);
    }

    private AdminBookingListItem toListItem(Booking b) {
        return AdminBookingListItem.builder()
                .bookingId(b.getBookingId())
                .bookingNumber(b.getBookingNumber())
                .customerName(b.getUser() != null ? b.getUser().getName() : "N/A")
                .customerEmail(b.getUser() != null ? b.getUser().getEmail() : "N/A")
                .providerBusinessName(b.getProvider() != null ? b.getProvider().getBusinessName() : "Unassigned")
                .serviceName(b.getService() != null ? b.getService().getServiceName() : "N/A")
                .bookingStatus(b.getBookingStatus().name())
                .paymentStatus(b.getPaymentStatus() != null ? b.getPaymentStatus().name() : "UNPAID")
                .scheduledDate(b.getScheduledDate())
                .scheduledTime(b.getScheduledTime())
                .estimatedAmount(b.getEstimatedAmount())
                .finalAmount(b.getFinalAmount())
                .serviceCity(b.getServiceCity())
                .createdAt(b.getCreatedAt())
                .build();
    }
}
