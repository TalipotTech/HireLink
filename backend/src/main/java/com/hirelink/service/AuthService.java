package com.hirelink.service;

import com.hirelink.dto.AuthDTO;
import com.hirelink.entity.OtpVerification;
import com.hirelink.entity.OtpVerification.OtpType;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.entity.User;
import com.hirelink.entity.UserRole;
import com.hirelink.exception.BadRequestException;
import com.hirelink.exception.ResourceNotFoundException;
import com.hirelink.exception.UnauthorizedException;
import com.hirelink.repository.OtpRepository;
import com.hirelink.repository.ServiceCategoryRepository;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.UserRepository;
import com.hirelink.repository.UserRoleRepository;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final ServiceProviderRepository providerRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    private final OtpRepository otpRepository;
    private final SmsService smsService;
    private final EmailService emailService;

    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

    /**
     * OTP-verified registration.
     * User must call /send-otp first, then submit name + phone + otp + password.
     * Always creates a CUSTOMER account with verified phone.
     */
    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        // Verify the OTP first
        OtpVerification otp = otpRepository
                .findByIdentifierAndOtpCodeAndOtpTypeAndIsUsedFalse(
                        request.getPhone(), request.getOtp(), OtpType.PHONE)
                .orElseThrow(() -> new UnauthorizedException("Invalid OTP code"));

        if (otp.isExpired()) {
            throw new UnauthorizedException("OTP has expired. Please request a new one.");
        }

        // Mark OTP as used
        otp.setIsUsed(true);
        otpRepository.save(otp);

        // Check if phone already exists
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number already registered. Please login instead.");
        }

        // Check if email already exists (if provided)
        if (request.getEmail() != null && !request.getEmail().isEmpty() &&
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Create user - always starts as CUSTOMER
        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .userType(User.UserType.CUSTOMER)
                .accountStatus(User.AccountStatus.ACTIVE)
                .isPhoneVerified(true)
                .phoneVerifiedAt(LocalDateTime.now())
                .build();

        user = userRepository.save(user);

        // Assign CUSTOMER role
        UserRole customerRole = UserRole.builder()
                .user(user)
                .role("CUSTOMER")
                .build();
        userRoleRepository.save(customerRole);

        user.setRoles(List.of(customerRole));

        // Generate tokens
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        log.info("New user registered with OTP-verified phone: {}", request.getPhone());

        return AuthDTO.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    /**
     * Login with phone/email and password.
     */
    @Transactional
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        User user;
        String identifier;

        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            identifier = request.getPhone();
            user = userRepository.findByPhone(request.getPhone())
                    .orElseThrow(() -> new UnauthorizedException("Invalid phone or password"));
        } else if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            identifier = request.getEmail();
            user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new UnauthorizedException("Invalid email or password"));
        } else {
            throw new BadRequestException("Phone or email is required");
        }

        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new UnauthorizedException("Password not set. Please login with OTP first and set a password.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            userRepository.save(user);
            throw new UnauthorizedException("Invalid credentials");
        }

        ensureUserHasRoles(user);

        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        log.info("User logged in with password: {}", identifier);

        return AuthDTO.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    public AuthDTO.AuthResponse refreshToken(String refreshToken) {
        String phone = jwtService.extractUsername(refreshToken);

        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token"));

        CustomUserDetails userDetails = new CustomUserDetails(user);

        if (!jwtService.isTokenValid(refreshToken, userDetails)) {
            throw new UnauthorizedException("Invalid or expired refresh token");
        }

        ensureUserHasRoles(user);

        String newAccessToken = jwtService.generateAccessToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthDTO.AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    @Transactional
    public void changePassword(Long userId, AuthDTO.ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadRequestException("Current password is incorrect");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void setPassword(Long userId, AuthDTO.SetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (!Boolean.TRUE.equals(user.getIsPhoneVerified()) && !Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BadRequestException("Please verify your phone or email before setting a password");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        log.info("Password set for user: {}", userId);
    }

    // ============================================
    // OTP Authentication Methods
    // ============================================

    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);
        return String.valueOf(otp);
    }

    @Transactional
    public void sendPhoneOtp(String phone) {
        if (!smsService.isValidPhoneNumber(phone)) {
            throw new BadRequestException("Invalid phone number format");
        }

        otpRepository.deleteByIdentifierAndOtpType(phone, OtpType.PHONE);

        String otpCode = generateOtp();
        OtpVerification otp = OtpVerification.builder()
                .identifier(phone)
                .otpType(OtpType.PHONE)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        otpRepository.save(otp);

        smsService.sendOtp(phone, otpCode);

        log.info("Phone OTP sent to: {}", phone);
    }

    @Transactional
    public void sendEmailOtp(String email) {
        if (!emailService.isValidEmail(email)) {
            throw new BadRequestException("Invalid email format");
        }

        otpRepository.deleteByIdentifierAndOtpType(email, OtpType.EMAIL);

        String otpCode = generateOtp();
        OtpVerification otp = OtpVerification.builder()
                .identifier(email)
                .otpType(OtpType.EMAIL)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        otpRepository.save(otp);

        emailService.sendOtpEmail(email, otpCode);

        log.info("Email OTP sent to: {}", email);
    }

    /**
     * Verify OTP and login existing user.
     * For new users via OTP login, creates a CUSTOMER account automatically.
     * No userType selection -- everyone starts as CUSTOMER.
     */
    @Transactional
    public AuthDTO.AuthResponse verifyOtpAndLogin(AuthDTO.VerifyOtpRequest request) {
        String identifier;
        OtpType otpType;

        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            identifier = request.getPhone();
            otpType = OtpType.PHONE;
        } else if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            identifier = request.getEmail();
            otpType = OtpType.EMAIL;
        } else {
            throw new BadRequestException("Phone or email is required");
        }

        OtpVerification otp = otpRepository
                .findByIdentifierAndOtpCodeAndOtpTypeAndIsUsedFalse(identifier, request.getOtp(), otpType)
                .orElseThrow(() -> new UnauthorizedException("Invalid OTP code"));

        if (otp.isExpired()) {
            throw new UnauthorizedException("OTP has expired. Please request a new one.");
        }

        otp.setIsUsed(true);
        otpRepository.save(otp);

        User user;
        if (otpType == OtpType.PHONE) {
            user = userRepository.findByPhone(identifier)
                    .orElseGet(() -> createUserFromOtp(identifier, null, request.getName()));
            user.setIsPhoneVerified(true);
            user.setPhoneVerifiedAt(LocalDateTime.now());
        } else {
            user = userRepository.findByEmail(identifier)
                    .orElseGet(() -> createUserFromOtp(null, identifier, request.getName()));
            user.setIsEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
        }

        ensureUserHasRoles(user);

        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        user = userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        log.info("User logged in via OTP: {} (type: {})", identifier, otpType);

        return AuthDTO.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    /**
     * Create a new CUSTOMER user from OTP verification (for first-time users).
     */
    private User createUserFromOtp(String phone, String email, String name) {
        String userName = name;
        if (userName == null || userName.isEmpty()) {
            if (phone != null) {
                userName = "User " + phone.substring(Math.max(0, phone.length() - 4));
            } else if (email != null) {
                userName = email.split("@")[0];
            } else {
                userName = "HireLink User";
            }
        }

        User user = User.builder()
                .name(userName)
                .phone(phone)
                .email(email)
                .authProvider(User.AuthProvider.LOCAL)
                .userType(User.UserType.CUSTOMER)
                .accountStatus(User.AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        UserRole customerRole = UserRole.builder()
                .user(user)
                .role("CUSTOMER")
                .build();
        userRoleRepository.save(customerRole);

        user.setRoles(List.of(customerRole));

        log.info("New CUSTOMER user created via OTP: {}", phone != null ? phone : email);
        return user;
    }

    // ============================================
    // Google OAuth Authentication
    // ============================================

    /**
     * Login or register user with Google OAuth.
     * New users are always created as CUSTOMER.
     */
    @Transactional
    public AuthDTO.AuthResponse googleLogin(AuthDTO.GoogleLoginRequest request) {
        Optional<User> existingByGoogleId = userRepository.findByGoogleId(request.getGoogleId());

        if (existingByGoogleId.isPresent()) {
            User user = existingByGoogleId.get();
            ensureUserHasRoles(user);
            return generateAuthResponse(user);
        }

        Optional<User> existingByEmail = userRepository.findByEmail(request.getEmail());

        if (existingByEmail.isPresent()) {
            User user = existingByEmail.get();
            user.setGoogleId(request.getGoogleId());
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            if (request.getImageUrl() != null && user.getProfileImageUrl() == null) {
                user.setProfileImageUrl(request.getImageUrl());
            }
            user.setIsEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            user = userRepository.save(user);

            ensureUserHasRoles(user);

            log.info("Linked Google account to existing user: {}", request.getEmail());
            return generateAuthResponse(user);
        }

        // New user -- always CUSTOMER
        String userName = request.getName();
        if (userName == null || userName.isEmpty()) {
            userName = request.getEmail().split("@")[0];
        }

        User newUser = User.builder()
                .name(userName)
                .email(request.getEmail())
                .googleId(request.getGoogleId())
                .profileImageUrl(request.getImageUrl())
                .authProvider(User.AuthProvider.GOOGLE)
                .userType(User.UserType.CUSTOMER)
                .accountStatus(User.AccountStatus.ACTIVE)
                .isEmailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .build();

        newUser = userRepository.save(newUser);

        UserRole customerRole = UserRole.builder()
                .user(newUser)
                .role("CUSTOMER")
                .build();
        userRoleRepository.save(customerRole);

        newUser.setRoles(List.of(customerRole));

        log.info("New CUSTOMER user registered via Google: {}", request.getEmail());
        return generateAuthResponse(newUser);
    }

    // ============================================
    // Become Provider
    // ============================================

    /**
     * Upgrade an existing CUSTOMER to also be a PROVIDER.
     * Creates service_providers record and adds PROVIDER role.
     */
    @Transactional
    public AuthDTO.AuthResponse becomeProvider(Long userId, AuthDTO.BecomeProviderRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (userRoleRepository.existsByUserUserIdAndRole(userId, "PROVIDER")) {
            throw new BadRequestException("You are already registered as a provider");
        }

        // Create service provider profile
        ServiceProvider.ServiceProviderBuilder providerBuilder = ServiceProvider.builder()
                .user(user)
                .businessName(user.getName() + "'s Services");

        if (request.getCategoryId() != null) {
            categoryRepository.findById(request.getCategoryId())
                    .ifPresent(providerBuilder::primaryCategory);
        }
        if (request.getBaseAddress() != null) {
            providerBuilder.baseAddress(request.getBaseAddress());
        }
        if (request.getBasePincode() != null) {
            providerBuilder.basePincode(request.getBasePincode());
        }
        if (request.getBaseLatitude() != null) {
            providerBuilder.baseLatitude(request.getBaseLatitude());
        }
        if (request.getBaseLongitude() != null) {
            providerBuilder.baseLongitude(request.getBaseLongitude());
        }

        providerRepository.save(providerBuilder.build());

        // Add PROVIDER role
        UserRole providerRole = UserRole.builder()
                .user(user)
                .role("PROVIDER")
                .build();
        userRoleRepository.save(providerRole);

        // Update user_type to PROVIDER (primary role)
        user.setUserType(User.UserType.PROVIDER);
        user = userRepository.save(user);

        // Reload roles
        List<UserRole> roles = userRoleRepository.findByUserUserId(userId);
        user.setRoles(roles);

        log.info("User {} upgraded to PROVIDER", userId);

        // Return fresh tokens with updated roles
        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthDTO.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    // ============================================
    // Helpers
    // ============================================

    /**
     * Ensure legacy users (created before user_roles table) have roles populated.
     */
    private void ensureUserHasRoles(User user) {
        if (user.getRoles() == null || user.getRoles().isEmpty()) {
            List<UserRole> roles = new ArrayList<>();

            UserRole primaryRole = UserRole.builder()
                    .user(user)
                    .role(user.getUserType().name())
                    .build();
            userRoleRepository.save(primaryRole);
            roles.add(primaryRole);

            // Providers also get CUSTOMER role
            if (user.getUserType() == User.UserType.PROVIDER) {
                UserRole customerRole = UserRole.builder()
                        .user(user)
                        .role("CUSTOMER")
                        .build();
                userRoleRepository.save(customerRole);
                roles.add(customerRole);
            }

            user.setRoles(roles);
        }
    }

    private AuthDTO.AuthResponse generateAuthResponse(User user) {
        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        CustomUserDetails userDetails = new CustomUserDetails(user);
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthDTO.AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .expiresIn(jwtService.getAccessTokenExpiration())
                .user(mapToUserDTO(user))
                .build();
    }

    private AuthDTO.UserDTO mapToUserDTO(User user) {
        List<String> roleNames = List.of("CUSTOMER");
        if (user.getRoles() != null && !user.getRoles().isEmpty()) {
            roleNames = user.getRoles().stream()
                    .map(UserRole::getRole)
                    .collect(Collectors.toList());
        }

        boolean hasProviderProfile = user.getServiceProvider() != null
                || providerRepository.findByUserUserId(user.getUserId()).isPresent();

        return AuthDTO.UserDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .userType(user.getUserType().name())
                .roles(roleNames)
                .hasProviderProfile(hasProviderProfile)
                .accountStatus(user.getAccountStatus().name())
                .isEmailVerified(user.getIsEmailVerified())
                .isPhoneVerified(user.getIsPhoneVerified())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL")
                .hasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty())
                .build();
    }
}
