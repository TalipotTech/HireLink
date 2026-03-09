# HireLink Application - Admin Module Implementation Plan
## For Cursor IDE with Claude Opus

---

## 📋 PROJECT CONTEXT

**Application:** HireLink Booking System  
**Stack:** Spring Boot 3.x (Backend) + React 18.x (Frontend) + MySQL 8.0  
**Current State:** User-facing CRUD, OTP/Google Auth, search, location features implemented  
**Goal:** Build a full Admin Module — dashboard, user management, booking oversight, service/category management, provider approval, and reporting

---

## 🎯 ADMIN MODULE TASKS

### TASK 1: Admin Role & Authentication
### TASK 2: Admin Dashboard (Stats & Overview)
### TASK 3: User Management (View / Edit / Ban)
### TASK 4: Booking Management (Override, Assign, Audit)
### TASK 5: Service & Category Management (CRUD)
### TASK 6: Provider Verification & Approval
### TASK 7: Reports & Analytics
### TASK 8: Admin Frontend Layout & Routing

---

# TASK 1: ADMIN ROLE & AUTHENTICATION

## 1.1 Overview
Add an ADMIN role to the existing auth system. Admin users access a separate `/admin` area protected by role-based guards on both backend and frontend.

## 1.2 Backend Implementation

### Step 1: Add Role Enum to User Entity
```java
// Modify: backend/src/main/java/com/hirelink/entity/User.java
// ADD a Role enum and field to the existing User entity

public enum Role {
    CUSTOMER,
    PROVIDER,
    ADMIN
}

@Column(name = "role", nullable = false)
@Enumerated(EnumType.STRING)
private Role role = Role.CUSTOMER;
```

### Step 2: Include Role in JWT Claims
```java
// Modify: backend/src/main/java/com/hirelink/service/JwtService.java
// Update generateToken to embed the role

public String generateToken(User user) {
    return Jwts.builder()
        .subject(user.getEmail())
        .claim("userId", user.getId())
        .claim("name", user.getName())
        .claim("role", user.getRole().name())   // <-- ADD THIS
        .issuedAt(new Date())
        .expiration(new Date(System.currentTimeMillis() + jwtExpiration))
        .signWith(getSigningKey())
        .compact();
}

// ADD helper to extract role
public String extractRole(String token) {
    return Jwts.parser()
        .verifyWith(getSigningKey())
        .build()
        .parseSignedClaims(token)
        .getPayload()
        .get("role", String.class);
}
```

### Step 3: Create Admin Authorization Filter
```java
// Create file: backend/src/main/java/com/hirelink/config/AdminAuthFilter.java

package com.hirelink.config;

import com.hirelink.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import java.io.IOException;

@Component
@RequiredArgsConstructor
public class AdminAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        // Only intercept /api/admin/** routes
        if (!path.startsWith("/api/admin")) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false,\"message\":\"Missing token\"}");
            return;
        }

        String token = authHeader.substring(7);

        if (!jwtService.validateToken(token)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"success\":false,\"message\":\"Invalid token\"}");
            return;
        }

        String role = jwtService.extractRole(token);
        if (!"ADMIN".equals(role)) {
            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
            response.getWriter().write("{\"success\":false,\"message\":\"Admin access required\"}");
            return;
        }

        // Attach user info to request attributes for downstream use
        request.setAttribute("userEmail", jwtService.extractEmail(token));
        request.setAttribute("userRole", role);

        filterChain.doFilter(request, response);
    }
}
```

### Step 4: Register the Filter in Security Config
```java
// Modify: backend/src/main/java/com/hirelink/config/SecurityConfig.java
// If using Spring Security, register the filter; if not, register as a bean

import org.springframework.boot.web.servlet.FilterRegistrationBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SecurityConfig {

    @Bean
    public FilterRegistrationBean<AdminAuthFilter> adminFilter(AdminAuthFilter filter) {
        FilterRegistrationBean<AdminAuthFilter> reg = new FilterRegistrationBean<>();
        reg.setFilter(filter);
        reg.addUrlPatterns("/api/admin/*");
        reg.setOrder(1);
        return reg;
    }

    // ... existing security beans ...
}
```

### Step 5: Seed a Default Admin User
```java
// Create file: backend/src/main/java/com/hirelink/config/DataSeeder.java

package com.hirelink.config;

import com.hirelink.entity.User;
import com.hirelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;

    @Override
    public void run(String... args) {
        if (userRepository.findByEmail("admin@hirelink.com").isEmpty()) {
            User admin = new User();
            admin.setName("HireLink Admin");
            admin.setEmail("admin@hirelink.com");
            admin.setPhone("9999999999");
            admin.setRole(User.Role.ADMIN);
            admin.setIsVerified(true);
            admin.setAuthProvider(User.AuthProvider.LOCAL);
            userRepository.save(admin);
            System.out.println("✅ Default admin user created: admin@hirelink.com");
        }
    }
}
```

### Step 6: Update AuthResponse to Include Role
```java
// Modify: backend/src/main/java/com/hirelink/dto/AuthDTO.java
// ADD role field to AuthResponse

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public static class AuthResponse {
    private String token;
    private Long userId;
    private String email;
    private String name;
    private String role;   // <-- ADD THIS
}
```

Then in `AuthService.java`, include the role when building the response:
```java
return AuthResponse.builder()
    .token(token)
    .userId(user.getId())
    .email(user.getEmail())
    .name(user.getName())
    .role(user.getRole().name())   // <-- ADD THIS
    .build();
```

## 1.3 Frontend Implementation

### Step 1: Update AuthContext to Store Role
```jsx
// Modify: frontend/src/context/AuthContext.jsx
// Include role in state and localStorage

const login = (authResponse) => {
    const userData = {
        id: authResponse.userId,
        email: authResponse.email,
        name: authResponse.name,
        role: authResponse.role,        // <-- ADD
    };
    localStorage.setItem('token', authResponse.token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(authResponse.token);
    setUser(userData);
};

// ADD helper
const isAdmin = () => user?.role === 'ADMIN';
```

### Step 2: Create AdminRoute Guard
```jsx
// Create file: frontend/src/components/AdminRoute.jsx

import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
    const { user, loading } = useAuth();

    if (loading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (user.role !== 'ADMIN') return <Navigate to="/" />;

    return children;
};

export default AdminRoute;
```

### Step 3: Create Admin API Service
```jsx
// Create file: frontend/src/services/adminApi.js

import axios from 'axios';

const adminApi = axios.create({
    baseURL: '/api/admin',
});

// Attach JWT to every admin request
adminApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401/403 globally
adminApi.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.clear();
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

export default adminApi;
```

---

