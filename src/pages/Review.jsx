import React, { useState, useEffect } from "react";
import { ProductImage } from "@/entities/ProductImage";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye, CheckCircle, Shield, Users, FlaskConical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import ProjectSelector from "../components/review/ProjectSelector";
import ImageReviewCard from "../components/review/ImageReviewCard";
import BulkActions from "../components/review/BulkActions";
import WCAGValidator from "../components/ui/wcag-validator";
import CollaborativeEditor from "../components/ui/collaborative-editor";
import ABTesting from "../components/ui/ab-testing";

export default function ReviewPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState("all");
  const [editingImage, setEditingImage] = useState(null);
  const [selectedAltText, setSelectedAltText] = useState("");
  const [activeTab, setActiveTab] = useState("review");

  useEffect(() => {
    loadImages();
  }, []);

  useEffect(() => {
    if (selectedProject === "all") {
      setFilteredImages(images);
    } else {
      setFilteredImages(images.filter(img => img.project_name === selectedProject));
    }
  }, [selectedProject, images]);

  const loadImages = async () => {
    setIsLoading(true);
    try {
      // Only load non-approved images for review
      const allImages = await ProductImage.filter({
        status: ['generated', 'uploaded', 'processing', 'error', 'pending']
      }, "-created_date");
      setImages(allImages);
    } catch (error) {
      console.error("Error loading images:", error);
    }
    setIsLoading(false);
  };

  const handleUpdateAltText = async (imageId, newAltText) => {
    try {
      await ProductImage.update(imageId, { 
        final_alt_text: newAltText,
        status: "approved"
      });
      loadImages();
    } catch (error) {
      console.error("Error updating alt text:", error);
    }
  };

  const handleApproveAll = async () => {
    try {
      const pendingImages = filteredImages.filter(img =>
        img.status === "generated" || img.status === "uploaded" || img.status === "pending"
      );
      
      for (const image of pendingImages) {
        await ProductImage.update(image.id, { status: "approved" });
      }
      
      loadImages();
    } catch (error) {
      console.error("Error approving all:", error);
    }
  };

  const projects = [...new Set(images.map(img => img.project_name).filter(Boolean))];
  const pendingCount = filteredImages.filter(img =>
    img.status === "generated" || img.status === "uploaded" || img.status === "pending"
  ).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
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
              <Eye className="w-8 h-8 text-purple-600" />
              Review & Edit Alt Text
            </h1>
            <p className="text-slate-600 mt-1">Review AI-generated alt text and make any needed adjustments</p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 bg-white/70 backdrop-blur-sm rounded-lg p-1 border border-slate-200/60 shadow-sm">
          <button
            onClick={() => setActiveTab("review")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "review"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Eye className="w-4 h-4" />
            Review
          </button>
          <button
            onClick={() => setActiveTab("wcag")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "wcag"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Shield className="w-4 h-4" />
            WCAG Validation
          </button>
          <button
            onClick={() => setActiveTab("collaboration")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "collaboration"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <Users className="w-4 h-4" />
            Collaboration
          </button>
          <button
            onClick={() => setActiveTab("ab-testing")}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeTab === "ab-testing"
                ? "bg-blue-600 text-white shadow-sm"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            }`}
          >
            <FlaskConical className="w-4 h-4" />
            A/B Testing
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === "review" && (
          <>
            {/* Project Filter & Bulk Actions */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <ProjectSelector
                projects={projects}
                selectedProject={selectedProject}
                onProjectChange={setSelectedProject}
                imageCount={filteredImages.length}
              />

              {pendingCount > 0 && (
                <BulkActions
                  pendingCount={pendingCount}
                  onApproveAll={handleApproveAll}
                />
              )}
            </div>
          </>
        )}

        {/* Tab Content */}
        {activeTab === "review" && (
          <>
            {/* Images Grid */}
            {isLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="bg-white/70 rounded-xl p-6 animate-pulse">
                    <div className="aspect-square bg-slate-200 rounded-lg mb-4"></div>
                    <div className="space-y-3">
                      <div className="h-4 bg-slate-200 rounded"></div>
                      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredImages.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredImages.map((image) => (
                  <ImageReviewCard
                    key={image.id}
                    image={image}
                    onUpdateAltText={(altText) => {
                      handleUpdateAltText(image.id, altText);
                      setSelectedAltText(altText);
                    }}
                    isEditing={editingImage === image.id}
                    onStartEdit={() => setEditingImage(image.id)}
                    onStopEdit={() => setEditingImage(null)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Eye className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Images to Review</h3>
                <p className="text-slate-500 mb-6">Upload some images first to start reviewing AI-generated alt text</p>
                <Button
                  onClick={() => navigate(createPageUrl("Upload"))}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Upload Images
                </Button>
              </div>
            )}
          </>
        )}

        {activeTab === "wcag" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">WCAG Compliance Validation</h2>
              <p className="text-slate-600">Validate your alt text against WCAG accessibility guidelines</p>
            </div>
            <WCAGValidator altText={selectedAltText} />
            {selectedAltText && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>Current Alt Text:</strong> {selectedAltText}
                </p>
              </div>
            )}
            {!selectedAltText && (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Select an image from the Review tab to validate its alt text</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "collaboration" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">Collaborative Editing</h2>
              <p className="text-slate-600">Work together with your team in real-time</p>
            </div>
            <CollaborativeEditor
              projectId={selectedProject !== "all" ? selectedProject : "default"}
              initialContent={selectedAltText}
            />
          </div>
        )}

        {activeTab === "ab-testing" && (
          <div className="space-y-6">
            <div className="text-center">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">A/B Testing</h2>
              <p className="text-slate-600">Test different alt text variations and track performance</p>
            </div>
            <ABTesting />
          </div>
        )}
      </div>
    </div>
  );
}
