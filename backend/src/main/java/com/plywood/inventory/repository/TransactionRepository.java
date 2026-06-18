package com.plywood.inventory.repository;

import com.plywood.inventory.model.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {
    List<Transaction> findByItemIdAndCompanyId(Long itemId, Long companyId);
    List<Transaction> findByCompanyIdOrderByDateDesc(Long companyId);
}