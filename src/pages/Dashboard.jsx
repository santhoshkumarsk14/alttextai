import React, { useState, useEffect } from "react";
import { ProductImage } from "@/entities/ProductImage";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Upload,
  ImageIcon,
  Clock,
  CheckCircle,
  TrendingUp,
  Sparkles,
  ArrowRight,
  Zap,
  Store,
  Settings,
  Eye
} from "lucide-react";

import StatsOverview from "../components/dashboard/StatsOverview";
import RecentProjects from "../components/dashboard/RecentProjects";
import QuickActions from "../components/dashboard/QuickActions";
import RealTimeAIProcessing from "../components/dashboard/RealTimeAIProcessing";
import MainFeatures from "../components/dashboard/MainFeatures";

export default function Dashboard() {
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalImages: 0,
    processed: 0,
    timeSaved: 0,
    thisMonth: 0
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const allImages = await ProductImage.list("-created_date", 100);
      setImages(allImages);
      
      // Calculate stats
      const processed = allImages.filter(img => img.status === 'approved' || img.status === 'exported').length;
      const thisMonth = allImages.filter(img => {
        const createdDate = new Date(img.created_date);
        const now = new Date();
        return createdDate.getMonth() === now.getMonth() && 
               createdDate.getFullYear() === now.getFullYear();
      }).length;
      
      setStats({
        totalImages: allImages.length,
        processed,
        timeSaved: Math.round(processed * 2.5), // Estimate 2.5 minutes saved per image
        thisMonth
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-2 lg:p-3">
      <div className="max-w-7xl mx-auto space-y-2">

        {/* Header Section */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-1">
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-slate-900 flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-blue-600" />
              AltTextAI Dashboard
            </h1>
            <p className="text-slate-600 text-xs">AI-powered alt text generation for better SEO</p>
          </div>

          {/* Quick Actions in Header */}
          <div className="flex gap-1">
            <Link to={createPageUrl("Upload")}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs">
                <Upload className="w-3 h-3 mr-1" />
                Upload
              </Button>
            </Link>
            <Link to={createPageUrl("Review")}>
              <Button size="sm" variant="outline" className="h-7 px-2 text-xs">
                <Eye className="w-3 h-3 mr-1" />
                Review
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Overview - Compact */}
        <StatsOverview stats={stats} isLoading={isLoading} />

        {/* Main Features - Primary Focus */}
        <MainFeatures />

        {/* Secondary Content Grid */}
        <div className="grid lg:grid-cols-3 gap-2">
          <div className="lg:col-span-2">
            <RecentProjects images={images} isLoading={isLoading} />
          </div>
          <div className="space-y-2">
            <QuickActions stats={stats} />
            {/* Real-time AI Processing - Compact */}
            <RealTimeAIProcessing />
          </div>
        </div>

        {/* Getting Started - Only for New Users */}
        {stats.totalImages === 0 && !isLoading && (
          <div className="bg-white/70 backdrop-blur-sm rounded border border-slate-200/60 p-3 shadow-md">
            <div className="text-center space-y-2">
              <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-indigo-600 rounded flex items-center justify-center mx-auto">
                <Zap className="w-3 h-3 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-1">Welcome! Let's Get Started</h3>
                <p className="text-xs text-slate-600 max-w-xs mx-auto">
                  Follow these simple steps to start optimizing your images
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-1 mt-3">
                <div className="text-center p-2 bg-blue-50 rounded">
                  <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <span className="text-blue-600 font-bold text-xs">1</span>
                  </div>
                  <h4 className="font-semibold text-slate-900 text-xs mb-0.5">Upload Images</h4>
                  <p className="text-xs text-slate-600">Drag & drop your product photos</p>
                </div>
                <div className="text-center p-2 bg-purple-50 rounded">
                  <div className="w-5 h-5 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <Settings className="w-3 h-3 text-purple-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-xs mb-0.5">AI Processing</h4>
                  <p className="text-xs text-slate-600">Our AI creates perfect alt text</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded">
                  <div className="w-5 h-5 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-1">
                    <CheckCircle className="w-3 h-3 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-slate-900 text-xs mb-0.5">Done!</h4>
                  <p className="text-xs text-slate-600">SEO-optimized images ready</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
