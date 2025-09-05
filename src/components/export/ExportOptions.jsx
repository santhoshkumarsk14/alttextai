import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Settings, FileText, Store, Package } from "lucide-react";

const formatOptions = [
  {
    id: "csv",
    name: "CSV (General)",
    description: "Standard CSV format for spreadsheet applications",
    icon: FileText
  },
  {
    id: "json",
    name: "JSON",
    description: "Structured data format for developers",
    icon: Package
  },
  {
    id: "shopify",
    name: "Export to Shopify",
    description: "Directly update alt text in your Shopify store",
    icon: Store
  },
  {
    id: "woocommerce",
    name: "Export to WooCommerce",
    description: "Directly update alt text in your WooCommerce store",
    icon: Package
  }
];

export default function ExportOptions({ 
  projects, 
  selectedProject, 
  onProjectChange, 
  selectedFormat, 
  onFormatChange,
  imageCount 
}) {
  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Export Configuration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Selection */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-2 block">
            Select Project
          </label>
          <Select value={selectedProject} onValueChange={onProjectChange}>
            <SelectTrigger className="bg-white/80">
              <SelectValue placeholder="Choose project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project) => (
                <SelectItem key={project} value={project}>
                  {project}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Format Selection */}
        <div>
          <label className="text-sm font-semibold text-slate-700 mb-3 block">
            Export Format
          </label>
          <div className="space-y-2">
            {formatOptions.map((format) => {
              const IconComponent = format.icon;
              return (
                <div
                  key={format.id}
                  onClick={() => onFormatChange(format.id)}
                  className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                    selectedFormat === format.id
                      ? "border-blue-500 bg-blue-50"
                      : "border-slate-200 hover:border-slate-300 bg-white/50"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${
                    selectedFormat === format.id ? "bg-blue-100" : "bg-slate-100"
                  }`}>
                    <IconComponent className={`w-4 h-4 ${
                      selectedFormat === format.id ? "text-blue-600" : "text-slate-500"
                    }`} />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900">{format.name}</h4>
                    <p className="text-xs text-slate-500 mt-1">{format.description}</p>
                  </div>
                  {selectedFormat === format.id && (
                    <Badge className="bg-blue-100 text-blue-700 text-xs">Selected</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-50 rounded-lg p-4">
          <h4 className="font-medium text-slate-900 mb-2">Export Summary</h4>
          <div className="space-y-1 text-sm text-slate-600">
            <p>• <span className="font-medium">{imageCount}</span> images selected</p>
            <p>• Format: <span className="font-medium">{formatOptions.find(f => f.id === selectedFormat)?.name}</span></p>
            <p>• Project: <span className="font-medium">{selectedProject === "all" ? "All Projects" : selectedProject}</span></p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
