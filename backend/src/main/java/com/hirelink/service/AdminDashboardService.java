package com.hirelink.service;

import com.hirelink.dto.DashboardDTO.*;
import com.hirelink.entity.Booking.BookingStatus;
import com.hirelink.entity.User;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.UserRepository;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.ServiceRepository;
import com.hirelink.repository.ServiceCategoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ServiceProviderRepository providerRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceCategoryRepository categoryRepository;

    public DashboardStats getDashboardStats() {
        long totalBookings = bookingRepository.count();
        long pending = bookingRepository.countByBookingStatus(BookingStatus.PENDING);
        long completed = bookingRepository.countByBookingStatus(BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByBookingStatus(BookingStatus.CANCELLED);

        long totalCustomers = userRepository.countByUserType(User.UserType.CUSTOMER);
        long totalProviders = userRepository.countByUserType(User.UserType.PROVIDER);
        long pendingKyc = providerRepository.countByKycStatus(ServiceProvider.KycStatus.PENDING);
        long totalServices = serviceRepository.count();
        long totalCategories = categoryRepository.count();

        BigDecimal totalRevenue = bookingRepository.sumCompletedRevenue();
        BigDecimal monthRevenue = bookingRepository.sumRevenueThisMonth();

        List<BookingsByStatus> statusBreakdown = Arrays.stream(BookingStatus.values())
                .map(s -> BookingsByStatus.builder()
                        .status(s.name())
                        .count(bookingRepository.countByBookingStatus(s))
                        .build())
                .collect(Collectors.toList());

        List<Object[]> raw = bookingRepository.countBookingsByMonth(LocalDateTime.now().minusMonths(6));
        List<MonthlyBookingCount> trend = raw.stream()
                .map(r -> MonthlyBookingCount.builder()
                        .month((String) r[0])
                        .count((Long) r[1])
                        .build())
                .collect(Collectors.toList());

        return DashboardStats.builder()
                .totalBookings(totalBookings)
                .pendingBookings(pending)
                .completedBookings(completed)
                .cancelledBookings(cancelled)
                .totalCustomers(totalCustomers)
                .totalProviders(totalProviders)
                .pendingKycApprovals(pendingKyc)
                .totalServices(totalServices)
                .totalCategories(totalCategories)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .revenueThisMonth(monthRevenue != null ? monthRevenue : BigDecimal.ZERO)
                .bookingsByStatus(statusBreakdown)
                .monthlyTrend(trend)
                .build();
    }
}
