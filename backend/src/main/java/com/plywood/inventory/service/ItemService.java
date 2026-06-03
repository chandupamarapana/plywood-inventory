package com.plywood.inventory.service;

import com.plywood.inventory.model.Category;
import com.plywood.inventory.model.Item;
import com.plywood.inventory.repository.ItemRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class ItemService {

    private final ItemRepository itemRepository;
    private final CategoryService categoryService;

    public ItemService(ItemRepository itemRepository, CategoryService categoryService) {
        this.itemRepository = itemRepository;
        this.categoryService = categoryService;
    }

    public List<Item> getAllItems() {
        return itemRepository.findAll();
    }

    public List<Item> getItemsByCategory(Long categoryId) {
        return itemRepository.findByCategoryId(categoryId);
    }

    public Item getItemById(Long id) {
        return itemRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Item not found with id: " + id));
    }

    public Item createItem(Long categoryId, Item item) {
        Category category = categoryService.getCategoryById(categoryId);
        item.setCategory(category);
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

    public void deleteItem(Long id) {
        itemRepository.deleteById(id);
    }
}