package com.plywood.inventory.controller;

import com.plywood.inventory.dto.LoginRequest;
import com.plywood.inventory.dto.LoginResponse;
import com.plywood.inventory.dto.RegisterRequest;
import com.plywood.inventory.model.User;
import com.plywood.inventory.service.UserService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    private final UserService userService;

    public AuthController(UserService userService) {
        this.userService = userService;
    }

    // Create a brand new company + first admin user
    // You call this from Postman when onboarding a new client
    @PostMapping("/setup")
    public ResponseEntity<String> setup(@RequestBody Map<String, String> body) {
        userService.registerNewCompany(
                body.get("companyName"),
                body.get("username"),
                body.get("password")
        );
        return ResponseEntity.ok("Company and admin user created successfully");
    }

    // Add a user to the current logged in user's company
    @PostMapping("/register")
    public ResponseEntity<String> register(@RequestBody RegisterRequest request) {
        userService.register(
                request.getUsername(),
                request.getPassword(),
                request.getRole(),
                userService.getCurrentCompany().getId()
        );
        return ResponseEntity.ok("User registered successfully");
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@RequestBody LoginRequest request) {
        String token = userService.login(
                request.getUsername(),
                request.getPassword()
        );
        return ResponseEntity.ok(new LoginResponse(token));
    }

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @DeleteMapping("/users/{username}")
    public ResponseEntity<String> deleteUser(@PathVariable String username) {
        userService.deleteUser(username);
        return ResponseEntity.ok("User deleted");
    }
}