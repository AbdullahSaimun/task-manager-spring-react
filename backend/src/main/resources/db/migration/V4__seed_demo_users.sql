-- Demo accounts for local development (Phase 17). Both use password "password123".
-- Hashes generated with Spring Security's BCryptPasswordEncoder (see CLAUDE.md section 16).
INSERT INTO users (username, password) VALUES
    ('alice', '$2a$10$UqgXh7.VPwAVrPStMcmameciyuTqwv/1BOgpEcdO.7AfrR0lhIkrG'),
    ('bob', '$2a$10$tTpp4ZfnudVfrBxItpfBSOgdE2Ek3pPJk1lZbO2RsEbTaBEMyRPuK');
