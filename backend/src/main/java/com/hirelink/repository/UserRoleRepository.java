package com.hirelink.repository;

import com.hirelink.entity.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, Long> {

    List<UserRole> findByUserUserId(Long userId);

    boolean existsByUserUserIdAndRole(Long userId, String role);
}
