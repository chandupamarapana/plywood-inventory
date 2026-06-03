package com.plywood.inventory.repository;

import com.plywood.inventory.model.Borrow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BorrowRepository extends JpaRepository<Borrow, Long> {
    List<Borrow> findByItemId(Long itemId);
    List<Borrow> findByItemIdAndDateInIsNull(Long itemId);
    List<Borrow> findByDateInIsNull();
}