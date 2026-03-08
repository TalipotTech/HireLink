-- Migration: Add user_roles table for multi-role support
-- Allows a single user to hold both CUSTOMER and PROVIDER roles simultaneously

CREATE TABLE IF NOT EXISTS user_roles (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    role VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_role (user_id, role)
);

-- Populate user_roles from existing user_type data
-- All existing users get their current role
INSERT INTO user_roles (user_id, role)
SELECT user_id, user_type FROM users
WHERE deleted_at IS NULL
ON DUPLICATE KEY UPDATE role = VALUES(role);

-- Existing PROVIDER users should also have the CUSTOMER role
INSERT INTO user_roles (user_id, role)
SELECT user_id, 'CUSTOMER' FROM users
WHERE user_type = 'PROVIDER' AND deleted_at IS NULL
ON DUPLICATE KEY UPDATE role = VALUES(role);
