package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.AuthDTO;
import com.hirelink.entity.User;
import com.hirelink.entity.UserAddress;
import com.hirelink.entity.UserRole;
import com.hirelink.exception.ResourceNotFoundException;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.UserRoleRepository;
import com.hirelink.repository.UserAddressRepository;
import com.hirelink.repository.UserRepository;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserRepository userRepository;
    private final UserAddressRepository addressRepository;
    private final UserRoleRepository userRoleRepository;
    private final ServiceProviderRepository providerRepository;
    private final AuthService authService;

    @GetMapping("/me")
    @Operation(summary = "Get current user profile")
    public ResponseEntity<ApiResponse<AuthDTO.UserDTO>> getCurrentUser(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        AuthDTO.UserDTO dto = buildUserDTO(user);
        return ResponseEntity.ok(ApiResponse.success(dto));
    }

    @PostMapping("/become-provider")
    @Operation(summary = "Submit a provider application for admin review")
    public ResponseEntity<ApiResponse<AuthDTO.MessageResponse>> becomeProvider(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody AuthDTO.BecomeProviderRequest request) {
        AuthDTO.MessageResponse response = authService.becomeProvider(userDetails.getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success(response.getMessage(), response));
    }

    // ============================================
    // Profile Email Verification
    // ============================================

    @PostMapping("/me/send-email-otp")
    @Operation(summary = "Send OTP to the current user's email for verification")
    public ResponseEntity<ApiResponse<String>> sendEmailOtp(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.sendProfileEmailOtp(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("OTP sent to your email", "Check your email for the verification code"));
    }

    @PostMapping("/me/verify-email-otp")
    @Operation(summary = "Verify OTP to mark the current user's email as verified")
    public ResponseEntity<ApiResponse<AuthDTO.UserDTO>> verifyEmailOtp(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @RequestBody AuthDTO.VerifyOtpRequest request) {
        authService.verifyProfileEmailOtp(userDetails.getUserId(), request.getOtp());
        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return ResponseEntity.ok(ApiResponse.success("Email verified successfully", buildUserDTO(user)));
    }

    @PostMapping("/me/send-verification-link")
    @Operation(summary = "Send a verification link to the current user's email")
    public ResponseEntity<ApiResponse<String>> sendVerificationLink(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        authService.sendProfileVerificationLink(userDetails.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Verification link sent", "Check your email for the verification link"));
    }

    @PutMapping("/me")
    @Operation(summary = "Update current user profile")
    @Transactional
    public ResponseEntity<ApiResponse<AuthDTO.UserDTO>> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (request.getName() != null) {
            user.setName(request.getName());
        }
        if (request.getEmail() != null) {
            user.setEmail(request.getEmail());
        }
        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }
        if (request.getDateOfBirth() != null) {
            user.setDateOfBirth(request.getDateOfBirth());
        }
        if (request.getGender() != null) {
            user.setGender(User.Gender.valueOf(request.getGender()));
        }

        user = userRepository.save(user);

        AuthDTO.UserDTO dto = buildUserDTO(user);
        return ResponseEntity.ok(ApiResponse.success("Profile updated", dto));
    }

    @GetMapping("/me/addresses")
    @Operation(summary = "Get user addresses")
    public ResponseEntity<ApiResponse<List<AddressDTO>>> getAddresses(
            @AuthenticationPrincipal CustomUserDetails userDetails) {
        List<UserAddress> addresses = addressRepository.findByUserUserIdAndIsActiveTrue(userDetails.getUserId());
        List<AddressDTO> dtos = addresses.stream()
                .map(this::mapToAddressDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(dtos));
    }

    @PostMapping("/me/addresses")
    @Operation(summary = "Add new address")
    @Transactional
    public ResponseEntity<ApiResponse<AddressDTO>> addAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody CreateAddressRequest request) {
        User user = userRepository.findById(userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // If this is the first address or marked as default, reset other defaults
        if (request.getIsDefault() != null && request.getIsDefault()) {
            addressRepository.resetDefaultAddresses(user.getUserId());
        }

        UserAddress.AddressType addressType = UserAddress.AddressType.HOME;
        if (request.getAddressType() != null) {
            addressType = UserAddress.AddressType.valueOf(request.getAddressType());
        }

        UserAddress address = UserAddress.builder()
                .user(user)
                .addressType(addressType)
                .addressLabel(request.getAddressLabel())
                .addressLine1(request.getAddressLine1())
                .addressLine2(request.getAddressLine2())
                .landmark(request.getLandmark())
                .city(request.getCity())
                .state(request.getState())
                .pincode(request.getPincode())
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .isDefault(request.getIsDefault() != null ? request.getIsDefault() : false)
                .build();

        // If no addresses exist, make this the default
        if (addressRepository.countByUserUserIdAndIsActiveTrue(user.getUserId()) == 0) {
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return ResponseEntity.ok(ApiResponse.success("Address added", mapToAddressDTO(address)));
    }

    @PutMapping("/me/addresses/{id}")
    @Operation(summary = "Update address")
    @Transactional
    public ResponseEntity<ApiResponse<AddressDTO>> updateAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id,
            @Valid @RequestBody CreateAddressRequest request) {
        UserAddress address = addressRepository.findByAddressIdAndUserUserId(id, userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        if (request.getAddressType() != null) {
            address.setAddressType(UserAddress.AddressType.valueOf(request.getAddressType()));
        }
        if (request.getAddressLabel() != null) {
            address.setAddressLabel(request.getAddressLabel());
        }
        if (request.getAddressLine1() != null) {
            address.setAddressLine1(request.getAddressLine1());
        }
        if (request.getAddressLine2() != null) {
            address.setAddressLine2(request.getAddressLine2());
        }
        if (request.getLandmark() != null) {
            address.setLandmark(request.getLandmark());
        }
        if (request.getCity() != null) {
            address.setCity(request.getCity());
        }
        if (request.getState() != null) {
            address.setState(request.getState());
        }
        if (request.getPincode() != null) {
            address.setPincode(request.getPincode());
        }
        if (request.getLatitude() != null) {
            address.setLatitude(request.getLatitude());
        }
        if (request.getLongitude() != null) {
            address.setLongitude(request.getLongitude());
        }
        if (request.getIsDefault() != null && request.getIsDefault()) {
            addressRepository.resetDefaultAddresses(userDetails.getUserId());
            address.setIsDefault(true);
        }

        address = addressRepository.save(address);
        return ResponseEntity.ok(ApiResponse.success("Address updated", mapToAddressDTO(address)));
    }

    @DeleteMapping("/me/addresses/{id}")
    @Operation(summary = "Delete address")
    @Transactional
    public ResponseEntity<ApiResponse<Void>> deleteAddress(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @PathVariable Long id) {
        UserAddress address = addressRepository.findByAddressIdAndUserUserId(id, userDetails.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("Address not found"));

        address.setIsActive(false);
        addressRepository.save(address);
        return ResponseEntity.ok(ApiResponse.success("Address deleted"));
    }

    private AuthDTO.UserDTO buildUserDTO(User user) {
        List<String> roleNames = userRoleRepository.findByUserUserId(user.getUserId())
                .stream().map(UserRole::getRole).collect(Collectors.toList());
        if (roleNames.isEmpty()) {
            roleNames = List.of(user.getUserType().name());
        }
        var providerOpt = providerRepository.findByUserUserId(user.getUserId());
        boolean hasProviderProfile = providerOpt.isPresent();
        String providerAppStatus = providerOpt.map(sp -> sp.getKycStatus().name()).orElse(null);

        return AuthDTO.UserDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .userType(user.getUserType().name())
                .roles(roleNames)
                .hasProviderProfile(hasProviderProfile)
                .providerApplicationStatus(providerAppStatus)
                .accountStatus(user.getAccountStatus().name())
                .isEmailVerified(user.getIsEmailVerified())
                .isPhoneVerified(user.getIsPhoneVerified())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL")
                .hasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty())
                .build();
    }

    private AddressDTO mapToAddressDTO(UserAddress address) {
        return AddressDTO.builder()
                .addressId(address.getAddressId())
                .addressType(address.getAddressType().name())
                .addressLabel(address.getAddressLabel())
                .addressLine1(address.getAddressLine1())
                .addressLine2(address.getAddressLine2())
                .landmark(address.getLandmark())
                .city(address.getCity())
                .state(address.getState())
                .pincode(address.getPincode())
                .country(address.getCountry())
                .latitude(address.getLatitude())
                .longitude(address.getLongitude())
                .isDefault(address.getIsDefault())
                .build();
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class UpdateProfileRequest {
        private String name;
        private String email;
        private String profileImageUrl;
        private java.time.LocalDate dateOfBirth;
        private String gender;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class CreateAddressRequest {
        private String addressType;
        private String addressLabel;
        private String addressLine1;
        private String addressLine2;
        private String landmark;
        private String city;
        private String state;
        private String pincode;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Boolean isDefault;
    }

    @Data
    @Builder
    @AllArgsConstructor
    public static class AddressDTO {
        private Long addressId;
        private String addressType;
        private String addressLabel;
        private String addressLine1;
        private String addressLine2;
        private String landmark;
        private String city;
        private String state;
        private String pincode;
        private String country;
        private BigDecimal latitude;
        private BigDecimal longitude;
        private Boolean isDefault;
    }
}
