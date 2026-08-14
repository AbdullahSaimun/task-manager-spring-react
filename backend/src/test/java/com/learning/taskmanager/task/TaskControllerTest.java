package com.learning.taskmanager.task;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.learning.taskmanager.common.exception.ResourceNotFoundException;
import com.learning.taskmanager.task.dto.TaskResponse;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

@WebMvcTest(TaskController.class)
class TaskControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    private static TaskResponse response(Long id, String title) {
        return new TaskResponse(id, title, null, TaskStatus.TODO, TaskPriority.LOW, null,
                LocalDateTime.now(), LocalDateTime.now());
    }

    @Test
    void getByIdReturnsTaskWhenFound() throws Exception {
        when(taskService.getById(1L)).thenReturn(response(1L, "Title"));

        mockMvc.perform(get("/api/tasks/{id}", 1L))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Title"));
    }

    @Test
    void getByIdReturns404WhenMissing() throws Exception {
        when(taskService.getById(999L)).thenThrow(new ResourceNotFoundException("Task not found with id 999"));

        mockMvc.perform(get("/api/tasks/{id}", 999L))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Task not found with id 999"));
    }

    @Test
    void createWithBlankTitleReturns400BeforeReachingService() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"   ","status":"TODO","priority":"LOW"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("title"));
    }

    @Test
    void createDelegatesToServiceAndReturns201() throws Exception {
        when(taskService.create(any())).thenReturn(response(2L, "New task"));

        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"New task","status":"TODO","priority":"MEDIUM"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void deleteReturns204AndDelegatesToService() throws Exception {
        mockMvc.perform(delete("/api/tasks/{id}", 3L))
                .andExpect(status().isNoContent());

        verify(taskService).delete(3L);
    }

    @Test
    void listReturnsDocumentedPageShape() throws Exception {
        when(taskService.search(any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(response(1L, "Task")), PageRequest.of(0, 20), 1));

        mockMvc.perform(get("/api/tasks"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Task"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void invalidStatusQueryParamReturns400() throws Exception {
        mockMvc.perform(get("/api/tasks").param("status", "NOT_REAL"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void malformedJsonBodyReturns400() throws Exception {
        mockMvc.perform(post("/api/tasks")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not valid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body"));
    }
}
