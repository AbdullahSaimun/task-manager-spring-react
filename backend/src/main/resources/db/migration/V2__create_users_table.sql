CREATE TABLE users (
    id       BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX idx_users_username ON users (username);
