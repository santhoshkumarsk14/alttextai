import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Edit3, Save, X, ExternalLink } from "lucide-react";

const statusConfig = {
  uploaded: { label: "Uploaded", color: "bg-blue-100 text-blue-800" },
  processing: { label: "Processing", color: "bg-yellow-100 text-yellow-800" },
  generated: { label: "Generated", color: "bg-purple-100 text-purple-800" },
  approved: { label: "Approved", color: "bg-green-100 text-green-800" },
  exported: { label: "Exported", color: "bg-gray-100 text-gray-800" }
};

export default function ImageReviewCard({ 
  image, 
  onUpdateAltText, 
  isEditing, 
  onStartEdit, 
  onStopEdit 
}) {
  const [editedAltText, setEditedAltText] = useState(image.final_alt_text || image.generated_alt_text || "");
  const [isUpdating, setIsUpdating] = useState(false);

  const handleSave = async () => {
    if (editedAltText.trim() === "") return;
    
    setIsUpdating(true);
    try {
      await onUpdateAltText(image.id, editedAltText.trim());
      onStopEdit();
    } catch (error) {
      console.error("Error saving alt text:", error);
    }
    setIsUpdating(false);
  };

  const handleCancel = () => {
    setEditedAltText(image.final_alt_text || image.generated_alt_text || "");
    onStopEdit();
  };

  const altTextLength = editedAltText.length;
  const isOptimalLength = altTextLength >= 50 && altTextLength <= 125;

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardContent className="p-6">
        {/* Image */}
        <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden mb-4 group">
          <img
            src={image.file_url || `/uploads/${image.original_filename || image.filename}`}
            alt={image.filename}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            onError={(e) => {
              console.error('Image failed to load:', e.target.src);
              e.target.style.display = 'none';
            }}
          />
        </div>

        {/* File Info & Status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-slate-900 truncate">{image.filename}</h3>
            <p className="text-xs text-slate-500">{image.project_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={statusConfig[image.status]?.color}>
              {statusConfig[image.status]?.label}
            </Badge>
            <Button
              variant="ghost"
              size="icon"
              className="w-6 h-6"
              onClick={() => window.open(image.file_url, '_blank')}
            >
              <ExternalLink className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Alt Text Editor */}
        {isEditing ? (
          <div className="space-y-3">
            <Textarea
              value={editedAltText}
              onChange={(e) => setEditedAltText(e.target.value)}
              placeholder="Enter alt text..."
              className="min-h-20 bg-white/80"
              maxLength={200}
            />
            <div className="flex items-center justify-between text-xs">
              <span className={`font-medium ${
                isOptimalLength ? 'text-green-600' : altTextLength > 125 ? 'text-red-600' : 'text-yellow-600'
              }`}>
                {altTextLength} characters {isOptimalLength ? '(optimal)' : altTextLength < 50 ? '(too short)' : '(too long)'}
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isUpdating}
                >
                  <X className="w-3 h-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={!editedAltText.trim() || isUpdating}
                  className="bg-green-600 hover:bg-green-700"
                >
                  <Save className="w-3 h-3 mr-1" />
                  {isUpdating ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="bg-slate-50 rounded-lg p-3 min-h-20">
              <p className="text-sm text-slate-700 leading-relaxed">
                {image.final_alt_text || image.generated_alt_text || "No alt text generated"}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {(image.final_alt_text || image.generated_alt_text || "").length} characters
              </span>
              <div className="flex gap-2">
                {image.status !== "approved" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateAltText(image.id, image.generated_alt_text || "")}
                    className="text-green-600 hover:bg-green-50"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onStartEdit}
                >
                  <Edit3 className="w-3 h-3 mr-1" />
                  Edit
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Keywords */}
        {image.keywords && image.keywords.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-200">
            <p className="text-xs font-medium text-slate-500 mb-2">Keywords:</p>
            <div className="flex flex-wrap gap-1">
              {image.keywords.slice(0, 4).map((keyword, idx) => (
                <Badge key={idx} variant="secondary" className="text-xs">
                  {keyword}
                </Badge>
              ))}
              {image.keywords.length > 4 && (
                <Badge variant="secondary" className="text-xs">
                  +{image.keywords.length - 4} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
