import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, ImageIcon } from "lucide-react";

export default function ExportPreview({ images, format }) {
  const renderPreview = () => {
    if (format === "csv" || format === "shopify" || format === "woocommerce") {
      const headers = format === "shopify"
        ? ["Handle", "Alt Text"]
        : format === "woocommerce"
        ? ["Image URL", "Image Alt Text", "Image Title"]
        : ["Filename", "Alt Text", "Project", "Keywords"];
      
      return (
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <div className="mb-2 text-slate-600 font-bold">
            {headers.join(",")}
          </div>
          {images.slice(0, 3).map((image, idx) => (
            <div key={idx} className="text-slate-700 truncate">
              {format === "shopify"
                ? `"${image.filename.replace(/\.[^/.]+$/, "").toLowerCase().replace(/[^a-z0-9]/g, '-')}","${image.final_alt_text || image.generated_alt_text || ""}"`
                : format === "woocommerce"
                ? `"${image.file_url || ""}","${image.final_alt_text || image.generated_alt_text || ""}","${image.final_alt_text || image.generated_alt_text || ""}"`
                : `"${image.filename}","${image.final_alt_text || image.generated_alt_text || ""}","${image.project_name || ""}","${(image.keywords || []).join(", ")}"`
              }
            </div>
          ))}
          {images.length > 3 && (
            <div className="text-slate-400 mt-2">... and {images.length - 3} more rows</div>
          )}
        </div>
      );
    }

    if (format === "json") {
      const previewData = images.slice(0, 2).map(img => ({
        filename: img.filename,
        alt_text: img.final_alt_text || img.generated_alt_text || "",
        project: img.project_name || "",
        keywords: img.keywords || []
      }));

      return (
        <div className="bg-slate-50 rounded-lg p-4 font-mono text-xs overflow-x-auto">
          <pre className="text-slate-700">
            {JSON.stringify(previewData, null, 2)}
            {images.length > 2 && (
              <div className="text-slate-400 mt-2">
                ... and {images.length - 2} more objects
              </div>
            )}
          </pre>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-purple-600" />
          Export Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        {images.length > 0 ? (
          <div className="space-y-4">
            <div className="text-sm text-slate-600 mb-4">
              Preview of your export file ({images.length} total images):
            </div>
            {renderPreview()}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <ImageIcon className="w-6 h-6 text-slate-400" />
            </div>
            <p className="text-slate-500">No images selected for export</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
