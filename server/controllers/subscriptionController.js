import { executeQuery } from '../config/database.js';
import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy');

// Get all subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const plansResult = await executeQuery(
      'SELECT * FROM subscription_plans WHERE is_active = TRUE ORDER BY price_monthly ASC',
      []
    );

    if (!plansResult.success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch subscription plans'
      });
    }

    res.json({
      success: true,
      plans: plansResult.results
    });

  } catch (error) {
    console.error('Get subscription plans error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription plans'
    });
  }
};

// Get user's current subscription
export const getUserSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    const subscriptionResult = await executeQuery(
      `SELECT u.*, sp.name as plan_name, sp.price_monthly, sp.price_yearly, sp.credits_per_month
       FROM users u
       LEFT JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
       WHERE u.id = ?`,
      [userId]
    );

    if (!subscriptionResult.success || subscriptionResult.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = subscriptionResult.results[0];

    res.json({
      success: true,
      subscription: {
        plan_id: user.subscription_plan_id,
        plan_name: user.plan_name,
        status: user.subscription_status,
        credits_remaining: user.credits_remaining,
        monthly_credit_limit: user.monthly_credit_limit,
        credits_used_this_month: user.credits_used_this_month,
        trial_ends_at: user.trial_ends_at,
        subscription_ends_at: user.subscription_ends_at,
        price_monthly: user.price_monthly,
        price_yearly: user.price_yearly,
        credits_per_month: user.credits_per_month
      }
    });

  } catch (error) {
    console.error('Get user subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get subscription'
    });
  }
};

