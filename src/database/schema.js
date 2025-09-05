// Database schema for micro SaaS application
// This can be used with MySQL, PostgreSQL, or MongoDB

export const DatabaseSchema = {
  // Users table for multi-tenant SaaS
  users: {
    id: 'VARCHAR(36) PRIMARY KEY', // UUID
    email: 'VARCHAR(255) UNIQUE NOT NULL',
    password_hash: 'VARCHAR(255) NOT NULL',
    name: 'VARCHAR(255)',
    company: 'VARCHAR(255)',
    subscription_plan: 'ENUM("free", "pro", "enterprise") DEFAULT "free"',
    subscription_status: 'ENUM("active", "cancelled", "suspended") DEFAULT "active"',
    monthly_limit: 'INT DEFAULT 100',
    usage_count: 'INT DEFAULT 0',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    last_login: 'TIMESTAMP',
    api_key: 'VARCHAR(255) UNIQUE',
    settings: 'JSON'
  },

  // Sessions for user tracking
  sessions: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    session_token: 'VARCHAR(255) UNIQUE NOT NULL',
    expires_at: 'TIMESTAMP NOT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    last_activity: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    user_agent: 'TEXT',
    ip_address: 'VARCHAR(45)',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE'
  },

  // Uploaded files
  files: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    session_id: 'VARCHAR(36)',
    filename: 'VARCHAR(255) NOT NULL',
    original_name: 'VARCHAR(255) NOT NULL',
    file_url: 'TEXT NOT NULL',
    file_size: 'BIGINT NOT NULL',
    mime_type: 'VARCHAR(100) NOT NULL',
    upload_status: 'ENUM("uploading", "completed", "failed") DEFAULT "uploading"',
    uploaded_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    deleted_at: 'TIMESTAMP NULL',
    metadata: 'JSON',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE'
  },

  // Chat messages and AI responses
  chat_messages: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    session_id: 'VARCHAR(36)',
    message_type: 'ENUM("user", "ai") NOT NULL',
    content: 'TEXT NOT NULL',
    prompt: 'TEXT',
    file_urls: 'JSON',
    ai_response: 'JSON',
    tokens_used: 'INT',
    processing_time: 'FLOAT',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE'
  },

  // Generated alt text and SEO data
  alt_text_generations: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    file_id: 'VARCHAR(36)',
    original_filename: 'VARCHAR(255) NOT NULL',
    file_url: 'TEXT',
    seo_alt_text: 'TEXT',
    ada_alt_text: 'TEXT',
    final_alt_text: 'TEXT',
    seo_score: 'INT',
    ada_compliant: 'BOOLEAN DEFAULT FALSE',
    keywords: 'JSON',
    competitor_keywords: 'JSON',
    image_analysis: 'JSON',
    brand_voice: 'VARCHAR(50)',
    project_name: 'VARCHAR(255)',
    product_handle: 'VARCHAR(255)', // For Shopify product handle
    status: 'VARCHAR(20) DEFAULT "generated"',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE',
    FOREIGN_KEY: 'file_id REFERENCES files(id) ON DELETE SET NULL'
  },

  // Usage analytics and metrics
  usage_analytics: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    date: 'DATE NOT NULL',
    request_count: 'INT DEFAULT 0',
    upload_count: 'INT DEFAULT 0',
    processing_time_total: 'FLOAT DEFAULT 0',
    tokens_used_total: 'INT DEFAULT 0',
    seo_score_average: 'FLOAT',
    error_count: 'INT DEFAULT 0',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE',
    UNIQUE: 'user_id, date'
  },

  // API rate limiting and quotas
  api_quotas: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    quota_type: 'ENUM("daily", "monthly") NOT NULL',
    quota_limit: 'INT NOT NULL',
    quota_used: 'INT DEFAULT 0',
    reset_date: 'DATE NOT NULL',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE',
    UNIQUE: 'user_id, quota_type, reset_date'
  },

  // Projects for organizing alt text generations
  projects: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36) NOT NULL',
    name: 'VARCHAR(255) NOT NULL',
    description: 'TEXT',
    settings: 'JSON',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    updated_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE CASCADE'
  },

  // Performance tracking
  performance_metrics: {
    id: 'VARCHAR(36) PRIMARY KEY',
    metric_type: 'VARCHAR(50) NOT NULL',
    metric_value: 'FLOAT NOT NULL',
    metric_unit: 'VARCHAR(20)',
    timestamp: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    metadata: 'JSON'
  },

  // Error logging
  error_logs: {
    id: 'VARCHAR(36) PRIMARY KEY',
    user_id: 'VARCHAR(36)',
    error_type: 'VARCHAR(100) NOT NULL',
    error_message: 'TEXT NOT NULL',
    stack_trace: 'TEXT',
    request_data: 'JSON',
    created_at: 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP',
    FOREIGN_KEY: 'user_id REFERENCES users(id) ON DELETE SET NULL'
  }
};

