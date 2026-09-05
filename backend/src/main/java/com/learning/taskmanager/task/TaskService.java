package com.learning.taskmanager.task;

import com.learning.taskmanager.common.exception.ResourceNotFoundException;
import com.learning.taskmanager.task.dto.TaskRequest;
import com.learning.taskmanager.task.dto.TaskResponse;
import com.learning.taskmanager.user.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public TaskService(TaskRepository taskRepository, UserRepository userRepository) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> search(Long userId, TaskStatus status, String search, Pageable pageable) {
        return taskRepository.search(userId, status, search, pageable).map(TaskResponse::from);
    }

    @Transactional(readOnly = true)
    public TaskResponse getById(Long userId, Long id) {
        return TaskResponse.from(findTaskOrThrow(userId, id));
    }

    @Transactional
    public TaskResponse create(Long userId, TaskRequest request) {
        Task task = new Task();
        task.setUser(userRepository.getReferenceById(userId));
        applyRequest(task, request);
        return TaskResponse.from(taskRepository.save(task));
    }

    @Transactional
    public TaskResponse update(Long userId, Long id, TaskRequest request) {
        Task task = findTaskOrThrow(userId, id);
        applyRequest(task, request);
        return TaskResponse.from(task);
    }

    @Transactional
    public TaskResponse updateStatus(Long userId, Long id, TaskStatus status) {
        Task task = findTaskOrThrow(userId, id);
        task.setStatus(status);
        return TaskResponse.from(task);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        taskRepository.delete(findTaskOrThrow(userId, id));
    }

    private Task findTaskOrThrow(Long userId, Long id) {
        return taskRepository.findByIdAndUserId(id, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found with id " + id));
    }

    private void applyRequest(Task task, TaskRequest request) {
        task.setTitle(request.title());
        task.setDescription(request.description());
        task.setStatus(request.status());
        task.setPriority(request.priority());
        task.setDueDate(request.dueDate());
    }
}
