package com.learning.taskmanager.task;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.learning.taskmanager.common.exception.ResourceNotFoundException;
import com.learning.taskmanager.security.AppUserPrincipal;
import com.learning.taskmanager.security.CustomAccessDeniedHandler;
import com.learning.taskmanager.security.CustomAuthenticationEntryPoint;
import com.learning.taskmanager.security.CustomUserDetailsService;
import com.learning.taskmanager.security.JwtService;
import com.learning.taskmanager.security.SecurityConfig;
import com.learning.taskmanager.task.dto.TaskResponse;
import com.learning.taskmanager.user.User;
import java.time.LocalDateTime;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

@WebMvcTest(TaskController.class)
// @WebMvcTest doesn't pull in @EnableWebSecurity (SecurityConfig lives outside this
// slice's controller/filter/converter allowlist), so Spring Security's MVC argument
// resolver for @AuthenticationPrincipal never gets wired and silently falls back to
// Spring MVC's generic model-attribute binding — importing the real config is what
// triggers that wiring. The real filter chain runs too (needed for the
// authentication() request post-processor's SecurityContext propagation to work),
// but since every request here goes through authed() with a valid principal already
// attached, JwtAuthenticationFilter has nothing to do and never touches it.
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
class TaskControllerTest {

    private static final Long USER_ID = 1L;

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private TaskService taskService;

    // Not exercised directly (addFilters = false keeps JwtAuthenticationFilter out of
    // this slice's chain) — only present so the filter bean's constructor resolves,
    // since @WebMvcTest pulls in Filter beans but not their own dependencies.
    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    private static TaskResponse response(Long id, String title) {
        return new TaskResponse(id, title, null, TaskStatus.TODO, TaskPriority.LOW, null,
                LocalDateTime.now(), LocalDateTime.now());
    }

    private static MockHttpServletRequestBuilder authed(MockHttpServletRequestBuilder builder) {
        User user = new User();
        user.setId(USER_ID);
        user.setUsername("test-user");
        Authentication auth = new UsernamePasswordAuthenticationToken(new AppUserPrincipal(user), null, List.of());
        return builder.with(authentication(auth));
    }

    @Test
    void getByIdReturnsTaskWhenFound() throws Exception {
        when(taskService.getById(USER_ID, 1L)).thenReturn(response(1L, "Title"));

        mockMvc.perform(authed(get("/api/tasks/{id}", 1L)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("Title"));
    }

    @Test
    void getByIdReturns404WhenMissing() throws Exception {
        when(taskService.getById(USER_ID, 999L))
                .thenThrow(new ResourceNotFoundException("Task not found with id 999"));

        mockMvc.perform(authed(get("/api/tasks/{id}", 999L)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.message").value("Task not found with id 999"));
    }

    @Test
    void createWithBlankTitleReturns400BeforeReachingService() throws Exception {
        mockMvc.perform(authed(post("/api/tasks"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"   ","status":"TODO","priority":"LOW"}
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("title"));
    }

    @Test
    void createDelegatesToServiceAndReturns201() throws Exception {
        when(taskService.create(eq(USER_ID), any())).thenReturn(response(2L, "New task"));

        mockMvc.perform(authed(post("/api/tasks"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"title":"New task","status":"TODO","priority":"MEDIUM"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2L));
    }

    @Test
    void deleteReturns204AndDelegatesToService() throws Exception {
        mockMvc.perform(authed(delete("/api/tasks/{id}", 3L)))
                .andExpect(status().isNoContent());

        verify(taskService).delete(USER_ID, 3L);
    }

    @Test
    void listReturnsDocumentedPageShape() throws Exception {
        when(taskService.search(any(), any(), any(), any()))
                .thenReturn(new PageImpl<>(List.of(response(1L, "Task")), PageRequest.of(0, 20), 1));

        mockMvc.perform(authed(get("/api/tasks")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].title").value("Task"))
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.page").value(0));
    }

    @Test
    void invalidStatusQueryParamReturns400() throws Exception {
        mockMvc.perform(authed(get("/api/tasks")).param("status", "NOT_REAL"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void malformedJsonBodyReturns400() throws Exception {
        mockMvc.perform(authed(post("/api/tasks"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{not valid json"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value("Malformed request body"));
    }
}
