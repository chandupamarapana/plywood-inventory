package com.plywood.inventory.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "transactions")
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "item_id", nullable = false)
    private Item item;

    @Column(nullable = false)
    private String type; // STOCK_IN, CONSUMPTION, BORROW, RETURN

    @Column(nullable = false)
    private Integer quantity;

    private LocalDate date;

    private String supplier;

    private String note;

    private String borrower;

    private String loggedBy;

    // Constructors
    public Transaction() {}

    public Transaction(Item item, String type, Integer quantity, LocalDate date,
                       String supplier, String note, String borrower, String loggedBy) {
        this.item = item;
        this.type = type;
        this.quantity = quantity;
        this.date = date;
        this.supplier = supplier;
        this.note = note;
        this.borrower = borrower;
        this.loggedBy = loggedBy;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Item getItem() { return item; }
    public void setItem(Item item) { this.item = item; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }

    public String getSupplier() { return supplier; }
    public void setSupplier(String supplier) { this.supplier = supplier; }

    public String getNote() { return note; }
    public void setNote(String note) { this.note = note; }

    public String getBorrower() { return borrower; }
    public void setBorrower(String borrower) { this.borrower = borrower; }

    public String getLoggedBy() { return loggedBy; }
    public void setLoggedBy(String loggedBy) { this.loggedBy = loggedBy; }
}