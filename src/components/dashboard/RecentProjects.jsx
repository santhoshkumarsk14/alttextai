import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { format } from "date-fns";
import { ImageIcon, Eye, Clock, CheckCircle, Upload, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const statusConfig = {
  uploaded: { 
    label: "Uploaded", 
    color: "bg-blue-100 text-blue-800", 
    icon: Upload 
  },
  processing: { 
    label: "Processing", 
    color: "bg-yellow-100 text-yellow-800", 
    icon: Clock 
  },
  generated: { 
    label: "Generated", 
    color: "bg-purple-100 text-purple-800", 
    icon: FileText 
  },
  approved: { 
    label: "Approved", 
    color: "bg-green-100 text-green-800", 
    icon: CheckCircle 
  },
  exported: { 
    label: "Exported", 
    color: "bg-gray-100 text-gray-800", 
    icon: CheckCircle 
  }
};

export default function RecentProjects({ images, isLoading }) {
  const groupedByProject = images.reduce((acc, image) => {
    const project = image.project_name || 'Untitled Project';
    if (!acc[project]) {
      acc[project] = [];
    }
    acc[project].push(image);
    return acc;
  }, {});

  const projects = Object.entries(groupedByProject).map(([name, projectImages]) => ({
    name,
    images: projectImages,
    totalImages: projectImages.length,
    processed: projectImages.filter(img => img.status === 'approved' || img.status === 'exported').length,
    latestDate: Math.max(...projectImages.map(img => new Date(img.created_date).getTime()))
  })).sort((a, b) => b.latestDate - a.latestDate).slice(0, 5);

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-md">
      <CardHeader className="border-b border-slate-200/60 pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 flex items-center gap-1">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            Recent Projects
          </CardTitle>
          <Link to={createPageUrl("ImageLibrary")}>
            <Button variant="outline" size="sm" className="h-6 px-2 text-xs hover:bg-blue-50 hover:border-blue-200">
              <Eye className="w-3 h-3 mr-1" />
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-2 border border-slate-200 rounded">
                <div className="flex items-center gap-2">
                  <Skeleton className="w-8 h-8 rounded" />
                  <div>
                    <Skeleton className="h-3 w-24 mb-1" />
                    <Skeleton className="h-2 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="space-y-2">
            {projects.map((project, index) => (
              <div key={project.name} className="flex items-center justify-between p-2 border border-slate-200/60 rounded hover:bg-slate-50/50 transition-all duration-200">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 rounded flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm">{project.name}</h3>
                    <p className="text-xs text-slate-500">
                      {project.totalImages} images • {project.processed} processed
                    </p>
                    <p className="text-xs text-slate-400">
                      {format(new Date(project.latestDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Badge className="bg-blue-100 text-blue-800 font-medium text-xs px-1.5 py-0.5">
                    {Math.round((project.processed / project.totalImages) * 100)}%
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6">
            <div className="w-10 h-10 bg-slate-100 rounded flex items-center justify-center mx-auto mb-2">
              <ImageIcon className="w-5 h-5 text-slate-400" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">No Projects Yet</h3>
            <p className="text-slate-500 text-xs mb-2">Upload your first batch of images to get started</p>
            <Link to={createPageUrl("Upload")}>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 h-7 px-2 text-xs">
                <Upload className="w-3 h-3 mr-1" />
                Upload Images
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