# TASK 2: ADMIN DASHBOARD (STATS & OVERVIEW)

## 2.1 Overview
Central dashboard showing key metrics: total bookings, active users, revenue, pending approvals, and recent activity.

## 2.2 Backend Implementation

### Step 1: Create Dashboard DTO
```java
// Create file: backend/src/main/java/com/hirelink/dto/DashboardDTO.java

package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

public class DashboardDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class DashboardStats {
        private long totalBookings;
        private long pendingBookings;
        private long completedBookings;
        private long cancelledBookings;
        private long totalUsers;
        private long totalProviders;
        private long pendingProviderApprovals;
        private long totalServices;
        private BigDecimal totalRevenue;
        private BigDecimal revenueThisMonth;
        private List<BookingsByStatus> bookingsByStatus;
        private List<RecentActivity> recentActivities;
        private List<MonthlyBookingCount> monthlyTrend;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BookingsByStatus {
        private String status;
        private long count;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RecentActivity {
        private String type;        // BOOKING_CREATED, USER_REGISTERED, etc.
        private String description;
        private String timestamp;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class MonthlyBookingCount {
        private String month;       // "2026-01", "2026-02", etc.
        private long count;
    }
}
```

### Step 2: Add Repository Count Queries
```java
// Add to: backend/src/main/java/com/hirelink/repository/BookingRepository.java

long countByStatus(BookingStatus status);

@Query("SELECT SUM(b.totalAmount) FROM Booking b WHERE b.status = 'COMPLETED'")
BigDecimal sumCompletedRevenue();

@Query("SELECT SUM(b.totalAmount) FROM Booking b " +
       "WHERE b.status = 'COMPLETED' " +
       "AND MONTH(b.completedDate) = MONTH(CURRENT_DATE) " +
       "AND YEAR(b.completedDate) = YEAR(CURRENT_DATE)")
BigDecimal sumRevenueThisMonth();

@Query("SELECT FUNCTION('DATE_FORMAT', b.createdAt, '%Y-%m') AS month, COUNT(b) " +
       "FROM Booking b " +
       "WHERE b.createdAt >= :since " +
       "GROUP BY FUNCTION('DATE_FORMAT', b.createdAt, '%Y-%m') " +
       "ORDER BY month")
List<Object[]> countBookingsByMonth(@Param("since") LocalDateTime since);
```

```java
// Add to: backend/src/main/java/com/hirelink/repository/UserRepository.java

long countByRole(User.Role role);

long countByRoleAndIsVerifiedFalse(User.Role role);  // pending provider approvals
```

### Step 3: Create Admin Dashboard Service
```java
// Create file: backend/src/main/java/com/hirelink/service/AdminDashboardService.java

package com.hirelink.service;

import com.hirelink.dto.DashboardDTO.*;
import com.hirelink.entity.Booking.BookingStatus;
import com.hirelink.entity.User;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.UserRepository;
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

    public DashboardStats getDashboardStats() {
        // Booking counts
        long totalBookings = bookingRepository.count();
        long pending = bookingRepository.countByStatus(BookingStatus.PENDING);
        long completed = bookingRepository.countByStatus(BookingStatus.COMPLETED);
        long cancelled = bookingRepository.countByStatus(BookingStatus.CANCELLED);

        // User counts
        long totalUsers = userRepository.countByRole(User.Role.CUSTOMER);
        long totalProviders = userRepository.countByRole(User.Role.PROVIDER);
        long pendingApprovals = userRepository.countByRoleAndIsVerifiedFalse(User.Role.PROVIDER);

        // Revenue
        BigDecimal totalRevenue = bookingRepository.sumCompletedRevenue();
        BigDecimal monthRevenue = bookingRepository.sumRevenueThisMonth();

        // Bookings by status (for pie chart)
        List<BookingsByStatus> statusBreakdown = Arrays.stream(BookingStatus.values())
            .map(s -> BookingsByStatus.builder()
                .status(s.name())
                .count(bookingRepository.countByStatus(s))
                .build())
            .collect(Collectors.toList());

        // Monthly trend (last 6 months)
        List<Object[]> raw = bookingRepository
            .countBookingsByMonth(LocalDateTime.now().minusMonths(6));
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
            .totalUsers(totalUsers)
            .totalProviders(totalProviders)
            .pendingProviderApprovals(pendingApprovals)
            .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
            .revenueThisMonth(monthRevenue != null ? monthRevenue : BigDecimal.ZERO)
            .bookingsByStatus(statusBreakdown)
            .monthlyTrend(trend)
            .build();
    }
}
```

### Step 4: Create Admin Dashboard Controller
```java
// Create file: backend/src/main/java/com/hirelink/controller/AdminDashboardController.java

package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.DashboardDTO.DashboardStats;
import com.hirelink.service.AdminDashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/admin/dashboard")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminDashboardController {

    private final AdminDashboardService dashboardService;

    /**
     * GET /api/admin/dashboard/stats
     * Returns all dashboard metrics
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStats>> getStats() {
        return ResponseEntity.ok(
            ApiResponse.success("Dashboard loaded", dashboardService.getDashboardStats())
        );
    }
}
```

## 2.3 Frontend Implementation

