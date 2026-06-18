package com.plywood.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "items")
public class Item {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private String name;

    private Integer stock;

    private Integer costPerUnit;

    private Integer minStock;

    public Item() {}

    public Item(Category category, Company company, String name, Integer stock, Integer costPerUnit, Integer minStock) {
        this.category = category;
        this.company = company;
        this.name = name;
        this.stock = stock;
        this.costPerUnit = costPerUnit;
        this.minStock = minStock;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Category getCategory() { return category; }
    public void setCategory(Category category) { this.category = category; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getStock() { return stock; }
    public void setStock(Integer stock) { this.stock = stock; }

    public Integer getCostPerUnit() { return costPerUnit; }
    public void setCostPerUnit(Integer costPerUnit) { this.costPerUnit = costPerUnit; }

    public Integer getMinStock() { return minStock; }
    public void setMinStock(Integer minStock) { this.minStock = minStock; }
}