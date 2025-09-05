import React, { useState, useEffect, useMemo, useCallback } from "react";
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Custom AG Grid styles
const customGridStyles = `
  .ag-theme-alpine-dark .ag-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    font-weight: 600;
  }

  .ag-theme-alpine-dark .ag-header-cell {
    border-right: 1px solid rgba(255, 255, 255, 0.1);
  }

  .ag-theme-alpine-dark .ag-row:hover {
    background-color: #f0f9ff !important;
    transition: background-color 0.2s ease;
  }

  .ag-theme-alpine-dark .ag-cell {
    border-right: 1px solid #f1f5f9;
    padding: 8px 12px;
  }

  .ag-theme-alpine-dark .ag-checkbox-input-wrapper {
    border-radius: 4px;
  }

  .ag-theme-alpine-dark .ag-paging-panel {
    background: #f8fafc;
    border-top: 1px solid #e2e8f0;
  }

  .ag-theme-alpine-dark .ag-paging-button {
    border-radius: 6px;
    margin: 0 2px;
  }
`;

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);
import { ProductImage } from "@/entities/ProductImage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Search,
  Download,
  Copy,
  Trash2,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Filter,
  MoreHorizontal,
  FileText,
  Image as ImageIcon
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import socketService from "@/services/socketService";

export default function ImageLibraryPage() {
  const navigate = useNavigate();
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRows, setSelectedRows] = useState([]);
  const [gridApi, setGridApi] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [processingImages, setProcessingImages] = useState(new Set());
  const [syncProgress, setSyncProgress] = useState(null);

  useEffect(() => {
    loadImages();
  }, []);

  // Socket.io real-time features
  useEffect(() => {
    const connectSocket = async () => {
      try {
        // Get current user ID (you might need to get this from auth context)
        const userId = 'user-1'; // Replace with actual user ID from auth
        await socketService.connect(userId);

        // Set up real-time listeners
        socketService.on('notification', handleRealTimeNotification);
        socketService.on('task-completed', handleTaskCompleted);
        socketService.on('sync-progress', handleSyncProgress);

        console.log('Real-time features connected');
      } catch (error) {
        console.error('Failed to connect to real-time features:', error);
      }
    };

    connectSocket();

    // Cleanup
    return () => {
      socketService.off('notification', handleRealTimeNotification);
      socketService.off('task-completed', handleTaskCompleted);
      socketService.off('sync-progress', handleSyncProgress);
    };
  }, []);

  useEffect(() => {
    // Filter images based on search term
    if (searchTerm) {
      const filtered = images.filter(image =>
        image.filename?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.generated_alt_text?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        image.project_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredImages(filtered);
    } else {
      setFilteredImages(images);
    }
  }, [images, searchTerm]);

  const loadImages = async () => {
    console.log("Starting to load images...");
    setIsLoading(true);
    try {
      // Test server connection first
      const testResponse = await fetch('/api/server-info');
      if (!testResponse.ok) {
        throw new Error(`Server not accessible: ${testResponse.status}`);
      }
      const serverInfo = await testResponse.json();
      console.log("Server info:", serverInfo);

      // Only load approved images for the library
      const allImages = await ProductImage.filter({
        status: 'approved'
      }, "-created_date");
      console.log("API response received:", allImages);
      setImages(allImages);
      setFilteredImages(allImages);
      console.log("Images loaded successfully:", allImages.length);
    } catch (error) {
      console.error("Error loading images:", error);
      alert(`Failed to refresh images: ${error.message}. Please check if the server is running on port 3004.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAltTextUpdate = async (imageId, newAltText) => {
    try {
      await ProductImage.update(imageId, {
        final_alt_text: newAltText,
        status: "approved"
      });
      loadImages(); // Refresh the grid
    } catch (error) {
      console.error("Error updating alt text:", error);
    }
  };

  const handleRegenerateAltText = async (image) => {
    try {
      // Add to processing set for real-time tracking
      setProcessingImages(prev => new Set(prev).add(image.original_filename || image.filename));

      // Update status to processing
      await ProductImage.update(image.id, { status: "processing" });

      // Trigger AI regeneration (you would implement this API call)
      console.log('Triggering AI regeneration for:', image.filename);

      // For demo purposes, simulate completion after 3 seconds
      setTimeout(() => {
        handleTaskCompleted({
          message: `Alt text regenerated for ${image.filename}`,
          data: { filename: image.filename, taskType: 'regeneration' },
          timestamp: new Date().toISOString()
        });
      }, 3000);

    } catch (error) {
      console.error("Error regenerating alt text:", error);
      setProcessingImages(prev => {
        const newSet = new Set(prev);
        newSet.delete(image.original_filename || image.filename);
        return newSet;
      });
    }
  };

  const handleDeleteImage = async (imageId) => {
    if (window.confirm("Are you sure you want to delete this image?")) {
      try {
        await ProductImage.delete(imageId);
        loadImages();
      } catch (error) {
        console.error("Error deleting image:", error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRows.length === 0) return;

    if (window.confirm(`Are you sure you want to delete ${selectedRows.length} images?`)) {
      try {
        for (const imageId of selectedRows) {
          await ProductImage.delete(imageId);
        }
        loadImages();
        setSelectedRows([]);
      } catch (error) {
        console.error("Error deleting images:", error);
      }
    }
  };

  const handleBulkExport = () => {
    if (selectedRows.length === 0) return;

    const selectedImages = images.filter(img => selectedRows.includes(img.id));
    const csvContent = [
      ['Filename', 'Alt Text', 'SEO Score', 'Project', 'Date Processed', 'Status'],
      ...selectedImages.map(img => [
        img.filename,
        img.final_alt_text || img.generated_alt_text,
        img.seo_score,
        img.project_name,
        new Date(img.created_date).toLocaleDateString(),
        img.status
      ])
    ].map(row => row.map(cell => `"${cell || ''}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'alt-text-export.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handlePlatformExport = async (platform) => {
    if (selectedRows.length === 0) return;

    try {
      const selectedImages = images.filter(img => selectedRows.includes(img.id));
      const imageIds = selectedImages.map(img => img.id);

      const response = await fetch(`/api/export/${platform}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ imageIds }),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${platform}-export.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
      alert(`Failed to export for ${platform}: ${error.message}`);
    }
  };

  const handleCopyAltText = (altText) => {
    navigator.clipboard.writeText(altText);
    // You could add a toast notification here
  };

  const handleDownloadWithExif = async (image) => {
    try {
      // This would be implemented to embed alt text in EXIF data
      // For now, just download the original image
      const filename = image.original_filename || image.filename;
      const imageUrl = `/uploads/${filename}`;

      console.log('Downloading image:', { filename, imageUrl });

      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;

      // Add to DOM temporarily for Firefox compatibility
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      console.log('Download initiated for:', filename);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download image. Please try again.');
    }
  };

  // Real-time event handlers
  const handleRealTimeNotification = (data) => {
    console.log('Real-time notification:', data);
    setNotifications(prev => [data, ...prev.slice(0, 4)]); // Keep last 5 notifications

    // Show browser notification
    if (Notification.permission === 'granted') {
      new Notification('AltText AI', {
        body: data.message,
        icon: '/favicon.ico'
      });
    }
  };

  const handleTaskCompleted = (data) => {
    console.log('Task completed:', data);

    // Remove from processing set
    setProcessingImages(prev => {
      const newSet = new Set(prev);
      newSet.delete(data.data?.filename);
      return newSet;
    });

    // Refresh the grid to show updated data
    loadImages();

    // Show notification
    handleRealTimeNotification({
      type: 'task_completed',
      message: data.message,
      timestamp: data.timestamp
    });
  };

  const handleSyncProgress = (data) => {
    console.log('Sync progress:', data);
    setSyncProgress(data);

    if (data.progress === 100) {
      // Sync completed
      setTimeout(() => {
        setSyncProgress(null);
        loadImages(); // Refresh the grid
      }, 2000);
    }
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'select',
      headerName: '',
      width: 50,
      checkboxSelection: true,
      headerCheckboxSelection: true,
      pinned: 'left'
    },
    {
      field: 'thumbnail',
      headerName: 'Thumbnail',
      width: 100,
      cellRenderer: (params) => {
        // Construct proper image URL
        const filename = params.data.original_filename || params.data.filename;
        const imageUrl = filename ? `/uploads/${filename}` : null;

        if (!imageUrl) {
          return (
            <div className="flex items-center justify-center">
              <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 flex items-center justify-center">
                <ImageIcon className="w-6 h-6 text-gray-400" />
              </div>
            </div>
          );
        }

        return (
          <div className="flex items-center justify-center">
            <img
              src={imageUrl}
              alt="thumbnail"
              className="w-12 h-12 object-cover rounded border border-gray-200 shadow-sm"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div className="w-12 h-12 bg-gray-200 rounded border border-gray-300 items-center justify-center hidden">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
          </div>
        );
      },
      pinned: 'left'
    },
    {
      field: 'filename',
      headerName: 'Filename',
      width: 200,
      filter: 'agTextColumnFilter',
      pinned: 'left'
    },
    {
      field: 'generated_alt_text',
      headerName: 'Alt Text',
      width: 300,
      editable: true,
      cellEditor: 'agTextCellEditor',
      cellEditorParams: {
        maxLength: 125
      },
      cellRenderer: (params) => {
        const altText = params.value || '';
        const isOverLimit = altText.length > 125;

        return (
          <div className="group relative">
            <div className={`text-sm ${isOverLimit ? 'text-red-600' : 'text-gray-900'}`}>
              {altText.length > 50 ? `${altText.substring(0, 50)}...` : altText}
            </div>
            <div className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopyAltText(altText)}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        );
      },
      onCellValueChanged: (params) => {
        handleAltTextUpdate(params.data.id, params.newValue);
      }
    },
    {
      field: 'seo_score',
      headerName: 'SEO Score',
      width: 120,
      cellRenderer: (params) => {
        const score = params.value || 0;
        const getScoreColor = (score) => {
          if (score >= 80) return 'bg-green-500';
          if (score >= 60) return 'bg-yellow-500';
          return 'bg-red-500';
        };

        return (
          <div className="flex items-center space-x-2">
            <div className="w-16 bg-gray-200 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${getScoreColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className="text-sm font-medium">{score}/100</span>
          </div>
        );
      },
      filter: 'agNumberColumnFilter'
    },
    {
      field: 'character_count',
      headerName: 'Characters',
      width: 100,
      valueGetter: (params) => {
        const altText = params.data.final_alt_text || params.data.generated_alt_text || '';
        return altText.length;
      },
      cellRenderer: (params) => {
        const count = params.value;
        const isOverLimit = count > 125;

        return (
          <span className={`text-sm ${isOverLimit ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
            {count}
          </span>
        );
      },
      filter: 'agNumberColumnFilter'
    },
    {
      field: 'project_name',
      headerName: 'Project',
      width: 150,
      filter: 'agTextColumnFilter'
    },
    {
      field: 'created_date',
      headerName: 'Date Processed',
      width: 150,
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString();
      },
      filter: 'agDateColumnFilter'
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params) => {
        const status = params.value;
        const filename = params.data.original_filename || params.data.filename;
        const isProcessing = processingImages.has(filename);

        const getStatusBadge = (status, isProcessing) => {
          if (isProcessing) {
            return (
              <Badge className="bg-blue-100 text-blue-800 animate-pulse">
                <Clock className="w-3 h-3 mr-1" />
                Processing
              </Badge>
            );
          }

          switch (status) {
            case 'approved':
              return <Badge className="bg-green-100 text-green-800">Approved</Badge>;
            case 'processing':
              return <Badge className="bg-blue-100 text-blue-800">Processing</Badge>;
            case 'generated':
              return <Badge className="bg-yellow-100 text-yellow-800">Generated</Badge>;
            case 'error':
              return <Badge variant="destructive">Error</Badge>;
            default:
              return <Badge variant="secondary">Draft</Badge>;
          }
        };

        return getStatusBadge(status, isProcessing);
      },
      filter: 'agTextColumnFilter'
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
      suppressCellSelection: true,
      cellRenderer: (params) => {
        const handleCopy = () => {
          handleCopyAltText(params.data.final_alt_text || params.data.generated_alt_text);
        };

        const handleRegenerate = () => {
          handleRegenerateAltText(params.data);
        };

        const handleDownload = () => {
          handleDownloadWithExif(params.data);
        };

        const handleDelete = () => {
          handleDeleteImage(params.data.id);
        };

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="h-8 w-8 p-0 hover:bg-blue-50 hover:text-blue-600"
              title="Copy Alt Text"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
              title="Regenerate Alt Text"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              className="h-8 w-8 p-0 hover:bg-purple-50 hover:text-purple-600"
              title="Download Image"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
              title="Delete Image"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
      pinned: 'right'
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
    floatingFilter: true,
  }), []);

  const onGridReady = useCallback((params) => {
    setGridApi(params.api);
  }, []);

  const onSelectionChanged = useCallback(() => {
    if (gridApi) {
      const selectedNodes = gridApi.getSelectedNodes();
      const selectedData = selectedNodes.map(node => node.data.id);
      setSelectedRows(selectedData);
    }
  }, [gridApi]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <style dangerouslySetInnerHTML={{ __html: customGridStyles }} />
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
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <ImageIcon className="w-8 h-8 text-blue-600" />
              Image Library
            </h1>
            <p className="text-slate-600 mt-1">Manage all your processed images with advanced filtering and bulk actions</p>
          </div>
        </div>

        {/* Connection Status & Search */}
        <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className={`w-2 h-2 rounded-full ${socketService.isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>{socketService.isConnected ? 'Real-time connected' : 'Real-time disconnected'}</span>
          </div>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search images..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-64"
              />
            </div>
            <Button onClick={loadImages} variant="outline" size="sm" disabled={isLoading}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>

          {/* Bulk Actions */}
          {selectedRows.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {selectedRows.length} selected
              </span>
              <Button onClick={handleBulkExport} variant="outline" size="sm">
                <FileText className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export for Platform...
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handlePlatformExport('shopify')}>
                    Export for Shopify
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handlePlatformExport('woocommerce')}>
                    Export for WooCommerce
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button onClick={handleBulkDelete} variant="destructive" size="sm">
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>

        {/* Real-time Notifications */}
        {notifications.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">Recent Activity</h3>
            </div>
            <div className="space-y-2">
              {notifications.slice(0, 3).map((notification, index) => (
                <div key={index} className="text-sm text-blue-800">
                  {notification.message}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sync Progress */}
        {syncProgress && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-purple-600 animate-spin" />
                <span className="font-semibold text-purple-900">{syncProgress.message}</span>
              </div>
              <span className="text-sm text-purple-600">{syncProgress.progress}%</span>
            </div>
            <Progress value={syncProgress.progress} className="w-full" />
          </div>
        )}

        {/* AG Grid */}
        <div className="bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden">
          <div
            className="ag-theme-alpine-dark"
            style={{
              height: '650px',
              width: '100%',
              '--ag-background-color': '#ffffff',
              '--ag-odd-row-background-color': '#f8fafc',
              '--ag-header-background-color': '#f1f5f9',
              '--ag-header-foreground-color': '#334155',
              '--ag-row-hover-color': '#e2e8f0',
              '--ag-border-color': '#e2e8f0',
              '--ag-secondary-border-color': '#cbd5e1'
            }}
          >
            <AgGridReact
              rowData={filteredImages}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              onGridReady={onGridReady}
              onSelectionChanged={onSelectionChanged}
              rowSelection="multiple"
              enableRangeSelection={true}
              pagination={true}
              paginationPageSize={20}
              paginationPageSizeSelector={[10, 20, 50, 100]}
              animateRows={true}
              enableCellTextSelection={true}
              suppressRowClickSelection={true}
              suppressCellSelection={true}
              rowHeight={50}
              headerHeight={48}
            />
          </div>
        </div>

        {/* Stats Footer */}
        <div className="bg-white/70 backdrop-blur-sm rounded-xl border border-slate-200/60 p-6 shadow-lg">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{images.length}</div>
              <div className="text-sm text-gray-600">Total Images</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {images.filter(img => img.status === 'approved').length}
              </div>
              <div className="text-sm text-gray-600">Approved</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {images.filter(img => img.seo_score >= 80).length}
              </div>
              <div className="text-sm text-gray-600">High SEO Score</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(images.reduce((sum, img) => sum + (img.seo_score || 0), 0) / (images.length || 1))}
              </div>
              <div className="text-sm text-gray-600">Avg SEO Score</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}