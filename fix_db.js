// Database migration script to fix schema issues
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'test_db'
};

async function migrateDatabase() {
  let connection;

  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('Connected to database for migration');

    // Check if alt_text_generations table exists
    const [tables] = await connection.execute(
      "SHOW TABLES LIKE 'alt_text_generations'"
    );

    if (tables.length === 0) {
      console.log('Creating alt_text_generations table...');
      await connection.execute(`
        CREATE TABLE alt_text_generations (
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
        )
      `);
      console.log('✅ Table created successfully');
    } else {
      console.log('Table exists, checking for missing columns...');

      // Check for missing columns and add them
      const [columns] = await connection.execute(
        "SHOW COLUMNS FROM alt_text_generations"
      );

      const columnNames = columns.map(col => col.Field);
      const missingColumns = [];

      if (!columnNames.includes('file_url')) {
        missingColumns.push('ADD COLUMN file_url TEXT');
      }
      if (!columnNames.includes('final_alt_text')) {
        missingColumns.push('ADD COLUMN final_alt_text TEXT');
      }
      if (!columnNames.includes('status')) {
        missingColumns.push('ADD COLUMN status VARCHAR(20) DEFAULT "generated"');
      }
      if (!columnNames.includes('project_name')) {
        missingColumns.push('ADD COLUMN project_name VARCHAR(255)');
      }
      if (!columnNames.includes('product_handle')) {
        missingColumns.push('ADD COLUMN product_handle VARCHAR(255)');
      }

      // Rename approval_status to status if it exists
      if (columnNames.includes('approval_status') && !columnNames.includes('status')) {
        await connection.execute(
          'ALTER TABLE alt_text_generations CHANGE approval_status status VARCHAR(20) DEFAULT "generated"'
        );
        console.log('✅ Renamed approval_status to status');
      }

      // Add missing columns
      for (const column of missingColumns) {
        try {
          await connection.execute(`ALTER TABLE alt_text_generations ${column}`);
          console.log(`✅ Added column: ${column}`);
        } catch (error) {
          console.error(`❌ Error adding column ${column}:`, error.message);
        }
      }

      // Update existing records to have proper status
      await connection.execute(
        'UPDATE alt_text_generations SET status = "generated" WHERE status IS NULL OR status = ""'
      );
      console.log('✅ Updated existing records with default status');
    }

    // Insert some sample data for testing
    const [existingData] = await connection.execute(
      'SELECT COUNT(*) as count FROM alt_text_generations'
    );

    if (existingData[0].count === 0) {
      console.log('Inserting sample data...');
      await connection.execute(`
        INSERT INTO alt_text_generations (
          id, user_id, original_filename, file_url, seo_alt_text, final_alt_text,
          seo_score, keywords, status, project_name, created_at
        ) VALUES
        (
          'sample-1',
          '20326fcd-7a6b-49e0-a2a9-f6378ac3d84c',
          'sample-image.jpg',
          '/uploads/sample-image.jpg',
          'Sample SEO alt text for product image',
          'Sample final alt text for product image',
          85,
          '["sample", "product", "image"]',
          'generated',
          'Sample Project',
          NOW()
        ),
        (
          'sample-2',
          '20326fcd-7a6b-49e0-a2a9-f6378ac3d84c',
          'sample-image2.jpg',
          '/uploads/sample-image2.jpg',
          'Another sample SEO alt text',
          'Another final alt text',
          90,
          '["another", "sample", "product"]',
          'approved',
          'Sample Project',
          NOW()
        )
      `);
      console.log('✅ Sample data inserted');
    }

    console.log('✅ Database migration completed successfully');

  } catch (error) {
    console.error('❌ Migration error:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

migrateDatabase().catch(console.error);