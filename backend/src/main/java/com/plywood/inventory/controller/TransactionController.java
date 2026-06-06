package com.plywood.inventory.controller;

import com.plywood.inventory.model.Borrow;
import com.plywood.inventory.model.Transaction;
import com.plywood.inventory.service.TransactionService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionService.getAllTransactions();
    }

    @GetMapping("/item/{itemId}")
    public List<Transaction> getTransactionsByItem(@PathVariable Long itemId) {
        return transactionService.getTransactionsByItem(itemId);
    }

    @PostMapping("/stock-in/{itemId}")
    public ResponseEntity<Transaction> stockIn(@PathVariable Long itemId,
                                               @RequestBody Map<String, String> body) {
        Transaction tx = transactionService.logStockIn(
                itemId,
                Integer.parseInt(body.get("quantity")),
                body.get("supplier"),
                body.get("note"),
                body.get("loggedBy")
        );
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/consume/{itemId}")
    public ResponseEntity<Transaction> consume(@PathVariable Long itemId,
                                               @RequestBody Map<String, String> body) {
        Transaction tx = transactionService.logConsumption(
                itemId,
                Integer.parseInt(body.get("quantity")),
                body.get("note"),
                body.get("loggedBy")
        );
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/borrow/{itemId}")
    public ResponseEntity<Transaction> borrow(@PathVariable Long itemId,
                                              @RequestBody Map<String, String> body) {
        Transaction tx = transactionService.logBorrow(
                itemId,
                Integer.parseInt(body.get("quantity")),
                body.get("borrower"),
                body.get("loggedBy")
        );
        return ResponseEntity.ok(tx);
    }

    @PostMapping("/return/{borrowId}")
    public ResponseEntity<Transaction> returnItem(@PathVariable Long borrowId,
                                                  @RequestBody Map<String, String> body) {
        Transaction tx = transactionService.logReturn(
                borrowId,
                body.get("loggedBy")
        );
        return ResponseEntity.ok(tx);
    }

    @GetMapping("/borrows/active")
    public List<Borrow> getActiveBorrows() {
        return transactionService.getActiveBorrows();
    }

    @GetMapping("/borrows/active/{itemId}")
    public List<Borrow> getActiveBorrowsByItem(@PathVariable Long itemId) {
        return transactionService.getActiveBorrowsByItem(itemId);
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTransaction(@PathVariable Long id) {
        transactionService.deleteTransaction(id);
        return ResponseEntity.noContent().build();
    }
}