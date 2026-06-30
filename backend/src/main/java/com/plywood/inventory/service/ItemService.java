package com.plywood.inventory.service;

import com.plywood.inventory.model.Category;
import com.plywood.inventory.model.Company;
import com.plywood.inventory.model.Item;
import com.plywood.inventory.repository.BorrowRepository;
import com.plywood.inventory.repository.ItemRepository;
import com.plywood.inventory.repository.TransactionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryService categoryService;
    private final UserService userService;
    private final TransactionRepository transactionRepository;
    private final BorrowRepository borrowRepository;

    public ItemService(ItemRepository itemRepository, CategoryService categoryService,
                       UserService userService, TransactionRepository transactionRepository,
                       BorrowRepository borrowRepository) {
        this.itemRepository = itemRepository;
        this.categoryService = categoryService;
        this.userService = userService;
        this.transactionRepository = transactionRepository;
        this.borrowRepository = borrowRepository;
    }

    public List<Item> getAllItems() {
        Long companyId = userService.getCurrentCompany().getId();
        return itemRepository.findByCompanyId(companyId);
    }

    public List<Item> getItemsByCategory(Long categoryId) {
        Long companyId = userService.getCurrentCompany().getId();
        return itemRepository.findByCategoryIdAndCompanyId(categoryId, companyId);
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));
    }

    public Item createItem(Long categoryId, Item item) {
        Category category = categoryService.getCategoryById(categoryId);
        Company company = userService.getCurrentCompany();
        item.setCategory(category);
        item.setCompany(company);
        return itemRepository.save(item);
    }

    public Item updateItem(Long id, Item updated) {
        Item existing = getItemById(id);
        existing.setName(updated.getName());
        existing.setCostPerUnit(updated.getCostPerUnit());
        existing.setMinStock(updated.getMinStock());
        return itemRepository.save(existing);
    }

    public Item updateStock(Long id, int newStock) {
        Item item = getItemById(id);
        item.setStock(newStock);
        return itemRepository.save(item);
    }

    @Transactional
    public void deleteItem(Long id) {
        Item item = getItemById(id);
        Long categoryId = item.getCategory().getId();

        // Borrows reference transactions via FK — must go first
        borrowRepository.deleteByItemId(id);

        // Transactions reference item via FK — must go before the item
        transactionRepository.deleteByItemId(id);

        itemRepository.deleteById(id);

        // If this was the last item in the category, delete the category too
        List<Item> remainingItems = itemRepository.findByCategoryIdAndCompanyId(
                categoryId, item.getCompany().getId());
        if (remainingItems.isEmpty()) {
            categoryService.deleteCategory(categoryId);
        }
    }
}