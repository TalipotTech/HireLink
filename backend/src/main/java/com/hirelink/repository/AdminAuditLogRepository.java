package com.hirelink.repository;

import com.hirelink.entity.AdminAuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    List<AdminAuditLog> findByTargetTypeAndTargetIdOrderByPerformedAtDesc(String targetType, Long targetId);

    Page<AdminAuditLog> findByAdminUserIdOrderByPerformedAtDesc(Long adminUserId, Pageable pageable);

    Page<AdminAuditLog> findAllByOrderByPerformedAtDesc(Pageable pageable);
}
