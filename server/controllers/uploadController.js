// Upload controller
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';

// Handle file upload and database operations
export const handleFileUpload = async (req, res, next) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? 'present' : 'missing',
      body: req.body,
      files: req.files
    });

    if (!req.file) {
      console.log('No file in request');
      return res.status(400).json({ error: 'No file provided' });
    }

    const file = req.file;
    const userId = req.body.user_id || 'user-1'; // Default to user-1 instead of anonymous
    const sessionId = req.body.session_id || uuidv4();

    // Create file URL
    const fileUrl = `http://localhost:${process.env.PORT || 3001}/uploads/${file.filename}`;

    console.log('File uploaded successfully:', {
      filename: file.filename,
      originalname: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
      userId: userId
    });

    // Transaction to ensure data consistency
    try {
      // First check if user exists
      const userCheckResult = await executeQuery(
        'SELECT id FROM users WHERE id = ?',
        [userId]
      );

      if (!userCheckResult.success) {
        throw new Error(`Database error checking user: ${userCheckResult.error}`);
      }

      // If user doesn't exist, create a new one
      if (userCheckResult.results.length === 0) {
        console.log(`User ${userId} not found, creating new user`);
        const createUserResult = await executeQuery(
          'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
          [userId, `${userId}@example.com`, 'default-password-hash', `User ${userId}`]
        );

        if (!createUserResult.success) {
          throw new Error(`Failed to create user: ${createUserResult.error}`);
        }

        console.log(`User ${userId} created successfully`);
      }

      // Now insert the file record with proper error handling for foreign key constraints
      const fileId = uuidv4();
      const insertFileResult = await executeQuery(
        `INSERT INTO files (id, user_id, session_id, filename, original_name, file_url, file_size, mime_type, upload_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [fileId, userId, sessionId, file.filename, file.originalname, fileUrl, file.size, file.mimetype, 'completed']
      );

      if (!insertFileResult.success) {
        // Check for foreign key constraint error
        if (insertFileResult.error.includes('ER_NO_REFERENCED_ROW') ||
            insertFileResult.error.includes('foreign key constraint fails')) {
          return res.status(400).json({
            error: 'Foreign key constraint error',
            details: 'The specified user does not exist in the database',
            user_id: userId
          });
        }

        throw new Error(`Failed to insert file record: ${insertFileResult.error}`);
      }

      console.log('File record saved to database successfully');

      // Return success response
      return res.status(200).json({
        success: true,
        file_url: fileUrl,
        file_id: fileId,
        size: file.size,
        type: file.mimetype,
        user_id: userId
      });
    } catch (error) {
      console.error('Transaction error:', error);
      next(error);
    }
  } catch (error) {
    console.error('Upload controller error:', error);
    next(error);
  }
};