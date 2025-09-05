import React, { useState, useEffect } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, ImageIcon, Eye, Target, Clock, Wifi, WifiOff } from "lucide-react";
import socketService from '../../services/socketService';

export default function AnalyticsOverview({ report, images }) {
  const [liveData, setLiveData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Listen for analytics updates
    const handleAnalyticsUpdate = (data) => {
      setLiveData(data);
      setIsConnected(true);
    };

    socketService.on('analytics-update', handleAnalyticsUpdate);

    // Request initial analytics update
    socketService.requestAnalyticsUpdate();

    // Check connection status
    const checkConnection = () => {
      setIsConnected(socketService.isConnected);
    };

    const interval = setInterval(checkConnection, 5000);

    return () => {
      socketService.off('analytics-update', handleAnalyticsUpdate);
      clearInterval(interval);
    };
  }, []);
  // Use live data if available, otherwise fall back to report data
  const currentData = liveData || report;

  const metrics = [
    {
      title: "Total Generations",
      value: currentData ? currentData.totalGenerations?.toLocaleString() || "0" : "0",
      change: liveData ? 5.2 : null, // Show change only for live data
      icon: ImageIcon,
      color: "text-green-600",
      bg: "bg-green-50"
    },
    {
      title: "Today's Generations",
      value: currentData ? currentData.todayGenerations?.toString() || "0" : "0",
      change: liveData ? 12.5 : null,
      icon: TrendingUp,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
    {
      title: "Average SEO Score",
      value: currentData ? currentData.averageSeoScore?.toString() || "0" : "0",
      change: liveData ? 3.1 : null,
      icon: Target,
      color: "text-purple-600",
      bg: "bg-purple-50"
    },
    {
      title: "Credits Remaining",
      value: currentData ? currentData.creditsRemaining?.toString() || "0" : "0",
      change: null,
      icon: Clock,
      color: "text-orange-600",
      bg: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <Wifi className="w-4 h-4 text-green-500" />
          ) : (
            <WifiOff className="w-4 h-4 text-gray-400" />
          )}
          <span className={`text-sm ${isConnected ? 'text-green-600' : 'text-gray-500'}`}>
            {isConnected ? 'Live' : 'Offline'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {metrics.map((metric, index) => {
        const IconComponent = metric.icon;
        const isPositive = metric.change > 0;
        const TrendIcon = isPositive ? TrendingUp : TrendingDown;
        
        return (
          <Card key={index} className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${metric.bg}`}>
                  <IconComponent className={`w-6 h-6 ${metric.color}`} />
                </div>
                {metric.change !== null && (
                  <Badge 
                    variant="outline" 
                    className={`${isPositive ? 'text-green-700 bg-green-50 border-green-200' : 'text-red-700 bg-red-50 border-red-200'}`}
                  >
                    <TrendIcon className="w-3 h-3 mr-1" />
                    {Math.abs(metric.change).toFixed(1)}%
                  </Badge>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-slate-500 mb-1">{metric.title}</p>
                <p className="text-3xl font-bold text-slate-900">{metric.value}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
      </div>
    </div>
  );
}
