package com.plywood.inventory.repository;

import com.plywood.inventory.model.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByTypeAndCompanyId(String type, Long companyId);
    List<Category> findByCompanyId(Long companyId);
}