package com.learning.taskmanager.task.dto;

import com.learning.taskmanager.task.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TaskStatusUpdateRequest(@NotNull TaskStatus status) {
}
