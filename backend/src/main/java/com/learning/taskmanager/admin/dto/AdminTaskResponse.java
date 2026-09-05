package com.learning.taskmanager.admin.dto;

import com.learning.taskmanager.task.Task;
import com.learning.taskmanager.task.TaskPriority;
import com.learning.taskmanager.task.TaskStatus;
import java.time.LocalDate;

/**
 * Admin-only view of a task — adds {@code ownerUsername} on top of the fields in the
 * regular {@code TaskResponse}, since knowing whose task this is is the whole point
 * of an admin listing that spans every user.
 */
public record AdminTaskResponse(
        Long id,
        String title,
        String description,
        TaskStatus status,
        TaskPriority priority,
        LocalDate dueDate,
        String ownerUsername) {

    public static AdminTaskResponse from(Task task) {
        return new AdminTaskResponse(
                task.getId(),
                task.getTitle(),
                task.getDescription(),
                task.getStatus(),
                task.getPriority(),
                task.getDueDate(),
                task.getUser().getUsername());
    }
}
