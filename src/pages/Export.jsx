import React, { useState, useEffect } from "react";
import { ProductImage } from "@/entities/ProductImage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  ArrowLeft, 
  FileText, 
  Store,
  Package,
  CheckCircle,
  Copy
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ExportOptions from "../components/export/ExportOptions";
import ExportPreview from "../components/export/ExportPreview";

export default function ExportPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [selectedProject, setSelectedProject] = useState("all");
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    loadImages();
  }, []);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      const approvedImages = await ProductImage.filter({ status: "approved" }, "-created_date");
      setImages(approvedImages);
    } catch (error) {
      console.error("Error loading images:", error);
    }
    setIsLoading(false);
  };

  const filteredImages = selectedProject === "all" 
    ? images 
    : images.filter(img => img.project_name === selectedProject);

  const projects = [...new Set(images.map(img => img.project_name).filter(Boolean))];

  const handleExport = async () => {
    if (filteredImages.length === 0) return;

    setIsExporting(true);
    try {
      const imageIds = filteredImages.map(img => img.id);

      if (selectedFormat === "csv") {
        // Client-side CSV generation for general format
        const headers = ["Filename", "Alt Text", "Project", "Keywords"];
        const rows = filteredImages.map(img => [
          `"${img.filename}"`,
          `"${img.final_alt_text || img.generated_alt_text || ""}"`,
          `"${img.project_name || ""}"`,
          `"${(img.keywords || []).join(", ")}"`
        ]);
        const content = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
        const filename = `alt-text-export-${new Date().toISOString().split('T')[0]}.csv`;

        const blob = new Blob([content], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (selectedFormat === "json") {
        // Client-side JSON generation
        const exportData = filteredImages.map(img => ({
          filename: img.filename,
          alt_text: img.final_alt_text || img.generated_alt_text || "",
          project: img.project_name || "",
          keywords: img.keywords || [],
          image_url: img.file_url
        }));
        const content = JSON.stringify(exportData, null, 2);
        const filename = `alt-text-export-${new Date().toISOString().split('T')[0]}.json`;

        const blob = new Blob([content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else if (selectedFormat === "shopify") {
        // Use server endpoint for Shopify export
        const response = await fetch('/api/export/shopify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageIds })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`Shopify export failed: ${data.error || response.status}`);
        }

        // Show success message with results
        console.log('Shopify export results:', data);
        alert(`Shopify Export Complete!\n\nExported ${data.exportedCount} of ${data.totalCount} images to your Shopify store.`);
      } else if (selectedFormat === "woocommerce") {
        // Use server endpoint for WooCommerce export
        const response = await fetch('/api/export/woocommerce', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageIds })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(`WooCommerce export failed: ${data.error || response.status}`);
        }

        // Show success message with results
        console.log('WooCommerce export results:', data);
        alert(`WooCommerce Export Complete!\n\nExported ${data.exportedCount} of ${data.totalCount} images to your WooCommerce store.`);
      }

      // Mark as exported
      for (const image of filteredImages) {
        await ProductImage.update(image.id, { status: "exported" });
      }

      loadImages();
    } catch (error) {
      console.error("Export error:", error);
    }
    setIsExporting(false);
  };

  const copyToClipboard = async () => {
    const altTexts = filteredImages.map(img => 
      `${img.filename}: ${img.final_alt_text || img.generated_alt_text || ""}`
    ).join("\n\n");
    
    try {
      await navigator.clipboard.writeText(altTexts);
      // Could add a toast notification here
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Download className="w-8 h-8 text-green-600" />
              Export Alt Text
            </h1>
            <p className="text-slate-600 mt-1">Download your AI-generated alt text for e-commerce platforms</p>
          </div>
        </div>

        {isLoading ? (
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white/70 rounded-xl p-6 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/3"></div>
              <div className="h-4 bg-slate-200 rounded"></div>
              <div className="h-4 bg-slate-200 rounded w-2/3"></div>
            </div>
            <div className="bg-white/70 rounded-xl p-6 animate-pulse space-y-4">
              <div className="h-6 bg-slate-200 rounded w-1/4"></div>
              <div className="h-32 bg-slate-200 rounded"></div>
            </div>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Download className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Approved Images</h3>
            <p className="text-slate-500 mb-6">You need to approve some images before you can export alt text</p>
            <Button 
              onClick={() => navigate(createPageUrl("Review"))}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Review Images
            </Button>
          </div>
        ) : (
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Export Configuration */}
            <div className="space-y-6">
              <ExportOptions
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                selectedFormat={selectedFormat}
                onFormatChange={setSelectedFormat}
                imageCount={filteredImages.length}
              />

              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-green-600" />
                    Export Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      onClick={handleExport}
                      disabled={filteredImages.length === 0 || isExporting}
                      className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-700 hover:to-emerald-800 text-white"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      {isExporting ? "Exporting..." : "Download"}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={copyToClipboard}
                      disabled={filteredImages.length === 0}
                      className="hover:bg-slate-50"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy All
                    </Button>
                  </div>
                  
                  <div className="text-center">
                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      {filteredImages.length} images ready to export
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Export Preview */}
            <ExportPreview
              images={filteredImages.slice(0, 5)}
              format={selectedFormat}
            />
          </div>
        )}
      </div>
    </div>
  );
}
