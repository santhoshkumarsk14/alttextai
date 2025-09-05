// Database configuration
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Database configuration with enhanced settings from .env
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'test_db',
  waitForConnections: process.env.DB_WAIT_FOR_CONNECTIONS === 'true',
  connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
  queueLimit: parseInt(process.env.DB_QUEUE_LIMIT || '0'),
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
};

// Create connection pool with enhanced error handling
const pool = mysql.createPool(dbConfig);

// Initialize database by running setup script if needed
const initializeDatabase = async () => {
  try {
    // Check if database exists
    const connection = await pool.getConnection();
    
    try {
      // Check if users table exists
      const [rows] = await connection.query(`
        SELECT COUNT(*) as count 
        FROM information_schema.tables 
        WHERE table_schema = ? AND table_name = 'users'
      `, [dbConfig.database]);
      
      // If tables don't exist, run setup script
      if (rows[0].count === 0) {
        console.log('Database tables not found. Running setup script...');
        const setupScript = await fs.readFile(
          path.join(__dirname, '..', 'setup-database.sql'),
          'utf8'
        );

        // Split script into individual statements
        const statements = setupScript
          .split(';')
          .filter(statement => statement.trim() !== '')
          .map(stmt => stmt.trim())
          .filter(stmt => stmt && !stmt.startsWith('--'));

        // Execute each statement
        for (const statement of statements) {
          if (statement.trim().startsWith('CREATE DATABASE') ||
              statement.trim().startsWith('USE') ||
              statement.trim().startsWith('INSERT') ||
              statement.trim().startsWith('COMMIT') ||
              statement.trim().startsWith('SHOW')) {
            continue; // Skip database creation, use statements, and sample data
          }
          if (statement.trim()) {
            try {
              await connection.query(statement);
              console.log('Executed:', statement.substring(0, 50) + '...');
            } catch (err) {
              console.error('Error executing statement:', err);
              console.error('Statement:', statement);
            }
          }
        }

        console.log('Database setup completed successfully');
      }
    } finally {
      connection.release();
    }
    
    return true;
  } catch (error) {
    console.error('Database initialization error:', error);
    return false;
  }
};

// Test database connection with retry mechanism
const testConnection = async (retries = 3, delay = 2000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await pool.getConnection();
      console.log('Database connected successfully');
      connection.release();
      return true;
    } catch (error) {
      console.error(`Database connection attempt ${attempt}/${retries} failed:`, error);
      
      if (attempt < retries) {
        console.log(`Retrying in ${delay/1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`Failed to connect to database after ${retries} attempts`);
  return false;
};

// Execute a query with error handling and connection management
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await pool.getConnection();
    const [results] = await connection.query(query, params);
    return { success: true, results };
  } catch (error) {
    console.error('Database query error:', error);
    return { success: false, error: error.message };
  } finally {
    if (connection) connection.release();
  }
};

export { pool, testConnection, initializeDatabase, executeQuery };