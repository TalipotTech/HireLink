package com.hirelink.service;

import com.hirelink.entity.AdminAuditLog;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.entity.ServiceProvider.KycStatus;
import com.hirelink.repository.AdminAuditLogRepository;
import com.hirelink.repository.ServiceProviderRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AdminProviderService {

    private final ServiceProviderRepository providerRepository;
    private final AdminAuditLogRepository auditLogRepository;

    public List<ServiceProvider> getPendingProviders() {
        return providerRepository.findByKycStatus(KycStatus.PENDING);
    }

    public List<ServiceProvider> getAllProviders() {
        return providerRepository.findAllWithUser();
    }

    @Transactional
    public void approveProvider(Long providerId, Long adminUserId) {
        ServiceProvider provider = providerRepository.findByIdWithDetails(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        provider.setKycStatus(KycStatus.VERIFIED);
        provider.setKycVerifiedAt(LocalDateTime.now());
        providerRepository.save(provider);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("KYC_APPROVED")
                .actionDescription("Approved KYC for provider: " + provider.getBusinessName())
                .targetType("PROVIDER")
                .targetId(providerId)
                .build());
    }

    @Transactional
    public void rejectProvider(Long providerId, String reason, Long adminUserId) {
        ServiceProvider provider = providerRepository.findByIdWithDetails(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        provider.setKycStatus(KycStatus.REJECTED);
        provider.setKycRejectionReason(reason);
        providerRepository.save(provider);

        auditLogRepository.save(AdminAuditLog.builder()
                .adminUserId(adminUserId)
                .actionType("KYC_REJECTED")
                .actionDescription("Rejected KYC for provider: " + provider.getBusinessName() + " - Reason: " + reason)
                .targetType("PROVIDER")
                .targetId(providerId)
                .build());
    }
}
