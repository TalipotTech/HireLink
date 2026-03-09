package com.hirelink.repository;

import com.hirelink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByPhone(String phone);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByPhone(String phone);
    
    boolean existsByEmail(String email);
    
    Optional<User> findByPhoneAndDeletedAtIsNull(String phone);
    
    Optional<User> findByGoogleId(String googleId);

    // ========== Admin queries ==========

    long countByUserType(User.UserType userType);

    List<User> findByUserType(User.UserType userType);

    List<User> findByAccountStatus(User.AccountStatus accountStatus);

    @Query("SELECT u FROM User u " +
           "WHERE LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%')) " +
           "OR u.phone LIKE CONCAT('%', :keyword, '%')")
    List<User> searchUsers(@Param("keyword") String keyword);
}