### Step 1: Create Dashboard Page
```jsx
// Create file: frontend/src/pages/admin/Dashboard.jsx

import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

const Dashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await adminApi.get('/dashboard/stats');
            setStats(res.data.data);
        } catch (err) {
            console.error('Failed to load dashboard:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div style={ds.loader}>Loading dashboard...</div>;
    if (!stats) return <div style={ds.error}>Failed to load dashboard</div>;

    return (
        <div style={ds.page}>
            <h1 style={ds.heading}>Admin Dashboard</h1>

            {/* Stat Cards Row */}
            <div style={ds.cardGrid}>
                <StatCard label="Total Bookings" value={stats.totalBookings} color="#2563eb" />
                <StatCard label="Pending" value={stats.pendingBookings} color="#f59e0b" />
                <StatCard label="Completed" value={stats.completedBookings} color="#10b981" />
                <StatCard label="Cancelled" value={stats.cancelledBookings} color="#ef4444" />
                <StatCard label="Customers" value={stats.totalUsers} color="#6366f1" />
                <StatCard label="Providers" value={stats.totalProviders} color="#8b5cf6" />
                <StatCard
                    label="Revenue (Total)"
                    value={`₹${stats.totalRevenue.toLocaleString()}`}
                    color="#059669"
                />
                <StatCard
                    label="Revenue (This Month)"
                    value={`₹${stats.revenueThisMonth.toLocaleString()}`}
                    color="#0891b2"
                />
            </div>

            {/* Pending Approvals Alert */}
            {stats.pendingProviderApprovals > 0 && (
                <div style={ds.alert}>
                    ⚠️ {stats.pendingProviderApprovals} provider(s) awaiting approval
                </div>
            )}

            {/* Monthly Trend Table */}
            <div style={ds.section}>
                <h3 style={ds.sectionTitle}>Booking Trend (Last 6 Months)</h3>
                <table style={ds.table}>
                    <thead>
                        <tr>
                            <th style={ds.th}>Month</th>
                            <th style={ds.th}>Bookings</th>
                        </tr>
                    </thead>
                    <tbody>
                        {stats.monthlyTrend.map((m) => (
                            <tr key={m.month}>
                                <td style={ds.td}>{m.month}</td>
                                <td style={ds.td}>{m.count}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const StatCard = ({ label, value, color }) => (
    <div style={{ ...ds.card, borderTop: `4px solid ${color}` }}>
        <p style={ds.cardLabel}>{label}</p>
        <p style={{ ...ds.cardValue, color }}>{value}</p>
    </div>
);

const ds = {
    page: { padding: '24px' },
    heading: { fontSize: '1.75rem', color: '#1e293b', marginBottom: '24px' },
    cardGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
        marginBottom: '24px',
    },
    card: {
        background: '#fff',
        borderRadius: '10px',
        padding: '20px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
    },
    cardLabel: { color: '#64748b', fontSize: '0.85rem', marginBottom: '6px' },
    cardValue: { fontSize: '1.6rem', fontWeight: '700' },
    alert: {
        background: '#fef3c7',
        border: '1px solid #fbbf24',
        borderRadius: '8px',
        padding: '14px 20px',
        marginBottom: '24px',
        color: '#92400e',
        fontWeight: '500',
    },
    section: {
        background: '#fff',
        borderRadius: '10px',
        padding: '24px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
        marginBottom: '24px',
    },
    sectionTitle: { fontSize: '1.1rem', color: '#1e293b', marginBottom: '16px' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: {
        textAlign: 'left', padding: '12px 16px',
        background: '#f8fafc', color: '#475569',
        borderBottom: '2px solid #e2e8f0', fontWeight: '600',
    },
    td: { padding: '12px 16px', borderBottom: '1px solid #f1f5f9', color: '#475569' },
    loader: { textAlign: 'center', padding: '60px', color: '#64748b' },
    error: { textAlign: 'center', padding: '60px', color: '#ef4444' },
};

export default Dashboard;
```

---

# TASK 3: USER MANAGEMENT

## 3.1 Overview
Admin can view all users, filter by role, edit profiles, and toggle active/banned status.

## 3.2 Backend Implementation

### Step 1: Add Management Fields to User Entity
```java
// Modify: backend/src/main/java/com/hirelink/entity/User.java
// ADD these fields

@Column(name = "is_active", nullable = false)
private Boolean isActive = true;

@Column(name = "banned_reason")
private String bannedReason;

@Column(name = "created_at")
private LocalDateTime createdAt;

@Column(name = "updated_at")
private LocalDateTime updatedAt;

@PrePersist
protected void onCreate() {
    this.createdAt = LocalDateTime.now();
    this.updatedAt = LocalDateTime.now();
}

@PreUpdate
protected void onUpdate() {
    this.updatedAt = LocalDateTime.now();
}
```

### Step 2: Create Admin User DTOs
```java
// Create file: backend/src/main/java/com/hirelink/dto/AdminUserDTO.java

package com.hirelink.dto;

import lombok.*;
import java.time.LocalDateTime;

public class AdminUserDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserListItem {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private Boolean isVerified;
        private Boolean isActive;
        private String authProvider;
        private LocalDateTime createdAt;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class UserDetail {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private String role;
        private Boolean isVerified;
        private Boolean isActive;
        private String bannedReason;
        private String authProvider;
        private long totalBookings;
        private LocalDateTime createdAt;
        private LocalDateTime updatedAt;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class UpdateUserRequest {
        private String name;
        private String phone;
        private String role;    // CUSTOMER, PROVIDER, ADMIN
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class BanUserRequest {
        private String reason;
    }
}
```

### Step 3: Add Repository Methods
```java
// Add to: backend/src/main/java/com/hirelink/repository/UserRepository.java

List<User> findByRole(User.Role role);

List<User> findByIsActive(Boolean isActive);

@Query("SELECT u FROM User u " +
       "WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
       "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))")
List<User> searchUsers(@Param("keyword") String keyword);
```

### Step 4: Create Admin User Service
```java
// Create file: backend/src/main/java/com/hirelink/service/AdminUserService.java

package com.hirelink.service;

import com.hirelink.dto.AdminUserDTO.*;
import com.hirelink.entity.User;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminUserService {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;

    public List<UserListItem> getAllUsers() {
        return userRepository.findAll().stream()
            .map(this::toListItem)
            .collect(Collectors.toList());
    }

    public List<UserListItem> getUsersByRole(String role) {
        return userRepository.findByRole(User.Role.valueOf(role)).stream()
            .map(this::toListItem)
            .collect(Collectors.toList());
    }

    public List<UserListItem> searchUsers(String keyword) {
        return userRepository.searchUsers(keyword).stream()
            .map(this::toListItem)
            .collect(Collectors.toList());
    }

    public UserDetail getUserDetail(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        long bookingCount = bookingRepository.countByCustomerId(id);

        return UserDetail.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .phone(user.getPhone())
            .role(user.getRole().name())
            .isVerified(user.getIsVerified())
            .isActive(user.getIsActive())
            .bannedReason(user.getBannedReason())
            .authProvider(user.getAuthProvider().name())
            .totalBookings(bookingCount)
            .createdAt(user.getCreatedAt())
            .updatedAt(user.getUpdatedAt())
            .build();
    }

    @Transactional
    public UserDetail updateUser(Long id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));

        if (request.getName() != null) user.setName(request.getName());
        if (request.getPhone() != null) user.setPhone(request.getPhone());
        if (request.getRole() != null) user.setRole(User.Role.valueOf(request.getRole()));

        userRepository.save(user);
        return getUserDetail(id);
    }

    @Transactional
    public void banUser(Long id, BanUserRequest request) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(false);
        user.setBannedReason(request.getReason());
        userRepository.save(user);
    }

    @Transactional
    public void unbanUser(Long id) {
        User user = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("User not found"));
        user.setIsActive(true);
        user.setBannedReason(null);
        userRepository.save(user);
    }

    private UserListItem toListItem(User u) {
        return UserListItem.builder()
            .id(u.getId())
            .name(u.getName())
            .email(u.getEmail())
            .phone(u.getPhone())
            .role(u.getRole().name())
            .isVerified(u.getIsVerified())
            .isActive(u.getIsActive())
            .authProvider(u.getAuthProvider().name())
            .createdAt(u.getCreatedAt())
            .build();
    }
}
```

