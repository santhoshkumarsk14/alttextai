import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const AltTextManager = () => {
  const { user } = useAuth();
  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch alt text generations
  const fetchAltTextGenerations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/alt-text/generations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch alt text generations');
      }

      const data = await response.json();
      setRowData(data.generations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAltTextGenerations();
  }, []);

  // Approve alt text
  const approveAltText = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/alt-text/approve/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to approve alt text');
      }

      // Refresh data
      fetchAltTextGenerations();
    } catch (err) {
      setError(err.message);
    }
  };

  // Reject alt text
  const rejectAltText = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/alt-text/reject/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to reject alt text');
      }

      // Refresh data
      fetchAltTextGenerations();
    } catch (err) {
      setError(err.message);
    }
  };

  // Delete alt text
  const deleteAltText = async (id) => {
    if (!confirm('Are you sure you want to delete this alt text generation?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/alt-text/delete/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete alt text');
      }

      // Refresh data
      fetchAltTextGenerations();
    } catch (err) {
      setError(err.message);
    }
  };

  // AG Grid column definitions
  const columnDefs = useMemo(() => [
    {
      field: 'original_filename',
      headerName: 'File Name',
      width: 200,
      cellRenderer: (params) => (
        <div className="flex items-center gap-2">
          <img
            src={params.data.file_url}
            alt=""
            className="w-8 h-8 object-cover rounded"
            onError={(e) => e.target.style.display = 'none'}
          />
          <span className="truncate">{params.value}</span>
        </div>
      )
    },
    {
      field: 'seo_alt_text',
      headerName: 'SEO Alt Text',
      width: 300,
      cellRenderer: (params) => (
        <div className="truncate" title={params.value}>
          {params.value}
        </div>
      )
    },
    {
      field: 'seo_score',
      headerName: 'SEO Score',
      width: 100,
      cellRenderer: (params) => (
        <Badge variant={params.value >= 80 ? 'default' : params.value >= 60 ? 'secondary' : 'destructive'}>
          {params.value}/100
        </Badge>
      )
    },
    {
      field: 'approval_status',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params) => {
        const status = params.value;
        return (
          <Badge
            variant={
              status === 'approved' ? 'default' :
              status === 'rejected' ? 'destructive' : 'secondary'
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      }
    },
    {
      field: 'created_at',
      headerName: 'Created',
      width: 150,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString()
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      cellRenderer: (params) => (
        <div className="flex gap-1">
          {params.data.approval_status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="outline"
                onClick={() => approveAltText(params.data.id)}
                className="h-8 w-8 p-0"
              >
                <CheckCircle className="h-4 w-4 text-green-600" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => rejectAltText(params.data.id)}
                className="h-8 w-8 p-0"
              >
                <XCircle className="h-4 w-4 text-red-600" />
              </Button>
            </>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => window.open(params.data.file_url, '_blank')}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => deleteAltText(params.data.id)}
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      )
    }
  ], []);

  const defaultColDef = useMemo(() => ({
    resizable: true,
    sortable: true,
    filter: true,
  }), []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading alt text generations...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Alt Text Manager</h1>
          <p className="text-gray-600">Manage and approve your AI-generated alt text</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchAltTextGenerations} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Alt Text Generations ({rowData.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="ag-theme-alpine" style={{ height: '600px', width: '100%' }}>
            <AgGridReact
              rowData={rowData}
              columnDefs={columnDefs}
              defaultColDef={defaultColDef}
              pagination={true}
              paginationPageSize={20}
              enableCellTextSelection={true}
              suppressRowClickSelection={true}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AltTextManager;