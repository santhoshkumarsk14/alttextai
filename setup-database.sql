-- Setup database for AltTextAI
-- Run this script in MySQL Workbench to create the necessary tables

CREATE DATABASE IF NOT EXISTS test_db;
USE test_db;

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2) NOT NULL,
  credits_per_month INT NOT NULL,
  features JSON,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  name VARCHAR(255),
  company VARCHAR(255),
  subscription_plan_id VARCHAR(36),
  subscription_status ENUM('active', 'cancelled', 'suspended', 'trial', 'expired') DEFAULT 'trial',
  credits_remaining INT DEFAULT 50,
  credits_used_this_month INT DEFAULT 0,
  monthly_credit_limit INT DEFAULT 50,
  stripe_customer_id VARCHAR(255),
  trial_ends_at TIMESTAMP NULL,
  subscription_ends_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  api_key VARCHAR(255) UNIQUE,
  settings JSON,
  is_email_verified BOOLEAN DEFAULT FALSE,
  email_verification_token VARCHAR(255),
  reset_password_token VARCHAR(255),
  reset_password_expires TIMESTAMP NULL,
  FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  user_agent TEXT,
  ip_address VARCHAR(45),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36),
  filename VARCHAR(255) NOT NULL,
  original_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  upload_status ENUM('uploading', 'completed', 'failed') DEFAULT 'uploading',
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP NULL,
  metadata JSON,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS payments (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  stripe_payment_id VARCHAR(255) UNIQUE,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'pending',
  payment_method VARCHAR(50),
  subscription_plan_id VARCHAR(36),
  credits_purchased INT DEFAULT 0,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id)
);

-- Usage tracking table
CREATE TABLE IF NOT EXISTS usage_logs (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  action_type ENUM('upload', 'ai_generation', 'export', 'api_call') NOT NULL,
  credits_used INT DEFAULT 1,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Alt text generations table
CREATE TABLE IF NOT EXISTS alt_text_generations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  file_id VARCHAR(36),
  original_filename VARCHAR(255) NOT NULL,
  seo_alt_text TEXT,
  ada_alt_text TEXT,
  final_alt_text TEXT,
  seo_score INT,
  ada_compliant BOOLEAN DEFAULT FALSE,
  keywords JSON,
  competitor_keywords JSON,
  image_analysis JSON,
  brand_voice VARCHAR(50),
  project_name VARCHAR(255),
  status ENUM('generated', 'approved', 'exported') DEFAULT 'generated',
  approval_status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_at TIMESTAMP NULL,
  approved_by VARCHAR(36) NULL,
  credits_used INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (file_id) REFERENCES files(id) ON DELETE SET NULL,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  session_id VARCHAR(36),
  message_type ENUM('user', 'ai', 'system') NOT NULL,
  content TEXT NOT NULL,
  file_urls JSON,
  credits_used INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Real-time analytics table
CREATE TABLE IF NOT EXISTS analytics_realtime (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  metric_type VARCHAR(50) NOT NULL,
  metric_value INT NOT NULL,
  metadata JSON,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Integration connections table
CREATE TABLE IF NOT EXISTS integrations (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  platform VARCHAR(50) NOT NULL, -- 'shopify', 'woocommerce'
  store_url VARCHAR(255),
  api_key VARCHAR(255),
  api_secret VARCHAR(255),
  access_token VARCHAR(255),
  refresh_token VARCHAR(255),
  is_connected BOOLEAN DEFAULT FALSE,
  last_sync TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_platform (user_id, platform)
);

-- Insert subscription plans
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, credits_per_month, features) VALUES
('free-plan', 'Free', 'Perfect for trying out AltTextAI', 0.00, 0.00, 50, '["Basic alt text generation", "5 images per month", "Standard support"]'),
('pro-plan', 'Pro', 'For small businesses and freelancers', 19.99, 199.99, 500, '["Advanced AI analysis", "500 images per month", "Priority support", "Bulk processing", "API access"]'),
('enterprise-plan', 'Enterprise', 'For large teams and agencies', 99.99, 999.99, 5000, '["Everything in Pro", "5000 images per month", "Dedicated support", "Custom integrations", "White-label options"]')
ON DUPLICATE KEY UPDATE name = name;

-- Insert a default user for testing
INSERT INTO users (id, email, password_hash, name, subscription_plan_id, credits_remaining, monthly_credit_limit, trial_ends_at)
VALUES ('user-1', 'test@example.com', '$2b$10$dummy.hash.for.testing', 'Test User', 'free-plan', 50, 50, DATE_ADD(NOW(), INTERVAL 14 DAY))
ON DUPLICATE KEY UPDATE email = email;

-- Display created tables
SHOW TABLES;

-- If you need to add the credits_used column to existing alt_text_generations table:
-- ALTER TABLE alt_text_generations ADD COLUMN credits_used INT DEFAULT 1 AFTER status;