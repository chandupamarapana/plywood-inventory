package com.plywood.inventory.service;

import com.plywood.inventory.model.Category;
import com.plywood.inventory.model.Company;
import com.plywood.inventory.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final UserService userService;

    public CategoryService(CategoryRepository categoryRepository, UserService userService) {
        this.categoryRepository = categoryRepository;
        this.userService = userService;
    }

    public List<Category> getAllCategories() {
        Long companyId = userService.getCurrentCompany().getId();
        return categoryRepository.findByCompanyId(companyId);
    }

    public List<Category> getCategoriesByType(String type) {
        Long companyId = userService.getCurrentCompany().getId();
        return categoryRepository.findByTypeAndCompanyId(type, companyId);
    }

    public Category getCategoryById(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Category not found with id: " + id));
    }

    public Category createCategory(Category category) {
        Company company = userService.getCurrentCompany();
        category.setCompany(company);
        return categoryRepository.save(category);
    }

    public Category updateCategory(Long id, Category updated) {
        Category existing = getCategoryById(id);
        existing.setName(updated.getName());
        existing.setType(updated.getType());
        existing.setUnit(updated.getUnit());
        existing.setLowAlert(updated.getLowAlert());
        return categoryRepository.save(existing);
    }

    public void deleteCategory(Long id) {
        categoryRepository.deleteById(id);
    }
}