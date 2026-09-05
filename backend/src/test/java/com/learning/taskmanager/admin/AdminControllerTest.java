package com.learning.taskmanager.admin;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.learning.taskmanager.admin.dto.AdminTaskResponse;
import com.learning.taskmanager.admin.dto.AdminUserResponse;
import com.learning.taskmanager.security.AppUserPrincipal;
import com.learning.taskmanager.security.CustomAccessDeniedHandler;
import com.learning.taskmanager.security.CustomAuthenticationEntryPoint;
import com.learning.taskmanager.security.CustomUserDetailsService;
import com.learning.taskmanager.security.JwtService;
import com.learning.taskmanager.security.SecurityConfig;
import com.learning.taskmanager.task.TaskPriority;
import com.learning.taskmanager.task.TaskStatus;
import com.learning.taskmanager.user.Role;
import com.learning.taskmanager.user.User;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

// See TaskControllerTest for why @Import({SecurityConfig.class, ...}) with the real
// filter chain (rather than addFilters = false) is required for @AuthenticationPrincipal
// and hasRole(...) to actually evaluate inside a @WebMvcTest slice.
@WebMvcTest(AdminController.class)
@Import({SecurityConfig.class, CustomAuthenticationEntryPoint.class, CustomAccessDeniedHandler.class})
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AdminService adminService;

    @MockitoBean
    private JwtService jwtService;

    @MockitoBean
    private CustomUserDetailsService userDetailsService;

    private static MockHttpServletRequestBuilder as(MockHttpServletRequestBuilder builder, Role role) {
        User user = new User();
        user.setId(1L);
        user.setUsername("test-user");
        user.setRole(role);
        List<GrantedAuthority> authorities = List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
        Authentication auth = new UsernamePasswordAuthenticationToken(new AppUserPrincipal(user), null, authorities);
        return builder.with(authentication(auth));
    }

    @Test
    void adminCanListAllTasks() throws Exception {
        AdminTaskResponse task = new AdminTaskResponse(
                1L, "Task", null, TaskStatus.TODO, TaskPriority.LOW, null, "alice");
        when(adminService.listAllTasks(any()))
                .thenReturn(new PageImpl<>(List.of(task), PageRequest.of(0, 20), 1));

        mockMvc.perform(as(get("/api/admin/tasks"), Role.ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].ownerUsername").value("alice"));
    }

    @Test
    void adminCanListAllUsers() throws Exception {
        when(adminService.listAllUsers())
                .thenReturn(List.of(new AdminUserResponse(1L, "alice", Role.ADMIN)));

        mockMvc.perform(as(get("/api/admin/users"), Role.ADMIN))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("alice"));
    }

    @Test
    void regularUserGetsForbiddenFromAdminTasksEndpoint() throws Exception {
        mockMvc.perform(as(get("/api/admin/tasks"), Role.USER))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));
    }

    @Test
    void regularUserGetsForbiddenFromAdminUsersEndpoint() throws Exception {
        mockMvc.perform(as(get("/api/admin/users"), Role.USER))
                .andExpect(status().isForbidden());
    }

    @Test
    void unauthenticatedRequestReturns401() throws Exception {
        mockMvc.perform(get("/api/admin/tasks")).andExpect(status().isUnauthorized());
    }
}
