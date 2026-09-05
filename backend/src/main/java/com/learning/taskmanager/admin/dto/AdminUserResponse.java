package com.learning.taskmanager.admin.dto;

import com.learning.taskmanager.user.Role;
import com.learning.taskmanager.user.User;

public record AdminUserResponse(Long id, String username, Role role) {

    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(user.getId(), user.getUsername(), user.getRole());
    }
}
