package com.learning.taskmanager.security.dto;

import com.learning.taskmanager.user.Role;

public record LoginResponse(String token, String username, Role role) {
}
