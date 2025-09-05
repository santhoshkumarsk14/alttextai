import React, { useState, useEffect, useCallback } from "react";
import { ProductImage, PerformanceReport, KeywordInsight } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, BarChart3, TrendingUp, Target, Eye, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AnalyticsOverview from "../components/analytics/AnalyticsOverview";
import SEOPerformance from "../components/analytics/SEOPerformance";
import KeywordRankings from "../components/analytics/KeywordRankings";
import TrafficAttribution from "../components/analytics/TrafficAttribution";
import ImageSearchInsights from "../components/analytics/ImageSearchInsights";

export default function AnalyticsPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [reports, setReports] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dateRange, setDateRange] = useState("30d");

  const generateDailyReport = useCallback(async (imageData) => {
    const totalImages = imageData.length;
    const adaCompliantImages = imageData.filter(img => img.ada_compliant).length;
    const avgSeoScore = imageData.reduce((sum, img) => sum + (img.seo_score || 0), 0) / (totalImages || 1);
    
    // Simulate performance metrics (in real app, would come from GSC API)
    const mockPerformanceData = {
      organic_traffic_increase: Math.random() * 25 + 5, // 5-30% increase
      image_search_impressions: Math.floor(Math.random() * 10000 + 1000),
      image_search_clicks: Math.floor(Math.random() * 500 + 50),
      keyword_rank_improvements: Math.floor(Math.random() * imageData.length * 0.3)
    };

    const topKeywords = [];
    const allKeywords = imageData.flatMap(img => img.keywords || []);
    const keywordCounts = {};
    
    allKeywords.forEach(keyword => {
      keywordCounts[keyword] = (keywordCounts[keyword] || 0) + 1;
    });

    Object.entries(keywordCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .forEach(([keyword, count]) => {
        topKeywords.push({
          keyword,
          impressions: Math.floor(Math.random() * 1000 + 100) * count,
          clicks: Math.floor(Math.random() * 50 + 10) * count,
          ctr: Math.random() * 5 + 1
        });
      });

    await PerformanceReport.create({
      report_date: new Date().toISOString().split('T')[0],
      total_images: totalImages,
      ada_compliant_images: adaCompliantImages,
      avg_seo_score: Math.round(avgSeoScore),
      organic_traffic_increase: mockPerformanceData.organic_traffic_increase,
      image_search_impressions: mockPerformanceData.image_search_impressions,
      image_search_clicks: mockPerformanceData.image_search_clicks,
      top_performing_keywords: topKeywords,
      keyword_rank_improvements: mockPerformanceData.keyword_rank_improvements,
      time_saved_hours: Math.round(totalImages * 2.5 / 60) // 2.5 minutes per image
    });
  }, []);

  const loadAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [allImages, allReports, allKeywords] = await Promise.all([
        ProductImage.list("-created_date", 1000),
        PerformanceReport.list("-report_date", 30),
        KeywordInsight.list("-opportunity_score", 100)
      ]);

      setImages(allImages);
      setReports(allReports);
      setKeywords(allKeywords);

      // Generate current report if none exists for today
      if (allReports.length === 0 || !allReports.some(r => 
        new Date(r.report_date).toDateString() === new Date().toDateString()
      )) {
        await generateDailyReport(allImages);
      }
    } catch (error) {
      console.error("Error loading analytics data:", error);
    }
    setIsLoading(false);
  }, [generateDailyReport]);

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData, dateRange]);

  const latestReport = reports[0];

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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <BarChart3 className="w-8 h-8 text-green-600" />
              Advanced Analytics & Performance
            </h1>
            <p className="text-slate-600 mt-1">Track SEO impact, traffic attribution, and keyword performance</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-6">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-white/70 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="space-y-8">
            <AnalyticsOverview report={latestReport} images={images} />
            
            <div className="grid lg:grid-cols-2 gap-8">
              <SEOPerformance images={images} reports={reports} />
              <TrafficAttribution report={latestReport} />
            </div>
            
            <div className="grid lg:grid-cols-2 gap-8">
              <KeywordRankings keywords={keywords} report={latestReport} />
              <ImageSearchInsights report={latestReport} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
