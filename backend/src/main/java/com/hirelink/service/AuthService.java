package com.hirelink.service;

import com.hirelink.dto.AuthDTO;
import com.hirelink.entity.OtpVerification;
import com.hirelink.entity.OtpVerification.OtpType;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.entity.User;
import com.hirelink.exception.BadRequestException;
import com.hirelink.exception.ResourceNotFoundException;
import com.hirelink.exception.UnauthorizedException;
import com.hirelink.repository.OtpRepository;
import com.hirelink.repository.ServiceCategoryRepository;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.UserRepository;
import com.hirelink.security.CustomUserDetails;
import com.hirelink.security.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ServiceProviderRepository providerRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    
    // OTP-related dependencies
    private final OtpRepository otpRepository;
    private final SmsService smsService;
    private final EmailService emailService;
    
    // OTP Configuration
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 10;

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest request) {
        // Check if phone already exists
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new BadRequestException("Phone number already registered");
        }

        // Check if email already exists (if provided)
        if (request.getEmail() != null && !request.getEmail().isEmpty() && 
            userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Determine user type
        User.UserType userType = User.UserType.CUSTOMER;
        if (request.getUserType() != null && request.getUserType().equalsIgnoreCase("PROVIDER")) {
            userType = User.UserType.PROVIDER;
        }

        // Create user
        User user = User.builder()
                .name(request.getName())
                .phone(request.getPhone())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .userType(userType)
                .accountStatus(User.AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        // If provider, create provider profile with category and location
        if (userType == User.UserType.PROVIDER) {
            ServiceProvider.ServiceProviderBuilder providerBuilder = ServiceProvider.builder()
                    .user(user)
                    .businessName(request.getName() + "'s Services");

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
        }

        // Generate tokens
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

    /**
     * Login with phone/email and password.
     * Supports both phone+password and email+password login.
     */
    @Transactional
    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest request) {
        User user;
        String identifier;

        // Determine if login is by phone or email
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

        // Check if user has a password set
        if (user.getPasswordHash() == null || user.getPasswordHash().isEmpty()) {
            throw new UnauthorizedException("Password not set. Please login with OTP first and set a password.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            // Increment failed login attempts
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            userRepository.save(user);
            throw new UnauthorizedException("Invalid credentials");
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        // Generate tokens
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

    /**
     * Set password for OTP-verified users.
     * Allows users who logged in via OTP to set a password for future logins.
     */
    @Transactional
    public void setPassword(Long userId, AuthDTO.SetPasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Check if user is verified (phone or email)
        if (!Boolean.TRUE.equals(user.getIsPhoneVerified()) && !Boolean.TRUE.equals(user.getIsEmailVerified())) {
            throw new BadRequestException("Please verify your phone or email before setting a password");
        }

        // Set the password
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);

        log.info("Password set for user: {}", userId);
    }

    // ============================================
    // OTP Authentication Methods
    // ============================================

    /**
     * Generate a random 6-digit OTP code
     */
    private String generateOtp() {
        SecureRandom random = new SecureRandom();
        int otp = 100000 + random.nextInt(900000);  // 6-digit number
        return String.valueOf(otp);
    }

    /**
     * Send OTP to phone number via SMS
     */
    @Transactional
    public void sendPhoneOtp(String phone) {
        if (!smsService.isValidPhoneNumber(phone)) {
            throw new BadRequestException("Invalid phone number format");
        }

        // Delete any existing OTPs for this phone
        otpRepository.deleteByIdentifierAndOtpType(phone, OtpType.PHONE);

        // Generate and save new OTP
        String otpCode = generateOtp();
        OtpVerification otp = OtpVerification.builder()
                .identifier(phone)
                .otpType(OtpType.PHONE)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        otpRepository.save(otp);

        // Send SMS (mock in development)
        smsService.sendOtp(phone, otpCode);
        
        log.info("Phone OTP sent to: {}", phone);
    }

    /**
     * Send OTP to email address
     */
    @Transactional
    public void sendEmailOtp(String email) {
        if (!emailService.isValidEmail(email)) {
            throw new BadRequestException("Invalid email format");
        }

        // Delete any existing OTPs for this email
        otpRepository.deleteByIdentifierAndOtpType(email, OtpType.EMAIL);

        // Generate and save new OTP
        String otpCode = generateOtp();
        OtpVerification otp = OtpVerification.builder()
                .identifier(email)
                .otpType(OtpType.EMAIL)
                .otpCode(otpCode)
                .expiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES))
                .build();
        otpRepository.save(otp);

        // Send email
        emailService.sendOtpEmail(email, otpCode);
        
        log.info("Email OTP sent to: {}", email);
    }

    /**
     * Verify OTP and login/register user
     */
    @Transactional
    public AuthDTO.AuthResponse verifyOtpAndLogin(AuthDTO.VerifyOtpRequest request) {
        String identifier;
        OtpType otpType;

        // Determine if this is phone or email OTP
        if (request.getPhone() != null && !request.getPhone().isEmpty()) {
            identifier = request.getPhone();
            otpType = OtpType.PHONE;
        } else if (request.getEmail() != null && !request.getEmail().isEmpty()) {
            identifier = request.getEmail();
            otpType = OtpType.EMAIL;
        } else {
            throw new BadRequestException("Phone or email is required");
        }

        // Find and validate OTP
        OtpVerification otp = otpRepository
                .findByIdentifierAndOtpCodeAndOtpTypeAndIsUsedFalse(identifier, request.getOtp(), otpType)
                .orElseThrow(() -> new UnauthorizedException("Invalid OTP code"));

        if (otp.isExpired()) {
            throw new UnauthorizedException("OTP has expired. Please request a new one.");
        }

        // Mark OTP as used
        otp.setIsUsed(true);
        otpRepository.save(otp);

        // Find or create user
        User user;
        if (otpType == OtpType.PHONE) {
            user = userRepository.findByPhone(identifier)
                    .orElseGet(() -> createUserFromOtp(identifier, null, request.getName(), request.getUserType()));
            // Mark phone as verified
            user.setIsPhoneVerified(true);
            user.setPhoneVerifiedAt(LocalDateTime.now());
        } else {
            user = userRepository.findByEmail(identifier)
                    .orElseGet(() -> createUserFromOtp(null, identifier, request.getName(), request.getUserType()));
            // Mark email as verified
            user.setIsEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
        }

        // Update last login
        user.setLastLoginAt(LocalDateTime.now());
        user.setFailedLoginAttempts(0);
        user = userRepository.save(user);

        // Generate tokens
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
     * Create a new user from OTP verification (for first-time users)
     */
    private User createUserFromOtp(String phone, String email, String name, String userTypeStr) {
        User.UserType userType = User.UserType.CUSTOMER;
        if (userTypeStr != null && userTypeStr.equalsIgnoreCase("PROVIDER")) {
            userType = User.UserType.PROVIDER;
        }

        String userName = name;
        if (userName == null || userName.isEmpty()) {
            // Generate a default name from phone/email
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
                .userType(userType)
                .accountStatus(User.AccountStatus.ACTIVE)
                .build();

        user = userRepository.save(user);

        // If provider, create provider profile
        if (userType == User.UserType.PROVIDER) {
            ServiceProvider provider = ServiceProvider.builder()
                    .user(user)
                    .businessName(userName + "'s Services")
                    .build();
            providerRepository.save(provider);
        }

        log.info("New user created via OTP: {} (type: {})", phone != null ? phone : email, userType);
        return user;
    }

    // ============================================
    // Google OAuth Authentication
    // ============================================

    /**
     * Login or register user with Google OAuth
     */
    @Transactional
    public AuthDTO.AuthResponse googleLogin(AuthDTO.GoogleLoginRequest request) {
        // First, try to find user by Google ID
        Optional<User> existingByGoogleId = userRepository.findByGoogleId(request.getGoogleId());
        
        if (existingByGoogleId.isPresent()) {
            // Existing Google user - login
            User user = existingByGoogleId.get();
            return generateAuthResponse(user);
        }

        // Check if email already exists with different auth method
        Optional<User> existingByEmail = userRepository.findByEmail(request.getEmail());
        
        if (existingByEmail.isPresent()) {
            User user = existingByEmail.get();
            // Link Google account to existing user
            user.setGoogleId(request.getGoogleId());
            user.setAuthProvider(User.AuthProvider.GOOGLE);
            if (request.getImageUrl() != null && user.getProfileImageUrl() == null) {
                user.setProfileImageUrl(request.getImageUrl());
            }
            user.setIsEmailVerified(true);
            user.setEmailVerifiedAt(LocalDateTime.now());
            user = userRepository.save(user);
            
            log.info("Linked Google account to existing user: {}", request.getEmail());
            return generateAuthResponse(user);
        }

        // New user - register with Google
        User.UserType userType = User.UserType.CUSTOMER;
        if (request.getUserType() != null && request.getUserType().equalsIgnoreCase("PROVIDER")) {
            userType = User.UserType.PROVIDER;
        }

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
                .userType(userType)
                .accountStatus(User.AccountStatus.ACTIVE)
                .isEmailVerified(true)
                .emailVerifiedAt(LocalDateTime.now())
                .build();

        newUser = userRepository.save(newUser);

        // If provider, create provider profile
        if (userType == User.UserType.PROVIDER) {
            ServiceProvider provider = ServiceProvider.builder()
                    .user(newUser)
                    .businessName(userName + "'s Services")
                    .build();
            providerRepository.save(provider);
        }

        log.info("New user registered via Google: {}", request.getEmail());
        return generateAuthResponse(newUser);
    }

    /**
     * Generate auth response with JWT tokens
     */
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
        return AuthDTO.UserDTO.builder()
                .userId(user.getUserId())
                .name(user.getName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .profileImageUrl(user.getProfileImageUrl())
                .userType(user.getUserType().name())
                .accountStatus(user.getAccountStatus().name())
                .isEmailVerified(user.getIsEmailVerified())
                .isPhoneVerified(user.getIsPhoneVerified())
                .authProvider(user.getAuthProvider() != null ? user.getAuthProvider().name() : "LOCAL")
                .hasPassword(user.getPasswordHash() != null && !user.getPasswordHash().isEmpty())
                .build();
    }
}
