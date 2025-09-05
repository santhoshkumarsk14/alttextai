// /components/upload/ProcessingStatus.jsx - FIXED VERSION
import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Sparkles, 
  Eye, 
  Target, 
  TrendingUp,
  Zap,
  MessageSquare,
  X
} from "lucide-react";

export default function ProcessingStatus({ 
  progress, 
  currentFile, 
  isAdvanced = false,
  realTimeData = null,
  onCancel = null,
  totalFiles = 1,
  processedCount = 0,
  failedCount = 0
}) {
  const [liveChunks, setLiveChunks] = useState([]);
  const [currentStep, setCurrentStep] = useState("");
  const [aiInsights, setAiInsights] = useState({});
  const [stepProgress, setStepProgress] = useState({});
  const chunksRef = useRef([]);
  const lastChunkTime = useRef(Date.now());

  // Handle real-time chunk updates
  useEffect(() => {
    if (realTimeData?.chunk && realTimeData.chunk.trim()) {
      const timestamp = Date.now();
      const newChunk = {
        id: timestamp,
        content: realTimeData.chunk,
        timestamp,
        type: 'thinking'
      };
      
      // Add new chunk to the beginning for latest-first display
      chunksRef.current = [newChunk, ...chunksRef.current.slice(0, 4)]; // Keep only last 5 chunks
      setLiveChunks([...chunksRef.current]);
      lastChunkTime.current = timestamp;
      
      console.log('💭 New AI chunk received:', realTimeData.chunk);
    }
  }, [realTimeData?.chunk]);

  // Handle step updates
  useEffect(() => {
    if (realTimeData?.step) {
      setCurrentStep(realTimeData.step);
      console.log('📍 Step updated:', realTimeData.step);
    }
  }, [realTimeData?.step]);

  // Handle insights updates
  useEffect(() => {
    if (realTimeData?.insights) {
      setAiInsights(realTimeData.insights);
      console.log('🧠 Insights updated:', realTimeData.insights);
    }
  }, [realTimeData?.insights]);

  // Handle progress updates
  useEffect(() => {
    if (realTimeData?.progress !== undefined) {
      setStepProgress(prev => ({
        ...prev,
        [currentStep]: realTimeData.progress
      }));
    }
  }, [realTimeData?.progress, currentStep]);

  const processingSteps = [
    { key: "upload", label: "Image Upload & Validation", icon: Loader2 },
    { key: "analysis", label: "Visual Content Analysis", icon: Eye },
    { key: "seo", label: "SEO Keyword Extraction", icon: Target },
    { key: "generation", label: "Alt Text Generation", icon: Sparkles },
    { key: "optimization", label: "Optimization & Scoring", icon: TrendingUp }
  ];

  const getStepStatus = (stepLabel) => {
    if (currentStep === stepLabel) return "current";
    const stepIndex = processingSteps.findIndex(s => s.label === stepLabel);
    const currentIndex = processingSteps.findIndex(s => s.label === currentStep);
    return stepIndex < currentIndex ? "completed" : "pending";
  };

  const isStreamingActive = Date.now() - lastChunkTime.current < 5000; // Active if chunk received in last 5 seconds

  return (
    <div className="space-y-6">
      {/* Main Progress Card */}
      <Card className="bg-white/90 backdrop-blur-sm border-slate-200/60 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-6 h-6 text-blue-600 animate-pulse" />
              Real-Time AI Processing
              <Badge variant="outline" className={`text-xs ${isStreamingActive ? 'bg-green-50 text-green-700 border-green-200 animate-pulse' : 'bg-gray-50 text-gray-700'}`}>
                {isStreamingActive ? 'Streaming Live' : 'Processing'}
              </Badge>
            </div>
            {totalFiles > 1 && (
              <Badge variant="secondary" className="text-xs">
                {processedCount + failedCount + 1}/{totalFiles} files
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-slate-600">
              <span>Overall Progress</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Current File Status */}
          {currentFile && (
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
              <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{currentFile}</p>
                <p className="text-sm text-slate-600">
                  {currentStep || "Initializing AI analysis..."}
                </p>
              </div>
              {onCancel && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onCancel}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="w-4 h-4 mr-1" />
                  Cancel
                </Button>
              )}
            </div>
          )}

          {/* Processing Steps Pipeline */}
          {isAdvanced && (
            <div className="space-y-4">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                AI Analysis Pipeline
              </h4>
              <div className="space-y-3">
                {processingSteps.map((step, index) => {
                  const status = getStepStatus(step.label);
                  const StepIcon = step.icon;
                  const stepProg = stepProgress[step.label] || 0;
                  
                  return (
                    <div key={step.key} className="flex items-center gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                        status === "completed" 
                          ? "bg-green-100 text-green-600" 
                          : status === "current"
                          ? "bg-blue-100 text-blue-600 ring-2 ring-blue-200"
                          : "bg-slate-100 text-slate-400"
                      }`}>
                        {status === "completed" ? (
                          <CheckCircle className="w-4 h-4" />
                        ) : status === "current" ? (
                          <StepIcon className="w-4 h-4 animate-pulse" />
                        ) : (
                          <StepIcon className="w-4 h-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${
                            status === "completed" 
                              ? "text-green-700" 
                              : status === "current"
                              ? "text-blue-700"
                              : "text-slate-500"
                          }`}>
                            {step.label}
                          </span>
                          {status === "current" && stepProg > 0 && (
                            <span className="text-xs text-blue-600 font-medium">
                              {Math.round(stepProg)}%
                            </span>
                          )}
                        </div>
                        
                        {status === "current" && stepProg > 0 && (
                          <Progress value={stepProg} className="h-2 mt-1" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Live AI Thinking Display */}
          {isAdvanced && liveChunks.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                AI Thinking Stream
                {isStreamingActive && (
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-xs text-green-600">Live</span>
                  </div>
                )}
              </h4>
              <div className="max-h-48 overflow-y-auto space-y-2 p-3 bg-slate-50 rounded-lg border">
                {liveChunks.map((chunk) => (
                  <div key={chunk.id} className="text-sm text-slate-700 font-mono leading-relaxed">
                    <span className="text-xs text-slate-500 mr-2">
                      {new Date(chunk.timestamp).toLocaleTimeString()}
                    </span>
                    {chunk.content}
                  </div>
                ))}
                {liveChunks.length === 0 && (
                  <div className="text-sm text-slate-500 italic text-center py-4">
                    Waiting for AI thoughts...
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Live AI Insights */}
          {isAdvanced && Object.keys(aiInsights).length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-yellow-600" />
                Live Analysis Results
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {aiInsights.main_subject && (
                  <div className="p-3 bg-yellow-50 rounded-lg border border-yellow-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-yellow-800">Subject</p>
                    <p className="text-sm text-yellow-900 truncate" title={aiInsights.main_subject}>
                      {aiInsights.main_subject}
                    </p>
                  </div>
                )}
                
                {aiInsights.confidence_score && (
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-blue-800">Confidence</p>
                    <p className="text-sm text-blue-900">
                      {Math.round(aiInsights.confidence_score * 100)}%
                    </p>
                  </div>
                )}
                
                {aiInsights.seo_score && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-green-800">SEO Score</p>
                    <p className="text-sm text-green-900">{aiInsights.seo_score}/100</p>
                  </div>
                )}
                
                {aiInsights.colors && aiInsights.colors.length > 0 && (
                  <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-purple-800">Colors</p>
                    <p className="text-sm text-purple-900 truncate" title={aiInsights.colors.join(', ')}>
                      {aiInsights.colors.slice(0, 3).join(', ')}
                    </p>
                  </div>
                )}
                
                {aiInsights.materials && aiInsights.materials.length > 0 && (
                  <div className="p-3 bg-orange-50 rounded-lg border border-orange-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-orange-800">Materials</p>
                    <p className="text-sm text-orange-900 truncate" title={aiInsights.materials.join(', ')}>
                      {aiInsights.materials.slice(0, 2).join(', ')}
                    </p>
                  </div>
                )}
                
                {aiInsights.style && (
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-pink-800">Style</p>
                    <p className="text-sm text-pink-900 truncate" title={aiInsights.style}>
                      {aiInsights.style}
                    </p>
                  </div>
                )}
                
                {aiInsights.keywords_used && aiInsights.keywords_used.length > 0 && (
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-indigo-800">Keywords Used</p>
                    <p className="text-sm text-indigo-900 truncate" title={aiInsights.keywords_used.join(', ')}>
                      {aiInsights.keywords_used.slice(0, 2).join(', ')}
                    </p>
                  </div>
                )}
                
                {aiInsights.gender_target && (
                  <div className="p-3 bg-teal-50 rounded-lg border border-teal-200 transition-all duration-300 hover:shadow-md">
                    <p className="text-xs font-medium text-teal-800">Target</p>
                    <p className="text-sm text-teal-900">{aiInsights.gender_target}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Error Display */}
          {realTimeData?.error && (
            <Alert variant="destructive" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Processing Error:</strong> {realTimeData.error}
              </AlertDescription>
            </Alert>
          )}

          {/* Batch Processing Summary */}
          {totalFiles > 1 && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg border">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{processedCount}</div>
                <div className="text-xs text-slate-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedCount}</div>
                <div className="text-xs text-slate-600">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{totalFiles - processedCount - failedCount}</div>
                <div className="text-xs text-slate-600">Remaining</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-Time Debug Panel (for development) */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="bg-slate-900 text-white border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Real-Time Debug Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm font-mono">
              <div>
                <strong>Current Step:</strong> {currentStep || 'None'}
              </div>
              <div>
                <strong>Streaming Active:</strong> {isStreamingActive ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Chunks Received:</strong> {liveChunks.length}
              </div>
              <div>
                <strong>Last Update:</strong> {new Date(lastChunkTime.current).toLocaleTimeString()}
              </div>
            </div>
            
            {realTimeData && (
              <details className="text-xs">
                <summary className="cursor-pointer font-medium">Raw Real-Time Data</summary>
                <pre className="mt-2 p-2 bg-slate-800 rounded overflow-auto max-h-32">
                  {JSON.stringify(realTimeData, null, 2)}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      )}

      {/* Processing Tips */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-blue-900 mb-2">Real-Time AI Processing</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• AI analyzes visual content, context, and SEO requirements in real-time</li>
                <li>• Watch live AI thoughts and analysis as they happen</li>
                <li>• Each step provides immediate feedback and insights</li>
                <li>• Processing adapts dynamically based on image complexity</li>
                {isStreamingActive && (
                  <li className="font-medium text-green-700">• Currently receiving live AI stream!</li>
                )}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}