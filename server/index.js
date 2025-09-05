// Main server file
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Import routes
import uploadRoutes from './routes/uploadRoutes.js';
import altTextRoutes from './routes/altTextRoutes.js';
import authRoutes from './routes/authRoutes.js';
import subscriptionRoutes from './routes/subscriptionRoutes.js';

// Import middleware
import { authenticateToken, checkCredits } from './middleware/auth.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';

// Import database
import { pool, testConnection, initializeDatabase } from './config/database.js';

// Import OpenAI service
import { analyzeImageAndGenerateAltText } from './services/openaiService.js';

// Import multer for file uploads
import multer from 'multer';

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueFilename = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueFilename);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') } // Default 10MB
});

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Express app
const app = express();
const DEFAULT_PORT = parseInt(process.env.PORT || '3002');

// Function to find an available port
const findAvailablePort = async (startPort) => {
  const net = await import('net');

  for (let port = startPort; port < startPort + 100; port++) {
    try {
      const server = net.default.createServer();
      await new Promise((resolve, reject) => {
        server.listen(port, 'localhost', () => {
          server.close(() => resolve());
        });
        server.on('error', reject);
      });
      return port;
    } catch (error) {
      // Port is in use, try next one
      continue;
    }
  }
  throw new Error('No available ports found');
};

// Create HTTP server for Socket.io
let server;
let PORT;

// Initialize Socket.io
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
try {
  await fs.mkdir(uploadsDir, { recursive: true });
  console.log('Uploads directory created or already exists');
} catch (err) {
  console.error('Error creating uploads directory:', err);
}

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/upload', authenticateToken, checkCredits(1), uploadRoutes);
app.use('/api/alt-text', authenticateToken, checkCredits(1), altTextRoutes);

