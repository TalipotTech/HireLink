package com.hirelink.controller;

import com.hirelink.dto.AdminServiceDTO.*;
import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.Service;
import com.hirelink.entity.ServiceCategory;
import com.hirelink.entity.ServiceProvider;
import com.hirelink.repository.ServiceCategoryRepository;
import com.hirelink.repository.ServiceProviderRepository;
import com.hirelink.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/services")
@RequiredArgsConstructor
public class AdminServiceController {

    private final ServiceRepository serviceRepository;
    private final ServiceCategoryRepository categoryRepository;
    private final ServiceProviderRepository providerRepository;

    // ---- Categories ----

    @GetMapping("/categories")
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<CategoryItem>>> getCategories() {
        List<CategoryItem> items = categoryRepository.findAll().stream()
                .map(this::toCategoryItem)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping("/categories")
    public ResponseEntity<ApiResponse<CategoryItem>> createCategory(
            @RequestBody CreateCategoryRequest request) {
        ServiceCategory cat = new ServiceCategory();
        cat.setCategoryName(request.getCategoryName());
        cat.setCategorySlug(request.getCategorySlug() != null
                ? request.getCategorySlug()
                : request.getCategoryName().toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", ""));
        cat.setCategoryDescription(request.getCategoryDescription());
        cat.setCategoryIcon(request.getCategoryIcon());
        cat.setCategoryImageUrl(request.getCategoryImageUrl());
        if (request.getDisplayOrder() != null) cat.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsFeatured() != null) cat.setIsFeatured(request.getIsFeatured());
        if (request.getMinBasePrice() != null) cat.setMinBasePrice(request.getMinBasePrice());
        if (request.getMaxBasePrice() != null) cat.setMaxBasePrice(request.getMaxBasePrice());
        if (request.getPriceUnit() != null) cat.setPriceUnit(ServiceCategory.PriceUnit.valueOf(request.getPriceUnit()));

        if (request.getParentCategoryId() != null) {
            categoryRepository.findById(request.getParentCategoryId())
                    .ifPresent(parent -> {
                        cat.setParentCategory(parent);
                        cat.setCategoryLevel(parent.getCategoryLevel() + 1);
                    });
        }

        ServiceCategory saved = categoryRepository.save(cat);
        return ResponseEntity.ok(ApiResponse.success("Category created", toCategoryItem(saved)));
    }

    @PutMapping("/categories/{id}")
    public ResponseEntity<ApiResponse<CategoryItem>> updateCategory(
            @PathVariable Long id, @RequestBody CreateCategoryRequest request) {
        ServiceCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        if (request.getCategoryName() != null) cat.setCategoryName(request.getCategoryName());
        if (request.getCategoryDescription() != null) cat.setCategoryDescription(request.getCategoryDescription());
        if (request.getDisplayOrder() != null) cat.setDisplayOrder(request.getDisplayOrder());
        if (request.getIsFeatured() != null) cat.setIsFeatured(request.getIsFeatured());
        if (request.getCategoryIcon() != null) cat.setCategoryIcon(request.getCategoryIcon());
        if (request.getMinBasePrice() != null) cat.setMinBasePrice(request.getMinBasePrice());
        if (request.getMaxBasePrice() != null) cat.setMaxBasePrice(request.getMaxBasePrice());
        ServiceCategory saved = categoryRepository.save(cat);
        return ResponseEntity.ok(ApiResponse.success("Category updated", toCategoryItem(saved)));
    }

    @PutMapping("/categories/{id}/toggle-active")
    public ResponseEntity<ApiResponse<CategoryItem>> toggleCategoryActive(@PathVariable Long id) {
        ServiceCategory cat = categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found"));
        cat.setIsActive(!cat.getIsActive());
        ServiceCategory saved = categoryRepository.save(cat);
        return ResponseEntity.ok(ApiResponse.success(
                cat.getIsActive() ? "Category activated" : "Category deactivated",
                toCategoryItem(saved)));
    }

    // ---- Services ----

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<ApiResponse<List<ServiceItem>>> getAllServices() {
        List<ServiceItem> items = serviceRepository.findAll().stream()
                .map(this::toServiceItem)
                .collect(Collectors.toList());
        return ResponseEntity.ok(ApiResponse.success(items));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ServiceItem>> createService(
            @RequestBody CreateServiceRequest request) {
        Service svc = new Service();
        svc.setServiceName(request.getServiceName());
        svc.setServiceDescription(request.getServiceDescription());
        svc.setBasePrice(request.getBasePrice());
        if (request.getPriceType() != null) svc.setPriceType(Service.PriceType.valueOf(request.getPriceType()));
        if (request.getEstimatedDurationMinutes() != null) svc.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        if (request.getIsFeatured() != null) svc.setIsFeatured(request.getIsFeatured());

        if (request.getCategoryId() != null) {
            ServiceCategory cat = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Category not found"));
            svc.setCategory(cat);
        }
        if (request.getProviderId() != null) {
            ServiceProvider provider = providerRepository.findById(request.getProviderId())
                    .orElseThrow(() -> new RuntimeException("Provider not found"));
            svc.setProvider(provider);
        }

        Service saved = serviceRepository.save(svc);
        return ResponseEntity.ok(ApiResponse.success("Service created", toServiceItem(saved)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ServiceItem>> updateService(
            @PathVariable Long id, @RequestBody CreateServiceRequest request) {
        Service svc = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        if (request.getServiceName() != null) svc.setServiceName(request.getServiceName());
        if (request.getServiceDescription() != null) svc.setServiceDescription(request.getServiceDescription());
        if (request.getBasePrice() != null) svc.setBasePrice(request.getBasePrice());
        if (request.getEstimatedDurationMinutes() != null) svc.setEstimatedDurationMinutes(request.getEstimatedDurationMinutes());
        if (request.getIsFeatured() != null) svc.setIsFeatured(request.getIsFeatured());
        Service saved = serviceRepository.save(svc);
        return ResponseEntity.ok(ApiResponse.success("Service updated", toServiceItem(saved)));
    }

    @PutMapping("/{id}/toggle-active")
    public ResponseEntity<ApiResponse<ServiceItem>> toggleServiceActive(@PathVariable Long id) {
        Service svc = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        svc.setIsActive(!svc.getIsActive());
        Service saved = serviceRepository.save(svc);
        return ResponseEntity.ok(ApiResponse.success(
                svc.getIsActive() ? "Service activated" : "Service deactivated",
                toServiceItem(saved)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> softDeleteService(@PathVariable Long id) {
        Service svc = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        svc.setIsActive(false);
        serviceRepository.save(svc);
        return ResponseEntity.ok(ApiResponse.success("Service deactivated"));
    }

    // ---- Mappers ----

    private CategoryItem toCategoryItem(ServiceCategory c) {
        return CategoryItem.builder()
                .categoryId(c.getCategoryId())
                .categoryName(c.getCategoryName())
                .categorySlug(c.getCategorySlug())
                .categoryDescription(c.getCategoryDescription())
                .categoryIcon(c.getCategoryIcon())
                .categoryImageUrl(c.getCategoryImageUrl())
                .parentCategoryId(c.getParentCategory() != null ? c.getParentCategory().getCategoryId() : null)
                .parentCategoryName(c.getParentCategory() != null ? c.getParentCategory().getCategoryName() : null)
                .categoryLevel(c.getCategoryLevel())
                .displayOrder(c.getDisplayOrder())
                .isActive(c.getIsActive())
                .isFeatured(c.getIsFeatured())
                .minBasePrice(c.getMinBasePrice())
                .maxBasePrice(c.getMaxBasePrice())
                .priceUnit(c.getPriceUnit() != null ? c.getPriceUnit().name() : null)
                .createdAt(c.getCreatedAt())
                .build();
    }

    private ServiceItem toServiceItem(Service s) {
        return ServiceItem.builder()
                .serviceId(s.getServiceId())
                .serviceName(s.getServiceName())
                .serviceDescription(s.getServiceDescription())
                .basePrice(s.getBasePrice())
                .priceType(s.getPriceType() != null ? s.getPriceType().name() : null)
                .estimatedDurationMinutes(s.getEstimatedDurationMinutes())
                .isActive(s.getIsActive())
                .isFeatured(s.getIsFeatured())
                .averageRating(s.getAverageRating())
                .totalReviews(s.getTotalReviews())
                .timesBooked(s.getTimesBooked())
                .categoryId(s.getCategory() != null ? s.getCategory().getCategoryId() : null)
                .categoryName(s.getCategory() != null ? s.getCategory().getCategoryName() : null)
                .providerId(s.getProvider() != null ? s.getProvider().getProviderId() : null)
                .providerBusinessName(s.getProvider() != null ? s.getProvider().getBusinessName() : null)
                .createdAt(s.getCreatedAt())
                .build();
    }
}
