import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Upload, Eye, Download, Sparkles, ArrowRight, Database } from "lucide-react";

export default function QuickActions({ stats }) {
  const actions = [
    {
      title: "Upload Images",
      description: "Add new product images for AI analysis",
      icon: Upload,
      href: createPageUrl("Upload"),
      color: "from-blue-500 to-blue-600",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "Review & Edit",
      description: `${stats.totalImages - stats.processed} images ready for review`,
      icon: Eye,
      href: createPageUrl("Review"),
      color: "from-purple-500 to-purple-600",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      disabled: stats.totalImages === stats.processed
    },
    {
      title: "Export Results",
      description: "Download alt text for your platform",
      icon: Download,
      href: createPageUrl("Export"),
      color: "from-green-500 to-green-600",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      disabled: stats.processed === 0
    }
  ];

  return (
    <div className="space-y-2">
      <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-md">
        <CardHeader className="border-b border-slate-200/60 pb-2">
          <CardTitle className="text-base font-bold text-slate-900 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-orange-500" />
            Quick Actions
          </CardTitle>
        </CardHeader>
        <CardContent className="p-2 space-y-2">
          {actions.map((action) => (
            <Link
              key={action.title}
              to={action.href}
              className={`block ${action.disabled ? "pointer-events-none" : ""}`}
            >
              <div className={`flex items-center gap-2 p-2 rounded hover:bg-slate-50 transition-all duration-200 border border-transparent hover:border-slate-200 ${action.disabled ? 'opacity-50' : ''}`}>
                <div className={`p-1.5 rounded ${action.bgColor} flex-shrink-0`}>
                  <action.icon className={`w-3 h-3 ${action.textColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-slate-900 text-xs truncate">{action.title}</p>
                  <p className="text-xs text-slate-500 truncate">{action.description}</p>
                </div>
                {!action.disabled && (
                  <ArrowRight className="w-3 h-3 text-slate-400 flex-shrink-0" />
                )}
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>

      {/* Pro Tip Card */}
      <Card className="bg-gradient-to-br from-orange-50 to-yellow-50 border-orange-200/60">
        <CardContent className="p-2">
          <div className="flex items-start gap-2">
            <div className="w-4 h-4 bg-orange-100 rounded flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles className="w-2 h-2 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-orange-900 text-xs mb-0.5">Pro Tip</h3>
              <p className="text-xs text-orange-800 leading-tight">
                Group related products together and use descriptive project names to better organize your alt text workflow.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