// Create Stripe checkout session
export const createCheckoutSession = async (req, res) => {
  try {
    const { planId, billingCycle } = req.body; // 'monthly' or 'yearly'
    const userId = req.user.id;

    // Get plan details
    const planResult = await executeQuery(
      'SELECT * FROM subscription_plans WHERE id = ? AND is_active = TRUE',
      [planId]
    );

    if (!planResult.success || planResult.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subscription plan not found'
      });
    }

    const plan = planResult.results[0];
    const price = billingCycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: plan.name,
              description: plan.description,
            },
            unit_amount: Math.round(price * 100), // Convert to cents
            recurring: {
              interval: billingCycle,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/pricing?canceled=true`,
      client_reference_id: userId,
      metadata: {
        plan_id: planId,
        user_id: userId,
        billing_cycle: billingCycle
      }
    });

    // Store session info in database
    await executeQuery(
      'INSERT INTO payments (id, user_id, stripe_payment_id, amount, status, subscription_plan_id, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [uuidv4(), userId, session.id, price, 'pending', planId, `Subscription to ${plan.name}`]
    );

    res.json({
      success: true,
      sessionId: session.id,
      url: session.url
    });

  } catch (error) {
    console.error('Create checkout session error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create checkout session'
    });
  }
};

// Handle Stripe webhook
export const handleStripeWebhook = async (req, res) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object;
        await handleSubscriptionCreated(session);
        break;

      case 'invoice.payment_succeeded':
        const invoice = event.data.object;
        await handlePaymentSucceeded(invoice);
        break;

      case 'invoice.payment_failed':
        const failedInvoice = event.data.object;
        await handlePaymentFailed(failedInvoice);
        break;

      case 'customer.subscription.deleted':
        const canceledSubscription = event.data.object;
        await handleSubscriptionCanceled(canceledSubscription);
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });

  } catch (error) {
    console.error('Stripe webhook error:', error);
    res.status(500).json({ error: 'Webhook handler failed' });
  }
};

// Handle successful subscription creation
const handleSubscriptionCreated = async (session) => {
  try {
    const userId = session.client_reference_id;
    const planId = session.metadata.plan_id;

    // Update user subscription
    await executeQuery(
      'UPDATE users SET subscription_plan_id = ?, subscription_status = ?, stripe_customer_id = ?, subscription_ends_at = NULL WHERE id = ?',
      [planId, 'active', session.customer, userId]
    );

    // Reset credits for new billing cycle
    const planResult = await executeQuery(
      'SELECT credits_per_month FROM subscription_plans WHERE id = ?',
      [planId]
    );

    if (planResult.success && planResult.results.length > 0) {
      const creditsPerMonth = planResult.results[0].credits_per_month;
      await executeQuery(
        'UPDATE users SET credits_remaining = ?, monthly_credit_limit = ?, credits_used_this_month = 0 WHERE id = ?',
        [creditsPerMonth, creditsPerMonth, userId]
      );
    }

    // Update payment status
    await executeQuery(
      'UPDATE payments SET status = ? WHERE stripe_payment_id = ?',
      ['completed', session.id]
    );

    console.log(`Subscription created for user ${userId}`);

  } catch (error) {
    console.error('Handle subscription created error:', error);
  }
};

// Handle successful payment
const handlePaymentSucceeded = async (invoice) => {
  try {
    const customerId = invoice.customer;

    // Find user by Stripe customer ID
    const userResult = await executeQuery(
      'SELECT id FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (userResult.success && userResult.results.length > 0) {
      const userId = userResult.results[0].id;

      // Reset monthly credits
      const planResult = await executeQuery(
        `SELECT sp.credits_per_month FROM users u
         JOIN subscription_plans sp ON u.subscription_plan_id = sp.id
         WHERE u.id = ?`,
        [userId]
      );

      if (planResult.success && planResult.results.length > 0) {
        const creditsPerMonth = planResult.results[0].credits_per_month;
        await executeQuery(
          'UPDATE users SET credits_remaining = ?, credits_used_this_month = 0 WHERE id = ?',
          [creditsPerMonth, userId]
        );
      }

      console.log(`Monthly credits reset for user ${userId}`);
    }

  } catch (error) {
    console.error('Handle payment succeeded error:', error);
  }
};

// Handle failed payment
const handlePaymentFailed = async (invoice) => {
  try {
    const customerId = invoice.customer;

    // Find user by Stripe customer ID
    const userResult = await executeQuery(
      'SELECT id FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (userResult.success && userResult.results.length > 0) {
      const userId = userResult.results[0].id;

      // Mark subscription as suspended
      await executeQuery(
        'UPDATE users SET subscription_status = ? WHERE id = ?',
        ['suspended', userId]
      );

      console.log(`Subscription suspended for user ${userId} due to failed payment`);
    }

  } catch (error) {
    console.error('Handle payment failed error:', error);
  }
};

// Handle subscription cancellation
const handleSubscriptionCanceled = async (subscription) => {
  try {
    const customerId = subscription.customer;

    // Find user by Stripe customer ID
    const userResult = await executeQuery(
      'SELECT id FROM users WHERE stripe_customer_id = ?',
      [customerId]
    );

    if (userResult.success && userResult.results.length > 0) {
      const userId = userResult.results[0].id;

      // Mark subscription as cancelled
      await executeQuery(
        'UPDATE users SET subscription_status = ?, subscription_ends_at = ? WHERE id = ?',
        ['cancelled', new Date(subscription.current_period_end * 1000), userId]
      );

      console.log(`Subscription cancelled for user ${userId}`);
    }

  } catch (error) {
    console.error('Handle subscription canceled error:', error);
  }
};

// Cancel user subscription
export const cancelSubscription = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's Stripe customer ID
    const userResult = await executeQuery(
      'SELECT stripe_customer_id FROM users WHERE id = ?',
      [userId]
    );

    if (!userResult.success || userResult.results.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const customerId = userResult.results[0].stripe_customer_id;

    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: 'No active subscription found'
      });
    }

    // Cancel subscription in Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: 'active'
    });

    if (subscriptions.data.length > 0) {
      await stripe.subscriptions.update(subscriptions.data[0].id, {
        cancel_at_period_end: true
      });
    }

    res.json({
      success: true,
      message: 'Subscription will be cancelled at the end of the current billing period'
    });

  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cancel subscription'
    });
  }
};