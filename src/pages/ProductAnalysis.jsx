import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Brain,
  TrendingUp,
  Lightbulb,
  AlertCircle,
  CheckCircle,
  Loader2,
  Target,
  Star,
  Zap
} from 'lucide-react';

const ProductAnalysis = () => {
  const [files, setFiles] = useState([]);
  const [productInfo, setProductInfo] = useState({
    title: '',
    category: '',
    targetAudience: '',
    currentPrice: '',
    competitors: '',
    description: ''
  });
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFiles = Array.from(event.target.files);
    const imageFiles = selectedFiles.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== selectedFiles.length) {
      setError('Please select only image files');
      return;
    }

    if (imageFiles.length > 10) {
      setError('Please select a maximum of 10 images');
      return;
    }

    setFiles(imageFiles);
    setError(null);
  };

  const analyzeProduct = async () => {
    if (files.length === 0) {
      setError('Please select at least one product image');
      return;
    }

    if (!productInfo.title.trim()) {
      setError('Please enter a product title');
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);

    try {
      // Convert images to data URLs
      const imageUrls = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        imageUrls.push(dataUrl);
        setProgress((i + 1) / files.length * 30);
      }

      const token = localStorage.getItem('token');
      const response = await fetch('/api/ai/analyze-product', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          images: imageUrls,
          productInfo: productInfo
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Analysis failed');
      }

      const result = await response.json();
      setAnalysis(result);
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetAnalysis = () => {
    setFiles([]);
    setProductInfo({
      title: '',
      category: '',
      targetAudience: '',
      currentPrice: '',
      competitors: '',
      description: ''
    });
    setAnalysis(null);
    setProgress(0);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Analysis & Insights</h1>
          <p className="text-gray-600">AI-powered analysis to optimize your product strategy</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Input Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Product Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Product Images */}
            <div>
              <Label htmlFor="product-images">Product Images (Max 10)</Label>
              <Input
                id="product-images"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={loading}
              />
              {files.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {files.map((file, index) => (
                    <Badge key={index} variant="outline">
                      {file.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Product Title *</Label>
                <Input
                  id="title"
                  placeholder="Enter product title"
                  value={productInfo.title}
                  onChange={(e) => setProductInfo(prev => ({ ...prev, title: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  placeholder="e.g., Electronics, Fashion"
                  value={productInfo.category}
                  onChange={(e) => setProductInfo(prev => ({ ...prev, category: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="target-audience">Target Audience</Label>
                <Input
                  id="target-audience"
                  placeholder="e.g., Young adults, Professionals"
                  value={productInfo.targetAudience}
                  onChange={(e) => setProductInfo(prev => ({ ...prev, targetAudience: e.target.value }))}
                  disabled={loading}
                />
              </div>
              <div>
                <Label htmlFor="current-price">Current Price</Label>
                <Input
                  id="current-price"
                  placeholder="e.g., $99.99"
                  value={productInfo.currentPrice}
                  onChange={(e) => setProductInfo(prev => ({ ...prev, currentPrice: e.target.value }))}
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="competitors">Key Competitors</Label>
              <Input
                id="competitors"
                placeholder="e.g., Brand A, Brand B, Brand C"
                value={productInfo.competitors}
                onChange={(e) => setProductInfo(prev => ({ ...prev, competitors: e.target.value }))}
                disabled={loading}
              />
            </div>

            <div>
              <Label htmlFor="description">Product Description</Label>
              <Textarea
                id="description"
                placeholder="Describe your product features, benefits, and unique selling points..."
                value={productInfo.description}
                onChange={(e) => setProductInfo(prev => ({ ...prev, description: e.target.value }))}
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={analyzeProduct}
                disabled={files.length === 0 || !productInfo.title.trim() || loading}
                className="flex-1"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Brain className="h-4 w-4 mr-2" />
                )}
                Analyze Product
              </Button>
              <Button variant="outline" onClick={resetAnalysis} disabled={loading}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Analyzing product...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {analysis && (
              <div className="space-y-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Analysis Complete!</span>
                </div>

                {/* Product Score */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="font-medium">Product Score</span>
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {analysis.productScore || 85}/100
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {analysis.scoreDescription || 'Overall product performance rating'}
                  </p>
                </div>

                {/* Key Insights */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Key Insights
                  </h4>
                  <div className="space-y-2">
                    {analysis.keyInsights?.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-gray-50 rounded">
                        <TrendingUp className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No insights available</p>
                    )}
                  </div>
                </div>

                {/* Improvement Suggestions */}
                <div>
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Lightbulb className="h-4 w-4" />
                    Improvement Suggestions
                  </h4>
                  <div className="space-y-2">
                    {analysis.improvements?.map((improvement, index) => (
                      <div key={index} className="flex items-start gap-2 p-3 bg-green-50 rounded">
                        <Zap className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{improvement}</span>
                      </div>
                    )) || (
                      <p className="text-sm text-gray-500">No suggestions available</p>
                    )}
                  </div>
                </div>

                {/* Market Analysis */}
                {analysis.marketAnalysis && (
                  <div>
                    <h4 className="font-medium mb-3">Market Analysis</h4>
                    <div className="bg-yellow-50 p-3 rounded">
                      <p className="text-sm">{analysis.marketAnalysis}</p>
                    </div>
                  </div>
                )}

                {/* Pricing Recommendations */}
                {analysis.pricingRecommendation && (
                  <div>
                    <h4 className="font-medium mb-3">Pricing Recommendations</h4>
                    <div className="bg-purple-50 p-3 rounded">
                      <p className="text-sm">{analysis.pricingRecommendation}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!analysis && !loading && (
              <div className="text-center text-gray-500 py-12">
                <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload product images and enter details to get AI-powered analysis</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Analysis Features */}
      <Card>
        <CardHeader>
          <CardTitle>What You'll Get</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Target className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium mb-1">Visual Analysis</h4>
              <p className="text-sm text-gray-600">
                AI analyzes product images for appeal, quality, and market positioning
              </p>
            </div>
            <div className="text-center">
              <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <h4 className="font-medium mb-1">Market Insights</h4>
              <p className="text-sm text-gray-600">
                Competitive analysis and market positioning recommendations
              </p>
            </div>
            <div className="text-center">
              <Lightbulb className="h-8 w-8 mx-auto mb-2 text-yellow-600" />
              <h4 className="font-medium mb-1">Actionable Suggestions</h4>
              <p className="text-sm text-gray-600">
                Specific recommendations to improve product performance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductAnalysis;