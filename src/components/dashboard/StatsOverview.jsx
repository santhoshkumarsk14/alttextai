import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { ImageIcon, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function StatsOverview({ stats, isLoading }) {
  const statCards = [
    {
      title: "Total Images",
      value: stats.totalImages,
      icon: ImageIcon,
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-700"
    },
    {
      title: "Processed",
      value: stats.processed,
      icon: CheckCircle,
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-700"
    },
    {
      title: "Time Saved",
      value: `${stats.timeSaved}min`,
      icon: Clock,
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-700"
    },
    {
      title: "This Month",
      value: stats.thisMonth,
      icon: TrendingUp,
      color: "from-orange-500 to-orange-600",
      bgColor: "bg-orange-50",
      textColor: "text-orange-700"
    }
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
      {statCards.map((stat, index) => (
        <Card key={stat.title} className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-md hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
          <CardContent className="p-2">
            <div className="flex items-center justify-between mb-1">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5 truncate">{stat.title}</p>
                {isLoading ? (
                  <Skeleton className="h-4 w-8" />
                ) : (
                  <p className="text-lg font-bold text-slate-900 leading-none">{stat.value}</p>
                )}
              </div>
              <div className={`p-1 rounded ${stat.bgColor} flex-shrink-0`}>
                <stat.icon className={`w-3 h-3 ${stat.textColor}`} />
              </div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-0.5 overflow-hidden">
              <div
                className={`h-full bg-gradient-to-r ${stat.color} transition-all duration-500 ease-out rounded-full`}
                style={{
                  width: isLoading ? '50%' : `${Math.min(100, (stat.value / Math.max(1, stats.totalImages)) * 100)}%`,
                  minWidth: '2px'
                }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
