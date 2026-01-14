package com.hirelink.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.hirelink.dto.BookingDTO;
import com.hirelink.entity.*;
import com.hirelink.entity.Booking.BookingStatus;
import com.hirelink.exception.BadRequestException;
import com.hirelink.exception.ResourceNotFoundException;
import com.hirelink.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@org.springframework.stereotype.Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ServiceRepository serviceRepository;
    private final ServiceProviderRepository providerRepository;
    private final ReviewRepository reviewRepository;
    private final ObjectMapper objectMapper;

    @Transactional
    public BookingDTO.BookingResponse createBooking(Long userId, BookingDTO.CreateBookingRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        Service service = serviceRepository.findById(request.getServiceId())
                .orElseThrow(() -> new ResourceNotFoundException("Service not found"));

        ServiceProvider provider = providerRepository.findById(request.getProviderId())
                .orElseThrow(() -> new ResourceNotFoundException("Provider not found"));

        // Check if provider offers this service
        if (!service.getProvider().getProviderId().equals(provider.getProviderId())) {
            throw new BadRequestException("This provider does not offer this service");
        }

        // Check for duplicate pending bookings
        List<BookingStatus> activeStatuses = Arrays.asList(
                BookingStatus.PENDING, BookingStatus.ACCEPTED, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS
        );
        if (bookingRepository.existsByUserUserIdAndServiceServiceIdAndBookingStatusIn(
                userId, request.getServiceId(), activeStatuses)) {
            throw new BadRequestException("You already have an active booking for this service");
        }

        String issueImagesJson = null;
        if (request.getIssueImages() != null) {
            try {
                issueImagesJson = objectMapper.writeValueAsString(request.getIssueImages());
            } catch (JsonProcessingException e) {
                // ignore
            }
        }

        Booking.UrgencyLevel urgency = Booking.UrgencyLevel.MEDIUM;
        if (request.getUrgencyLevel() != null) {
            urgency = Booking.UrgencyLevel.valueOf(request.getUrgencyLevel());
        }

        Booking booking = Booking.builder()
                .user(user)
                .provider(provider)
                .service(service)
                .scheduledDate(request.getScheduledDate())
                .scheduledTime(request.getScheduledTime())
                .serviceAddress(request.getServiceAddress())
                .serviceLandmark(request.getServiceLandmark())
                .servicePincode(request.getServicePincode())
                .serviceLatitude(request.getServiceLatitude())
                .serviceLongitude(request.getServiceLongitude())
                .issueTitle(request.getIssueTitle())
                .issueDescription(request.getIssueDescription())
                .issueImages(issueImagesJson)
                .urgencyLevel(urgency)
                .estimatedAmount(service.getBasePrice())
                .build();

        booking = bookingRepository.save(booking);
        
        // Update provider stats
        provider.setTotalBookings(provider.getTotalBookings() + 1);
        providerRepository.save(provider);

        // Update service stats
        service.setTimesBooked(service.getTimesBooked() + 1);
        serviceRepository.save(service);

        return mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingDTO.BookingListResponse getUserBookings(Long userId, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookingPage;

        if (status != null && !status.isEmpty()) {
            BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
            bookingPage = bookingRepository.findByUserUserIdAndBookingStatusOrderByCreatedAtDesc(userId, bookingStatus, pageable);
        } else {
            bookingPage = bookingRepository.findByUserUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        return mapToBookingListResponse(bookingPage);
    }

    @Transactional(readOnly = true)
    public BookingDTO.BookingListResponse getProviderBookings(Long providerId, String status, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Booking> bookingPage;

        if (status != null && !status.isEmpty()) {
            BookingStatus bookingStatus = BookingStatus.valueOf(status.toUpperCase());
            bookingPage = bookingRepository.findByProviderProviderIdAndBookingStatusOrderByCreatedAtDesc(providerId, bookingStatus, pageable);
        } else {
            bookingPage = bookingRepository.findByProviderProviderIdOrderByCreatedAtDesc(providerId, pageable);
        }

        return mapToBookingListResponse(bookingPage);
    }

    @Transactional(readOnly = true)
    public BookingDTO.BookingResponse getBookingById(Long bookingId) {
        Booking booking = bookingRepository.findByIdWithDetails(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));
        return mapToBookingResponse(booking);
    }

    @Transactional(readOnly = true)
    public BookingDTO.BookingResponse getBookingByNumber(String bookingNumber) {
        Booking booking = bookingRepository.findByBookingNumber(bookingNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found: " + bookingNumber));
        return mapToBookingResponse(booking);
    }

    @Transactional
    public BookingDTO.BookingResponse updateBookingStatus(Long bookingId, Long userId, BookingDTO.UpdateBookingStatusRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        BookingStatus newStatus = BookingStatus.valueOf(request.getStatus().toUpperCase());
        BookingStatus currentStatus = booking.getBookingStatus();

        // Validate status transition
        validateStatusTransition(currentStatus, newStatus);

        booking.setBookingStatus(newStatus);

        // Handle specific status updates
        switch (newStatus) {
            case CANCELLED:
                booking.setCancelledAt(LocalDateTime.now());
                booking.setCancellationReason(request.getReason());
                // Determine who cancelled
                if (booking.getUser().getUserId().equals(userId)) {
                    booking.setCancelledBy(Booking.CancelledBy.USER);
                } else if (booking.getProvider().getUser().getUserId().equals(userId)) {
                    booking.setCancelledBy(Booking.CancelledBy.PROVIDER);
                }
                // Update provider stats
                ServiceProvider provider = booking.getProvider();
                provider.setCancelledBookings(provider.getCancelledBookings() + 1);
                providerRepository.save(provider);
                break;
            case ACCEPTED:
            case CONFIRMED:
                booking.setProviderResponseAt(LocalDateTime.now());
                booking.setProviderNotes(request.getNotes());
                break;
            case IN_PROGRESS:
                booking.setActualStartTime(LocalDateTime.now());
                break;
            case COMPLETED:
                booking.setActualEndTime(LocalDateTime.now());
                booking.setWorkSummary(request.getWorkSummary());
                if (request.getFinalAmount() != null) {
                    booking.setFinalAmount(request.getFinalAmount());
                } else {
                    booking.setFinalAmount(booking.getEstimatedAmount());
                }
                // Update provider stats
                ServiceProvider completedProvider = booking.getProvider();
                completedProvider.setCompletedBookings(completedProvider.getCompletedBookings() + 1);
                BigDecimal rate = BigDecimal.valueOf(completedProvider.getCompletedBookings())
                        .multiply(BigDecimal.valueOf(100))
                        .divide(BigDecimal.valueOf(completedProvider.getTotalBookings()), 2, BigDecimal.ROUND_HALF_UP);
                completedProvider.setCompletionRate(rate);
                completedProvider.setTotalEarnings(completedProvider.getTotalEarnings().add(booking.getFinalAmount()));
                providerRepository.save(completedProvider);
                break;
            default:
                break;
        }

        booking = bookingRepository.save(booking);
        return mapToBookingResponse(booking);
    }

    @Transactional
    public void addReview(Long bookingId, Long userId, BookingDTO.AddReviewRequest request) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new ResourceNotFoundException("Booking not found"));

        // Validate booking belongs to user and is completed
        if (!booking.getUser().getUserId().equals(userId)) {
            throw new BadRequestException("You can only review your own bookings");
        }

        if (booking.getBookingStatus() != BookingStatus.COMPLETED) {
            throw new BadRequestException("You can only review completed bookings");
        }

        if (reviewRepository.existsByBookingBookingId(bookingId)) {
            throw new BadRequestException("You have already reviewed this booking");
        }

        String reviewImagesJson = null;
        if (request.getReviewImages() != null) {
            try {
                reviewImagesJson = objectMapper.writeValueAsString(request.getReviewImages());
            } catch (JsonProcessingException e) {
                // ignore
            }
        }

        Review review = Review.builder()
                .booking(booking)
                .reviewer(booking.getUser())
                .revieweeProvider(booking.getProvider())
                .overallRating(request.getOverallRating())
                .qualityRating(request.getQualityRating())
                .punctualityRating(request.getPunctualityRating())
                .professionalismRating(request.getProfessionalismRating())
                .valueForMoneyRating(request.getValueForMoneyRating())
                .reviewTitle(request.getReviewTitle())
                .reviewText(request.getReviewText())
                .reviewImages(reviewImagesJson)
                .build();

        reviewRepository.save(review);

        // Update booking rating
        booking.setUserRating(request.getOverallRating());
        bookingRepository.save(booking);

        // Update provider rating
        ServiceProvider provider = booking.getProvider();
        BigDecimal avgRating = reviewRepository.calculateAverageRating(provider.getProviderId());
        Long reviewCount = reviewRepository.countByProviderId(provider.getProviderId());
        provider.setAverageRating(avgRating != null ? avgRating : BigDecimal.ZERO);
        provider.setTotalReviews(reviewCount.intValue());
        providerRepository.save(provider);
    }

    private void validateStatusTransition(BookingStatus from, BookingStatus to) {
        // Define valid transitions
        boolean valid = switch (from) {
            case PENDING -> to == BookingStatus.ACCEPTED || to == BookingStatus.REJECTED || to == BookingStatus.CANCELLED;
            case ACCEPTED -> to == BookingStatus.CONFIRMED || to == BookingStatus.CANCELLED;
            case CONFIRMED -> to == BookingStatus.IN_PROGRESS || to == BookingStatus.CANCELLED;
            case IN_PROGRESS -> to == BookingStatus.PAUSED || to == BookingStatus.COMPLETED || to == BookingStatus.CANCELLED;
            case PAUSED -> to == BookingStatus.IN_PROGRESS || to == BookingStatus.CANCELLED;
            case COMPLETED -> to == BookingStatus.DISPUTED;
            case DISPUTED -> to == BookingStatus.REFUNDED || to == BookingStatus.COMPLETED;
            default -> false;
        };

        if (!valid) {
            throw new BadRequestException("Invalid status transition from " + from + " to " + to);
        }
    }

    private BookingDTO.BookingListResponse mapToBookingListResponse(Page<Booking> bookingPage) {
        List<BookingDTO.BookingResponse> bookings = bookingPage.getContent().stream()
                .map(this::mapToBookingResponse)
                .collect(Collectors.toList());

        return BookingDTO.BookingListResponse.builder()
                .bookings(bookings)
                .page(bookingPage.getNumber())
                .size(bookingPage.getSize())
                .total(bookingPage.getTotalElements())
                .totalPages(bookingPage.getTotalPages())
                .build();
    }

    private BookingDTO.BookingResponse mapToBookingResponse(Booking booking) {
        List<String> issueImages = Collections.emptyList();
        if (booking.getIssueImages() != null) {
            try {
                issueImages = objectMapper.readValue(booking.getIssueImages(), new TypeReference<List<String>>() {});
            } catch (JsonProcessingException e) {
                // ignore
            }
        }

        Service service = booking.getService();
        ServiceProvider provider = booking.getProvider();
        User user = booking.getUser();

        // Build service summary with null safety
        BookingDTO.ServiceSummary serviceSummary = null;
        if (service != null) {
            ServiceCategory category = service.getCategory();
            serviceSummary = BookingDTO.ServiceSummary.builder()
                    .serviceId(service.getServiceId())
                    .serviceName(service.getServiceName())
                    .basePrice(service.getBasePrice())
                    .priceType(service.getPriceType() != null ? service.getPriceType().name() : "FIXED")
                    .estimatedDurationMinutes(service.getEstimatedDurationMinutes())
                    .categoryName(category != null ? category.getCategoryName() : null)
                    .categoryIcon(category != null ? category.getCategoryIcon() : null)
                    .build();
        }

        // Build provider info with null safety
        BookingDTO.ProviderInfo providerInfo = null;
        if (provider != null) {
            User providerUser = provider.getUser();
            providerInfo = BookingDTO.ProviderInfo.builder()
                    .providerId(provider.getProviderId())
                    .businessName(provider.getBusinessName())
                    .providerName(providerUser != null ? providerUser.getName() : "Unknown")
                    .phone(providerUser != null ? providerUser.getPhone() : null)
                    .profileImageUrl(providerUser != null ? providerUser.getProfileImageUrl() : null)
                    .averageRating(provider.getAverageRating())
                    .completedBookings(provider.getCompletedBookings())
                    .build();
        }

        // Build customer info with null safety
        BookingDTO.CustomerInfo customerInfo = null;
        if (user != null) {
            customerInfo = BookingDTO.CustomerInfo.builder()
                    .userId(user.getUserId())
                    .name(user.getName())
                    .phone(user.getPhone())
                    .email(user.getEmail())
                    .profileImageUrl(user.getProfileImageUrl())
                    .build();
        }

        return BookingDTO.BookingResponse.builder()
                .bookingId(booking.getBookingId())
                .bookingNumber(booking.getBookingNumber())
                .scheduledDate(booking.getScheduledDate())
                .scheduledTime(booking.getScheduledTime())
                .scheduledEndTime(booking.getScheduledEndTime())
                .serviceAddress(booking.getServiceAddress())
                .serviceLandmark(booking.getServiceLandmark())
                .servicePincode(booking.getServicePincode())
                .issueTitle(booking.getIssueTitle())
                .issueDescription(booking.getIssueDescription())
                .issueImages(issueImages)
                .urgencyLevel(booking.getUrgencyLevel() != null ? booking.getUrgencyLevel().name() : "MEDIUM")
                .estimatedAmount(booking.getEstimatedAmount())
                .materialCost(booking.getMaterialCost())
                .laborCost(booking.getLaborCost())
                .travelCharge(booking.getTravelCharge())
                .discountAmount(booking.getDiscountAmount())
                .taxAmount(booking.getTaxAmount())
                .finalAmount(booking.getFinalAmount())
                .bookingStatus(booking.getBookingStatus() != null ? booking.getBookingStatus().name() : "PENDING")
                .cancelledBy(booking.getCancelledBy() != null ? booking.getCancelledBy().name() : null)
                .cancellationReason(booking.getCancellationReason())
                .cancelledAt(booking.getCancelledAt())
                .providerNotes(booking.getProviderNotes())
                .workSummary(booking.getWorkSummary())
                .userRating(booking.getUserRating())
                .createdAt(booking.getCreatedAt())
                .updatedAt(booking.getUpdatedAt())
                .service(serviceSummary)
                .provider(providerInfo)
                .customer(customerInfo)
                .build();
    }
}
