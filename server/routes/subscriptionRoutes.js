import express from 'express';
import {
  getSubscriptionPlans,
  getUserSubscription,
  createCheckoutSession,
  handleStripeWebhook,
  cancelSubscription
} from '../controllers/subscriptionController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/plans', getSubscriptionPlans);
router.post('/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Protected routes
router.get('/current', authenticateToken, getUserSubscription);
router.post('/checkout', authenticateToken, createCheckoutSession);
router.post('/cancel', authenticateToken, cancelSubscription);

export default router;