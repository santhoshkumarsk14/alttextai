import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImageIcon, Search, TrendingUp, Target } from "lucide-react";

export default function ImageSearchInsights({ report }) {
  const insights = [
    {
      title: "Image Search Visibility",
      value: report ? `${((report.image_search_clicks / report.image_search_impressions) * 100).toFixed(1)}%` : "0%",
      description: "Click-through rate from Google Images",
      icon: Search,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Rank Improvement",
      value: report ? `+${report.keyword_rank_improvements}` : "0",
      description: "Keywords that improved in ranking",
      icon: TrendingUp,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "SEO Score Average",
      value: report ? report.avg_seo_score : "0",
      description: "Average SEO score across all images",
      icon: Target,
      color: "text-purple-600",
      bg: "bg-purple-50"
    }
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-600" />
          Image Search Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4">
          {insights.map((insight, index) => {
            const IconComponent = insight.icon;
            return (
              <div key={index} className="flex items-center gap-4 p-4 bg-slate-50 rounded-lg">
                <div className={`p-3 rounded-xl ${insight.bg}`}>
                  <IconComponent className={`w-6 h-6 ${insight.color}`} />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-slate-900">{insight.title}</h4>
                  <p className="text-sm text-slate-500">{insight.description}</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-slate-900">{insight.value}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="pt-4 border-t border-slate-200">
          <h4 className="font-semibold text-slate-900 mb-3">Performance Summary</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <p className="text-sm text-green-700 font-medium">Traffic Increase</p>
              <p className="text-xl font-bold text-green-800">
                {report ? `+${report.organic_traffic_increase.toFixed(1)}%` : "0%"}
              </p>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-700 font-medium">Time Saved</p>
              <p className="text-xl font-bold text-blue-800">
                {report ? `${report.time_saved_hours}h` : "0h"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
