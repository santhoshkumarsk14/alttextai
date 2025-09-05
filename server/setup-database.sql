-- Database setup for AltText AI application
-- Run this script to create all necessary tables

-- Users table (if not exists)
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  credits_remaining INT DEFAULT 100,
  credits_used_this_month INT DEFAULT 0,
  subscription_plan VARCHAR(50) DEFAULT 'free',
  subscription_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Alt text generations table
CREATE TABLE IF NOT EXISTS alt_text_generations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  original_filename VARCHAR(255),
  file_url TEXT,
  seo_alt_text TEXT,
  ada_alt_text TEXT,
  final_alt_text TEXT,
  seo_score INT,
  keywords JSON,
  credits_used INT DEFAULT 1,
  status VARCHAR(20) DEFAULT 'generated',
  project_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_status (status),
  INDEX idx_project_name (project_name)
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36),
  message_type VARCHAR(20) DEFAULT 'user',
  content TEXT,
  file_urls JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at)
);

-- Usage logs table
CREATE TABLE IF NOT EXISTS usage_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action_type VARCHAR(50),
  credits_used INT DEFAULT 0,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_action (user_id, action_type),
  INDEX idx_created (created_at)
);

-- A/B Tests table
CREATE TABLE IF NOT EXISTS ab_tests (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  variant_a TEXT NOT NULL,
  variant_b TEXT NOT NULL,
  image_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft',
  variant_a_views INT DEFAULT 0,
  variant_b_views INT DEFAULT 0,
  variant_a_conversions INT DEFAULT 0,
  variant_b_conversions INT DEFAULT 0,
  winner VARCHAR(10),
  confidence_level DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_created (created_at)
);

-- API Keys table
CREATE TABLE IF NOT EXISTS api_keys (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  permissions JSON,
  usage_count INT DEFAULT 0,
  usage_limit INT DEFAULT 1000,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_used_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_active (user_id, is_active),
  INDEX idx_key_hash (key_hash)
);

-- Billing history table
CREATE TABLE IF NOT EXISTS billing_history (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  invoice_id VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'paid',
  billing_period_start DATE,
  billing_period_end DATE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_created (user_id, created_at),
  INDEX idx_status (status)
);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  email_usage_limit BOOLEAN DEFAULT TRUE,
  email_processing_complete BOOLEAN DEFAULT FALSE,
  email_weekly_report BOOLEAN DEFAULT TRUE,
  email_billing_reminders BOOLEAN DEFAULT TRUE,
  push_usage_limit BOOLEAN DEFAULT TRUE,
  push_processing_complete BOOLEAN DEFAULT FALSE,
  push_system_updates BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user (user_id)
);

-- Insert sample data for testing
INSERT IGNORE INTO users (id, email, name, credits_remaining, subscription_plan) VALUES
('20326fcd-7a6b-49e0-a2a9-f6378ac3d84c', 'user@example.com', 'Test User', 100, 'pro');

-- Insert sample notification preferences
INSERT IGNORE INTO notification_preferences (id, user_id) VALUES
(UUID(), '20326fcd-7a6b-49e0-a2a9-f6378ac3d84c');

COMMIT;