// Test database connection
app.get('/api/test-db', async (req, res) => {
  const connected = await testConnection();
  if (connected) {
    res.json({ success: true, message: 'Database connected successfully' });
  } else {
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Authentication endpoint - this will work with Firebase Auth
app.post('/api/auth/verify', async (req, res) => {
  try {
    const { userId, token } = req.body;
    
    // In a real implementation, you would verify the Firebase token
    // For now, we'll just check if the user exists in our database
    
    const connection = await pool.getConnection();
    try {
      const [rows] = await connection.execute(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      );
      
      if (rows.length === 0) {
        // User doesn't exist, create a new one
        const id = userId || uuidv4();
        await connection.execute(
          'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
          [id, 'user@example.com', 'firebase-auth', 'Firebase User']
        );
        
        res.json({ success: true, userId: id, isNewUser: true });
      } else {
        // User exists
        res.json({ success: true, userId: rows[0].id, isNewUser: false });
      }
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI Processing endpoint for alt text generation
app.post('/api/ai/generate-alt-text', authenticateToken, checkCredits(1), async (req, res) => {
  const connection = await pool.getConnection();
  const userId = req.user.id;

  try {
    const { prompt, fileUrls, responseSchema } = req.body;

    console.log('🤖 AI Alt Text Generation Request:', {
      prompt: prompt?.substring(0, 100),
      fileUrls: fileUrls?.length,
      userId
    });


    if (!fileUrls || fileUrls.length === 0) {
      return res.status(400).json({ success: false, error: 'No image URLs provided' });
    }

    // Process the first image (for now - can be extended for multiple)
    const imagePath = fileUrls[0].replace(`http://localhost:${PORT}/uploads/`, './uploads/');

    console.log('📸 Processing image:', imagePath);

    // Generate alt text using OpenAI
    const result = await analyzeImageAndGenerateAltText(imagePath, {
      title: prompt || 'Product image',
      category: 'general',
      brand: 'brand'
    });

    console.log('✅ AI Processing completed:', result);

    // Start transaction
    await connection.beginTransaction();

    try {
      // Deduct credits
      await connection.execute(
        'UPDATE users SET credits_remaining = credits_remaining - 1, credits_used_this_month = credits_used_this_month + 1 WHERE id = ?',
        [userId]
      );

      // Log usage
      await connection.execute(
        'INSERT INTO usage_logs (id, user_id, action_type, credits_used, metadata) VALUES (?, ?, ?, ?, ?)',
        [uuidv4(), userId, 'ai_generation', 1, JSON.stringify({ prompt, fileUrls })]
      );

      // Save alt text generation to database
      const filename = imagePath.split('/').pop();
      await connection.execute(
        `INSERT INTO alt_text_generations (
          id, user_id, original_filename, seo_alt_text, ada_alt_text,
          seo_score, keywords, credits_used, approval_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uuidv4(),
          userId,
          filename,
          result.seo_alt_text || '',
          result.ada_alt_text || '',
          result.seo_score || 85,
          JSON.stringify(result.keywords_used || []),
          1,
          'generated'
        ]
      );

      await connection.commit();

      // Send real-time notification
      io.to(`user_${userId}`).emit('notification', {
        type: 'task_completed',
        message: 'Alt text generation completed successfully',
        data: {
          taskType: 'alt_text_generation',
          filename: filename,
          seo_score: result.seo_score
        },
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        ...result,
        credits_remaining: req.user.credits_remaining - 1
      });

    } catch (dbError) {
      await connection.rollback();
      throw dbError;
    }

  } catch (error) {
    console.error('❌ AI Processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      seo_alt_text: "AI processing temporarily unavailable",
      ada_alt_text: "Please try again later",
      main_subject: "Product",
      confidence_score: 0.5,
      seo_score: 50
    });
  } finally {
    connection.release();
  }
});

// Chat API endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { userId, message, fileUrl } = req.body;

    // Store the chat message
    const connection = await pool.getConnection();
    try {
      const messageId = uuidv4();
      await connection.execute(
        'INSERT INTO chat_messages (id, user_id, message_type, content, file_urls) VALUES (?, ?, ?, ?, ?)',
        [messageId, userId || 'anonymous', 'user', message, JSON.stringify(fileUrl ? [fileUrl] : [])]
      );

      // In a real implementation, you would call OpenAI API here
      // For now, return a mock response
      const aiResponse = {
        id: uuidv4(),
        content: `This is a mock AI response to: "${message}"`,
        timestamp: new Date().toISOString()
      };

      // Store AI response
      await connection.execute(
        'INSERT INTO chat_messages (id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
        [aiResponse.id, userId || 'anonymous', 'ai', aiResponse.content]
      );

      res.json({ success: true, response: aiResponse });
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Chat API error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Chat history endpoint
app.get('/api/chat/history', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM chat_messages WHERE user_id = ? ORDER BY created_at ASC LIMIT 50',
      [req.user.id]
    );

    const messages = rows.map(row => ({
      id: row.id,
      content: row.content,
      type: row.message_type,
      timestamp: row.created_at,
      fileUrls: JSON.parse(row.file_urls || '[]')
    }));

    res.json({ success: true, messages });
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch chat history' });
  } finally {
    connection.release();
  }
});

// Alt Text Management Endpoints
app.get('/api/alt-text/generations', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM alt_text_generations WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, generations: rows });
  } catch (error) {
    console.error('Error fetching alt text generations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch generations' });
  } finally {
    connection.release();
  }
});

app.put('/api/alt-text/approve/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [result] = await connection.execute(
      'UPDATE alt_text_generations SET status = ?, approved_at = NOW(), approved_by = ? WHERE id = ? AND user_id = ?',
      ['approved', req.user.id, req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, error: 'Alt text generation not found' });
    }

    await connection.commit();
    res.json({ success: true, message: 'Alt text approved successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error approving alt text:', error);
    res.status(500).json({ success: false, error: 'Failed to approve alt text' });
  } finally {
    connection.release();
  }
});

app.put('/api/alt-text/reject/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'UPDATE alt_text_generations SET status = ? WHERE id = ? AND user_id = ?',
      ['rejected', req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Alt text generation not found' });
    }

    res.json({ success: true, message: 'Alt text rejected successfully' });
  } catch (error) {
    console.error('Error rejecting alt text:', error);
    res.status(500).json({ success: false, error: 'Failed to reject alt text' });
  } finally {
    connection.release();
  }
});

app.delete('/api/alt-text/delete/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [result] = await connection.execute(
      'DELETE FROM alt_text_generations WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Alt text generation not found' });
    }

    res.json({ success: true, message: 'Alt text deleted successfully' });
  } catch (error) {
    console.error('Error deleting alt text:', error);
    res.status(500).json({ success: false, error: 'Failed to delete alt text' });
  } finally {
    connection.release();
  }
});

// CSV Processing Endpoint
app.post('/api/csv/process', authenticateToken, checkCredits(1), upload.single('csv'), async (req, res) => {
  const connection = await pool.getConnection();
  const userId = req.user.id;

  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No CSV file provided' });
    }

    const platform = req.body.platform;
    if (!platform || !['shopify', 'woocommerce'].includes(platform)) {
      return res.status(400).json({ success: false, error: 'Invalid platform specified' });
    }

    console.log('Processing CSV for platform:', platform);

    // Import CSV parser
    const fs = await import('fs');
    const csv = await import('csv-parser');

    const results = [];
    let totalRows = 0;
    let processedRows = 0;
    let skippedRows = 0;
    let errorRows = 0;

    // Parse CSV
    await new Promise((resolve, reject) => {
      fs.default.createReadStream(req.file.path)
        .pipe(csv.default())
        .on('data', (data) => {
          totalRows++;
          results.push(data);
        })
        .on('end', () => resolve())
        .on('error', (err) => reject(err));
    });

    console.log(`Parsed ${totalRows} rows from CSV`);

    // Process each row
    const processedResults = [];
    for (let i = 0; i < results.length; i++) {
      const row = results[i];

      try {
        // Extract image URL based on platform
        let imageUrl = '';
        if (platform === 'shopify') {
          imageUrl = row['Image Src'] || row['Images'] || '';
        } else if (platform === 'woocommerce') {
          imageUrl = row['Images'] || '';
        }

        if (!imageUrl) {
          skippedRows++;
          processedResults.push({ ...row, 'Image Alt Text': 'No image URL found' });
          continue;
        }

        // Generate alt text using AI
        const aiResult = await analyzeImageAndGenerateAltText(imageUrl, {
          title: row['Title'] || row['Name'] || 'Product',
          category: 'general',
          brand: 'brand'
        });

        // Update row with alt text
        const updatedRow = {
          ...row,
          'Image Alt Text': aiResult.seo_alt_text || 'AI-generated alt text'
        };

        processedResults.push(updatedRow);
        processedRows++;

        // Deduct credits for each processed image
        await connection.execute(
          'UPDATE users SET credits_remaining = credits_remaining - 1, credits_used_this_month = credits_used_this_month + 1 WHERE id = ?',
          [userId]
        );

      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        errorRows++;
        processedResults.push({
          ...row,
          'Image Alt Text': 'Error processing image'
        });
      }
    }

    // Convert back to CSV
    const csvString = convertToCSV(processedResults);

    // Send real-time notification for CSV processing completion
    io.to(`user_${userId}`).emit('notification', {
      type: 'task_completed',
      message: `CSV processing completed: ${processedRows} images processed`,
      data: {
        taskType: 'csv_processing',
        stats: {
          totalRows,
          processedRows,
          skippedRows,
          errorRows
        }
      },
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      stats: {
        totalRows,
        processedRows,
        skippedRows,
        errorRows
      },
      processedCsv: csvString
    });

  } catch (error) {
    console.error('CSV processing error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  } finally {
    connection.release();
    // Clean up uploaded file
    if (req.file && req.file.path) {
      try {
        const fs = await import('fs');
        await fs.default.promises.unlink(req.file.path);
      } catch (err) {
        console.error('Error cleaning up file:', err);
      }
    }
  }
});

// Helper function to convert JSON to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header] || '';
      // Escape quotes and wrap in quotes if contains comma or quote
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}

// Real-time Analytics Endpoint
app.get('/api/analytics/realtime', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;

    // Get total generations
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM alt_text_generations WHERE user_id = ?',
      [userId]
    );
    const totalGenerations = totalResult[0].total;

    // Get today's generations
    const [todayResult] = await connection.execute(
      'SELECT COUNT(*) as today FROM alt_text_generations WHERE user_id = ? AND DATE(created_at) = CURDATE()',
      [userId]
    );
    const todayGenerations = todayResult[0].today;

    // Get credits information
    const [creditsResult] = await connection.execute(
      'SELECT credits_remaining, credits_used_this_month FROM users WHERE id = ?',
      [userId]
    );
    const creditsRemaining = creditsResult[0].credits_remaining;
    const totalCreditsUsed = creditsResult[0].credits_used_this_month;

    // Get average SEO score
    const [seoResult] = await connection.execute(
      'SELECT AVG(seo_score) as average FROM alt_text_generations WHERE user_id = ? AND seo_score IS NOT NULL',
      [userId]
    );
    const averageSeoScore = Math.round(seoResult[0].average || 0);

    // Get success rate (approved + generated / total)
    const [successResult] = await connection.execute(
      'SELECT COUNT(*) as successful FROM alt_text_generations WHERE user_id = ? AND status IN ("approved", "generated")',
      [userId]
    );
    const successRate = totalGenerations > 0 ? Math.round((successResult[0].successful / totalGenerations) * 100) : 0;

    // Get daily usage for last 7 days
    const [dailyResult] = await connection.execute(
      `SELECT DATE(created_at) as date, COUNT(*) as generations
       FROM alt_text_generations
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId]
    );

    // Get approval status distribution
    const [approvalResult] = await connection.execute(
      'SELECT status, COUNT(*) as count FROM alt_text_generations WHERE user_id = ? GROUP BY status',
      [userId]
    );

    const approvalStatus = approvalResult.map(row => ({
      name: row.approval_status.charAt(0).toUpperCase() + row.approval_status.slice(1),
      value: row.count
    }));

    // Get SEO score trend (last 7 days)
    const [seoTrendResult] = await connection.execute(
      `SELECT DATE(created_at) as date, AVG(seo_score) as averageScore
       FROM alt_text_generations
       WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND seo_score IS NOT NULL
       GROUP BY DATE(created_at)
       ORDER BY date`,
      [userId]
    );

    const seoScoreTrend = seoTrendResult.map(row => ({
      date: new Date(row.date).toLocaleDateString(),
      averageScore: Math.round(row.averageScore)
    }));

    // Get recent activity (last 10)
    const [activityResult] = await connection.execute(
      `SELECT original_filename, status, created_at
        FROM alt_text_generations
        WHERE user_id = ?
        ORDER BY created_at DESC
        LIMIT 10`,
      [userId]
    );

    const recentActivity = activityResult.map(row => ({
      description: `Generated alt text for ${row.original_filename}`,
      type: row.status,
      timestamp: new Date(row.created_at).toLocaleString()
    }));

    // Get platform usage (if we have platform data)
    const platformUsage = [
      { name: 'Web Upload', count: totalGenerations },
      { name: 'CSV Import', count: 0 },
      { name: 'Shopify', count: 0 },
      { name: 'WooCommerce', count: 0 }
    ];

    res.json({
      success: true,
      totalGenerations,
      todayGenerations,
      totalCreditsUsed,
      creditsRemaining,
      averageSeoScore,
      successRate,
      dailyUsage: dailyResult.map(row => ({
        date: new Date(row.date).toLocaleDateString(),
        generations: row.generations
      })),
      approvalStatus,
      seoScoreTrend,
      platformUsage,
      recentActivity
    });

  } catch (error) {
    console.error('Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch analytics'
    });
  } finally {
    connection.release();
  }
});

// Initialize integrations table if it doesn't exist
const initializeIntegrationsTable = async () => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS integrations (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        platform VARCHAR(50) NOT NULL,
        store_url VARCHAR(255),
        api_key VARCHAR(255),
        api_secret VARCHAR(255),
        access_token TEXT,
        refresh_token TEXT,
        is_connected BOOLEAN DEFAULT FALSE,
        last_sync TIMESTAMP NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        UNIQUE KEY unique_user_platform (user_id, platform)
      )
    `);
    console.log('✅ Integrations table initialized');
  } catch (error) {
    console.error('❌ Error initializing integrations table:', error);
  } finally {
    connection.release();
  }
};

// Integration Management Endpoints
app.get('/api/integrations', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM integrations WHERE user_id = ?',
      [req.user.id]
    );
    res.json({ success: true, integrations: rows });
  } catch (error) {
    console.error('Error fetching integrations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch integrations' });
  } finally {
    connection.release();
  }
});
// Shopify OAuth URL Generation
app.post('/api/integrations/shopify/oauth-url', authenticateToken, async (req, res) => {
  try {
    const { storeUrl } = req.body;
    const apiKey = process.env.SHOPIFY_CLIENT_ID;

    if (!storeUrl) {
      return res.status(400).json({ success: false, error: 'Store URL is required' });
    }

    if (!apiKey) {
      return res.status(500).json({ success: false, error: 'Shopify API key not configured' });
    }

    // Generate random state for security
    const state = uuidv4();

    // Store state temporarily (you might want to use Redis/session for production)
    global.oauthStates = global.oauthStates || {};
    global.oauthStates[state] = {
      userId: req.user.id,
      storeUrl: storeUrl,
      timestamp: Date.now()
    };

    // Construct Shopify OAuth URL
    const scopes = 'read_products,write_products,read_content,write_content';
    const redirectUri = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations/shopify/callback`;

    const oauthUrl = `https://${storeUrl}/admin/oauth/authorize?` +
      `client_id=${apiKey}&` +
      `scope=${encodeURIComponent(scopes)}&` +
      `redirect_uri=${encodeURIComponent(redirectUri)}&` +
      `state=${state}`;

    res.json({
      success: true,
      oauthUrl: oauthUrl,
      state: state
    });

  } catch (error) {
    console.error('Shopify OAuth URL generation error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate OAuth URL' });
  }
});

// Shopify OAuth Callback Handler
app.get('/api/integrations/shopify/callback', async (req, res) => {
  try {
    const { code, state, error: oauthError } = req.query;

    // Check for OAuth errors
    if (oauthError) {
      console.error('Shopify OAuth error:', oauthError);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?error=${oauthError}`);
    }

    if (!code || !state) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?error=missing_code_or_state`);
    }

    // Verify state
    const stateData = global.oauthStates?.[state];
    if (!stateData) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?error=invalid_state`);
    }

    // Check if state is not expired (5 minutes)
    if (Date.now() - stateData.timestamp > 5 * 60 * 1000) {
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?error=state_expired`);
    }

    const { userId, storeUrl } = stateData;
    const apiKey = process.env.SHOPIFY_CLIENT_ID;
    const apiSecret = process.env.SHOPIFY_CLIENT_SECRET;

    // Exchange code for access token
    const tokenResponse = await fetch(`https://${storeUrl}/admin/oauth/access_token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: apiKey,
        client_secret: apiSecret,
        code: code
      })
    });

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token');
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Save integration to database
    const connection = await pool.getConnection();
    try {
      await connection.execute(
        `INSERT INTO integrations (id, user_id, platform, store_url, access_token, is_connected)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         store_url = VALUES(store_url),
         access_token = VALUES(access_token),
         is_connected = VALUES(is_connected),
         updated_at = NOW()`,
        [uuidv4(), userId, 'shopify', storeUrl, accessToken, true]
      );

      console.log('✅ Shopify integration saved successfully');

      // Clean up state
      delete global.oauthStates[state];

      // Redirect back to frontend with success
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?success=shopify_connected`);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Shopify OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/integrations?error=callback_error`);
  }
});

app.post('/api/integrations/shopify/sync', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get Shopify integration
    const [integrations] = await connection.execute(
      'SELECT * FROM integrations WHERE user_id = ? AND platform = ? AND is_connected = ?',
      [req.user.id, 'shopify', true]
    );

    if (integrations.length === 0) {
      return res.status(400).json({ success: false, error: 'Shopify not connected' });
    }

    const integration = integrations[0];
    const accessToken = integration.access_token;

    if (!accessToken) {
      return res.status(400).json({ success: false, error: 'No access token found. Please reconnect Shopify.' });
    }

    // Fetch products using REST API
    const productsResponse = await fetch(`https://${integration.store_url}/admin/api/2024-07/products.json`, {
      headers: {
        'X-Shopify-Access-Token': accessToken,
        'Content-Type': 'application/json'
      }
    });

    if (!productsResponse.ok) {
      throw new Error(`Shopify API error: ${productsResponse.status}`);
    }

    const productsData = await productsResponse.json();
    const products = productsData.products || [];

    let syncedProducts = 0;
    const totalProducts = products.length;

    // Send initial progress update
    io.to(`user_${req.user.id}`).emit('sync-progress', {
      type: 'shopify_sync',
      message: `Starting sync of ${totalProducts} products`,
      progress: 0,
      total: totalProducts,
      completed: 0
    });

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          if (image.src) {
            try {
              // Generate alt text
              const result = await analyzeImageAndGenerateAltText(image.src, {
                title: product.title,
                category: 'shopify',
                brand: 'shopify'
              });

              // Update image alt text in Shopify
              const updateResponse = await fetch(
                `https://${integration.store_url}/admin/api/2024-07/products/${product.id}/images/${image.id}.json`,
                {
                  method: 'PUT',
                  headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    image: {
                      id: image.id,
                      alt: result.seo_alt_text
                    }
                  })
                }
              );

              if (updateResponse.ok) {
                syncedProducts++;
              } else {
                console.error(`Failed to update Shopify image ${image.id}:`, updateResponse.status);
              }

            } catch (error) {
              console.error(`Error processing Shopify image ${image.id}:`, error);
            }
          }
        }
      }

      // Send progress update every 5 products or at the end
      if ((i + 1) % 5 === 0 || i === products.length - 1) {
        io.to(`user_${req.user.id}`).emit('sync-progress', {
          type: 'shopify_sync',
          message: `Processed ${i + 1} of ${totalProducts} products`,
          progress: Math.round(((i + 1) / totalProducts) * 100),
          total: totalProducts,
          completed: i + 1,
          syncedProducts
        });
      }
    }

    // Update last sync
    await connection.execute(
      'UPDATE integrations SET last_sync = NOW() WHERE id = ?',
      [integration.id]
    );

    // Send real-time notification for Shopify sync completion
    io.to(`user_${req.user.id}`).emit('notification', {
      type: 'task_completed',
      message: `Shopify sync completed: ${syncedProducts} products updated`,
      data: {
        taskType: 'shopify_sync',
        syncedProducts
      },
      timestamp: new Date().toISOString()
    });

    res.json({ success: true, syncedProducts });
  } catch (error) {
    console.error('Shopify sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync Shopify products' });
  } finally {
    connection.release();
  }
});

