import React, { useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, ImageIcon, Sparkles, Target, TrendingUp, Zap } from "lucide-react";

export default function AdvancedUploadZone({ onFileSelect, dragActive }) {
  const fileInputRef = useRef(null);

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`transition-all duration-300 ${dragActive ? "bg-blue-50 scale-105" : "bg-white/50"}`}>
      <div className="p-12">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={onFileSelect}
          className="hidden"
        />
        
        <div className="text-center max-w-2xl mx-auto">
          <div className={`w-24 h-24 mx-auto mb-8 rounded-3xl flex items-center justify-center transition-all duration-300 ${
            dragActive 
              ? "bg-blue-100 shadow-lg scale-110" 
              : "bg-gradient-to-br from-blue-50 to-indigo-50"
          }`}>
            {dragActive ? (
              <Sparkles className="w-12 h-12 text-blue-600" />
            ) : (
              <ImageIcon className="w-12 h-12 text-blue-600" />
            )}
          </div>
          
          <h3 className="text-3xl font-bold text-slate-900 mb-3">
            {dragActive ? "Drop your images here" : "Professional Image Upload"}
          </h3>
          <p className="text-slate-600 mb-8 leading-relaxed text-lg">
            Upload your product images and let our AI create SEO-optimized, 
            ADA-compliant alt text with competitor analysis and keyword insights.
          </p>
          
          <Button
            type="button"
            onClick={handleBrowseClick}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-10 py-4 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 mb-8"
          >
            <Upload className="w-6 h-6 mr-3" />
            Browse Files
          </Button>
          
          {/* Advanced Features Grid */}
          <div className="grid md:grid-cols-3 gap-6 mt-12 text-left">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Target className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Context-Aware AI</h4>
                <p className="text-sm text-slate-600 mt-1">Uses product title, category, and collection data for smarter descriptions</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">SEO Optimization</h4>
                <p className="text-sm text-slate-600 mt-1">Incorporates target keywords and analyzes competitor strategies</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <Zap className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">ADA Compliance</h4>
                <p className="text-sm text-slate-600 mt-1">Generates detailed descriptions for accessibility requirements</p>
              </div>
            </div>
          </div>
          
          <div className="mt-8 text-sm text-slate-500">
            Supported formats: JPG, PNG, WebP • Maximum file size: 10MB each
          </div>
        </div>
      </div>
    </div>
  );
}
