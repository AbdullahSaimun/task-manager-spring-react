package com.learning.taskmanager.admin;

import com.learning.taskmanager.admin.dto.AdminTaskResponse;
import com.learning.taskmanager.admin.dto.AdminUserResponse;
import com.learning.taskmanager.task.dto.PageResponse;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Every endpoint here requires the ADMIN role — enforced by SecurityConfig's
 * {@code .requestMatchers("/api/admin/**").hasRole("ADMIN")}, not by a per-method
 * check, so there is nothing role-related in this class's own code (see CLAUDE.md
 * section 16 for why a URL-matcher was chosen over method security for this app's
 * one admin-only area).
 */
@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/tasks")
    public PageResponse<AdminTaskResponse> listAllTasks(@PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return PageResponse.from(adminService.listAllTasks(pageable));
    }

    @GetMapping("/users")
    public List<AdminUserResponse> listAllUsers() {
        return adminService.listAllUsers();
    }
}
