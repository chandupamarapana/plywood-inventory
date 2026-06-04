package com.plywood.inventory.service;

import com.plywood.inventory.model.User;
import com.plywood.inventory.repository.UserRepository;
import com.plywood.inventory.security.JwtService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder, JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User register(String username, String password) {

        if (userRepository.existsByUsername(username)) {
            throw new RuntimeException("Username already exists");
        }

        User user = new User();

        user.setUsername(username);

        user.setPassword(
                passwordEncoder.encode(password)
        );

        return userRepository.save(user);
    }
    public String login(String username, String password) {

        User user = userRepository
                .findByUsername(username)
                .orElseThrow(() ->
                        new RuntimeException("Invalid username or password")
                );

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new RuntimeException("Invalid username or password");
        }

        return jwtService.generateToken(username);
    }
}