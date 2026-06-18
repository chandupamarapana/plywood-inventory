package com.plywood.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "borrows")
public class Borrow {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @ManyToOne
    @JoinColumn(name = "transaction_id")
    private Transaction transaction;

    @ManyToOne
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false)
    private Integer quantity;

    @Column(nullable = false)
    private String borrower;

    @Column(nullable = false)
    private LocalDate dateOut;

    private LocalDate dateIn;

    public Borrow() {}

    public Borrow(Item item, Transaction transaction, Company company, Integer quantity,
                  String borrower, LocalDate dateOut) {
        this.item = item;
        this.transaction = transaction;
        this.company = company;
        this.quantity = quantity;
        this.borrower = borrower;
        this.dateOut = dateOut;
        this.dateIn = null;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }

    public Transaction getTransaction() { return transaction; }
    public void setTransaction(Transaction transaction) { this.transaction = transaction; }

    public Company getCompany() { return company; }
    public void setCompany(Company company) { this.company = company; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getBorrower() { return borrower; }
    public void setBorrower(String borrower) { this.borrower = borrower; }

    public LocalDate getDateOut() { return dateOut; }
    public void setDateOut(LocalDate dateOut) { this.dateOut = dateOut; }

    public LocalDate getDateIn() { return dateIn; }
    public void setDateIn(LocalDate dateIn) { this.dateIn = dateIn; }
}