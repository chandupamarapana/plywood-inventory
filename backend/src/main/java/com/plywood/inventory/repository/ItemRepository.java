package com.plywood.inventory.repository;

import com.plywood.inventory.model.Item;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ItemRepository extends JpaRepository<Item, Long> {
    List<Item> findByCategoryIdAndCompanyId(Long categoryId, Long companyId);
    List<Item> findByCompanyId(Long companyId);
}