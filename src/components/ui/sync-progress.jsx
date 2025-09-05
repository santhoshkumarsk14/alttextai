import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, AlertCircle } from 'lucide-react';
import socketService from '../../services/socketService';

const SyncProgress = ({ isVisible, onClose }) => {
  const [syncData, setSyncData] = useState(null);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isVisible) return;

    const handleSyncProgress = (data) => {
      setSyncData(data);
      if (data.progress >= 100) {
        setIsCompleted(true);
        // Auto-close after 3 seconds when completed
        setTimeout(() => {
          onClose && onClose();
        }, 3000);
      }
    };

    socketService.on('sync-progress', handleSyncProgress);

    return () => {
      socketService.off('sync-progress', handleSyncProgress);
    };
  }, [isVisible, onClose]);

  if (!isVisible || !syncData) return null;

  const getProgressColor = () => {
    if (syncData.progress >= 100) return 'bg-green-500';
    if (syncData.progress > 50) return 'bg-blue-500';
    return 'bg-yellow-500';
  };

  const getStatusIcon = () => {
    if (isCompleted) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (syncData.progress > 0) return <Loader className="w-5 h-5 text-blue-500 animate-spin" />;
    return <AlertCircle className="w-5 h-5 text-yellow-500" />;
  };

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className="bg-white rounded-lg shadow-xl border border-gray-200 p-6 min-w-96 max-w-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            {getStatusIcon()}
            <div>
              <h3 className="font-semibold text-gray-900">
                {syncData.type === 'shopify_sync' ? 'Shopify Sync' : 'Sync Progress'}
              </h3>
              <p className="text-sm text-gray-600">{syncData.message}</p>
            </div>
          </div>
          {!isCompleted && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ×
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Progress</span>
            <span>{syncData.progress}%</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
              style={{ width: `${syncData.progress}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Completed:</span>
              <span className="ml-2 font-medium">{syncData.completed || 0}</span>
            </div>
            <div>
              <span className="text-gray-600">Total:</span>
              <span className="ml-2 font-medium">{syncData.total || 0}</span>
            </div>
          </div>

          {syncData.syncedProducts !== undefined && (
            <div className="text-sm">
              <span className="text-gray-600">Products Synced:</span>
              <span className="ml-2 font-medium text-green-600">{syncData.syncedProducts}</span>
            </div>
          )}
        </div>

        {isCompleted && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">
              ✅ Sync completed successfully!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default SyncProgress;