### Step 5: Create Admin User Controller
```java
// Create file: backend/src/main/java/com/hirelink/controller/AdminUserController.java

package com.hirelink.controller;

import com.hirelink.dto.AdminUserDTO.*;
import com.hirelink.dto.ApiResponse;
import com.hirelink.service.AdminUserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/users")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminUserController {

    private final AdminUserService adminUserService;

    /** GET /api/admin/users */
    @GetMapping
    public ResponseEntity<ApiResponse<List<UserListItem>>> getAllUsers(
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String search) {

        List<UserListItem> users;
        if (search != null && !search.isBlank()) {
            users = adminUserService.searchUsers(search);
        } else if (role != null && !role.isBlank()) {
            users = adminUserService.getUsersByRole(role);
        } else {
            users = adminUserService.getAllUsers();
        }
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    /** GET /api/admin/users/{id} */
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetail>> getUser(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminUserService.getUserDetail(id)));
    }

    /** PUT /api/admin/users/{id} */
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<UserDetail>> updateUser(
            @PathVariable Long id,
            @RequestBody UpdateUserRequest request) {
        return ResponseEntity.ok(ApiResponse.success("User updated",
            adminUserService.updateUser(id, request)));
    }

    /** POST /api/admin/users/{id}/ban */
    @PostMapping("/{id}/ban")
    public ResponseEntity<ApiResponse<String>> banUser(
            @PathVariable Long id,
            @RequestBody BanUserRequest request) {
        adminUserService.banUser(id, request);
        return ResponseEntity.ok(ApiResponse.success("User banned"));
    }

    /** POST /api/admin/users/{id}/unban */
    @PostMapping("/{id}/unban")
    public ResponseEntity<ApiResponse<String>> unbanUser(@PathVariable Long id) {
        adminUserService.unbanUser(id);
        return ResponseEntity.ok(ApiResponse.success("User unbanned"));
    }
}
```

## 3.3 Frontend – User Management Page
```jsx
// Create file: frontend/src/pages/admin/UserManagement.jsx

import { useState, useEffect } from 'react';
import adminApi from '../../services/adminApi';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => { fetchUsers(); }, [roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const params = {};
            if (roleFilter) params.role = roleFilter;
            if (searchTerm) params.search = searchTerm;
            const res = await adminApi.get('/users', { params });
            setUsers(res.data.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchUsers();
    };

    const handleBan = async (id) => {
        const reason = prompt('Reason for banning:');
        if (!reason) return;
        await adminApi.post(`/users/${id}/ban`, { reason });
        fetchUsers();
    };

    const handleUnban = async (id) => {
        await adminApi.post(`/users/${id}/unban`);
        fetchUsers();
    };

    return (
        <div style={{ padding: '24px' }}>
            <h1 style={{ fontSize: '1.75rem', color: '#1e293b', marginBottom: '20px' }}>
                User Management
            </h1>

            {/* Filters */}
            <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', flex: 1 }}>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={inputStyle}
                    />
                    <button type="submit" style={btnPrimary}>Search</button>
                </form>
                <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} style={inputStyle}>
                    <option value="">All Roles</option>
                    <option value="CUSTOMER">Customers</option>
                    <option value="PROVIDER">Providers</option>
                    <option value="ADMIN">Admins</option>
                </select>
            </div>

            {/* Table */}
            {loading ? (
                <p>Loading...</p>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                        <thead>
                            <tr>
                                {['ID', 'Name', 'Email', 'Phone', 'Role', 'Verified', 'Active', 'Actions'].map(h => (
                                    <th key={h} style={thStyle}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map(u => (
                                <tr key={u.id}>
                                    <td style={tdStyle}>{u.id}</td>
                                    <td style={tdStyle}>{u.name}</td>
                                    <td style={tdStyle}>{u.email}</td>
                                    <td style={tdStyle}>{u.phone}</td>
                                    <td style={tdStyle}>
                                        <span style={roleBadge(u.role)}>{u.role}</span>
                                    </td>
                                    <td style={tdStyle}>{u.isVerified ? '✅' : '❌'}</td>
                                    <td style={tdStyle}>{u.isActive ? '✅' : '🚫'}</td>
                                    <td style={tdStyle}>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {u.isActive ? (
                                                <button onClick={() => handleBan(u.id)} style={btnDanger}>Ban</button>
                                            ) : (
                                                <button onClick={() => handleUnban(u.id)} style={btnSuccess}>Unban</button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

// Inline styles
const inputStyle = { padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' };
const btnPrimary = { padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: '500' };
const btnDanger = { padding: '6px 14px', background: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnSuccess = { padding: '6px 14px', background: '#10b981', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const thStyle = { textAlign: 'left', padding: '12px 14px', background: '#f8fafc', borderBottom: '2px solid #e2e8f0', fontWeight: '600', color: '#475569' };
const tdStyle = { padding: '12px 14px', borderBottom: '1px solid #f1f5f9', color: '#475569' };
const roleBadge = (role) => ({
    padding: '3px 10px', borderRadius: '9999px', fontSize: '11px', fontWeight: '600',
    background: role === 'ADMIN' ? '#ede9fe' : role === 'PROVIDER' ? '#dbeafe' : '#f0fdf4',
    color: role === 'ADMIN' ? '#5b21b6' : role === 'PROVIDER' ? '#1e40af' : '#166534',
});

export default UserManagement;
```

---

# TASK 4: BOOKING MANAGEMENT (ADMIN VIEW)

## 4.1 Overview
Admin can view all bookings system-wide, override status, manually assign providers, and view an audit trail of changes.

## 4.2 Backend Implementation

### Step 1: Create Admin Booking DTOs
```java
// Create file: backend/src/main/java/com/hirelink/dto/AdminBookingDTO.java

package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

public class AdminBookingDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class AdminBookingListItem {
        private Long id;
        private String bookingNumber;
        private String customerName;
        private String customerEmail;
        private String providerName;
        private String serviceName;
        private String status;
        private LocalDate scheduledDate;
        private LocalTime scheduledTime;
        private BigDecimal totalAmount;
        private String city;
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class OverrideStatusRequest {
        private String status;       // PENDING, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED
        private String adminNote;    // reason for the override
    }

    @Data @NoArgsConstructor @AllArgsConstructor
    public static class AssignProviderRequest {
        private Long providerId;
    }
}
```

