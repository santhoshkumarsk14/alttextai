import React, { useState, useCallback, useEffect, useRef } from "react";
import { ProductImage, StoreSettings } from "@/entities/all";
import { UploadFile, InvokeLLM, InvokeLLMRealTime } from "@/integrations/Core";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Upload, Sparkles, ArrowLeft, ImageIcon, Settings, Target, Bot, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import AdvancedUploadZone from "../components/upload/AdvancedUploadZone";
import FilePreview from "../components/upload/FilePreview";
import ProcessingStatus from "../components/upload/ProcessingStatus";
import RealTimeAIChat from "../components/upload/RealTimeAIChat";

export default function UploadPage() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [productTitle, setProductTitle] = useState("");
  const [productCategory, setProductCategory] = useState("");
  const [collectionName, setCollectionName] = useState("");
  const [brandVoice, setBrandVoice] = useState("professional");
  const [targetKeywords, setTargetKeywords] = useState("");
  const [settings, setSettings] = useState(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentProcessing, setCurrentProcessing] = useState("");
  const [realTimeData, setRealTimeData] = useState(null);
  const [processingCancelled, setProcessingCancelled] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [processedFiles, setProcessedFiles] = useState([]);
  const [failedFiles, setFailedFiles] = useState([]);
  
  // Refs for cancellation and real-time updates
  const cancelTokenRef = useRef({ cancelled: false });
  const realTimeUpdateRef = useRef(null);

  useEffect(() => {
    loadSettings();
  }, []);

  // Cleanup effect for object URLs
  useEffect(() => {
    return () => {
      files.forEach(f => {
        if (f.preview) {
          URL.revokeObjectURL(f.preview);
        }
      });
    };
  }, [files]);

  const loadSettings = async () => {
    try {
      const userSettings = await StoreSettings.list();
      if (userSettings.length > 0) {
        setSettings(userSettings[0]);
        setBrandVoice(userSettings[0].default_brand_voice || "professional");
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      setError("Failed to load user settings. Some features may not work correctly.");
    }
  };

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  // Convert unsupported image formats to PNG, validate supported formats
  const convertToSupportedFormat = (file) =>
    new Promise((resolve, reject) => {
      // Supported formats by OpenAI Vision API
      const supportedFormats = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

      // If already supported, validate the image can be loaded
      if (supportedFormats.includes(file.type)) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            // Optional: Resize if too large (OpenAI recommends under 512x512 for low detail)
            if (img.width > 1024 || img.height > 1024) {
              const canvas = document.createElement("canvas");
              const maxSize = 1024;
              const ratio = Math.min(maxSize / img.width, maxSize / img.height);
              canvas.width = img.width * ratio;
              canvas.height = img.height * ratio;
              const ctx = canvas.getContext("2d");
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              canvas.toBlob((blob) => {
                if (!blob) return reject("Resize failed");
                const resizedFile = new File([blob], file.name, { type: file.type });
                resolve(resizedFile);
              }, file.type);
            } else {
              resolve(file); // Return original if size is OK
            }
          };
          img.onerror = () => reject(new Error(`Invalid ${file.type} file: cannot load image`));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      } else {
        // Convert unsupported formats to PNG
        const reader = new FileReader();
        reader.onload = (e) => {
          const img = new Image();
          img.onload = () => {
            const canvas = document.createElement("canvas");
            // Resize if too large
            const maxSize = 1024;
            const ratio = Math.min(maxSize / img.width, maxSize / img.height);
            canvas.width = img.width * ratio;
            canvas.height = img.height * ratio;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            canvas.toBlob((blob) => {
              if (!blob) return reject("Conversion failed");
              const pngFile = new File([blob], "converted.png", { type: "image/png" });
              resolve(pngFile);
            }, "image/png");
          };
          img.onerror = () => reject(new Error(`Unsupported format ${file.type}: cannot load image`));
          img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
      }
    });
  
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type.startsWith("image/")
    );

    if (droppedFiles.length === 0) {
      setError("Please upload image files only (PNG, JPEG, WebP)");
      return;
    }

    // Convert unsupported formats to supported format before adding them
    Promise.all(droppedFiles.map(file => convertToSupportedFormat(file)))
      .then(convertedFiles => {
        addFiles(convertedFiles);
      })
      .catch(err => {
        console.error("Image processing error:", err);
        setError(`Failed to process images: ${err.message}. Please ensure files are valid images.`);
      });
  }, []);

  const handleFileInput = (e) => {
    const selectedFiles = Array.from(e.target.files).filter(
      file => file.type.startsWith("image/")
    );

    if (selectedFiles.length === 0) {
      setError("Please upload image files only (PNG, JPEG, WebP)");
      return;
    }

    // Convert unsupported formats to supported format before adding them
    Promise.all(selectedFiles.map(file => convertToSupportedFormat(file)))
      .then(convertedFiles => {
        addFiles(convertedFiles);
      })
      .catch(err => {
        console.error("Image processing error:", err);
        setError(`Failed to process images: ${err.message}. Please ensure files are valid images.`);
      });
  };

  const addFiles = (newFiles) => {
    // Check file size limits (10MB per file)
    const oversizedFiles = newFiles.filter(file => file.size > 10 * 1024 * 1024);
    if (oversizedFiles.length > 0) {
      setError(`Some files are too large (max 10MB): ${oversizedFiles.map(f => f.name).join(', ')}`);
      return;
    }

    const filesWithPreview = newFiles.map((file, index) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
      position: index === 0 ? "main" : "gallery", // First image as main, rest as gallery
      size: file.size,
      lastModified: file.lastModified
    }));
    
    setFiles(prev => [...prev, ...filesWithPreview]);
    setError(null);
  };

  const removeFile = (fileId) => {
    setFiles(prev => {
      const fileToRemove = prev.find(f => f.id === fileId);
      if (fileToRemove && fileToRemove.preview) {
        URL.revokeObjectURL(fileToRemove.preview);
      }
      return prev.filter(f => f.id !== fileId);
    });
  };

  const updateFilePosition = (fileId, position) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, position } : f
    ));
  };

  // Enhanced real-time data update with debouncing
  const updateRealTimeData = useCallback((updates) => {
    if (cancelTokenRef.current.cancelled) return;
    
    // Clear previous timeout
    if (realTimeUpdateRef.current) {
      clearTimeout(realTimeUpdateRef.current);
    }
    
    // Debounce updates to prevent excessive re-renders
    realTimeUpdateRef.current = setTimeout(() => {
      setRealTimeData(prev => ({
        ...prev,
        ...updates,
        lastUpdate: Date.now()
      }));
    }, 50);
  }, []);

  const generateContextAwareAltText = async (imageUrl, filename, filePosition, fileIndex, totalFiles) => {
    const keywords = targetKeywords.split(',').map(k => k.trim()).filter(Boolean);
    
    const contextPrompt = `You are an expert e-commerce SEO specialist. Analyze this product image and generate highly optimized alt text.
  
  CONTEXT INFORMATION:
  - Product Title: ${productTitle || "Not provided"}
  - Category: ${productCategory || "Not provided"}
  - Collection: ${collectionName || "Not provided"}
  - Brand Voice: ${brandVoice}
  - Target Keywords: ${keywords.join(', ') || "Not provided"}
  - Image Position: ${filePosition}
  - Image ${fileIndex + 1} of ${totalFiles}
  - Blacklisted Words: ${settings?.keyword_blacklist?.join(', ') || "None"}
  
  REQUIREMENTS:
  1. Generate SEO-optimized alt text (50-125 characters) that naturally incorporates target keywords
  2. Generate ADA compliant description (detailed, 150-300 characters)
  3. Create unique sequential alt text if this is part of a product gallery
  4. Match the specified brand voice tone
  5. Avoid blacklisted words
  6. Focus on features that drive conversions
  7. Ensure alt text is unique if processing multiple images
  
  Return detailed analysis and both alt text versions.`;
  
    try {
      console.log(`Starting real-time AI analysis for: ${filename}`);
      
      // Initialize real-time data for this file
      updateRealTimeData({
        step: "Initializing AI Analysis",
        currentFile: filename,
        progress: 0,
        chunk: "",
        insights: null
      });
  
      // Check if InvokeLLMRealTime is available and properly configured
      if (typeof InvokeLLMRealTime !== 'function') {
        console.warn("InvokeLLMRealTime not available, falling back to regular LLM");
        throw new Error("Real-time LLM not available");
      }
  
      const response = await InvokeLLMRealTime({
        prompt: contextPrompt,
        file_urls: [imageUrl],
        response_json_schema: {
          type: "object",
          properties: {
            seo_alt_text: { type: "string" },
            ada_alt_text: { type: "string" },
            main_subject: { type: "string" },
            colors: { type: "array", items: { type: "string" } },
            materials: { type: "array", items: { type: "string" } },
            setting: { type: "string" },
            style: { type: "string" },
            gender_target: { type: "string" },
            confidence_score: { type: "number" },
            keywords_used: { type: "array", items: { type: "string" } },
            seo_score: { type: "number" },
            competitor_keywords: { type: "array", items: { type: "string" } }
          }
        },
        onProgress: (progress) => {
          console.log(`Real-time progress for ${filename}:`, progress);
          if (!cancelTokenRef.current.cancelled) {
            updateRealTimeData({
              progress: progress,
              step: progress < 25 ? "Visual Analysis" :
                    progress < 50 ? "Content Understanding" :
                    progress < 75 ? "SEO Optimization" : "Finalizing Results"
            });
          }
        },
        onChunk: (chunk) => {
          console.log(`Real-time chunk for ${filename}:`, chunk);
          if (!cancelTokenRef.current.cancelled) {
            updateRealTimeData({
              chunk: chunk,
              step: "AI Thinking..."
            });
          }
        },
        onError: (error) => {
          console.error(`Real-time error for ${filename}:`, error);
          updateRealTimeData({
            error: error.message,
            step: "Error in AI Processing"
          });
        }
      });
  
      console.log(`Real-time AI analysis completed for: ${filename}`, response);
  
      // FIXED: Parse the analysis string if it exists, or use response directly
      let parsedAnalysis;
      
      if (response.analysis && typeof response.analysis === 'string') {
        try {
          // Clean the analysis string by removing markdown code blocks
          let cleanAnalysis = response.analysis.trim();
          
          // Remove ```json at the beginning
          if (cleanAnalysis.startsWith('```json')) {
            cleanAnalysis = cleanAnalysis.substring(7).trim();
          }
          
          // Remove ``` at the end
          if (cleanAnalysis.endsWith('```')) {
            cleanAnalysis = cleanAnalysis.substring(0, cleanAnalysis.length - 3).trim();
          }
          
          // Parse the cleaned JSON string
          parsedAnalysis = JSON.parse(cleanAnalysis);
          console.log("Parsed analysis from cleaned string:", parsedAnalysis);
        } catch (parseError) {
          console.error("Failed to parse analysis JSON:", parseError);
          // Fallback to using response data directly
          parsedAnalysis = {
            seo_alt_text: response.alt_text || "AI-generated alt text",
            ada_alt_text: response.ada_alt_text || "",
            main_subject: response.main_subject || "",
            colors: response.colors || [],
            materials: response.materials || [],
            setting: response.setting || "",
            style: response.style || "",
            gender_target: response.gender_target || "",
            confidence_score: response.confidence_score || 0.85,
            keywords_used: response.keywords || [],
            seo_score: response.seo_score || 85,
            competitor_keywords: response.competitor_keywords || []
          };
        }
      } else {
        // Use response directly if analysis is not a string
        parsedAnalysis = {
          seo_alt_text: response.seo_alt_text || response.alt_text || "AI-generated alt text",
          ada_alt_text: response.ada_alt_text || "",
          main_subject: response.main_subject || "",
          colors: response.colors || [],
          materials: response.materials || [],
          setting: response.setting || "",
          style: response.style || "",
          gender_target: response.gender_target || "",
          confidence_score: response.confidence_score || 0.85,
          keywords_used: response.keywords_used || response.keywords || [],
          seo_score: response.seo_score || 85,
          competitor_keywords: response.competitor_keywords || []
        };
      }
  
      // Log response structure for debugging
      console.log(`Final parsed analysis for ${filename}:`, parsedAnalysis);
  
      return parsedAnalysis;
  
    } catch (error) {
      console.error(`Real-time AI failed for ${filename}, falling back to standard processing:`, error);
      
      updateRealTimeData({
        step: "Fallback Processing",
        chunk: "Switching to standard AI processing..."
      });
  
      // Fallback to regular LLM processing
      try {
        const fallbackResponse = await InvokeLLM({
          prompt: contextPrompt,
          file_urls: [imageUrl],
          response_json_schema: {
            type: "object",
            properties: {
              seo_alt_text: { type: "string" },
              ada_alt_text: { type: "string" },
              main_subject: { type: "string" },
              colors: { type: "array", items: { type: "string" } },
              materials: { type: "array", items: { type: "string" } },
              setting: { type: "string" },
              style: { type: "string" },
              gender_target: { type: "string" },
              confidence_score: { type: "number", default: 0.75 },
              keywords_used: { type: "array", items: { type: "string" } },
              seo_score: { type: "number", default: 80 },
              competitor_keywords: { type: "array", items: { type: "string" } }
            }
          }
        });
        
        updateRealTimeData({
          step: "Standard Processing Complete",
          chunk: "Analysis completed using standard AI processing"
        });
  
        // Apply same parsing logic for fallback
        let parsedFallback;
        if (fallbackResponse.analysis && typeof fallbackResponse.analysis === 'string') {
          try {
            // Clean the analysis string by removing markdown code blocks
            let cleanAnalysis = fallbackResponse.analysis.trim();
            
            // Remove ```json at the beginning
            if (cleanAnalysis.startsWith('```json')) {
              cleanAnalysis = cleanAnalysis.substring(7).trim();
            }
            
            // Remove ``` at the end
            if (cleanAnalysis.endsWith('```')) {
              cleanAnalysis = cleanAnalysis.substring(0, cleanAnalysis.length - 3).trim();
            }
            
            parsedFallback = JSON.parse(cleanAnalysis);
          } catch (parseError) {
            parsedFallback = {
              seo_alt_text: fallbackResponse.seo_alt_text || fallbackResponse.alt_text || "AI-generated alt text",
              ada_alt_text: fallbackResponse.ada_alt_text || "",
              main_subject: fallbackResponse.main_subject || "",
              colors: fallbackResponse.colors || [],
              materials: fallbackResponse.materials || [],
              setting: fallbackResponse.setting || "",
              style: fallbackResponse.style || "",
              gender_target: fallbackResponse.gender_target || "",
              confidence_score: fallbackResponse.confidence_score || 0.75,
              keywords_used: fallbackResponse.keywords_used || fallbackResponse.keywords || [],
              seo_score: fallbackResponse.seo_score || 80,
              competitor_keywords: fallbackResponse.competitor_keywords || []
            };
          }
        } else {
          parsedFallback = fallbackResponse;
        }
  
        return parsedFallback;
      } catch (fallbackError) {
        console.error(`Both real-time and fallback processing failed for ${filename}:`, fallbackError);
        throw new Error(`AI processing failed: ${fallbackError.message}`);
      }
    }
  };

  const processFiles = async () => {
    if (files.length === 0) return;
    if (!projectName.trim()) {
      setError("Please enter a project name above before generating alt text");
      document.getElementById("projectName")?.focus();
      return;
    }

    // Check subscription limits
    if (settings && settings.images_processed_this_month >= settings.monthly_image_limit) {
      setError("You've reached your monthly image limit. Please upgrade your plan to continue.");
      return;
    }

    // Reset processing state
    setIsProcessing(true);
    setProcessingProgress(0);
    setError(null);
    setRealTimeData(null);
    setProcessingCancelled(false);
    setProcessedFiles([]);
    setFailedFiles([]);
    cancelTokenRef.current = { cancelled: false };

    try {
      const total = files.length;
      const stepWeights = { upload: 0.2, analysis: 0.5, generation: 0.2, saving: 0.1 };
      let successCount = 0;
      
      for (let i = 0; i < files.length; i++) {
        if (cancelTokenRef.current.cancelled) {
          console.log("Processing cancelled by user");
          break;
        }
        
        const fileData = files[i];
        const baseProgress = (i / total) * 100;
        
        try {
          // Step 1: Upload with progress tracking
          updateRealTimeData({
            step: "Image Upload & Validation",
            currentFile: fileData.file.name,
            fileIndex: i + 1,
            totalFiles: total,
            progress: 0
          });
          
          setCurrentProcessing(`Uploading ${fileData.file.name}...`);
          
          const { file_url } = await UploadFile({ 
            file: fileData.file,
            onProgress: (uploadProgress) => {
              const currentStepProgress = baseProgress + (uploadProgress * stepWeights.upload / 100);
              setProcessingProgress(currentStepProgress);
              updateRealTimeData({
                progress: uploadProgress,
                step: `Uploading ${fileData.file.name}... ${Math.round(uploadProgress)}%`
              });
            }
          });

          if (cancelTokenRef.current.cancelled) break;

          // Step 2: AI Analysis with real-time updates
          updateRealTimeData({
            step: "Visual Content Analysis",
            currentFile: fileData.file.name,
            progress: 0
          });
          
          setCurrentProcessing(`AI analyzing ${fileData.file.name} with SEO optimization...`);
          
          const analysis = await generateContextAwareAltText(
            file_url, 
            fileData.file.name, 
            fileData.position, 
            i, 
            total
          );

          if (cancelTokenRef.current.cancelled) break;

          // Step 3: Update insights with safe property access
          updateRealTimeData({
            step: "SEO Keyword Extraction",
            insights: {
              main_subject: analysis?.main_subject || "",
              colors: analysis?.colors || [],
              materials: analysis?.materials || [],
              setting: analysis?.setting || "",
              style: analysis?.style || "",
              gender_target: analysis?.gender_target || "",
              confidence_score: analysis?.confidence_score || 0.85,
              seo_score: analysis?.seo_score || 85,
              keywords_used: analysis?.keywords_used || []
            },
            progress: 85
          });

          // Step 4: Save to database with safe property access
          updateRealTimeData({
            step: "Saving Results",
            progress: 90
          });

          setCurrentProcessing(`Saving ${fileData.file.name}...`);

          // Ensure analysis object has expected structure
          const safeAnalysis = {
            seo_alt_text: analysis?.seo_alt_text || analysis?.alt_text || "AI-generated alt text",
            ada_alt_text: analysis?.ada_alt_text || analysis?.ada_compliant_description || "",
            main_subject: analysis?.main_subject || "",
            colors: analysis?.colors || [],
            materials: analysis?.materials || [],
            setting: analysis?.setting || "",
            style: analysis?.style || "",
            gender_target: analysis?.gender_target || "",
            confidence_score: analysis?.confidence_score || 0.85,
            keywords_used: analysis?.keywords_used || analysis?.keywords || [],
            seo_score: analysis?.seo_score || 85,
            competitor_keywords: analysis?.competitor_keywords || []
          };

          const savedImage = await ProductImage.create({
            filename: fileData.file.name,
            file_url,
            product_title: productTitle || "",
            product_category: productCategory || "",
            collection_name: collectionName || "",
            target_keywords: targetKeywords.split(',').map(k => k.trim()).filter(Boolean),
            competitor_keywords: safeAnalysis.competitor_keywords,
            generated_alt_text: safeAnalysis.seo_alt_text,
            ada_alt_text: safeAnalysis.ada_alt_text,
            final_alt_text: safeAnalysis.seo_alt_text,
            status: "generated",
            project_name: projectName.trim(),
            brand_voice: brandVoice,
            image_position: fileData.position,
            seo_score: safeAnalysis.seo_score,
            ada_compliant: safeAnalysis.ada_alt_text?.length >= 150,
            keywords: safeAnalysis.keywords_used,
            image_analysis: {
              main_subject: safeAnalysis.main_subject,
              colors: safeAnalysis.colors,
              materials: safeAnalysis.materials,
              setting: safeAnalysis.setting,
              style: safeAnalysis.style,
              gender_target: safeAnalysis.gender_target,
              confidence_score: safeAnalysis.confidence_score
            },
            performance_metrics: {
              impressions: 0,
              clicks: 0,
              ctr: 0,
              rank_improvement: 0
            }
          });

          // Update final progress for this file
          const finalProgress = ((i + 1) / total) * 100;
          setProcessingProgress(finalProgress);
          
          updateRealTimeData({
            step: "Complete",
            progress: 100,
            currentFile: fileData.file.name
          });

          // Track successful processing
          setProcessedFiles(prev => [...prev, { 
            ...fileData, 
            savedImage,
            analysis 
          }]);
          successCount++;

          // Small delay between files to prevent overwhelming the UI
          if (i < files.length - 1 && !cancelTokenRef.current.cancelled) {
            await new Promise(resolve => setTimeout(resolve, 500));
          }

        } catch (fileError) {
          console.error(`Error processing ${fileData.file.name}:`, fileError);
          
          // Track failed file but continue processing others
          setFailedFiles(prev => [...prev, {
            ...fileData,
            error: fileError.message
          }]);

          updateRealTimeData({
            step: "Error",
            error: `Failed to process ${fileData.file.name}: ${fileError.message}`,
            progress: 0
          });

          // Continue with next file after a brief pause
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Final processing summary
      if (!cancelTokenRef.current.cancelled) {
        console.log(`Processing complete: ${successCount}/${total} files processed successfully`);
        
        // Update usage counter only for successful files
        if (settings && successCount > 0) {
          try {
            await StoreSettings.update(settings.id, {
              images_processed_this_month: settings.images_processed_this_month + successCount
            });
          } catch (updateError) {
            console.error("Error updating usage counter:", updateError);
          }
        }
        
        // Show completion summary
        if (failedFiles.length > 0) {
          setError(`Processing completed with ${failedFiles.length} errors. ${successCount} images processed successfully.`);
        }
        
        // Clean up and navigate only if we have successful results
        if (successCount > 0) {
          // Clean up previews
          files.forEach(f => {
            if (f.preview) {
              URL.revokeObjectURL(f.preview);
            }
          });
          
          // Reset form
          setFiles([]);
          setProjectName("");
          setProductTitle("");
          setProductCategory("");
          setCollectionName("");
          setTargetKeywords("");
          
          // Navigate to review page with a delay to show completion
          updateRealTimeData({
            step: "Redirecting to Results",
            progress: 100
          });
          
          setTimeout(() => {
            navigate(createPageUrl("Review"));
          }, 2000);
        }
      } else {
        console.log("Processing was cancelled by user");
        setError("Processing was cancelled. Partial results may have been saved.");
      }
      
    } catch (error) {
      console.error("Critical processing error:", error);
      setError(`Critical error during processing: ${error.message}. Please try again.`);
    } finally {
      setIsProcessing(false);
      setCurrentProcessing("");
      
      // Clear real-time data after a delay to show final state
      setTimeout(() => {
        setRealTimeData(null);
      }, 3000);
      
      // Clear any pending timeouts
      if (realTimeUpdateRef.current) {
        clearTimeout(realTimeUpdateRef.current);
      }
    }
  };

  const cancelProcessing = useCallback(() => {
    console.log("User requested processing cancellation");
    cancelTokenRef.current.cancelled = true;
    setProcessingCancelled(true);
    setIsProcessing(false);
    setCurrentProcessing("");
    
    updateRealTimeData({
      step: "Cancelling...",
      progress: 0,
      chunk: "Processing cancellation requested"
    });
    
    // Clear real-time data after showing cancellation message
    setTimeout(() => {
      setRealTimeData(null);
    }, 2000);
  }, [updateRealTimeData]);

  const handleAltTextGenerated = useCallback((altText) => {
    console.log("AI chat generated alt text:", altText);
    // You can integrate this with your existing alt text handling logic
    // For example, pre-fill the target keywords or show suggestions
    if (altText && typeof altText === 'string') {
      // Extract potential keywords from the generated alt text
      const potentialKeywords = altText.toLowerCase()
        .split(/[\s,.-]+/)
        .filter(word => word.length > 3)
        .slice(0, 5)
        .join(', ');
      
      if (!targetKeywords.trim()) {
        setTargetKeywords(potentialKeywords);
      }
    }
  }, [targetKeywords]);

  const remainingImages = settings ? Math.max(0, settings.monthly_image_limit - settings.images_processed_this_month) : 500;

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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Upload className="w-8 h-8 text-blue-600" />
              Advanced Image Upload & Processing
            </h1>
            <p className="text-slate-600 mt-1">Context-aware AI generation with SEO optimization and competitor analysis</p>
          </div>
          <div className="text-right flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAIChat(!showAIChat)}
              className="flex items-center gap-2"
            >
              <Bot className="w-4 h-4" />
              {showAIChat ? "Hide" : "Show"} AI Assistant
            </Button>
            <Badge variant={remainingImages > 10 ? "outline" : "destructive"} className="text-xs">
              {remainingImages} images remaining this month
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="destructive" className="bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Show processing summary if there are failed files */}
        {failedFiles.length > 0 && !isProcessing && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="space-y-1">
                <div className="font-semibold">Processing Summary:</div>
                <div>✅ Successfully processed: {processedFiles.length} files</div>
                <div>❌ Failed: {failedFiles.length} files</div>
                {failedFiles.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm font-medium">View failed files</summary>
                    <ul className="mt-1 text-sm space-y-1">
                      {failedFiles.map((failed, idx) => (
                        <li key={idx} className="text-red-600">
                          {failed.file.name}: {failed.error}
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {!isProcessing ? (
          <div className="space-y-8">
            {/* AI Chat Assistant */}
            {showAIChat && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-600" />
                    AI Assistant - Real-Time Help
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <RealTimeAIChat 
                    onAltTextGenerated={handleAltTextGenerated}
                    currentImage={files.length > 0 ? files[0] : null}
                    projectContext={{
                      projectName,
                      productTitle,
                      productCategory,
                      targetKeywords,
                      brandVoice
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Context Setup */}
            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-600" />
                  Product Context & SEO Setup
                  <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                    Enhanced Features
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="projectName" className="text-sm font-semibold text-slate-700">
                      Project Name *
                    </Label>
                    <Input
                      id="projectName"
                      placeholder="e.g., Summer Collection 2024"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className={`mt-1 bg-white/50 ${!projectName.trim() && files.length > 0 ? 'border-orange-300 bg-orange-50' : ''}`}
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productTitle" className="text-sm font-semibold text-slate-700">
                      Product Title
                    </Label>
                    <Input
                      id="productTitle"
                      placeholder="e.g., Organic Cotton T-Shirt"
                      value={productTitle}
                      onChange={(e) => setProductTitle(e.target.value)}
                      className="mt-1 bg-white/50"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="productCategory" className="text-sm font-semibold text-slate-700">
                      Category
                    </Label>
                    <Select value={productCategory} onChange={setProductCategory} disabled={isProcessing}>
                      <SelectTrigger className="bg-white/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing & Apparel</SelectItem>
                        <SelectItem value="shoes">Shoes & Footwear</SelectItem>
                        <SelectItem value="accessories">Accessories</SelectItem>
                        <SelectItem value="electronics">Electronics</SelectItem>
                        <SelectItem value="home-garden">Home & Garden</SelectItem>
                        <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                        <SelectItem value="sports">Sports & Outdoors</SelectItem>
                        <SelectItem value="jewelry">Jewelry & Watches</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="collectionName" className="text-sm font-semibold text-slate-700">
                      Collection/Season
                    </Label>
                    <Input
                      id="collectionName"
                      placeholder="e.g., Summer 2024, Holiday Collection"
                      value={collectionName}
                      onChange={(e) => setCollectionName(e.target.value)}
                      className="mt-1 bg-white/50"
                      disabled={isProcessing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="brandVoice" className="text-sm font-semibold text-slate-700">
                      Brand Voice
                    </Label>
                    <Select value={brandVoice} onChange={setBrandVoice} disabled={isProcessing}>
                      <SelectTrigger className="bg-white/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="descriptive">Descriptive</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="playful">Playful</SelectItem>
                        <SelectItem value="luxury">Luxury</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="targetKeywords" className="text-sm font-semibold text-slate-700">
                      Target Keywords
                    </Label>
                    <Input
                      id="targetKeywords"
                      placeholder="e.g., organic cotton, sustainable fashion, eco-friendly"
                      value={targetKeywords}
                      onChange={(e) => setTargetKeywords(e.target.value)}
                      className="mt-1 bg-white/50"
                      disabled={isProcessing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg overflow-hidden">
              <CardContent className="p-0">
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <AdvancedUploadZone 
                    onFileSelect={handleFileInput}
                    dragActive={dragActive}
                    disabled={isProcessing}
                  />
                </div>
              </CardContent>
            </Card>

            {files.length > 0 && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-green-600" />
                    Selected Images ({files.length})
                    {files.length > 1 && (
                      <Badge variant="secondary" className="text-xs">
                        Batch Processing Enabled
                      </Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <FilePreview 
                    files={files}
                    onRemove={removeFile}
                    onUpdatePosition={updateFilePosition}
                    showPositions={true}
                    disabled={isProcessing}
                  />
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div className="text-sm text-slate-600">
                      {files.length > 1 ? (
                        <span>Ready to process {files.length} images with AI-powered analysis</span>
                      ) : (
                        <span>Ready to generate premium alt text with real-time AI</span>
                      )}
                    </div>
                    
                    <Button
                      onClick={processFiles}
                      disabled={files.length === 0 || !projectName.trim() || remainingImages <= 0 || isProcessing}
                      className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white px-8 py-2.5 font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      {files.length > 1 
                        ? `Process ${files.length} Images with AI` 
                        : "Generate Premium Alt Text"
                      }
                    </Button>
                  </div>

                  {files.length > 5 && (
                    <Alert className="mt-4 bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertDescription>
                        <strong>Large Batch Processing:</strong> {files.length} images will be processed sequentially. 
                        You can cancel at any time and partial results will be saved.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            <ProcessingStatus 
              progress={processingProgress}
              currentFile={currentProcessing}
              isAdvanced={true}
              realTimeData={realTimeData}
              onCancel={cancelProcessing}
              totalFiles={files.length}
              processedCount={processedFiles.length}
              failedCount={failedFiles.length}
            />
            
            {/* Real-time AI visualization */}
            {realTimeData && (
              <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="w-5 h-5 text-purple-600 animate-pulse" />
                    Real-Time AI Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Current Step</Label>
                      <div className="p-3 bg-slate-50 rounded-lg border">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          <span className="text-sm font-medium">{realTimeData.step || "Initializing..."}</span>
                        </div>
                        {realTimeData.currentFile && (
                          <div className="text-xs text-slate-600 mt-1">
                            File: {realTimeData.currentFile}
                          </div>
                        )}
                        {realTimeData.fileIndex && realTimeData.totalFiles && (
                          <div className="text-xs text-slate-600">
                            Progress: {realTimeData.fileIndex} of {realTimeData.totalFiles}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {realTimeData.chunk && (
                      <div>
                        <Label className="text-sm font-semibold text-slate-700">AI Thinking</Label>
                        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                          <div className="text-sm text-purple-800 font-mono">
                            {realTimeData.chunk.length > 100 
                              ? `${realTimeData.chunk.substring(0, 100)}...` 
                              : realTimeData.chunk
                            }
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {realTimeData.progress !== undefined && (
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">
                        Processing Progress ({Math.round(realTimeData.progress)}%)
                      </Label>
                      <Progress value={realTimeData.progress} className="mt-2" />
                    </div>
                  )}

                  {realTimeData.insights && (
                    <div>
                      <Label className="text-sm font-semibold text-slate-700">Live Analysis Insights</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                        {realTimeData.insights.main_subject && (
                          <div className="p-2 bg-green-50 rounded border border-green-200">
                            <div className="text-xs font-medium text-green-800">Subject</div>
                            <div className="text-sm text-green-700">{realTimeData.insights.main_subject}</div>
                          </div>
                        )}
                        {realTimeData.insights.confidence_score && (
                          <div className="p-2 bg-blue-50 rounded border border-blue-200">
                            <div className="text-xs font-medium text-blue-800">Confidence</div>
                            <div className="text-sm text-blue-700">{Math.round(realTimeData.insights.confidence_score * 100)}%</div>
                          </div>
                        )}
                        {realTimeData.insights.seo_score && (
                          <div className="p-2 bg-orange-50 rounded border border-orange-200">
                            <div className="text-xs font-medium text-orange-800">SEO Score</div>
                            <div className="text-sm text-orange-700">{realTimeData.insights.seo_score}/100</div>
                          </div>
                        )}
                        {realTimeData.insights.colors && realTimeData.insights.colors.length > 0 && (
                          <div className="p-2 bg-purple-50 rounded border border-purple-200">
                            <div className="text-xs font-medium text-purple-800">Colors</div>
                            <div className="text-sm text-purple-700">{realTimeData.insights.colors.slice(0, 2).join(', ')}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {realTimeData.error && (
                    <Alert variant="destructive" className="bg-red-50 border-red-200">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Real-time processing error: {realTimeData.error}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}