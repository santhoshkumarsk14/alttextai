import React from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageCircle, Bell, Zap, BarChart3, Shield, Users, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import NotificationContainer from "../components/ui/notification";
import ChatWidget from "../components/ui/chat-widget";
import SyncProgress from "../components/ui/sync-progress";
import ABTesting from "../components/ui/ab-testing";
import CollaborativeEditor from "../components/ui/collaborative-editor";
import WCAGValidator from "../components/ui/wcag-validator";

export default function RealTimeFeaturesPage() {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bell,
      title: "Push Notifications",
      description: "Real-time notifications for completed tasks and system updates",
      component: <NotificationContainer />,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      icon: MessageCircle,
      title: "Live Chat Support",
      description: "Real-time chat widget for customer support and assistance",
      component: <ChatWidget />,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      icon: Zap,
      title: "Sync Progress",
      description: "Live progress tracking for Shopify and WooCommerce sync operations",
      component: <SyncProgress isVisible={false} />,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      icon: BarChart3,
      title: "Live Analytics",
      description: "Real-time dashboard with live metrics and connection status",
      component: null,
      color: "text-orange-600",
      bg: "bg-orange-50"
    },
    {
      icon: Shield,
      title: "WCAG Validation",
      description: "Real-time accessibility validation against WCAG guidelines",
      component: <WCAGValidator altText="Sample alt text for demonstration" />,
      color: "text-red-600",
      bg: "bg-red-50"
    },
    {
      icon: Users,
      title: "Collaboration",
      description: "Real-time collaborative editing for team workflows",
      component: <CollaborativeEditor projectId="demo" initialContent="Collaborative alt text editing..." />,
      color: "text-indigo-600",
      bg: "bg-indigo-50"
    },
    {
      icon: FlaskConical,
      title: "A/B Testing",
      description: "Real-time A/B testing framework for alt text optimization",
      component: <ABTesting />,
      color: "text-pink-600",
      bg: "bg-pink-50"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Zap className="w-8 h-8 text-blue-600" />
              Real-Time Features
            </h1>
            <p className="text-slate-600 mt-1">Experience the power of real-time collaboration and monitoring</p>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div key={index} className="bg-white/70 backdrop-blur-sm border border-slate-200/60 shadow-lg rounded-xl p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${feature.bg} flex-shrink-0`}>
                    <IconComponent className={`w-6 h-6 ${feature.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600 mb-4">{feature.description}</p>
                    {feature.component && (
                      <div className="border-t border-slate-200 pt-4">
                        <p className="text-sm text-slate-500 mb-2">Live Demo:</p>
                        <div className="bg-slate-50 rounded-lg p-4">
                          {feature.component}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Experience Real-Time Power?</h2>
          <p className="text-blue-100 mb-6 max-w-2xl mx-auto">
            All these features are now integrated throughout your application.
            Navigate to different sections to see them in action!
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button
              onClick={() => navigate(createPageUrl("Upload"))}
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Try Upload with Real-Time AI
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Review"))}
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              Explore Review Features
            </Button>
            <Button
              onClick={() => navigate(createPageUrl("Analytics"))}
              variant="secondary"
              className="bg-white text-blue-600 hover:bg-blue-50"
            >
              View Live Analytics
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}