### Step 2: Create Booking Audit Entity
```java
// Create file: backend/src/main/java/com/hirelink/entity/BookingAudit.java

package com.hirelink.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "booking_audit")
@Data
public class BookingAudit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "booking_id", nullable = false)
    private Long bookingId;

    @Column(name = "action", nullable = false)
    private String action;              // STATUS_CHANGE, PROVIDER_ASSIGNED, etc.

    @Column(name = "old_value")
    private String oldValue;

    @Column(name = "new_value")
    private String newValue;

    @Column(name = "performed_by")
    private String performedBy;         // admin email

    @Column(name = "note")
    private String note;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
```

### Step 3: Create Audit Repository
```java
// Create file: backend/src/main/java/com/hirelink/repository/BookingAuditRepository.java

package com.hirelink.repository;

import com.hirelink.entity.BookingAudit;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface BookingAuditRepository extends JpaRepository<BookingAudit, Long> {
    List<BookingAudit> findByBookingIdOrderByCreatedAtDesc(Long bookingId);
}
```

### Step 4: Create Admin Booking Service
```java
// Create file: backend/src/main/java/com/hirelink/service/AdminBookingService.java

package com.hirelink.service;

import com.hirelink.dto.AdminBookingDTO.*;
import com.hirelink.entity.Booking;
import com.hirelink.entity.BookingAudit;
import com.hirelink.entity.User;
import com.hirelink.repository.BookingAuditRepository;
import com.hirelink.repository.BookingRepository;
import com.hirelink.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminBookingService {

    private final BookingRepository bookingRepository;
    private final BookingAuditRepository auditRepository;
    private final UserRepository userRepository;

    public List<AdminBookingListItem> getAllBookings() {
        return bookingRepository.findAll().stream()
            .map(this::toListItem)
            .collect(Collectors.toList());
    }

    @Transactional
    public void overrideStatus(Long bookingId, OverrideStatusRequest req, String adminEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));

        String oldStatus = booking.getStatus().name();
        booking.setStatus(Booking.BookingStatus.valueOf(req.getStatus()));
        bookingRepository.save(booking);

        // Write audit trail
        BookingAudit audit = new BookingAudit();
        audit.setBookingId(bookingId);
        audit.setAction("STATUS_OVERRIDE");
        audit.setOldValue(oldStatus);
        audit.setNewValue(req.getStatus());
        audit.setPerformedBy(adminEmail);
        audit.setNote(req.getAdminNote());
        auditRepository.save(audit);
    }

    @Transactional
    public void assignProvider(Long bookingId, AssignProviderRequest req, String adminEmail) {
        Booking booking = bookingRepository.findById(bookingId)
            .orElseThrow(() -> new RuntimeException("Booking not found"));
        User provider = userRepository.findById(req.getProviderId())
            .orElseThrow(() -> new RuntimeException("Provider not found"));

        String oldProvider = booking.getProvider() != null ? booking.getProvider().getName() : "None";
        booking.setProvider(provider);
        bookingRepository.save(booking);

        BookingAudit audit = new BookingAudit();
        audit.setBookingId(bookingId);
        audit.setAction("PROVIDER_ASSIGNED");
        audit.setOldValue(oldProvider);
        audit.setNewValue(provider.getName());
        audit.setPerformedBy(adminEmail);
        auditRepository.save(audit);
    }

    public List<BookingAudit> getAuditTrail(Long bookingId) {
        return auditRepository.findByBookingIdOrderByCreatedAtDesc(bookingId);
    }

    private AdminBookingListItem toListItem(Booking b) {
        return AdminBookingListItem.builder()
            .id(b.getId())
            .bookingNumber(b.getBookingNumber())
            .customerName(b.getCustomer() != null ? b.getCustomer().getName() : "N/A")
            .customerEmail(b.getCustomer() != null ? b.getCustomer().getEmail() : "N/A")
            .providerName(b.getProvider() != null ? b.getProvider().getName() : "Unassigned")
            .serviceName(b.getService() != null ? b.getService().getName() : "N/A")
            .status(b.getStatus().name())
            .scheduledDate(b.getScheduledDate())
            .scheduledTime(b.getScheduledTime())
            .totalAmount(b.getTotalAmount())
            .city(b.getCity())
            .build();
    }
}
```

### Step 5: Create Admin Booking Controller
```java
// Create file: backend/src/main/java/com/hirelink/controller/AdminBookingController.java

package com.hirelink.controller;

import com.hirelink.dto.AdminBookingDTO.*;
import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.BookingAudit;
import com.hirelink.service.AdminBookingService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/bookings")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminBookingController {

    private final AdminBookingService adminBookingService;

    /** GET /api/admin/bookings */
    @GetMapping
    public ResponseEntity<ApiResponse<List<AdminBookingListItem>>> getAll() {
        return ResponseEntity.ok(ApiResponse.success(adminBookingService.getAllBookings()));
    }

    /** PATCH /api/admin/bookings/{id}/status */
    @PatchMapping("/{id}/status")
    public ResponseEntity<ApiResponse<String>> overrideStatus(
            @PathVariable Long id,
            @RequestBody OverrideStatusRequest request,
            HttpServletRequest httpReq) {
        String adminEmail = (String) httpReq.getAttribute("userEmail");
        adminBookingService.overrideStatus(id, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Status overridden"));
    }

    /** PATCH /api/admin/bookings/{id}/assign */
    @PatchMapping("/{id}/assign")
    public ResponseEntity<ApiResponse<String>> assignProvider(
            @PathVariable Long id,
            @RequestBody AssignProviderRequest request,
            HttpServletRequest httpReq) {
        String adminEmail = (String) httpReq.getAttribute("userEmail");
        adminBookingService.assignProvider(id, request, adminEmail);
        return ResponseEntity.ok(ApiResponse.success("Provider assigned"));
    }

    /** GET /api/admin/bookings/{id}/audit */
    @GetMapping("/{id}/audit")
    public ResponseEntity<ApiResponse<List<BookingAudit>>> getAudit(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.success(adminBookingService.getAuditTrail(id)));
    }
}
```

---

# TASK 5: SERVICE & CATEGORY MANAGEMENT

## 5.1 Overview
Admin can create, edit, and soft-delete service categories and individual services.

## 5.2 Backend Implementation

### Step 1: Create ServiceCategory Entity
```java
// Create file: backend/src/main/java/com/hirelink/entity/ServiceCategory.java

package com.hirelink.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "service_categories")
@Data
public class ServiceCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    private String description;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @Column(name = "display_order")
    private Integer displayOrder = 0;

    @OneToMany(mappedBy = "category")
    private List<ServiceEntity> services;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }
}
```

