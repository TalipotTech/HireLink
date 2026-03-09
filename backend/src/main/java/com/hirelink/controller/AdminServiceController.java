package com.hirelink.controller;

import com.hirelink.dto.ApiResponse;
import com.hirelink.entity.ServiceCategory;
import com.hirelink.entity.Service;
import com.hirelink.repository.ServiceCategoryRepository;
import com.hirelink.repository.ServiceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/services")
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
        if (updated.getCategoryName() != null) cat.setCategoryName(updated.getCategoryName());
        if (updated.getCategoryDescription() != null) cat.setCategoryDescription(updated.getCategoryDescription());
        if (updated.getDisplayOrder() != null) cat.setDisplayOrder(updated.getDisplayOrder());
        if (updated.getIsActive() != null) cat.setIsActive(updated.getIsActive());
        if (updated.getIsFeatured() != null) cat.setIsFeatured(updated.getIsFeatured());
        return ResponseEntity.ok(ApiResponse.success("Category updated",
                categoryRepository.save(cat)));
    }

    // ---- Services ----

    @GetMapping
    public ResponseEntity<ApiResponse<List<Service>>> getAllServices() {
        return ResponseEntity.ok(ApiResponse.success(serviceRepository.findAll()));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Service>> createService(@RequestBody Service service) {
        return ResponseEntity.ok(ApiResponse.success("Service created",
                serviceRepository.save(service)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Service>> updateService(
            @PathVariable Long id, @RequestBody Service updated) {
        Service svc = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        if (updated.getServiceName() != null) svc.setServiceName(updated.getServiceName());
        if (updated.getServiceDescription() != null) svc.setServiceDescription(updated.getServiceDescription());
        if (updated.getBasePrice() != null) svc.setBasePrice(updated.getBasePrice());
        if (updated.getEstimatedDurationMinutes() != null)
            svc.setEstimatedDurationMinutes(updated.getEstimatedDurationMinutes());
        if (updated.getIsActive() != null) svc.setIsActive(updated.getIsActive());
        if (updated.getIsFeatured() != null) svc.setIsFeatured(updated.getIsFeatured());
        return ResponseEntity.ok(ApiResponse.success("Service updated",
                serviceRepository.save(svc)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> softDeleteService(@PathVariable Long id) {
        Service svc = serviceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Service not found"));
        svc.setIsActive(false);
        serviceRepository.save(svc);
        return ResponseEntity.ok(ApiResponse.success("Service deactivated"));
    }
}
