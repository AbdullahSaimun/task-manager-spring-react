package com.learning.taskmanager.task;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TaskRepository extends JpaRepository<Task, Long> {

    @Query("""
        SELECT t FROM Task t
        WHERE (:status IS NULL OR t.status = :status)
          AND (:search IS NULL
               OR LOWER(t.title) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%'))
               OR LOWER(t.description) LIKE LOWER(CONCAT('%', CAST(:search AS string), '%')))
        """)
    Page<Task> search(@Param("status") TaskStatus status, @Param("search") String search, Pageable pageable);
}