// Indexes for performance
export const DatabaseIndexes = [
  'CREATE INDEX idx_users_email ON users(email)',
  'CREATE INDEX idx_users_subscription ON users(subscription_plan, subscription_status)',
  'CREATE INDEX idx_sessions_user ON sessions(user_id)',
  'CREATE INDEX idx_sessions_token ON sessions(session_token)',
  'CREATE INDEX idx_files_user ON files(user_id)',
  'CREATE INDEX idx_files_uploaded ON files(uploaded_at)',
  'CREATE INDEX idx_chat_messages_user ON chat_messages(user_id)',
  'CREATE INDEX idx_chat_messages_created ON chat_messages(created_at)',
  'CREATE INDEX idx_alt_text_user ON alt_text_generations(user_id)',
  'CREATE INDEX idx_alt_text_project ON alt_text_generations(project_name)',
  'CREATE INDEX idx_usage_analytics_user_date ON usage_analytics(user_id, date)',
  'CREATE INDEX idx_api_quotas_user ON api_quotas(user_id)',
  'CREATE INDEX idx_projects_user ON projects(user_id)',
  'CREATE INDEX idx_performance_timestamp ON performance_metrics(timestamp)',
  'CREATE INDEX idx_error_logs_user ON error_logs(user_id)',
  'CREATE INDEX idx_error_logs_created ON error_logs(created_at)'
];

// Sample queries for common operations
export const SampleQueries = {
  // Get user usage for current month
  getUserMonthlyUsage: `
    SELECT 
      u.email,
      u.subscription_plan,
      u.monthly_limit,
      u.usage_count,
      COUNT(f.id) as files_uploaded,
      COUNT(alt.id) as alt_text_generated,
      AVG(alt.seo_score) as avg_seo_score
    FROM users u
    LEFT JOIN files f ON u.id = f.user_id 
      AND MONTH(f.uploaded_at) = MONTH(CURRENT_DATE())
      AND YEAR(f.uploaded_at) = YEAR(CURRENT_DATE())
    LEFT JOIN alt_text_generations alt ON u.id = alt.user_id
      AND MONTH(alt.created_at) = MONTH(CURRENT_DATE())
      AND YEAR(alt.created_at) = YEAR(CURRENT_DATE())
    WHERE u.id = ?
    GROUP BY u.id
  `,

  // Get recent activity for dashboard
  getRecentActivity: `
    SELECT 
      'upload' as type,
      f.filename as message,
      f.uploaded_at as timestamp
    FROM files f
    WHERE f.user_id = ?
    UNION ALL
    SELECT 
      'generation' as type,
      CONCAT('Generated alt text for ', alt.original_filename) as message,
      alt.created_at as timestamp
    FROM alt_text_generations alt
    WHERE alt.user_id = ?
    ORDER BY timestamp DESC
    LIMIT 10
  `,

  // Get performance metrics
  getPerformanceMetrics: `
    SELECT 
      AVG(processing_time) as avg_processing_time,
      COUNT(*) as total_requests,
      SUM(tokens_used) as total_tokens,
      AVG(seo_score) as avg_seo_score
    FROM chat_messages
    WHERE user_id = ? 
    AND created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
  `
};
