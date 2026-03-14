package com.hirelink.repository;

import com.hirelink.entity.PasswordResetToken;
import com.hirelink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    Optional<PasswordResetToken> findByTokenAndIsUsedFalse(String token);

    @Modifying
    void deleteByUser(User user);
}
