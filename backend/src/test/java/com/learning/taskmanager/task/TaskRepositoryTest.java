package com.learning.taskmanager.task;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase.Replace;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

@DataJpaTest
@AutoConfigureTestDatabase(replace = Replace.NONE)
class TaskRepositoryTest {

    @Autowired
    private TaskRepository taskRepository;

    private static Task task(String title, TaskStatus status) {
        Task task = new Task();
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(TaskPriority.MEDIUM);
        return task;
    }

    @Test
    void searchWithNoFiltersReturnsAllTasks() {
        taskRepository.save(task("Alpha", TaskStatus.TODO));
        taskRepository.save(task("Beta", TaskStatus.DONE));

        Page<Task> page = taskRepository.search(null, null, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    void searchFiltersByStatus() {
        taskRepository.save(task("Alpha", TaskStatus.TODO));
        taskRepository.save(task("Beta", TaskStatus.DONE));

        Page<Task> page = taskRepository.search(TaskStatus.DONE, null, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Task::getTitle).containsExactly("Beta");
    }

    @Test
    void searchMatchesTitleOrDescriptionCaseInsensitively() {
        Task reportTask = task("Write report", TaskStatus.TODO);
        reportTask.setDescription("quarterly SUMMARY");
        taskRepository.save(reportTask);
        taskRepository.save(task("Unrelated", TaskStatus.TODO));

        Page<Task> byTitle = taskRepository.search(null, "write", PageRequest.of(0, 10));
        Page<Task> byDescription = taskRepository.search(null, "summary", PageRequest.of(0, 10));

        assertThat(byTitle.getContent()).extracting(Task::getTitle).containsExactly("Write report");
        assertThat(byDescription.getContent()).extracting(Task::getTitle).containsExactly("Write report");
    }

    @Test
    void searchCombinesStatusAndTextFilters() {
        taskRepository.save(task("Write report", TaskStatus.DONE));
        taskRepository.save(task("Write summary", TaskStatus.TODO));

        Page<Task> page = taskRepository.search(TaskStatus.DONE, "write", PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Task::getTitle).containsExactly("Write report");
    }
}
