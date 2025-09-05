import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Download,
  FileText,
  AlertCircle,
  CheckCircle,
  Loader2,
  Table
} from 'lucide-react';

const CSVProcessor = () => {
  const [file, setFile] = useState(null);
  const [platform, setPlatform] = useState('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError(null);
    } else {
      setError('Please select a valid CSV file');
      setFile(null);
    }
  };

  const processCSV = async () => {
    if (!file || !platform) {
      setError('Please select a file and platform');
      return;
    }

    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('csv', file);
      formData.append('platform', platform);

      const token = localStorage.getItem('token');
      const response = await fetch('/api/csv/process', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Processing failed');
      }

      const result = await response.json();
      setResults(result);
      setProgress(100);
    } catch (err) {
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  const downloadProcessedCSV = () => {
    if (!results?.processedCsv) return;

    const blob = new Blob([results.processedCsv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processed_${platform}_${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const resetForm = () => {
    setFile(null);
    setPlatform('');
    setResults(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">CSV Processor</h1>
          <p className="text-gray-600">Process CSV files and update alt text for e-commerce platforms</p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload CSV File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="platform">E-commerce Platform</Label>
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="shopify">Shopify</SelectItem>
                  <SelectItem value="woocommerce">WooCommerce</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="csv-file">CSV File</Label>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                ref={fileInputRef}
                disabled={processing}
              />
              {file && (
                <div className="mt-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-green-600" />
                  <span className="text-sm text-gray-600">{file.name}</span>
                  <Badge variant="outline">{(file.size / 1024).toFixed(1)} KB</Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                onClick={processCSV}
                disabled={!file || !platform || processing}
                className="flex-1"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Table className="h-4 w-4 mr-2" />
                    Process CSV
                  </>
                )}
              </Button>
              <Button variant="outline" onClick={resetForm} disabled={processing}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        <Card>
          <CardHeader>
            <CardTitle>Processing Results</CardTitle>
          </CardHeader>
          <CardContent>
            {processing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processing CSV...</span>
                  <span>{progress}%</span>
                </div>
                <Progress value={progress} />
              </div>
            )}

            {results && (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  <span className="font-medium">Processing Complete!</span>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold text-blue-600">
                      {results.stats?.totalRows || 0}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold text-green-600">
                      {results.stats?.processedRows || 0}
                    </div>
                    <div className="text-sm text-gray-600">Processed</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold text-orange-600">
                      {results.stats?.skippedRows || 0}
                    </div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <div className="text-2xl font-bold text-red-600">
                      {results.stats?.errorRows || 0}
                    </div>
                    <div className="text-sm text-gray-600">Errors</div>
                  </div>
                </div>

                <Button onClick={downloadProcessedCSV} className="w-full">
                  <Download className="h-4 w-4 mr-2" />
                  Download Processed CSV
                </Button>
              </div>
            )}

            {!results && !processing && (
              <div className="text-center text-gray-500 py-8">
                <Table className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Upload a CSV file to see processing results</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>CSV Format Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Shopify CSV Format:</h4>
            <p className="text-sm text-gray-600 mb-2">
              Your CSV should include these columns: Handle, Title, Body (HTML), Variant SKU, Variant Price, Image Src
            </p>
            <p className="text-sm text-gray-600">
              The system will add/update the "Image Alt Text" column with AI-generated alt text.
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-2">WooCommerce CSV Format:</h4>
            <p className="text-sm text-gray-600 mb-2">
              Your CSV should include these columns: ID, Name, Published, SKU, Regular price, Images
            </p>
            <p className="text-sm text-gray-600">
              The system will add/update the "Image alt text" column with AI-generated alt text.
            </p>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Note:</strong> The system preserves all original columns and only adds/updates the alt text column.
              No existing data will be lost or modified except for the alt text field.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default CSVProcessor;