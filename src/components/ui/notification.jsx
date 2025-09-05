import React, { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';
import socketService from '../../services/socketService';

const NotificationItem = ({ notification, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Allow time for fade out animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (notification.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getBgColor = () => {
    switch (notification.type) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  return (
    <div
      className={`${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      } transition-all duration-300 p-4 rounded-lg border ${getBgColor()} shadow-lg mb-2 flex items-start space-x-3`}
    >
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm font-medium text-gray-900">
          {notification.title || 'Notification'}
        </p>
        <p className="text-sm text-gray-600 mt-1">
          {notification.message}
        </p>
        {notification.timestamp && (
          <p className="text-xs text-gray-400 mt-1">
            {new Date(notification.timestamp).toLocaleTimeString()}
          </p>
        )}
      </div>
      <button
        onClick={() => {
          setIsVisible(false);
          setTimeout(onClose, 300);
        }}
        className="text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

const NotificationContainer = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Listen for socket notifications
    const handleNotification = (data) => {
      const notification = {
        id: Date.now(),
        type: data.type || 'info',
        title: data.title || 'AltText AI',
        message: data.message,
        timestamp: data.timestamp
      };

      setNotifications(prev => [...prev, notification]);
    };

    socketService.on('notification', handleNotification);

    return () => {
      socketService.off('notification', handleNotification);
    };
  }, []);

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm space-y-2">
      {notifications.map(notification => (
        <NotificationItem
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;