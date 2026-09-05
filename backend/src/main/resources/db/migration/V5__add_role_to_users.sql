-- Role-based authorization (Phase 18). VARCHAR + Java-side @Enumerated(STRING),
-- consistent with tasks.status/priority (see CLAUDE.md section 16) rather than a
-- native Postgres enum type.
ALTER TABLE users ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER';

-- Promote the existing seeded 'alice' account to admin rather than creating a new
-- throwaway demo user (mirrors this project's established reuse-existing-seed-data
-- pattern, e.g. SecurityIntegrationTest reusing alice/bob instead of new accounts).
UPDATE users SET role = 'ADMIN' WHERE username = 'alice';