### Step 2: Update ServiceEntity (if not already present)
```java
// Ensure backend/src/main/java/com/hirelink/entity/ServiceEntity.java has:

@ManyToOne
@JoinColumn(name = "category_id")
private ServiceCategory category;

@Column(name = "base_price", nullable = false)
private BigDecimal basePrice;

@Column(name = "estimated_duration_minutes")
private Integer estimatedDurationMinutes;

@Column(name = "is_active", nullable = false)
private Boolean isActive = true;
```

### Step 3: Create Admin Service Controller
```java
// Create file: backend/src/main/java/com/hirelink/controller/AdminServiceController.java

package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.ServiceCategory;
import com.hirelink.entity.ServiceEntity;
import com.hirelink.repository.ServiceCategoryRepository;
import com.hirelink.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/admin/services")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminServiceController {

    private final ServiceRepository serviceRepository;
    private final ServiceCategoryRepository categoryRepository;

    // ---- Categories ----

    @GetMapping("/categories")
    public ResponseEntity<ApiResponse<List<ServiceCategory>>> getCategories() {
        return ResponseEntity.ok(ApiResponse.success(categoryRepository.findAll()));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<ServiceCategory>> createCategory(
            @RequestBody ServiceCategory category) {
        return ResponseEntity.ok(ApiResponse.success("Category created",
            categoryRepository.save(category)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<ServiceCategory>> updateCategory(
            @PathVariable Long id, @RequestBody ServiceCategory updated) {
        ServiceCategory cat = categoryRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Category not found"));
        if (updated.getName() != null) cat.setName(updated.getName());
        if (updated.getDescription() != null) cat.setDescription(updated.getDescription());
        if (updated.getDisplayOrder() != null) cat.setDisplayOrder(updated.getDisplayOrder());
        if (updated.getIsActive() != null) cat.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(ApiResponse.success("Category updated",
            categoryRepository.save(cat)));
    }

    // ---- Services ----

    @GetMapping
    public ResponseEntity<ApiResponse<List<ServiceEntity>>> getAllServices() {
        return ResponseEntity.ok(ApiResponse.success(serviceRepository.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceEntity>> createService(
            @RequestBody ServiceEntity service) {
        return ResponseEntity.ok(ApiResponse.success("Service created",
            serviceRepository.save(service)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceEntity>> updateService(
            @PathVariable Long id, @RequestBody ServiceEntity updated) {
        ServiceEntity svc = serviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Service not found"));
        if (updated.getName() != null) svc.setName(updated.getName());
        if (updated.getBasePrice() != null) svc.setBasePrice(updated.getBasePrice());
        if (updated.getEstimatedDurationMinutes() != null)
            svc.setEstimatedDurationMinutes(updated.getEstimatedDurationMinutes());
        if (updated.getIsActive() != null) svc.setIsActive(updated.getIsActive());
        return ResponseEntity.ok(ApiResponse.success("Service updated",
            serviceRepository.save(svc)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> softDeleteService(@PathVariable Long id) {
        ServiceEntity svc = serviceRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Service not found"));
        svc.setIsActive(false);
        serviceRepository.save(svc);
        return ResponseEntity.ok(ApiResponse.success("Service deactivated"));
    }
}
```

---

# TASK 6: PROVIDER VERIFICATION & APPROVAL

## 6.1 Overview
Providers who register must be approved by admin before they can accept bookings. Admin reviews profile, documents, and approves or rejects.

## 6.2 Backend Implementation

### Step 1: Add Provider Profile Fields to User
```java
// Modify: backend/src/main/java/com/hirelink/entity/User.java
// ADD these fields for provider profiles

@Column(name = "business_name")
private String businessName;

@Column(name = "experience_years")
private Integer experienceYears;

@Column(name = "service_description", length = 1000)
private String serviceDescription;

@Column(name = "approval_status")
@Enumerated(EnumType.STRING)
private ApprovalStatus approvalStatus;

@Column(name = "rejection_reason")
private String rejectionReason;

public enum ApprovalStatus {
    PENDING,
    APPROVED,
    REJECTED
}
```

### Step 2: Add Repository Methods
```java
// Add to: UserRepository.java

List<User> findByRoleAndApprovalStatus(User.Role role, User.ApprovalStatus status);
```

### Step 3: Create Provider Approval Service
```java
// Create file: backend/src/main/java/com/hirelink/service/ProviderApprovalService.java

package com.hirelink.service;

import com.hirelink.entity.User;
import com.hirelink.repository.UserRepository;
import com.hirelink.service.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProviderApprovalService {

    private final UserRepository userRepository;
    private final EmailService emailService;

    public List<User> getPendingProviders() {
        return userRepository.findByRoleAndApprovalStatus(
            User.Role.PROVIDER, User.ApprovalStatus.PENDING);
    }

    @Transactional
    public void approveProvider(Long id) {
        User provider = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        provider.setApprovalStatus(User.ApprovalStatus.APPROVED);
        provider.setIsVerified(true);
        userRepository.save(provider);

        // Notify provider via email
        emailService.sendOtpEmail(provider.getEmail(),
            "Congratulations! Your HireLink provider account has been approved.");
    }

    @Transactional
    public void rejectProvider(Long id, String reason) {
        User provider = userRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        provider.setApprovalStatus(User.ApprovalStatus.REJECTED);
        provider.setRejectionReason(reason);
        userRepository.save(provider);

        emailService.sendOtpEmail(provider.getEmail(),
            "Your HireLink provider application was not approved. Reason: " + reason);
    }
}
```

### Step 4: Create Provider Approval Controller
```java
// Create file: backend/src/main/java/com/hirelink/controller/AdminProviderController.java

package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.User;
import com.hirelink.service.ProviderApprovalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/providers")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminProviderController {

    private final ProviderApprovalService approvalService;

    /** GET /api/admin/providers/pending */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<User>>> getPending() {
        return ResponseEntity.ok(ApiResponse.success(approvalService.getPendingProviders()));
    }

    /** POST /api/admin/providers/{id}/approve */
    @PostMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<String>> approve(@PathVariable Long id) {
        approvalService.approveProvider(id);
        return ResponseEntity.ok(ApiResponse.success("Provider approved"));
    }

    /** POST /api/admin/providers/{id}/reject */
    @PostMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<String>> reject(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        approvalService.rejectProvider(id, body.get("reason"));
        return ResponseEntity.ok(ApiResponse.success("Provider rejected"));
    }
}
```

---

# TASK 7: REPORTS & ANALYTICS

## 7.1 Overview
Admin can generate reports: bookings by date range, revenue breakdown, top services, top providers.

## 7.2 Backend Implementation

