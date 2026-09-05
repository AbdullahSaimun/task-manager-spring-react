package com.learning.taskmanager.task;

import com.learning.taskmanager.security.AppUserPrincipal;
import com.learning.taskmanager.task.dto.PageResponse;
import com.learning.taskmanager.task.dto.TaskRequest;
import com.learning.taskmanager.task.dto.TaskResponse;
import com.learning.taskmanager.task.dto.TaskStatusUpdateRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @GetMapping
    public PageResponse<TaskResponse> list(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) String search,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        return PageResponse.from(taskService.search(principal.getUser().getId(), status, search, pageable));
    }

    @GetMapping("/{id}")
    public TaskResponse getById(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable Long id) {
        return taskService.getById(principal.getUser().getId(), id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TaskResponse create(
            @AuthenticationPrincipal AppUserPrincipal principal, @Valid @RequestBody TaskRequest request) {
        return taskService.create(principal.getUser().getId(), request);
    }

    @PutMapping("/{id}")
    public TaskResponse update(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody TaskRequest request) {
        return taskService.update(principal.getUser().getId(), id, request);
    }

    @PatchMapping("/{id}/status")
    public TaskResponse updateStatus(
            @AuthenticationPrincipal AppUserPrincipal principal,
            @PathVariable Long id,
            @Valid @RequestBody TaskStatusUpdateRequest request) {
        return taskService.updateStatus(principal.getUser().getId(), id, request.status());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@AuthenticationPrincipal AppUserPrincipal principal, @PathVariable Long id) {
        taskService.delete(principal.getUser().getId(), id);
    }
}
