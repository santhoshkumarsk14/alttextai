import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BarChart3, TrendingUp, Eye, MousePointer } from "lucide-react";

export default function TrafficAttribution({ report }) {
  const trafficSources = [
    {
      source: "Google Images",
      percentage: 45,
      visits: report ? Math.floor(report.image_search_clicks * 1.2) : 0,
      color: "bg-blue-500"
    },
    {
      source: "Organic Search",
      percentage: 30,
      visits: report ? Math.floor(report.image_search_clicks * 0.8) : 0,
      color: "bg-green-500"
    },
    {
      source: "Direct",
      percentage: 15,
      visits: report ? Math.floor(report.image_search_clicks * 0.4) : 0,
      color: "bg-purple-500"
    },
    {
      source: "Social Media",
      percentage: 10,
      visits: report ? Math.floor(report.image_search_clicks * 0.3) : 0,
      color: "bg-orange-500"
    }
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Traffic Attribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          {trafficSources.map((source, index) => (
            <div key={source.source} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${source.color}`}></div>
                  <span className="font-medium text-slate-900">{source.source}</span>
                </div>
                <div className="text-right">
                  <span className="font-semibold text-slate-900">{source.percentage}%</span>
                  <p className="text-xs text-slate-500">{source.visits.toLocaleString()} visits</p>
                </div>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full ${source.color} transition-all duration-500`}
                  style={{ width: `${source.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-slate-700">Total Impressions</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {report ? report.image_search_impressions.toLocaleString() : "0"}
            </p>
          </div>
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <MousePointer className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-slate-700">Total Clicks</span>
            </div>
            <p className="text-2xl font-bold text-slate-900">
              {report ? report.image_search_clicks.toLocaleString() : "0"}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