### Step 1: Create Report DTOs
```java
// Create file: backend/src/main/java/com/hirelink/dto/ReportDTO.java

package com.hirelink.dto;

import lombok.*;
import java.math.BigDecimal;
import java.util.List;

public class ReportDTO {

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class RevenueReport {
        private BigDecimal totalRevenue;
        private BigDecimal averageBookingValue;
        private long totalCompletedBookings;
        private List<ServiceRevenue> revenueByService;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class ServiceRevenue {
        private String serviceName;
        private long bookingCount;
        private BigDecimal revenue;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class TopProvider {
        private Long providerId;
        private String providerName;
        private long completedBookings;
        private BigDecimal totalEarnings;
        private double averageRating;
    }

    @Data @Builder @NoArgsConstructor @AllArgsConstructor
    public static class BookingSummaryReport {
        private String period;             // "2026-01" or "2026-W03"
        private long totalBookings;
        private long completed;
        private long cancelled;
        private BigDecimal revenue;
    }
}
```

### Step 2: Add Report Repository Queries
```java
// Add to: BookingRepository.java

@Query("SELECT b.service.name, COUNT(b), SUM(b.totalAmount) " +
       "FROM Booking b " +
       "WHERE b.status = 'COMPLETED' " +
       "AND b.completedDate BETWEEN :from AND :to " +
       "GROUP BY b.service.name " +
       "ORDER BY SUM(b.totalAmount) DESC")
List<Object[]> revenueByService(@Param("from") LocalDate from, @Param("to") LocalDate to);

@Query("SELECT b.provider.id, b.provider.name, COUNT(b), SUM(b.totalAmount) " +
       "FROM Booking b " +
       "WHERE b.status = 'COMPLETED' " +
       "GROUP BY b.provider.id, b.provider.name " +
       "ORDER BY COUNT(b) DESC")
List<Object[]> topProviders();
```

### Step 3: Create Report Controller
```java
// Create file: backend/src/main/java/com/hirelink/controller/AdminReportController.java

package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.dto.ReportDTO.*;
import com.hirelink.repository.BookingRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reports")
@CrossOrigin(origins = "*")
@RequiredArgsConstructor
public class AdminReportController {

    private final BookingRepository bookingRepository;

    /** GET /api/admin/reports/revenue?from=2026-01-01&to=2026-03-01 */
    @GetMapping("/revenue")
    public ResponseEntity<ApiResponse<RevenueReport>> getRevenueReport(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to) {

        List<Object[]> raw = bookingRepository.revenueByService(from, to);

        BigDecimal total = BigDecimal.ZERO;
        long count = 0;
        List<ServiceRevenue> breakdown = raw.stream().map(r -> {
            return ServiceRevenue.builder()
                .serviceName((String) r[0])
                .bookingCount((Long) r[1])
                .revenue((BigDecimal) r[2])
                .build();
        }).collect(Collectors.toList());

        for (ServiceRevenue sr : breakdown) {
            total = total.add(sr.getRevenue());
            count += sr.getBookingCount();
        }

        BigDecimal avg = count > 0
            ? total.divide(BigDecimal.valueOf(count), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        return ResponseEntity.ok(ApiResponse.success(RevenueReport.builder()
            .totalRevenue(total)
            .averageBookingValue(avg)
            .totalCompletedBookings(count)
            .revenueByService(breakdown)
            .build()));
    }

    /** GET /api/admin/reports/top-providers */
    @GetMapping("/top-providers")
    public ResponseEntity<ApiResponse<List<TopProvider>>> getTopProviders() {
        List<Object[]> raw = bookingRepository.topProviders();
        List<TopProvider> providers = raw.stream()
            .limit(10)
            .map(r -> TopProvider.builder()
                .providerId((Long) r[0])
                .providerName((String) r[1])
                .completedBookings((Long) r[2])
                .totalEarnings((BigDecimal) r[3])
                .build())
            .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(providers));
    }
}
```

---

# TASK 8: ADMIN FRONTEND LAYOUT & ROUTING

## 8.1 Overview
Create a sidebar-based admin layout with React Router navigation across all admin pages.

## 8.2 Install React Router (if not already installed)
```bash
cd frontend
npm install react-router-dom
```

## 8.3 Create Admin Layout Component
```jsx
// Create file: frontend/src/layouts/AdminLayout.jsx

import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const navItems = [
    { to: '/admin',           label: '📊 Dashboard',    exact: true },
    { to: '/admin/users',     label: '👥 Users' },
    { to: '/admin/bookings',  label: '📋 Bookings' },
    { to: '/admin/services',  label: '🛠️ Services' },
    { to: '/admin/providers', label: '✅ Provider Approvals' },
    { to: '/admin/reports',   label: '📈 Reports' },
];

const AdminLayout = () => {
    const { user, logout } = useAuth();

    return (
        <div style={al.wrapper}>
            {/* Sidebar */}
            <aside style={al.sidebar}>
                <div style={al.brand}>
                    <h2 style={al.brandText}>HireLink</h2>
                    <span style={al.brandSub}>Admin Panel</span>
                </div>

                <nav style={al.nav}>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            end={item.exact}
                            style={({ isActive }) => ({
                                ...al.navLink,
                                ...(isActive ? al.navLinkActive : {}),
                            })}
                        >
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                <div style={al.userSection}>
                    <p style={al.userName}>{user?.name}</p>
                    <p style={al.userEmail}>{user?.email}</p>
                    <button onClick={logout} style={al.logoutBtn}>Logout</button>
                </div>
            </aside>

            {/* Main Content */}
            <main style={al.main}>
                <Outlet />
            </main>
        </div>
    );
};

const al = {
    wrapper: { display: 'flex', minHeight: '100vh' },
    sidebar: {
        width: '260px', background: '#1e293b', color: '#fff',
        display: 'flex', flexDirection: 'column', flexShrink: 0,
    },
    brand: { padding: '24px 20px', borderBottom: '1px solid #334155' },
    brandText: { margin: 0, fontSize: '1.4rem' },
    brandSub: { fontSize: '0.8rem', color: '#94a3b8' },
    nav: { flex: 1, padding: '16px 0' },
    navLink: {
        display: 'block', padding: '12px 20px', color: '#94a3b8',
        textDecoration: 'none', fontSize: '0.9rem', transition: 'all 0.2s',
    },
    navLinkActive: {
        color: '#fff', background: '#334155', borderLeft: '3px solid #3b82f6',
    },
    userSection: {
        padding: '20px', borderTop: '1px solid #334155',
    },
    userName: { fontWeight: '600', margin: '0 0 4px 0' },
    userEmail: { fontSize: '0.8rem', color: '#94a3b8', margin: '0 0 12px 0' },
    logoutBtn: {
        width: '100%', padding: '10px', background: '#ef4444', color: '#fff',
        border: 'none', borderRadius: '6px', cursor: 'pointer',
    },
    main: { flex: 1, background: '#f8fafc', overflowY: 'auto' },
};

export default AdminLayout;
```

