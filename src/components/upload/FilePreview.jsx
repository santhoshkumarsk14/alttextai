import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, FileImage } from "lucide-react";

export default function FilePreview({ files, onRemove, onUpdatePosition, showPositions = false }) {
  const positionOptions = [
    { value: "main", label: "Main Product" },
    { value: "front", label: "Front View" },
    { value: "back", label: "Back View" },
    { value: "side", label: "Side View" },
    { value: "detail", label: "Detail Shot" },
    { value: "lifestyle", label: "Lifestyle" },
    { value: "other", label: "Other" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {files.map((fileData) => (
        <div key={fileData.id} className="relative group">
          <div className="aspect-square bg-slate-100 rounded-lg overflow-hidden shadow-sm">
            <img
              src={fileData.preview}
              alt={fileData.file.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>
          <Button
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 shadow-lg"
            onClick={() => onRemove(fileData.id)}
          >
            <X className="w-3 h-3" />
          </Button>
          <div className="mt-2">
            <p className="text-xs text-slate-600 truncate font-medium">{fileData.file.name}</p>
            <p className="text-xs text-slate-400">
              {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
            </p>
            {showPositions && (
              <div className="mt-2">
                <Select 
                  value={fileData.position} 
                  onValueChange={(value) => onUpdatePosition(fileData.id, value)}
                >
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {positionOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
