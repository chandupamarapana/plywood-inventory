package com.plywood.inventory.repository;

import com.plywood.inventory.model.Borrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BorrowRepository extends JpaRepository<Borrow, Long> {
    List<Borrow> findByItemIdAndCompanyId(Long itemId, Long companyId);
    List<Borrow> findByItemIdAndDateInIsNullAndCompanyId(Long itemId, Long companyId);
    List<Borrow> findByDateInIsNullAndCompanyId(Long companyId);
    void deleteByItemId(Long itemId);
}