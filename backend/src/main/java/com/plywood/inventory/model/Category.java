package com.plywood.inventory.model;

import jakarta.persistence.*;

@Entity
@Table(name = "categories")
public class Category {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String type; // CONSUMABLE or ENGINEERING

    @Column(nullable = false)
    private String unit;

    private Integer lowAlert;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    public Category() {}

    public Category(String name, String type, String unit, Integer lowAlert, Company company) {
        this.name = name;
        this.type = type;
        this.unit = unit;
        this.lowAlert = lowAlert;
        this.company = company;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getUnit() { return unit; }
    public void setUnit(String unit) { this.unit = unit; }

    public Integer getLowAlert() { return lowAlert; }
    public void setLowAlert(Integer lowAlert) { this.lowAlert = lowAlert; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }
}