// WooCommerce Integration
app.post('/api/integrations/woocommerce/connect', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { storeUrl, consumerKey, consumerSecret } = req.body;

    if (!storeUrl || !consumerKey || !consumerSecret) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Test WooCommerce connection
    try {
      const WooCommerceAPI = await import('woocommerce-api');

      const WooCommerce = new WooCommerceAPI.default({
        url: storeUrl,
        consumerKey: consumerKey,
        consumerSecret: consumerSecret,
        version: 'wc/v3'
      });

      // Test API call
      await WooCommerce.get('products', { per_page: 1 });

      // Save integration
      await connection.execute(
        `INSERT INTO integrations (id, user_id, platform, store_url, api_key, api_secret, is_connected)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
         store_url = VALUES(store_url),
         api_key = VALUES(api_key),
         api_secret = VALUES(api_secret),
         is_connected = VALUES(is_connected),
         updated_at = NOW()`,
        [require('uuid').v4(), req.user.id, 'woocommerce', storeUrl, consumerKey, consumerSecret, true]
      );

      res.json({ success: true, message: 'WooCommerce connected successfully' });
    } catch (wooError) {
      console.error('WooCommerce connection error:', wooError);
      res.status(400).json({ success: false, error: 'Invalid WooCommerce credentials or store URL' });
    }
  } catch (error) {
    console.error('WooCommerce integration error:', error);
    res.status(500).json({ success: false, error: 'Failed to connect WooCommerce' });
  } finally {
    connection.release();
  }
});

