import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Check, Zap } from "lucide-react";

export default function SubscriptionPlans({ currentTier, onUpgrade }) {
  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 19,
      images: 500,
      features: [
        "500 images/month",
        "Basic alt text generation",
        "Core SEO optimization",
        "Email support"
      ],
      color: "border-slate-200",
      buttonColor: "bg-slate-600 hover:bg-slate-700"
    },
    {
      id: "growth",
      name: "Growth",
      price: 49,
      images: 5000,
      popular: true,
      features: [
        "5,000 images/month",
        "Context-aware generation",
        "Advanced SEO insights",
        "ADA compliance mode",
        "Keyword analysis",
        "Priority support"
      ],
      color: "border-blue-500",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      id: "agency",
      name: "Agency",
      price: 199,
      images: 50000,
      features: [
        "50,000 images/month",
        "Multi-store management",
        "White-label reporting",
        "API access",
        "Custom integrations",
        "Dedicated account manager"
      ],
      color: "border-purple-500",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    }
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Crown className="w-6 h-6 text-amber-500" />
          Subscription Plans
        </CardTitle>
        <p className="text-slate-600">Choose the plan that fits your business needs</p>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-xl border-2 ${plan.color} p-6 ${
                plan.popular ? 'bg-blue-50/50' : 'bg-white/50'
              } transition-all duration-300 hover:shadow-lg`}
            >
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-600">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center mb-6">
                <h3 className="text-xl font-bold text-slate-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <span className="text-3xl font-bold text-slate-900">${plan.price}</span>
                  <span className="text-slate-500">/month</span>
                </div>
                <p className="text-slate-600">{plan.images.toLocaleString()} images/month</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-3">
                    <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                    <span className="text-sm text-slate-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                className={`w-full ${plan.buttonColor} ${
                  currentTier === plan.id ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={currentTier === plan.id}
                onClick={() => onUpgrade(plan.id)}
              >
                {currentTier === plan.id ? (
                  'Current Plan'
                ) : currentTier === 'agency' && plan.id !== 'agency' ? (
                  'Downgrade'
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    {plan.id === 'starter' ? 'Start Free Trial' : 'Upgrade Now'}
                  </>
                )}
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-slate-500">
          <p>All plans include a 14-day free trial. Cancel anytime.</p>
          <p>Need a custom plan? <a href="#" className="text-blue-600 hover:underline">Contact sales</a></p>
        </div>
      </CardContent>
    </Card>
  );
}
