import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function SEOPerformance({ images, reports }) {
  // Generate mock trend data
  const trendData = reports.slice(0, 7).reverse().map((report, index) => ({
    date: new Date(report.report_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    score: report.avg_seo_score,
    traffic: report.organic_traffic_increase
  }));

  const categoryBreakdown = {};
  images.forEach(img => {
    const category = img.product_category || 'Other';
    if (!categoryBreakdown[category]) {
      categoryBreakdown[category] = {
        count: 0,
        avgScore: 0,
        totalScore: 0
      };
    }
    categoryBreakdown[category].count++;
    categoryBreakdown[category].totalScore += img.seo_score || 0;
    categoryBreakdown[category].avgScore = categoryBreakdown[category].totalScore / categoryBreakdown[category].count;
  });

  const categoryData = Object.entries(categoryBreakdown)
    .sort(([,a], [,b]) => b.avgScore - a.avgScore)
    .slice(0, 5);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5 text-purple-600" />
          SEO Performance Trends
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {trendData.length > 1 ? (
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#7c3aed" 
                  strokeWidth={3}
                  name="SEO Score"
                />
                <Line 
                  type="monotone" 
                  dataKey="traffic" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Traffic Increase %"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p>Performance trends will appear after a few days</p>
            </div>
          </div>
        )}

        <div>
          <h4 className="font-semibold text-slate-900 mb-3">Category Performance</h4>
          <div className="space-y-3">
            {categoryData.map(([category, data]) => (
              <div key={category} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{category}</p>
                  <p className="text-sm text-slate-500">{data.count} images</p>
                </div>
                <Badge variant="outline" className={`${
                  data.avgScore >= 80 ? 'bg-green-50 text-green-700 border-green-200' :
                  data.avgScore >= 60 ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                  'bg-red-50 text-red-700 border-red-200'
                }`}>
                  {Math.round(data.avgScore)} SEO Score
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
