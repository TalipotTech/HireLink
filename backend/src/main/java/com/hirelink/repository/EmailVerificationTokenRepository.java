package com.hirelink.repository;

import com.hirelink.entity.EmailVerificationToken;
import com.hirelink.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, Long> {

    Optional<EmailVerificationToken> findByTokenAndIsUsedFalse(String token);

    Optional<EmailVerificationToken> findByToken(String token);

    @Modifying
    void deleteByUser(User user);
}
