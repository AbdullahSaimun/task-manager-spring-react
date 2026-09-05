package com.learning.taskmanager.task;

import static org.assertj.core.api.Assertions.assertThat;

import com.learning.taskmanager.user.User;
import com.learning.taskmanager.user.UserRepository;
import org.junit.jupiter.api.BeforeEach;
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

    @Autowired
    private UserRepository userRepository;

    private User user;
    private User otherUser;

    @BeforeEach
    void setUp() {
        user = userRepository.save(newUser("repo-test-user"));
        otherUser = userRepository.save(newUser("repo-test-other-user"));
    }

    private static User newUser(String username) {
        User user = new User();
        user.setUsername(username);
        user.setPassword("irrelevant-for-this-test");
        return user;
    }

    private Task task(String title, TaskStatus status) {
        Task task = new Task();
        task.setUser(user);
        task.setTitle(title);
        task.setStatus(status);
        task.setPriority(TaskPriority.MEDIUM);
        return task;
    }

    @Test
    void searchWithNoFiltersReturnsAllTasksForUser() {
        taskRepository.save(task("Alpha", TaskStatus.TODO));
        taskRepository.save(task("Beta", TaskStatus.DONE));

        Page<Task> page = taskRepository.search(user.getId(), null, null, PageRequest.of(0, 10));

        assertThat(page.getTotalElements()).isEqualTo(2);
    }

    @Test
    void searchFiltersByStatus() {
        taskRepository.save(task("Alpha", TaskStatus.TODO));
        taskRepository.save(task("Beta", TaskStatus.DONE));

        Page<Task> page = taskRepository.search(user.getId(), TaskStatus.DONE, null, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Task::getTitle).containsExactly("Beta");
    }

    @Test
    void searchMatchesTitleOrDescriptionCaseInsensitively() {
        Task reportTask = task("Write report", TaskStatus.TODO);
        reportTask.setDescription("quarterly SUMMARY");
        taskRepository.save(reportTask);
        taskRepository.save(task("Unrelated", TaskStatus.TODO));

        Page<Task> byTitle = taskRepository.search(user.getId(), null, "write", PageRequest.of(0, 10));
        Page<Task> byDescription = taskRepository.search(user.getId(), null, "summary", PageRequest.of(0, 10));

        assertThat(byTitle.getContent()).extracting(Task::getTitle).containsExactly("Write report");
        assertThat(byDescription.getContent()).extracting(Task::getTitle).containsExactly("Write report");
    }

    @Test
    void searchCombinesStatusAndTextFilters() {
        taskRepository.save(task("Write report", TaskStatus.DONE));
        taskRepository.save(task("Write summary", TaskStatus.TODO));

        Page<Task> page = taskRepository.search(user.getId(), TaskStatus.DONE, "write", PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Task::getTitle).containsExactly("Write report");
    }

    @Test
    void searchNeverReturnsAnotherUsersTasks() {
        taskRepository.save(task("My task", TaskStatus.TODO));
        Task othersTask = new Task();
        othersTask.setUser(otherUser);
        othersTask.setTitle("Someone else's task");
        othersTask.setStatus(TaskStatus.TODO);
        othersTask.setPriority(TaskPriority.MEDIUM);
        taskRepository.save(othersTask);

        Page<Task> page = taskRepository.search(user.getId(), null, null, PageRequest.of(0, 10));

        assertThat(page.getContent()).extracting(Task::getTitle).containsExactly("My task");
    }

    @Test
    void findByIdAndUserIdReturnsEmptyForAnotherUsersTask() {
        Task saved = taskRepository.save(task("Mine", TaskStatus.TODO));

        assertThat(taskRepository.findByIdAndUserId(saved.getId(), otherUser.getId())).isEmpty();
        assertThat(taskRepository.findByIdAndUserId(saved.getId(), user.getId())).isPresent();
    }
}
