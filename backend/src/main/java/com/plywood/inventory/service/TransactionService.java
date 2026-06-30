package com.plywood.inventory.service;

import com.plywood.inventory.model.Borrow;
import com.plywood.inventory.model.Company;
import com.plywood.inventory.model.Item;
import com.plywood.inventory.model.Transaction;
import com.plywood.inventory.repository.BorrowRepository;
import com.plywood.inventory.repository.ItemRepository;
import com.plywood.inventory.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final BorrowRepository borrowRepository;
    private final ItemService itemService;
    private final ItemRepository itemRepository;
    private final UserService userService;

    public TransactionService(TransactionRepository transactionRepository,
                              BorrowRepository borrowRepository,
                              ItemService itemService,
                              ItemRepository itemRepository,
                              UserService userService) {
        this.transactionRepository = transactionRepository;
        this.borrowRepository = borrowRepository;
        this.itemService = itemService;
        this.itemRepository = itemRepository;
        this.userService = userService;
    }

    public List<Transaction> getAllTransactions() {
        Long companyId = userService.getCurrentCompany().getId();
        return transactionRepository.findByCompanyIdOrderByDateDesc(companyId);
    }

    public List<Transaction> getTransactionsByItem(Long itemId) {
        Long companyId = userService.getCurrentCompany().getId();
        return transactionRepository.findByItemIdAndCompanyId(itemId, companyId);
    }

    // Stock In — adds to stock
    public Transaction logStockIn(Long itemId, Integer quantity, String supplier,
                                  String note, String loggedBy) {
        Company company = userService.getCurrentCompany();
        Item item = itemService.getItemById(itemId);
        item.setStock(item.getStock() + quantity);
        itemService.updateStock(itemId, item.getStock());

        Transaction tx = new Transaction(item, company, "STOCK_IN", quantity,
                LocalDate.now(), supplier, note, null, loggedBy);
        return transactionRepository.save(tx);
    }

    // Consumption — reduces stock
    public Transaction logConsumption(Long itemId, Integer quantity,
                                      String note, String loggedBy) {
        Company company = userService.getCurrentCompany();
        Item item = itemService.getItemById(itemId);
        if (quantity > item.getStock()) {
            throw new RuntimeException("Not enough stock. Available: " + item.getStock());
        }
        itemService.updateStock(itemId, item.getStock() - quantity);

        Transaction tx = new Transaction(item, company, "CONSUMPTION", quantity,
                LocalDate.now(), null, note, null, loggedBy);
        return transactionRepository.save(tx);
    }

    // Borrow — reduces stock and creates borrow record
    public Transaction logBorrow(Long itemId, Integer quantity,
                                 String borrower, String loggedBy) {
        Company company = userService.getCurrentCompany();
        Item item = itemService.getItemById(itemId);
        if (quantity > item.getStock()) {
            throw new RuntimeException("Not enough stock. Available: " + item.getStock());
        }
        itemService.updateStock(itemId, item.getStock() - quantity);

        Transaction tx = new Transaction(item, company, "BORROW", quantity,
                LocalDate.now(), null, null, borrower, loggedBy);
        tx = transactionRepository.save(tx);

        Borrow borrow = new Borrow(item, tx, company, quantity, borrower, LocalDate.now());
        borrowRepository.save(borrow);

        return tx;
    }

    // Return — adds stock back and closes borrow record
    public Transaction logReturn(Long borrowId, String loggedBy) {
        Company company = userService.getCurrentCompany();
        Borrow borrow = borrowRepository.findById(borrowId)
                .orElseThrow(() -> new RuntimeException("Borrow record not found"));

        borrow.setDateIn(LocalDate.now());
        borrowRepository.save(borrow);

        Item item = borrow.getItem();
        itemService.updateStock(item.getId(), item.getStock() + borrow.getQuantity());

        Transaction tx = new Transaction(item, company, "RETURN", borrow.getQuantity(),
                LocalDate.now(), null, null, borrow.getBorrower(), loggedBy);
        return transactionRepository.save(tx);
    }

    // Active borrows — items still out on loan
    public List<Borrow> getActiveBorrows() {
        Long companyId = userService.getCurrentCompany().getId();
        return borrowRepository.findByDateInIsNullAndCompanyId(companyId);
    }

    public List<Borrow> getActiveBorrowsByItem(Long itemId) {
        Long companyId = userService.getCurrentCompany().getId();
        return borrowRepository.findByItemIdAndDateInIsNullAndCompanyId(itemId, companyId);
    }

    @Transactional
    public void deleteTransaction(Long id) {
        Transaction tx = transactionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Transaction not found"));

        Item item = tx.getItem();

        switch (tx.getType()) {
            case "STOCK_IN":
                item.setStock(item.getStock() - tx.getQuantity());
                break;
            case "CONSUMPTION":
                item.setStock(item.getStock() + tx.getQuantity());
                break;
            case "BORROW":
                // Restore stock and delete the Borrow row that references this transaction.
                // Closing it (setting dateIn) is not enough — the FK on borrows.transaction_id
                // prevents deleting the Transaction while a Borrow row still references it.
                item.setStock(item.getStock() + tx.getQuantity());
                borrowRepository.findByItemIdAndDateInIsNullAndCompanyId(item.getId(), tx.getCompany().getId())
                        .stream()
                        .filter(b -> b.getTransaction().getId().equals(id))
                        .forEach(borrowRepository::delete);
                break;
            case "RETURN":
                item.setStock(item.getStock() - tx.getQuantity());
                break;
        }

        itemRepository.save(item);
        transactionRepository.deleteById(id);
    }
}