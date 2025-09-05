import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Crown,
  CreditCard,
  Calendar,
  Zap,
  AlertTriangle,
  CheckCircle,
  ArrowRight,
  Settings,
  Download
} from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchSubscription();
    } else {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  const fetchSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/current', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        setSubscription(data.subscription);
      } else {
        setError(data.error || 'Failed to fetch subscription');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          planId,
          billingCycle: 'monthly'
        })
      });

      const data = await response.json();

      if (data.success) {
        window.location.href = data.url;
      } else {
        setError(data.error || 'Failed to create checkout session');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? It will remain active until the end of your current billing period.')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (data.success) {
        alert('Subscription will be cancelled at the end of the current billing period.');
        fetchSubscription(); // Refresh subscription data
      } else {
        setError(data.error || 'Failed to cancel subscription');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading subscription details...</p>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Unable to Load Subscription</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const creditUsagePercentage = subscription.monthly_credit_limit > 0
    ? ((subscription.monthly_credit_limit - subscription.credits_remaining) / subscription.monthly_credit_limit) * 100
    : 0;

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'trial': return 'bg-blue-100 text-blue-800';
      case 'cancelled': return 'bg-yellow-100 text-yellow-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'expired': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'trial': return <Zap className="w-4 h-4" />;
      case 'cancelled': return <AlertTriangle className="w-4 h-4" />;
      case 'suspended': return <AlertTriangle className="w-4 h-4" />;
      case 'expired': return <AlertTriangle className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Crown className="w-8 h-8 text-amber-500" />
              Subscription & Billing
            </h1>
            <p className="text-slate-600 mt-1">Manage your plan and billing information</p>
          </div>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Back to Dashboard
          </Button>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Current Plan Overview */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              Current Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">{subscription.plan_name}</h3>
                <p className="text-slate-600">{subscription.plan_name} plan</p>
              </div>
              <Badge className={`${getStatusColor(subscription.status)} flex items-center gap-1`}>
                {getStatusIcon(subscription.status)}
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>

            {subscription.price_monthly > 0 && (
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-sm text-slate-600">Monthly Price</p>
                  <p className="text-2xl font-bold text-slate-900">${subscription.price_monthly}</p>
                </div>
                {subscription.subscription_ends_at && (
                  <div>
                    <p className="text-sm text-slate-600">Next Billing</p>
                    <p className="text-lg font-semibold text-slate-900">
                      {new Date(subscription.subscription_ends_at).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            )}

            {subscription.trial_ends_at && subscription.status === 'trial' && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-blue-600" />
                  <p className="text-sm font-medium text-blue-800">Free Trial Active</p>
                </div>
                <p className="text-sm text-blue-700">
                  Your trial ends on {new Date(subscription.trial_ends_at).toLocaleDateString()}.
                  Upgrade now to continue using AltTextAI after your trial expires.
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credits Usage */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-600" />
              Credits Usage
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{subscription.credits_remaining}</p>
                <p className="text-sm text-slate-600">Credits Remaining</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{subscription.monthly_credit_limit}</p>
                <p className="text-sm text-slate-600">Monthly Limit</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{subscription.credits_used_this_month}</p>
                <p className="text-sm text-slate-600">Used This Month</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Monthly Usage</span>
                <span className="text-slate-900 font-medium">
                  {subscription.monthly_credit_limit - subscription.credits_remaining} / {subscription.monthly_credit_limit} credits
                </span>
              </div>
              <Progress value={creditUsagePercentage} className="h-2" />
              <p className="text-xs text-slate-500">
                Resets on the 1st of each month
              </p>
            </div>

            {subscription.credits_remaining < 10 && (
              <Alert className="bg-yellow-50 border-yellow-200">
                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                <AlertDescription>
                  You're running low on credits. Consider upgrading your plan to continue processing images.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Plan Management */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-600" />
              Plan Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {subscription.status === 'trial' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">Upgrade Your Plan</h4>
                <p className="text-slate-600">
                  Upgrade now to unlock unlimited processing and premium features.
                </p>
                <div className="flex gap-4">
                  <Button
                    onClick={() => handleUpgrade('pro-plan')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handleUpgrade('enterprise-plan')}
                  >
                    Contact Sales
                  </Button>
                </div>
              </div>
            )}

            {subscription.status === 'active' && subscription.plan_name !== 'Enterprise' && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-slate-900">Upgrade Your Plan</h4>
                <p className="text-slate-600">
                  Get more credits and premium features with a higher tier plan.
                </p>
                <Button
                  onClick={() => handleUpgrade('enterprise-plan')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  Upgrade to Enterprise
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            )}

            {subscription.status === 'active' && (
              <div className="border-t pt-6">
                <h4 className="text-lg font-semibold text-slate-900 mb-4">Cancel Subscription</h4>
                <p className="text-slate-600 mb-4">
                  Your subscription will remain active until the end of your current billing period.
                  You can reactivate at any time.
                </p>
                <Button
                  variant="destructive"
                  onClick={handleCancelSubscription}
                >
                  Cancel Subscription
                </Button>
              </div>
            )}

            {subscription.status === 'cancelled' && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-yellow-600" />
                  <p className="text-sm font-medium text-yellow-800">Subscription Cancelled</p>
                </div>
                <p className="text-sm text-yellow-700 mb-4">
                  Your subscription will remain active until {new Date(subscription.subscription_ends_at).toLocaleDateString()}.
                </p>
                <Button
                  onClick={() => handleUpgrade(subscription.plan_id)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Reactivate Subscription
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Usage History */}
        <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-600" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Download className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-slate-600">Usage history will be available here</p>
              <p className="text-sm text-slate-500">Track your credit usage and billing history</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}