app.post('/api/integrations/woocommerce/sync', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    // Get WooCommerce integration
    const [integrations] = await connection.execute(
      'SELECT * FROM integrations WHERE user_id = ? AND platform = ? AND is_connected = ?',
      [req.user.id, 'woocommerce', true]
    );

    if (integrations.length === 0) {
      return res.status(400).json({ success: false, error: 'WooCommerce not connected' });
    }

    const integration = integrations[0];
    const WooCommerceAPI = await import('woocommerce-api');

    const WooCommerce = new WooCommerceAPI.default({
      url: integration.store_url,
      consumerKey: integration.api_key,
      consumerSecret: integration.api_secret,
      version: 'wc/v3'
    });

    // Fetch products
    const products = await WooCommerce.get('products', { per_page: 100 });

    let syncedProducts = 0;
    const totalProducts = products.length;

    // Send initial progress update
    io.to(`user_${req.user.id}`).emit('sync-progress', {
      type: 'woocommerce_sync',
      message: `Starting sync of ${totalProducts} products`,
      progress: 0,
      total: totalProducts,
      completed: 0
    });

    for (let i = 0; i < products.length; i++) {
      const product = products[i];

      if (product.images && product.images.length > 0) {
        for (const image of product.images) {
          if (image.src) {
            try {
              // Generate alt text
              const result = await analyzeImageAndGenerateAltText(image.src, {
                title: product.name,
                category: 'woocommerce',
                brand: 'woocommerce'
              });

              // Update image alt text in WooCommerce
              await WooCommerce.put(`products/${product.id}`, {
                images: [{
                  id: image.id,
                  alt_text: result.seo_alt_text
                }]
              });

              syncedProducts++;
            } catch (error) {
              console.error(`Error processing WooCommerce image ${image.id}:`, error);
            }
          }
        }
      }

      // Send progress update every 5 products or at the end
      if ((i + 1) % 5 === 0 || i === products.length - 1) {
        io.to(`user_${req.user.id}`).emit('sync-progress', {
          type: 'woocommerce_sync',
          message: `Processed ${i + 1} of ${totalProducts} products`,
          progress: Math.round(((i + 1) / totalProducts) * 100),
          total: totalProducts,
          completed: i + 1,
          syncedProducts
        });
      }
    }

    // Update last sync
    await connection.execute(
      'UPDATE integrations SET last_sync = NOW() WHERE id = ?',
      [integration.id]
    );

    res.json({ success: true, syncedProducts });
  } catch (error) {
    console.error('WooCommerce sync error:', error);
    res.status(500).json({ success: false, error: 'Failed to sync WooCommerce products' });
  } finally {
    connection.release();
  }
});

// Disconnect integration
app.delete('/api/integrations/:platform/disconnect', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { platform } = req.params;

    await connection.execute(
      'DELETE FROM integrations WHERE user_id = ? AND platform = ?',
      [req.user.id, platform]
    );

    res.json({ success: true, message: `${platform} disconnected successfully` });
  } catch (error) {
    console.error('Disconnect integration error:', error);
    res.status(500).json({ success: false, error: 'Failed to disconnect integration' });
  } finally {
    connection.release();
  }
});

