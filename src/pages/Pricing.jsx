import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ArrowLeft, Sparkles, Zap, Crown, Star } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext';

export default function PricingPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await fetch('/api/subscription/plans');
      const data = await response.json();

      if (data.success) {
        setPlans(data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (planId, planName) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      const response = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planId,
          billingCycle: 'monthly'
        })
      });

      const data = await response.json();

      if (data.success) {
        // Redirect to Stripe checkout
        window.location.href = data.url;
      } else {
        console.error('Failed to create checkout session:', data.error);
      }
    } catch (error) {
      console.error('Subscription error:', error);
    }
  };

  const features = [
    "AI-powered alt text generation",
    "SEO optimization",
    "ADA compliance",
    "Bulk processing",
    "API access",
    "Priority support",
    "Custom integrations",
    "White-label options"
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading pricing plans...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">AltTextAI</span>
            </div>

            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate('/')}>
                Home
              </Button>
              {!isAuthenticated ? (
                <>
                  <Button variant="ghost" onClick={() => navigate('/login')}>
                    Sign In
                  </Button>
                  <Button onClick={() => navigate('/register')}>
                    Get Started
                  </Button>
                </>
              ) : (
                <Button onClick={() => navigate('/dashboard')}>
                  Dashboard
                </Button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <Sparkles className="w-6 h-6 text-blue-600" />
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
              Pricing Plans
            </Badge>
          </div>

          <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-6">
            Choose the Perfect Plan for Your Business
          </h1>

          <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. All plans include our core AI-powered alt text generation features.
          </p>

          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              No setup fees
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              Cancel anytime
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              14-day free trial
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan, index) => (
              <Card key={plan.id} className={`relative bg-white/80 backdrop-blur-sm border-slate-200/60 ${plan.name === 'Pro' ? 'ring-2 ring-blue-500 shadow-xl scale-105' : 'hover:shadow-lg'} transition-all duration-300`}>
                {plan.name === 'Pro' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-600 text-white px-4 py-1 flex items-center gap-1">
                      <Star className="w-3 h-3" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="text-center pb-8">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    {plan.name === 'Free' && <Sparkles className="w-6 h-6 text-blue-600" />}
                    {plan.name === 'Pro' && <Zap className="w-6 h-6 text-blue-600" />}
                    {plan.name === 'Enterprise' && <Crown className="w-6 h-6 text-purple-600" />}
                  </div>

                  <CardTitle className="text-2xl font-bold text-slate-900">{plan.name}</CardTitle>

                  <div className="mt-4">
                    <span className="text-4xl font-bold text-slate-900">${plan.price_monthly}</span>
                    <span className="text-slate-600">/month</span>
                  </div>

                  <p className="text-slate-600 mt-2">{plan.description}</p>

                  <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                      <span className="font-semibold text-slate-900">{plan.credits_per_month}</span> credits per month
                    </p>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <ul className="space-y-3 mb-8">
                    {JSON.parse(plan.features || '[]').map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${plan.name === 'Pro' ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.name === 'Pro' ? 'default' : 'outline'}
                    onClick={() => handleSubscribe(plan.id, plan.name)}
                    disabled={plan.name === 'Enterprise'}
                  >
                    {plan.name === 'Free' ? 'Get Started Free' :
                     plan.name === 'Enterprise' ? 'Contact Sales' :
                     'Start Free Trial'}
                  </Button>

                  {plan.name === 'Enterprise' && (
                    <p className="text-center text-sm text-slate-500 mt-2">
                      Custom pricing for large teams
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-slate-600">
              Everything you need to know about our pricing and features
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">What are credits?</h3>
                <p className="text-slate-600">Credits are used for AI processing. Each image analysis costs 1 credit. Your credits reset monthly based on your plan.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Can I change plans anytime?</h3>
                <p className="text-slate-600">Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Is there a free trial?</h3>
                <p className="text-slate-600">Yes! All paid plans come with a 14-day free trial. No credit card required to start.</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">What happens if I run out of credits?</h3>
                <p className="text-slate-600">You can purchase additional credits or upgrade your plan. Processing will pause until you have credits.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Do you offer refunds?</h3>
                <p className="text-slate-600">Yes, we offer a 30-day money-back guarantee for all paid plans.</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">Need more credits?</h3>
                <p className="text-slate-600">Contact us for custom enterprise plans with higher credit limits and dedicated support.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Transform Your E-commerce SEO?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already using AltTextAI to improve their search rankings and accessibility
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              size="lg"
              onClick={() => navigate('/register')}
              className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg font-semibold"
            >
              Start Your Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/login')}
              className="border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 text-lg"
            >
              Sign In to Account
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}