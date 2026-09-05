package com.learning.taskmanager.admin;

import com.learning.taskmanager.admin.dto.AdminTaskResponse;
import com.learning.taskmanager.admin.dto.AdminUserResponse;
import com.learning.taskmanager.task.TaskRepository;
import com.learning.taskmanager.user.UserRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AdminService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public AdminService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<AdminTaskResponse> listAllTasks(Pageable pageable) {
        // Task.user is lazy — reading task.getUser().getUsername() here (inside the
        // transaction) rather than after it's committed is what open-in-view: false
        // requires (see CLAUDE.md section 11). TaskRepository.findAll(Pageable) is
        // overridden with @EntityGraph(attributePaths = "user") specifically so this
        // doesn't fire an extra query per row.
        return taskRepository.findAll(pageable).map(AdminTaskResponse::from);
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> listAllUsers() {
        return userRepository.findAll().stream().map(AdminUserResponse::from).toList();
    }
}
