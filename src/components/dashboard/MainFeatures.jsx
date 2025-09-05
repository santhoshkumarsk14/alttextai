import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Eye,
  Database,
  BarChart3,
  Target,
  Download,
  Cog,
  Sparkles,
  ArrowRight,
  FileText,
  Shield,
  Users,
  FlaskConical
} from "lucide-react";

export default function MainFeatures() {
  const features = [
    {
      title: "Review & Edit",
      description: "Review AI-generated alt text and make adjustments",
      icon: Eye,
      href: createPageUrl("Review"),
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      features: ["Bulk approval", "Inline editing", "WCAG validation"]
    },
    {
      title: "Image Library",
      description: "Advanced data grid with AG Grid features",
      icon: Database,
      href: createPageUrl("ImageLibrary"),
      color: "from-indigo-500 to-indigo-600",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      features: ["Sorting & filtering", "Bulk operations", "Real-time editing"],
      badge: "AG Grid"
    },
    {
      title: "Analytics",
      description: "Track performance and SEO improvements",
      icon: BarChart3,
      href: createPageUrl("Analytics"),
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      features: ["SEO scores", "Usage stats", "Performance metrics"]
    },
    {
      title: "Keywords",
      description: "Optimize keywords for better search rankings",
      icon: Target,
      href: createPageUrl("Keywords"),
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-600",
      features: ["Keyword analysis", "Competitor research", "SEO optimization"]
    },
    {
      title: "Export",
      description: "Download alt text for your e-commerce platform",
      icon: Download,
      href: createPageUrl("Export"),
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      features: ["CSV export", "Platform integration", "Bulk download"]
    },
    {
      title: "Integrations",
      description: "Connect with Shopify, WooCommerce, and more",
      icon: Cog,
      href: createPageUrl("Integrations"),
      color: "from-slate-500 to-slate-600",
      bgColor: "bg-slate-50",
      textColor: "text-slate-600",
      features: ["Auto-sync", "Multi-platform", "API connections"],
      badge: "New"
    }
  ];

  return (
    <div className="space-y-3">
      <div className="text-center">
        <h2 className="text-lg font-bold text-slate-900 mb-1">Tools & Features</h2>
        <p className="text-xs text-slate-600">Everything you need in one place</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-1">
        {features.map((feature) => (
          <Link key={feature.title} to={feature.href} className="block group">
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 h-full min-h-[100px]">
              <CardContent className="p-2 text-center space-y-1 flex flex-col h-full">
                <div className="relative flex-shrink-0">
                  <div className={`w-6 h-6 mx-auto rounded ${feature.bgColor} flex items-center justify-center group-hover:scale-105 transition-transform duration-200`}>
                    <feature.icon className={`w-3 h-3 ${feature.textColor}`} />
                  </div>
                  {feature.badge && (
                    <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-bold px-1 py-0.5 rounded text-[9px] shadow-sm">
                      {feature.badge}
                    </span>
                  )}
                </div>
                <div className="flex-1 flex flex-col justify-center">
                  <h3 className="font-semibold text-slate-900 text-xs leading-tight line-clamp-2">
                    {feature.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5 leading-tight line-clamp-2">
                    {feature.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Advanced Features Section */}
      <Card className="bg-gradient-to-br from-slate-50 to-blue-50 border-slate-200/60">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-slate-900 mb-1">Advanced Tools</h3>
              <p className="text-xs text-slate-600">
                WCAG Validation • Team Collaboration • A/B Testing
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}