## 8.4 Update App Router
```jsx
// Modify: frontend/src/App.jsx (or create a dedicated Router file)

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute';
import AdminLayout from './layouts/AdminLayout';
import Dashboard from './pages/admin/Dashboard';
import UserManagement from './pages/admin/UserManagement';
import BookingManagement from './pages/admin/BookingManagement';
import ServiceManagement from './pages/admin/ServiceManagement';
import ProviderApprovals from './pages/admin/ProviderApprovals';
import Reports from './pages/admin/Reports';
import Login from './components/Login';

// Inside your JSX:
<BrowserRouter>
    <Routes>
        <Route path="/login" element={<Login />} />

        {/* Public routes (existing) */}
        <Route path="/" element={/* existing homepage */} />

        {/* Admin routes – all protected */}
        <Route
            path="/admin"
            element={
                <AdminRoute>
                    <AdminLayout />
                </AdminRoute>
            }
        >
            <Route index element={<Dashboard />} />
            <Route path="users" element={<UserManagement />} />
            <Route path="bookings" element={<BookingManagement />} />
            <Route path="services" element={<ServiceManagement />} />
            <Route path="providers" element={<ProviderApprovals />} />
            <Route path="reports" element={<Reports />} />
        </Route>
    </Routes>
</BrowserRouter>
```

---

# ADMIN API REFERENCE

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/admin/dashboard/stats` | Dashboard metrics |
| `GET` | `/api/admin/users` | List users (optional `?role=` `?search=`) |
| `GET` | `/api/admin/users/{id}` | User detail |
| `PUT` | `/api/admin/users/{id}` | Update user |
| `POST` | `/api/admin/users/{id}/ban` | Ban user |
| `POST` | `/api/admin/users/{id}/unban` | Unban user |
| `GET` | `/api/admin/bookings` | List all bookings |
| `PATCH` | `/api/admin/bookings/{id}/status` | Override booking status |
| `PATCH` | `/api/admin/bookings/{id}/assign` | Assign provider |
| `GET` | `/api/admin/bookings/{id}/audit` | Booking audit trail |
| `GET` | `/api/admin/services` | List services |
| `POST` | `/api/admin/services` | Create service |
| `PUT` | `/api/admin/services/{id}` | Update service |
| `DELETE` | `/api/admin/services/{id}` | Soft-delete service |
| `GET` | `/api/admin/services/categories` | List categories |
| `POST` | `/api/admin/services/categories` | Create category |
| `PUT` | `/api/admin/services/categories/{id}` | Update category |
| `GET` | `/api/admin/providers/pending` | Pending provider approvals |
| `POST` | `/api/admin/providers/{id}/approve` | Approve provider |
| `POST` | `/api/admin/providers/{id}/reject` | Reject provider |
| `GET` | `/api/admin/reports/revenue?from=&to=` | Revenue report |
| `GET` | `/api/admin/reports/top-providers` | Top providers |

---

# IMPLEMENTATION ORDER

## Phase 1: Foundation (Do First)
1. Add Role enum and fields to User entity
2. Embed role in JWT claims
3. Create AdminAuthFilter
4. Seed default admin user
5. Update AuthResponse and frontend AuthContext

## Phase 2: Dashboard
1. Create DashboardDTO and repository queries
2. Build AdminDashboardService and controller
3. Build frontend Dashboard page

## Phase 3: User Management
1. Add management fields to User entity
2. Create AdminUserService + Controller
3. Build frontend UserManagement page

## Phase 4: Booking Management
1. Create BookingAudit entity + repository
2. Create AdminBookingService + Controller
3. Build frontend BookingManagement page

## Phase 5: Service & Category Management
1. Create ServiceCategory entity + repository
2. Build AdminServiceController
3. Build frontend ServiceManagement page

## Phase 6: Provider Approvals
1. Add approval fields to User entity
2. Create ProviderApprovalService + Controller
3. Build frontend ProviderApprovals page

## Phase 7: Reports
1. Add report repository queries
2. Create AdminReportController
3. Build frontend Reports page with date filters

## Phase 8: Layout & Routing
1. Install react-router-dom
2. Create AdminLayout with sidebar
3. Create AdminRoute guard
4. Wire all routes together
5. Test full navigation flow

---

# NEW DATABASE TABLES CREATED

| Table | Purpose |
|-------|---------|
| `otp_verifications` | Already exists from Task 1 |
| `booking_audit` | Tracks admin actions on bookings |
| `service_categories` | Groups services into categories |

# MODIFIED TABLES

| Table | New Columns |
|-------|-------------|
| `users` | `role`, `is_active`, `banned_reason`, `business_name`, `experience_years`, `service_description`, `approval_status`, `rejection_reason`, `created_at`, `updated_at` |
| `bookings` | (no new columns — uses existing `status`, `provider`, etc.) |
| `services` | `category_id`, `base_price`, `estimated_duration_minutes`, `is_active` |

---

# TESTING CHECKLIST

- [ ] Admin login works and token includes ADMIN role
- [ ] Non-admin users get 403 on /api/admin/** endpoints
- [ ] Dashboard stats load and display correctly
- [ ] User search, filter by role, ban/unban all work
- [ ] Booking status override writes audit trail
- [ ] Provider assign writes audit trail
- [ ] Audit trail displays chronologically per booking
- [ ] Service CRUD and soft-delete work
- [ ] Category CRUD works
- [ ] Pending provider list shows only PENDING
- [ ] Approve/reject sends email notification
- [ ] Revenue report filters by date range correctly
- [ ] Top providers report returns correct ordering
- [ ] Sidebar navigation works across all admin pages
- [ ] AdminRoute redirects non-admin users to home
- [ ] Mobile responsive layout for admin panel
- [ ] All existing user-facing features still work

---

# NOTES FOR CURSOR / CLAUDE OPUS

1. **All admin endpoints are under `/api/admin/**`** — this keeps them cleanly separated and easy to secure with a single filter
2. **Work incrementally** — implement one task at a time and test before moving on
3. **Run migrations** — after adding new entity fields, restart Spring Boot so Hibernate updates the schema (`ddl-auto=update`)
4. **Preserve existing code** — never remove or break user-facing features
5. **Follow existing patterns** — match the `ApiResponse` wrapper, naming conventions, and style objects already in use
6. **Add proper error handling** — every service method should throw meaningful exceptions; controllers should return proper HTTP status codes
7. **Keep it beginner-friendly** — add comments explaining each annotation and pattern

---

*Generated for HireLink Academic Project — Admin Module*
