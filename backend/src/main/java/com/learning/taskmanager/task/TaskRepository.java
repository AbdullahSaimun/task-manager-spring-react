package com.learning.taskmanager.task;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    // Overrides JpaRepository's default so the admin all-tasks listing (AdminService)
    // fetches each task's owner in the same query instead of one lazy-load query per
    // row — task.user is LAZY (Task.java), and this is the one place the app reads it
    // across many tasks at once.
    @Override
    @EntityGraph(attributePaths = "user")
    Page<Task> findAll(Pageable pageable);

    @Query("""
        SELECT t FROM Task t
        WHERE t.user.id = :userId
          AND (:status IS NULL OR t.status = :status)
          AND (:search IS NULL
               OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        """)
    Page<Task> search(
            @Param("userId") Long userId,
            @Param("status") TaskStatus status,
            @Param("search") String search,
            Pageable pageable);

    Optional<Task> findByIdAndUserId(Long id, Long userId);
}
