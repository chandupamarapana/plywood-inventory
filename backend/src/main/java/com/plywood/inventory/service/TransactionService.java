package com.plywood.inventory.service;

import com.plywood.inventory.model.Borrow;
import com.plywood.inventory.model.Item;
import com.plywood.inventory.model.Transaction;
import com.plywood.inventory.repository.BorrowRepository;
import com.plywood.inventory.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BorrowRepository borrowRepository;
    private final ItemService itemService;

    public TransactionService(TransactionRepository transactionRepository,
                              BorrowRepository borrowRepository,
                              ItemService itemService) {
        this.transactionRepository = transactionRepository;
        this.borrowRepository = borrowRepository;
        this.itemService = itemService;
    }

    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAllByOrderByDateDesc();
    }

    public List<Transaction> getTransactionsByItem(Long itemId) {
        return transactionRepository.findByItemId(itemId);
    }

    // Stock In — adds to stock
    public Transaction logStockIn(Long itemId, Integer quantity, String supplier,
                                  String note, String loggedBy) {
        Item item = itemService.getItemById(itemId);
        item.setStock(item.getStock() + quantity);
        itemService.updateStock(itemId, item.getStock());

        Transaction tx = new Transaction(item, "STOCK_IN", quantity,
                LocalDate.now(), supplier, note, null, loggedBy);
        return transactionRepository.save(tx);
    }

    // Consumption — reduces stock
    public Transaction logConsumption(Long itemId, Integer quantity,
                                      String note, String loggedBy) {
        Item item = itemService.getItemById(itemId);
        if (quantity > item.getStock()) {
            throw new RuntimeException("Not enough stock. Available: " + item.getStock());
        }
        itemService.updateStock(itemId, item.getStock() - quantity);

        Transaction tx = new Transaction(item, "CONSUMPTION", quantity,
                LocalDate.now(), null, note, null, loggedBy);
        return transactionRepository.save(tx);
    }

    // Borrow — reduces stock and creates borrow record
    public Transaction logBorrow(Long itemId, Integer quantity,
                                 String borrower, String loggedBy) {
        Item item = itemService.getItemById(itemId);
        if (quantity > item.getStock()) {
            throw new RuntimeException("Not enough stock. Available: " + item.getStock());
        }
        itemService.updateStock(itemId, item.getStock() - quantity);

        Transaction tx = new Transaction(item, "BORROW", quantity,
                LocalDate.now(), null, null, borrower, loggedBy);
        tx = transactionRepository.save(tx);

        Borrow borrow = new Borrow(item, tx, quantity, borrower, LocalDate.now());
        borrowRepository.save(borrow);

        return tx;
    }

    // Return — adds stock back and closes borrow record
    public Transaction logReturn(Long borrowId, String loggedBy) {
        Borrow borrow = borrowRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("Borrow record not found"));

        borrow.setDateIn(LocalDate.now());
        borrowRepository.save(borrow);

        Item item = borrow.getItem();
        itemService.updateStock(item.getId(), item.getStock() + borrow.getQuantity());

        Transaction tx = new Transaction(item, "RETURN", borrow.getQuantity(),
                LocalDate.now(), null, null, borrow.getBorrower(), loggedBy);
        return transactionRepository.save(tx);
    }

    // Active borrows — items still out on loan
    public List<Borrow> getActiveBorrows() {
        return borrowRepository.findByDateInIsNull();
    }

    public List<Borrow> getActiveBorrowsByItem(Long itemId) {
        return borrowRepository.findByItemIdAndDateInIsNull(itemId);
    }
}