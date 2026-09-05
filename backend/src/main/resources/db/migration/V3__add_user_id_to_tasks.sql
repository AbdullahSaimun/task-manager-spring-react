ALTER TABLE tasks ADD COLUMN user_id BIGINT NOT NULL REFERENCES users (id);

CREATE INDEX idx_tasks_user_id ON tasks (user_id);
