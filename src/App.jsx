import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Pricing from './pages/Pricing';
import Subscription from './pages/Subscription';
import Dashboard from './pages/Dashboard';
import Upload from './pages/Upload';
import Review from './pages/Review';
import Export from './pages/Export';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Keywords from './pages/Keywords';
import AltTextManager from './pages/AltTextManager';
import CSVProcessor from './pages/CSVProcessor';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import Integrations from './pages/Integrations';
import ProductAnalysis from './pages/ProductAnalysis';
import RealTimeFeatures from './pages/RealTimeFeatures';
import ImageLibrary from './pages/ImageLibrary';
import UserProfile from './pages/UserProfile';
import NotificationContainer from './components/ui/notification';
import ChatWidget from './components/ui/chat-widget';
import SyncProgress from './components/ui/sync-progress';
import { useAuth } from './contexts/AuthContext';
import socketService from './services/socketService';
import { useState } from 'react';

function App() {
  const { user, isAuthenticated } = useAuth();
  const [showSyncProgress, setShowSyncProgress] = useState(false);

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    const initializeSocket = async () => {
      if (isAuthenticated && user?.id) {
        await socketService.connect(user.id);
      } else {
        socketService.disconnect();
      }
    };

    initializeSocket();

    // Cleanup on unmount
    return () => {
      socketService.disconnect();
    };
  }, [isAuthenticated, user?.id]);

  // Listen for sync progress events
  useEffect(() => {
    const handleSyncProgress = () => {
      setShowSyncProgress(true);
    };

    socketService.on('sync-progress', handleSyncProgress);

    return () => {
      socketService.off('sync-progress', handleSyncProgress);
    };
  }, []);

  return (
    <>
      <NotificationContainer />
      {isAuthenticated && <ChatWidget />}
      <SyncProgress
        isVisible={showSyncProgress}
        onClose={() => setShowSyncProgress(false)}
      />
      <Routes>
        {/* Public routes without layout */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Protected routes with dashboard layout */}
        <Route path="/" element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/review" element={<Review />} />
          <Route path="/export" element={<Export />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/keywords" element={<Keywords />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/alt-text-manager" element={<AltTextManager />} />
          <Route path="/csv-processor" element={<CSVProcessor />} />
          <Route path="/analytics-dashboard" element={<AnalyticsDashboard />} />
          <Route path="/integrations" element={<Integrations />} />
          <Route path="/product-analysis" element={<ProductAnalysis />} />
          <Route path="/real-time-features" element={<RealTimeFeatures />} />
          <Route path="/imagelibrary" element={<ImageLibrary />} />
          <Route path="/profile" element={<UserProfile />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