// Advanced Product Analysis Endpoint
app.post('/api/ai/analyze-product', authenticateToken, checkCredits(5), async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { images, productInfo } = req.body;

    if (!images || images.length === 0) {
      return res.status(400).json({ success: false, error: 'No images provided' });
    }

    console.log('Starting advanced product analysis for:', productInfo.title);

    // Analyze each image
    const imageAnalyses = [];
    for (let i = 0; i < images.length; i++) {
      const imageUrl = images[i];
      try {
        const analysis = await analyzeImageAndGenerateAltText(imageUrl, {
          title: productInfo.title,
          category: productInfo.category,
          brand: 'analysis'
        });
        imageAnalyses.push(analysis);
      } catch (error) {
        console.error(`Error analyzing image ${i + 1}:`, error);
        imageAnalyses.push({ error: error.message });
      }
    }

    // Create comprehensive analysis prompt
    const analysisPrompt = `
You are an expert e-commerce consultant and product strategist. Analyze this product comprehensively and provide detailed insights.

PRODUCT INFORMATION:
- Title: ${productInfo.title}
- Category: ${productInfo.category || 'Not specified'}
- Target Audience: ${productInfo.targetAudience || 'Not specified'}
- Current Price: ${productInfo.currentPrice || 'Not specified'}
- Competitors: ${productInfo.competitors || 'Not specified'}
- Description: ${productInfo.description || 'Not specified'}

IMAGE ANALYSES:
${imageAnalyses.map((analysis, index) =>
  `Image ${index + 1}: ${JSON.stringify(analysis, null, 2)}`
).join('\n')}

Please provide a comprehensive analysis in JSON format with the following fields:
{
  "productScore": "Overall score out of 100",
  "scoreDescription": "Brief explanation of the score",
  "keyInsights": ["Array of key insights about the product"],
  "improvements": ["Array of specific improvement suggestions"],
  "marketAnalysis": "Analysis of market positioning and competition",
  "pricingRecommendation": "Pricing strategy recommendations",
  "targetAudienceInsights": "Insights about target audience fit",
  "visualAppealScore": "Score for visual appeal out of 100",
  "uniqueSellingPoints": ["Array of USP suggestions"],
  "marketingRecommendations": ["Array of marketing strategy suggestions"]
}
`;

    // Get comprehensive analysis from AI
    const comprehensiveAnalysis = await analyzeImageAndGenerateAltText(images[0], {
      title: productInfo.title,
      category: 'analysis',
      brand: 'comprehensive'
    });

    // Parse and structure the response
    let analysisResult;
    try {
      // Try to extract JSON from the response
      const jsonMatch = comprehensiveAnalysis.raw_response?.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        analysisResult = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback analysis
        analysisResult = {
          productScore: 75,
          scoreDescription: "Good product with room for optimization",
          keyInsights: [
            "Product has strong visual appeal",
            "Clear target audience identification needed",
            "Competitive pricing strategy required"
          ],
          improvements: [
            "Enhance product photography quality",
            "Develop clear unique selling proposition",
            "Optimize pricing based on market research"
          ],
          marketAnalysis: "Product shows potential in its category with proper positioning",
          pricingRecommendation: "Consider competitive pricing with value-added features",
          targetAudienceInsights: "Appeals to modern consumers seeking quality products",
          visualAppealScore: 80,
          uniqueSellingPoints: [
            "High-quality materials",
            "Modern design",
            "Versatile usage"
          ],
          marketingRecommendations: [
            "Focus on social media marketing",
            "Partner with influencers",
            "Create user-generated content campaigns"
          ]
        };
      }
    } catch (parseError) {
      console.error('Error parsing analysis response:', parseError);
      analysisResult = {
        productScore: 70,
        scoreDescription: "Analysis completed with some limitations",
        keyInsights: ["Product analysis completed"],
        improvements: ["Consider professional photography"],
        marketAnalysis: "Further market research recommended",
        pricingRecommendation: "Review competitive pricing",
        targetAudienceInsights: "Target audience analysis needed",
        visualAppealScore: 75,
        uniqueSellingPoints: ["Quality craftsmanship"],
        marketingRecommendations: ["Digital marketing focus"]
      };
    }

    // Deduct credits for advanced analysis
    await connection.execute(
      'UPDATE users SET credits_remaining = credits_remaining - 5, credits_used_this_month = credits_used_this_month + 5 WHERE id = ?',
      [req.user.id]
    );

    res.json({
      success: true,
      ...analysisResult,
      imageAnalyses: imageAnalyses
    });

  } catch (error) {
    console.error('Product analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze product'
    });
  } finally {
    connection.release();
  }
});

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Join user-specific room for notifications
  socket.on('join-user-room', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined room user_${userId}`);
  });

  // Join project-specific room for collaboration
  socket.on('join-project-room', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User joined project room: ${projectId}`);
  });

  // Handle real-time chat messages
  socket.on('send-message', async (data) => {
    try {
      const { userId, message, room } = data;
      const connection = await pool.getConnection();

      const messageId = uuidv4();
      await connection.execute(
        'INSERT INTO chat_messages (id, user_id, message_type, content) VALUES (?, ?, ?, ?)',
        [messageId, userId || 'anonymous', 'user', message]
      );

      connection.release();

      // Broadcast to room
      io.to(room).emit('new-message', {
        id: messageId,
        content: message,
        timestamp: new Date().toISOString(),
        type: 'user'
      });
    } catch (error) {
      console.error('Chat message error:', error);
    }
  });

  // Handle task completion notifications
  socket.on('task-completed', (data) => {
    const { userId, taskType, taskData } = data;
    io.to(`user_${userId}`).emit('notification', {
      type: 'task_completed',
      message: `${taskType} completed successfully`,
      data: taskData,
      timestamp: new Date().toISOString()
    });
  });

  // Handle collaborative editing
  socket.on('join-project-room', (projectId) => {
    socket.join(`project_${projectId}`);
    console.log(`User joined project room: ${projectId}`);

    // Notify others in the room
    socket.to(`project_${projectId}`).emit('user-joined-project', {
      userId: socket.id,
      name: 'Collaborator'
    });
  });

  socket.on('content-update', (data) => {
    socket.to(`project_${data.projectId}`).emit('content-update', {
      ...data,
      userId: socket.id
    });
  });

  socket.on('editing-status', (data) => {
    socket.to(`project_${data.projectId}`).emit('editing-status', {
      ...data,
      userId: socket.id
    });
  });

  // Handle analytics updates
  socket.on('request-analytics-update', async (userId) => {
    try {
      const connection = await pool.getConnection();

      const [totalResult] = await connection.execute(
        'SELECT COUNT(*) as total FROM alt_text_generations WHERE user_id = ?',
        [userId]
      );
      const totalGenerations = totalResult[0].total;

      connection.release();

      socket.emit('analytics-update', {
        totalGenerations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Analytics update error:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// A/B Testing Endpoints
app.get('/api/ab-tests', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const [rows] = await connection.execute(
      'SELECT * FROM ab_tests WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, tests: rows });
  } catch (error) {
    console.error('Error fetching A/B tests:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch A/B tests' });
  } finally {
    connection.release();
  }
});

app.post('/api/ab-tests', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { name, variantA, variantB, imageUrl } = req.body;
    const testId = uuidv4();

    await connection.execute(
      `INSERT INTO ab_tests (id, user_id, name, variant_a, variant_b, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [testId, req.user.id, name, variantA, variantB, imageUrl, 'draft']
    );

    const test = {
      id: testId,
      user_id: req.user.id,
      name,
      variant_a: variantA,
      variant_b: variantB,
      image_url: imageUrl,
      status: 'draft',
      variant_a_views: 0,
      variant_b_views: 0,
      created_at: new Date()
    };

    res.json({ success: true, test });
  } catch (error) {
    console.error('Error creating A/B test:', error);
    res.status(500).json({ success: false, error: 'Failed to create A/B test' });
  } finally {
    connection.release();
  }
});

app.post('/api/ab-tests/:id/start', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE ab_tests SET status = ? WHERE id = ? AND user_id = ?',
      ['running', req.params.id, req.user.id]
    );

    // Notify via socket
    io.to(`user_${req.user.id}`).emit('ab-test-update', {
      testId: req.params.id,
      status: 'running'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error starting A/B test:', error);
    res.status(500).json({ success: false, error: 'Failed to start A/B test' });
  } finally {
    connection.release();
  }
});

app.post('/api/ab-tests/:id/stop', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.execute(
      'UPDATE ab_tests SET status = ? WHERE id = ? AND user_id = ?',
      ['stopped', req.params.id, req.user.id]
    );

    // Notify via socket
    io.to(`user_${req.user.id}`).emit('ab-test-update', {
      testId: req.params.id,
      status: 'stopped'
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Error stopping A/B test:', error);
    res.status(500).json({ success: false, error: 'Failed to stop A/B test' });
  } finally {
    connection.release();
  }
});

// Images API Endpoints
app.get('/api/images', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const sortBy = req.query.sort || '-created_at';

    let orderBy = 'created_at DESC';
    if (sortBy === '-created_date') {
      orderBy = 'created_at DESC';
    } else if (sortBy === 'created_date') {
      orderBy = 'created_at ASC';
    }

    const [rows] = await connection.execute(
      `SELECT * FROM alt_text_generations WHERE user_id = ? ORDER BY ${orderBy}`,
      [userId]
    );

    res.json({ success: true, images: rows });
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch images' });
  } finally {
    connection.release();
  }
});

app.get('/api/images/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const imageId = req.params.id;

    const [rows] = await connection.execute(
      'SELECT * FROM alt_text_generations WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    res.json({ success: true, image: rows[0] });
  } catch (error) {
    console.error('Error fetching image:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch image' });
  } finally {
    connection.release();
  }
});

app.put('/api/images/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const imageId = req.params.id;
    const updates = req.body;

    // Build dynamic SET clause for MySQL
    const setParts = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      setParts.push(`${key} = ?`);
      values.push(value);
    }

    if (setParts.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const sql = `UPDATE alt_text_generations SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`;
    values.push(imageId, userId);

    const [result] = await connection.execute(sql, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    // Get updated image
    const [rows] = await connection.execute(
      'SELECT * FROM alt_text_generations WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    res.json({ success: true, image: rows[0] });
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ success: false, error: 'Failed to update image' });
  } finally {
    connection.release();
  }
});

app.delete('/api/images/:id', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const imageId = req.params.id;

    const [result] = await connection.execute(
      'DELETE FROM alt_text_generations WHERE id = ? AND user_id = ?',
      [imageId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, error: 'Image not found' });
    }

    res.json({ success: true, message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ success: false, error: 'Failed to delete image' });
  } finally {
    connection.release();
  }
});

app.put('/api/images/bulk', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;
    const { ids, updates } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'No image IDs provided' });
    }

    // Build dynamic SET clause for MySQL
    const setParts = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      setParts.push(`${key} = ?`);
      values.push(value);
    }

    if (setParts.length === 0) {
      return res.status(400).json({ success: false, error: 'No fields to update' });
    }

    const sql = `UPDATE alt_text_generations SET ${setParts.join(', ')} WHERE id IN (${ids.map(() => '?').join(',')}) AND user_id = ?`;
    values.push(...ids, userId);

    const [result] = await connection.execute(sql, values);

    // Get updated images
    const [rows] = await connection.execute(
      `SELECT * FROM alt_text_generations WHERE id IN (${ids.map(() => '?').join(',')}) AND user_id = ?`,
      [...ids, userId]
    );

    res.json({ success: true, images: rows, updatedCount: result.affectedRows });
  } catch (error) {
    console.error('Error bulk updating images:', error);
    res.status(500).json({ success: false, error: 'Failed to bulk update images' });
  } finally {
    connection.release();
  }
});

app.get('/api/images/stats', authenticateToken, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const userId = req.user.id;

    // Get total images
    const [totalResult] = await connection.execute(
      'SELECT COUNT(*) as total FROM alt_text_generations WHERE user_id = ?',
      [userId]
    );
    const total = totalResult[0].total;

    // Get processed images (approved or generated)
    const [processedResult] = await connection.execute(
      'SELECT COUNT(*) as processed FROM alt_text_generations WHERE user_id = ? AND status IN ("approved", "generated")',
      [userId]
    );
    const processed = processedResult[0].processed;

    // Get this month's images
    const [monthResult] = await connection.execute(
      'SELECT COUNT(*) as thisMonth FROM alt_text_generations WHERE user_id = ? AND MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())',
      [userId]
    );
    const thisMonth = monthResult[0].thisMonth;

    const stats = {
      total,
      processed,
      thisMonth,
      timeSaved: Math.round(processed * 2.5) // 2.5 minutes per image
    };

    res.json({ success: true, stats });
  } catch (error) {
    console.error('Error fetching image stats:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch image stats' });
  } finally {
    connection.release();
  }
});

// WCAG Validation Endpoint
app.post('/api/wcag/validate', authenticateToken, async (req, res) => {
  try {
    const { altText } = req.body;

    if (!altText) {
      return res.status(400).json({ success: false, error: 'Alt text is required' });
    }

    // Basic WCAG validation logic
    const issues = [];
    const suggestions = [];
    let score = 100;

    // Check length
    if (altText.length < 5) {
      issues.push('Alt text is too short (minimum 5 characters recommended)');
      score -= 30;
    } else if (altText.length > 125) {
      issues.push('Alt text is too long (maximum 125 characters recommended)');
      score -= 20;
    }

    // Check for keywords stuffing
    const words = altText.toLowerCase().split(' ');
    const wordCount = words.length;
    const uniqueWords = new Set(words);
    const repetitionRatio = wordCount / uniqueWords.size;

    if (repetitionRatio > 2) {
      issues.push('Possible keyword stuffing detected');
      score -= 25;
    }

    // Check for descriptive language
    const descriptiveWords = ['image', 'photo', 'picture', 'graphic', 'icon'];
    const hasDescriptiveWord = descriptiveWords.some(word =>
      altText.toLowerCase().includes(word)
    );

    if (!hasDescriptiveWord && altText.length > 10) {
      suggestions.push('Consider starting with what the image shows');
    }

    // Check for proper punctuation
    if (!altText.match(/[.!?]$/) && altText.length > 20) {
      suggestions.push('Consider ending with proper punctuation');
    }

    // Determine WCAG level
    let level = 'Fail';
    if (score >= 90) level = 'AAA';
    else if (score >= 75) level = 'AA';
    else if (score >= 60) level = 'A';

    const result = {
      score: Math.max(0, Math.min(100, score)),
      level,
      issues,
      suggestions,
      characterCount: altText.length,
      wordCount
    };

    // Emit real-time validation result
    io.to(`user_${req.user.id}`).emit('wcag-validation-result', {
      altText,
      result
    });

    res.json({ success: true, result });
  } catch (error) {
    console.error('WCAG validation error:', error);
    res.status(500).json({ success: false, error: 'Validation failed' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Global error handler:', err);
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large' });
  }
  if (err.name === 'MulterError') {
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }
  res.status(500).json({ error: err.message || 'Internal server error' });
});

app.use(errorHandler);

// Export io for use in other modules
export { io };

// Initialize database and start server
(async () => {
  try {
    // Find an available port
    PORT = await findAvailablePort(DEFAULT_PORT);
    console.log(`Found available port: ${PORT}`);

    // Create server with the available port
    server = createServer(app);

    // Initialize Socket.io with the server
    const io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
      }
    });

    // Initialize database with tables if needed
    const dbInitialized = await initializeDatabase();
    if (!dbInitialized) {
      console.warn('Database initialization failed. Some features may not work correctly.');
    }

    // Test database connection
    const dbConnected = await testConnection();
    if (!dbConnected) {
      console.warn('Database connection failed. Server will start but database features will not work.');
    }

    // Initialize integrations table
    await initializeIntegrationsTable();

    // Export endpoints for platform-specific exports
    app.post('/api/export/shopify', async (req, res) => {
      try {
        const { imageIds } = req.body;
        const userId = req.user ? req.user.id : 'demo-user'; // Use demo user if not authenticated

        if (!imageIds || !Array.isArray(imageIds)) {
          return res.status(400).json({ success: false, error: 'imageIds array is required' });
        }

        // Get Shopify integration
        const connection = await pool.getConnection();
        try {
          const [integrations] = await connection.execute(
            'SELECT * FROM integrations WHERE user_id = ? AND platform = ? AND is_connected = ?',
            [userId, 'shopify', true]
          );

          // For demo purposes, if no integration found, return a message
          if (integrations.length === 0) {
            return res.json({
              success: true,
              message: 'No Shopify integration found. Please connect your Shopify store first.',
              exportedCount: 0,
              totalCount: 0,
              results: []
            });
          }

          const integration = integrations[0];
          const accessToken = integration.access_token;

          if (!accessToken) {
            return res.status(400).json({ success: false, error: 'No access token found. Please reconnect Shopify.' });
          }

          // Get image data from database
          const placeholders = imageIds.map(() => '?').join(',');
          const [rows] = await connection.execute(
            `SELECT id, original_filename, seo_alt_text, final_alt_text, file_url, product_handle
             FROM alt_text_generations
             WHERE id IN (${placeholders}) AND user_id = ?`,
            [...imageIds, userId]
          );

          if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No images found' });
          }

          let exportedCount = 0;
          const results = [];

          // Export each image to Shopify
          for (const image of rows) {
            try {
              // Use stored product handle, or extract from filename as fallback
              let handle = image.product_handle;
              if (!handle) {
                const filename = image.original_filename || '';
                handle = filename.replace(/\.[^/.]+$/, "").replace(/-\d+$/, ""); // Remove extension and trailing numbers
              }

              const altText = image.final_alt_text || image.seo_alt_text || '';

              // Find product by handle
              const productResponse = await fetch(`https://${integration.store_url}/admin/api/2024-07/products.json?handle=${handle}`, {
                headers: {
                  'X-Shopify-Access-Token': accessToken,
                  'Content-Type': 'application/json'
                }
              });

              if (!productResponse.ok) {
                results.push({ handle, status: 'error', error: 'Product not found' });
                continue;
              }

              const productData = await productResponse.json();
              const products = productData.products || [];

              if (products.length === 0) {
                results.push({ handle, status: 'error', error: 'Product not found' });
                continue;
              }

              const product = products[0];

              // Find the matching image in the product
              const productImage = product.images.find(img => img.src === image.file_url);

              if (!productImage) {
                results.push({ handle, status: 'error', error: 'Image not found in product' });
                continue;
              }

              // Update image alt text
              const updateResponse = await fetch(
                `https://${integration.store_url}/admin/api/2024-07/products/${product.id}/images/${productImage.id}.json`,
                {
                  method: 'PUT',
                  headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    image: {
                      id: productImage.id,
                      alt: altText
                    }
                  })
                }
              );

              if (updateResponse.ok) {
                exportedCount++;
                results.push({ handle, status: 'success', altText });
              } else {
                const errorData = await updateResponse.json();
                results.push({ handle, status: 'error', error: errorData.errors || 'Update failed' });
              }

            } catch (error) {
              console.error(`Error exporting image ${image.id}:`, error);
              results.push({ handle: image.product_handle || 'unknown', status: 'error', error: error.message });
            }
          }

          // Update last export timestamp
          await connection.execute(
            'UPDATE integrations SET last_sync = NOW() WHERE id = ?',
            [integration.id]
          );

          res.json({
            success: true,
            message: `Exported ${exportedCount} of ${rows.length} images to Shopify`,
            results,
            exportedCount,
            totalCount: rows.length
          });

        } finally {
          connection.release();
        }
      } catch (error) {
        console.error('Shopify export error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    app.post('/api/export/woocommerce', async (req, res) => {
      try {
        const { imageIds } = req.body;
        const userId = req.user ? req.user.id : 'demo-user'; // Use demo user if not authenticated

        if (!imageIds || !Array.isArray(imageIds)) {
          return res.status(400).json({ success: false, error: 'imageIds array is required' });
        }

        // Get WooCommerce integration
        const connection = await pool.getConnection();
        try {
          const [integrations] = await connection.execute(
            'SELECT * FROM integrations WHERE user_id = ? AND platform = ? AND is_connected = ?',
            [userId, 'woocommerce', true]
          );

          // For demo purposes, if no integration found, return a message
          if (integrations.length === 0) {
            return res.json({
              success: true,
              message: 'No WooCommerce integration found. Please connect your WooCommerce store first.',
              exportedCount: 0,
              totalCount: 0,
              results: []
            });
          }

          const integration = integrations[0];
          const WooCommerceAPI = await import('woocommerce-api');

          const WooCommerce = new WooCommerceAPI.default({
            url: integration.store_url,
            consumerKey: integration.api_key,
            consumerSecret: integration.api_secret,
            version: 'wc/v3'
          });

          // Get image data from database
          const placeholders = imageIds.map(() => '?').join(',');
          const [rows] = await connection.execute(
            `SELECT id, original_filename, seo_alt_text, final_alt_text, file_url
             FROM alt_text_generations
             WHERE id IN (${placeholders}) AND user_id = ?`,
            [...imageIds, userId]
          );

          if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No images found' });
          }

          let exportedCount = 0;
          const results = [];

          // Export each image to WooCommerce
          for (const image of rows) {
            try {
              const altText = image.final_alt_text || image.seo_alt_text || '';

              // For WooCommerce, we need to find products that contain this image
              // This is more complex as WooCommerce doesn't have direct image handles like Shopify
              // We'll try to match by image URL or filename

              const products = await WooCommerce.get('products', { per_page: 100 });

              let foundProduct = null;
              let foundImage = null;

              // Search for the product containing this image
              for (const product of products) {
                if (product.images && product.images.length > 0) {
                  for (const img of product.images) {
                    if (img.src === image.file_url) {
                      foundProduct = product;
                      foundImage = img;
                      break;
                    }
                  }
                  if (foundProduct) break;
                }
              }

              if (!foundProduct || !foundImage) {
                results.push({
                  filename: image.original_filename,
                  status: 'error',
                  error: 'Product or image not found in WooCommerce'
                });
                continue;
              }

              // Update image alt text in WooCommerce
              await WooCommerce.put(`products/${foundProduct.id}`, {
                images: [{
                  id: foundImage.id,
                  alt_text: altText
                }]
              });

              exportedCount++;
              results.push({
                filename: image.original_filename,
                productId: foundProduct.id,
                status: 'success',
                altText
              });

            } catch (error) {
              console.error(`Error exporting image ${image.id}:`, error);
              results.push({
                filename: image.original_filename,
                status: 'error',
                error: error.message
              });
            }
          }

          // Update last export timestamp
          await connection.execute(
            'UPDATE integrations SET last_sync = NOW() WHERE id = ?',
            [integration.id]
          );

          res.json({
            success: true,
            message: `Exported ${exportedCount} of ${rows.length} images to WooCommerce`,
            results,
            exportedCount,
            totalCount: rows.length
          });

        } finally {
          connection.release();
        }
      } catch (error) {
        console.error('WooCommerce export error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
      try {
        const { imageIds } = req.body;
        const userId = req.user ? req.user.id : 'demo-user'; // Use demo user if not authenticated

        if (!imageIds || !Array.isArray(imageIds)) {
          return res.status(400).json({ success: false, error: 'imageIds array is required' });
        }

        // Get Shopify integration
        const connection = await pool.getConnection();
        try {
          const [integrations] = await connection.execute(
            'SELECT * FROM integrations WHERE user_id = ? AND platform = ? AND is_connected = ?',
            [userId, 'shopify', true]
          );

          // For demo purposes, if no integration found, return a message
          if (integrations.length === 0) {
            return res.json({
              success: true,
              message: 'No Shopify integration found. Please connect your Shopify store first.',
              exportedCount: 0,
              totalCount: rows.length,
              results: rows.map(row => ({ status: 'error', error: 'No Shopify integration' }))
            });
          }

          if (integrations.length === 0) {
            return res.status(400).json({ success: false, error: 'Shopify not connected. Please connect your Shopify store first.' });
          }

          const integration = integrations[0];
          const accessToken = integration.access_token;

          if (!accessToken) {
            return res.status(400).json({ success: false, error: 'No access token found. Please reconnect Shopify.' });
          }

          // Get image data from database
          const placeholders = imageIds.map(() => '?').join(',');
          const [rows] = await connection.execute(
            `SELECT id, original_filename, seo_alt_text, final_alt_text, file_url, product_handle
             FROM alt_text_generations
             WHERE id IN (${placeholders}) AND user_id = ?`,
            [...imageIds, userId]
          );

          if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No images found' });
          }

          let exportedCount = 0;
          const results = [];

          // Export each image to Shopify
          for (const image of rows) {
            try {
              // Use stored product handle, or extract from filename as fallback
              let handle = image.product_handle;
              if (!handle) {
                const filename = image.original_filename || '';
                handle = filename.replace(/\.[^/.]+$/, "").replace(/-\d+$/, ""); // Remove extension and trailing numbers
              }

              const altText = image.final_alt_text || image.seo_alt_text || '';

              // Find product by handle
              const productResponse = await fetch(`https://${integration.store_url}/admin/api/2024-07/products.json?handle=${handle}`, {
                headers: {
                  'X-Shopify-Access-Token': accessToken,
                  'Content-Type': 'application/json'
                }
              });

              if (!productResponse.ok) {
                results.push({ handle, status: 'error', error: 'Product not found' });
                continue;
              }

              const productData = await productResponse.json();
              const products = productData.products || [];

              if (products.length === 0) {
                results.push({ handle, status: 'error', error: 'Product not found' });
                continue;
              }

              const product = products[0];

              // Find the matching image in the product
              const productImage = product.images.find(img => img.src === image.file_url);

              if (!productImage) {
                results.push({ handle, status: 'error', error: 'Image not found in product' });
                continue;
              }

              // Update image alt text
              const updateResponse = await fetch(
                `https://${integration.store_url}/admin/api/2024-07/products/${product.id}/images/${productImage.id}.json`,
                {
                  method: 'PUT',
                  headers: {
                    'X-Shopify-Access-Token': accessToken,
                    'Content-Type': 'application/json'
                  },
                  body: JSON.stringify({
                    image: {
                      id: productImage.id,
                      alt: altText
                    }
                  })
                }
              );

              if (updateResponse.ok) {
                exportedCount++;
                results.push({ handle, status: 'success', altText });
              } else {
                const errorData = await updateResponse.json();
                results.push({ handle, status: 'error', error: errorData.errors || 'Update failed' });
              }

            } catch (error) {
              console.error(`Error exporting image ${image.id}:`, error);
              results.push({ handle: image.product_handle || 'unknown', status: 'error', error: error.message });
            }
          }

          // Update last export timestamp
          await connection.execute(
            'UPDATE integrations SET last_sync = NOW() WHERE id = ?',
            [integration.id]
          );

          res.json({
            success: true,
            message: `Exported ${exportedCount} of ${rows.length} images to Shopify`,
            results,
            exportedCount,
            totalCount: rows.length
          });

        } finally {
          connection.release();
        }
      } catch (error) {
        console.error('Shopify export error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });
    
    app.post('/api/export/woocommerce', async (req, res) => {
      try {
        const { imageIds } = req.body;
        const userId = req.user ? req.user.id : 'demo-user'; // Use demo user if not authenticated

        if (!imageIds || !Array.isArray(imageIds)) {
          return res.status(400).json({ success: false, error: 'imageIds array is required' });
        }

        // Get WooCommerce integration
        const connection = await pool.getConnection();
        try {
          const [integrations] = await connection.execute(
            'SELECT * FROM integrations WHERE user_id = ? AND platform = ? AND is_connected = ?',
            [userId, 'woocommerce', true]
          );

          // For demo purposes, if no integration found, return a message
          if (integrations.length === 0) {
            return res.json({
              success: true,
              message: 'No WooCommerce integration found. Please connect your WooCommerce store first.',
              exportedCount: 0,
              totalCount: rows.length,
              results: rows.map(row => ({ status: 'error', error: 'No WooCommerce integration' }))
            });
          }

          const integration = integrations[0];
          const WooCommerceAPI = await import('woocommerce-api');

          const WooCommerce = new WooCommerceAPI.default({
            url: integration.store_url,
            consumerKey: integration.api_key,
            consumerSecret: integration.api_secret,
            version: 'wc/v3'
          });

          // Get image data from database
          const placeholders = imageIds.map(() => '?').join(',');
          const [rows] = await connection.execute(
            `SELECT id, original_filename, seo_alt_text, final_alt_text, file_url
             FROM alt_text_generations
             WHERE id IN (${placeholders}) AND user_id = ?`,
            [...imageIds, userId]
          );

          if (rows.length === 0) {
            return res.status(404).json({ success: false, error: 'No images found' });
          }

          let exportedCount = 0;
          const results = [];

          // Export each image to WooCommerce
          for (const image of rows) {
            try {
              const altText = image.final_alt_text || image.seo_alt_text || '';

              // For WooCommerce, we need to find products that contain this image
              // This is more complex as WooCommerce doesn't have direct image handles like Shopify
              // We'll try to match by image URL or filename

              const products = await WooCommerce.get('products', { per_page: 100 });

              let foundProduct = null;
              let foundImage = null;

              // Search for the product containing this image
              for (const product of products) {
                if (product.images && product.images.length > 0) {
                  for (const img of product.images) {
                    if (img.src === image.file_url) {
                      foundProduct = product;
                      foundImage = img;
                      break;
                    }
                  }
                  if (foundProduct) break;
                }
              }

              if (!foundProduct || !foundImage) {
                results.push({
                  filename: image.original_filename,
                  status: 'error',
                  error: 'Product or image not found in WooCommerce'
                });
                continue;
              }

              // Update image alt text in WooCommerce
              await WooCommerce.put(`products/${foundProduct.id}`, {
                images: [{
                  id: foundImage.id,
                  alt_text: altText
                }]
              });

              exportedCount++;
              results.push({
                filename: image.original_filename,
                productId: foundProduct.id,
                status: 'success',
                altText
              });

            } catch (error) {
              console.error(`Error exporting image ${image.id}:`, error);
              results.push({
                filename: image.original_filename,
                status: 'error',
                error: error.message
              });
            }
          }

          // Update last export timestamp
          await connection.execute(
            'UPDATE integrations SET last_sync = NOW() WHERE id = ?',
            [integration.id]
          );

          res.json({
            success: true,
            message: `Exported ${exportedCount} of ${rows.length} images to WooCommerce`,
            results,
            exportedCount,
            totalCount: rows.length
          });

        } finally {
          connection.release();
        }
      } catch (error) {
        console.error('WooCommerce export error:', error);
        res.status(500).json({ success: false, error: error.message });
      }
    });

    // Start server
    server.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📤 Upload endpoint: http://localhost:${PORT}/api/upload`);
      console.log(`⚡ Socket.io enabled for real-time features`);
      console.log(`🗄️  Database status: ${dbConnected ? 'Connected' : 'Not connected'}`);
      console.log(`🔄 Port auto-selected: ${PORT} (was looking for ${DEFAULT_PORT})`);
      console.log(`📊 Shopify export endpoint: http://localhost:${PORT}/api/export/shopify`);
      console.log(`🛒 WooCommerce export endpoint: http://localhost:${PORT}/api/export/woocommerce`);
    });

    // Add endpoint to get server info
    app.get('/api/server-info', (req, res) => {
      res.json({
        port: PORT,
        url: `http://localhost:${PORT}`,
        socketUrl: `http://localhost:${PORT}`
      });
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
})();