import jwt from 'jsonwebtoken';
import { executeQuery } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware to verify JWT token
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if user still exists and is active
    const userResult = await executeQuery(
      'SELECT id, email, name, subscription_status, credits_remaining FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (!userResult.success || userResult.results.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.results[0];

    if (user.subscription_status !== 'active' && user.subscription_status !== 'trial') {
      return res.status(403).json({
        success: false,
        error: 'Account is not active'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'Token expired'
      });
    }

    return res.status(403).json({
      success: false,
      error: 'Invalid token'
    });
  }
};

// Middleware to check if user has enough credits
export const checkCredits = (requiredCredits = 1) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // Refresh user credits from database
      const { executeQuery } = await import('../config/database.js');
      const userResult = await executeQuery(
        'SELECT credits_remaining FROM users WHERE id = ?',
        [user.id]
      );

      if (userResult.success && userResult.results.length > 0) {
        const currentCredits = userResult.results[0].credits_remaining;

        if (currentCredits < requiredCredits) {
          return res.status(402).json({
            success: false,
            error: 'Insufficient credits',
            credits_remaining: currentCredits,
            credits_needed: requiredCredits
          });
        }

        // Update req.user with current credits
        req.user.credits_remaining = currentCredits;
      } else {
        return res.status(500).json({
          success: false,
          error: 'Failed to verify credits'
        });
      }

      next();
    } catch (error) {
      console.error('Credit check error:', error);
      return res.status(500).json({
        success: false,
        error: 'Credit check failed'
      });
    }
  };
};

// Generate JWT token
export const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// Generate refresh token
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId, type: 'refresh' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};