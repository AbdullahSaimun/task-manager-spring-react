package com.learning.taskmanager.task;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.learning.taskmanager.common.exception.ResourceNotFoundException;
import com.learning.taskmanager.task.dto.TaskRequest;
import com.learning.taskmanager.task.dto.TaskResponse;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {

    @Mock
    private TaskRepository taskRepository;

    private TaskService taskService;

    @BeforeEach
    void setUp() {
        taskService = new TaskService(taskRepository);
    }

    private static Task task(Long id, String title, TaskStatus status, TaskPriority priority) {
        Task task = new Task();
        task.setId(id);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(priority);
        return task;
    }

    @Test
    void createSavesAndReturnsMappedResponse() {
        when(taskRepository.save(any(Task.class))).thenReturn(task(1L, "Write tests", TaskStatus.TODO, TaskPriority.HIGH));

        TaskResponse response = taskService.create(
                new TaskRequest("Write tests", null, TaskStatus.TODO, TaskPriority.HIGH, null));

        assertThat(response.id()).isEqualTo(1L);
        assertThat(response.title()).isEqualTo("Write tests");
    }

    @Test
    void getByIdReturnsMappedResponseWhenFound() {
        when(taskRepository.findById(5L)).thenReturn(Optional.of(task(5L, "Existing", TaskStatus.TODO, TaskPriority.LOW)));

        TaskResponse response = taskService.getById(5L);

        assertThat(response.title()).isEqualTo("Existing");
    }

    @Test
    void getByIdThrowsWhenMissing() {
        when(taskRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.getById(99L))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("99");
    }

    @Test
    void updateAppliesRequestFieldsOntoManagedEntityWithNoExplicitSave() {
        Task existing = task(3L, "Old title", TaskStatus.TODO, TaskPriority.LOW);
        when(taskRepository.findById(3L)).thenReturn(Optional.of(existing));

        TaskResponse response = taskService.update(3L,
                new TaskRequest("New title", "desc", TaskStatus.IN_PROGRESS, TaskPriority.HIGH, null));

        assertThat(response.title()).isEqualTo("New title");
        assertThat(response.status()).isEqualTo(TaskStatus.IN_PROGRESS);
        assertThat(existing.getTitle()).isEqualTo("New title");
    }

    @Test
    void updateStatusChangesOnlyStatus() {
        Task existing = task(7L, "Task", TaskStatus.TODO, TaskPriority.MEDIUM);
        when(taskRepository.findById(7L)).thenReturn(Optional.of(existing));

        TaskResponse response = taskService.updateStatus(7L, TaskStatus.DONE);

        assertThat(response.status()).isEqualTo(TaskStatus.DONE);
        assertThat(response.title()).isEqualTo("Task");
    }

    @Test
    void deleteThrowsWhenMissing() {
        when(taskRepository.findById(42L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.delete(42L))
                .isInstanceOf(ResourceNotFoundException.class);
    }

    @Test
    void deleteRemovesFoundTask() {
        Task existing = task(8L, "Temp", TaskStatus.TODO, TaskPriority.LOW);
        when(taskRepository.findById(8L)).thenReturn(Optional.of(existing));

        taskService.delete(8L);

        verify(taskRepository).delete(existing);
    }

    @Test
    void searchDelegatesToRepositoryAndMapsResults() {
        Task found = task(1L, "Findable", TaskStatus.TODO, TaskPriority.LOW);
        Page<Task> page = new PageImpl<>(List.of(found));
        when(taskRepository.search(TaskStatus.TODO, "Findable", PageRequest.of(0, 10))).thenReturn(page);

        Page<TaskResponse> result = taskService.search(TaskStatus.TODO, "Findable", PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(TaskResponse::title).containsExactly("Findable");
    }
}
