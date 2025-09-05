import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, TrendingDown } from "lucide-react";

export default function KeywordRankings({ keywords, report }) {
  const topKeywords = report?.top_performing_keywords || [];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-green-600" />
          Top Performing Keywords
        </CardTitle>
      </CardHeader>
      <CardContent>
        {topKeywords.length > 0 ? (
          <div className="space-y-4">
            {topKeywords.slice(0, 8).map((keyword, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">{keyword.keyword}</p>
                    <p className="text-sm text-slate-500">
                      {keyword.impressions.toLocaleString()} impressions
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-green-100 text-green-800">
                    {keyword.clicks} clicks
                  </Badge>
                  <p className="text-xs text-slate-500 mt-1">
                    {keyword.ctr.toFixed(1)}% CTR
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="text-slate-500">No keyword data available yet</p>
            <p className="text-sm text-slate-400 mt-1">
              Keywords will appear after processing images
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
