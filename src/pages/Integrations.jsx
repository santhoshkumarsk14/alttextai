import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Store,
  ShoppingCart,
  Link,
  Unlink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Settings,
  ExternalLink
} from 'lucide-react';

const Integrations = () => {
  const [integrations, setIntegrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(null);
  const [error, setError] = useState(null);

  // Form states for different platforms
  const [shopifyForm, setShopifyForm] = useState({
    storeUrl: '',
    apiKey: '',
    apiSecret: ''
  });

  const [woocommerceForm, setWoocommerceForm] = useState({
    storeUrl: '',
    consumerKey: '',
    consumerSecret: ''
  });

  // Fetch integrations
  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/integrations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch integrations');
      }

      const data = await response.json();
      setIntegrations(data.integrations || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIntegrations();

    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    const success = urlParams.get('success');
    const error = urlParams.get('error');

    if (success === 'shopify_connected') {
      setError(null);
      fetchIntegrations(); // Refresh integrations list
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (error) {
      setError(`Shopify connection failed: ${error}`);
      // Clear URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Connect Shopify - OAuth Flow
  const connectShopify = async () => {
    if (!shopifyForm.storeUrl) {
      setError('Please enter your Shopify store URL');
      return;
    }

    try {
      setConnecting('shopify');
      const token = localStorage.getItem('token');

      // Get OAuth URL from backend
      const response = await fetch('/api/integrations/shopify/oauth-url', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ storeUrl: shopifyForm.storeUrl })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get OAuth URL');
      }

      const data = await response.json();

      // Redirect to Shopify OAuth
      window.location.href = data.oauthUrl;

    } catch (err) {
      setError(err.message);
      setConnecting(null);
    }
  };

  // Connect WooCommerce
  const connectWoocommerce = async () => {
    if (!woocommerceForm.storeUrl || !woocommerceForm.consumerKey || !woocommerceForm.consumerSecret) {
      setError('Please fill in all WooCommerce fields');
      return;
    }

    try {
      setConnecting('woocommerce');
      const token = localStorage.getItem('token');
      const response = await fetch('/api/integrations/woocommerce/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(woocommerceForm)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to connect WooCommerce');
      }

      await fetchIntegrations();
      setWoocommerceForm({ storeUrl: '', consumerKey: '', consumerSecret: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  // Sync products
  const syncProducts = async (platform) => {
    try {
      setConnecting(`${platform}-sync`);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/integrations/${platform}/sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to sync ${platform}`);
      }

      const result = await response.json();
      alert(`Successfully synced ${result.syncedProducts} products from ${platform}!`);
      await fetchIntegrations();
    } catch (err) {
      setError(err.message);
    } finally {
      setConnecting(null);
    }
  };

  // Disconnect integration
  const disconnectIntegration = async (platform) => {
    if (!confirm(`Are you sure you want to disconnect ${platform}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/integrations/${platform}/disconnect`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to disconnect ${platform}`);
      }

      await fetchIntegrations();
    } catch (err) {
      setError(err.message);
    }
  };

  const getIntegrationStatus = (platform) => {
    return integrations.find(int => int.platform === platform);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading integrations...</span>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Integrations</h1>
          <p className="text-gray-600">Connect your e-commerce stores for automated alt text generation</p>
        </div>
        <Button onClick={fetchIntegrations} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Integration Status Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Shopify Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-green-600" />
              Shopify Integration
              {getIntegrationStatus('shopify')?.is_connected && (
                <Badge variant="default" className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Demo Credentials Notice */}
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Demo Credentials Available:</strong> Shopify credentials are pre-configured for testing.
                Just enter your store URL to connect.
              </AlertDescription>
            </Alert>

            {getIntegrationStatus('shopify')?.is_connected ? (
              <div className="space-y-4">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-sm text-green-800">
                    ✅ Connected to {getIntegrationStatus('shopify').store_url}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Last sync: {getIntegrationStatus('shopify').last_sync ?
                      new Date(getIntegrationStatus('shopify').last_sync).toLocaleString() :
                      'Never'
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => syncProducts('shopify')}
                    disabled={connecting === 'shopify-sync'}
                    className="flex-1"
                  >
                    {connecting === 'shopify-sync' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Products
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => disconnectIntegration('shopify')}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="shopify-url">Store URL</Label>
                    <Input
                      id="shopify-url"
                      placeholder="yourstore.myshopify.com"
                      value={shopifyForm.storeUrl}
                      onChange={(e) => setShopifyForm(prev => ({ ...prev, storeUrl: e.target.value }))}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Enter your Shopify store URL (e.g., mystore.myshopify.com)
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-sm text-green-800">
                      ✅ <strong>API Credentials:</strong> Pre-configured for testing
                    </p>
                    <p className="text-xs text-green-600 mt-1">
                      Client ID and Secret are already set up in the environment
                    </p>
                  </div>
                </div>

                <Button
                  onClick={connectShopify}
                  disabled={connecting === 'shopify'}
                  className="w-full"
                >
                  {connecting === 'shopify' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Connect Shopify
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* WooCommerce Integration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-blue-600" />
              WooCommerce Integration
              {getIntegrationStatus('woocommerce')?.is_connected && (
                <Badge variant="default" className="bg-blue-100 text-blue-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Connected
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {getIntegrationStatus('woocommerce')?.is_connected ? (
              <div className="space-y-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    ✅ Connected to {getIntegrationStatus('woocommerce').store_url}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Last sync: {getIntegrationStatus('woocommerce').last_sync ?
                      new Date(getIntegrationStatus('woocommerce').last_sync).toLocaleString() :
                      'Never'
                    }
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => syncProducts('woocommerce')}
                    disabled={connecting === 'woocommerce-sync'}
                    className="flex-1"
                  >
                    {connecting === 'woocommerce-sync' ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    Sync Products
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => disconnectIntegration('woocommerce')}
                  >
                    <Unlink className="h-4 w-4 mr-2" />
                    Disconnect
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="woo-url">Store URL</Label>
                    <Input
                      id="woo-url"
                      placeholder="https://yourstore.com"
                      value={woocommerceForm.storeUrl}
                      onChange={(e) => setWoocommerceForm(prev => ({ ...prev, storeUrl: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="woo-key">Consumer Key</Label>
                    <Input
                      id="woo-key"
                      type="password"
                      placeholder="Your WooCommerce Consumer Key"
                      value={woocommerceForm.consumerKey}
                      onChange={(e) => setWoocommerceForm(prev => ({ ...prev, consumerKey: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="woo-secret">Consumer Secret</Label>
                    <Input
                      id="woo-secret"
                      type="password"
                      placeholder="Your WooCommerce Consumer Secret"
                      value={woocommerceForm.consumerSecret}
                      onChange={(e) => setWoocommerceForm(prev => ({ ...prev, consumerSecret: e.target.value }))}
                    />
                  </div>
                </div>

                <Button
                  onClick={connectWoocommerce}
                  disabled={connecting === 'woocommerce'}
                  className="w-full"
                >
                  {connecting === 'woocommerce' ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Link className="h-4 w-4 mr-2" />
                  )}
                  Connect WooCommerce
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Integration Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Store className="h-4 w-4 text-green-600" />
              Shopify Setup
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to your Shopify admin panel</li>
              <li>Navigate to Apps → Apps and sales channels</li>
              <li>Click "Develop apps for your store"</li>
              <li>Create a new app with read/write permissions for Products</li>
              <li>Copy the API key and secret from the app settings</li>
              <li>Enter your store URL (without https://) and credentials above</li>
            </ol>
          </div>

          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <ShoppingCart className="h-4 w-4 text-blue-600" />
              WooCommerce Setup
            </h4>
            <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
              <li>Go to your WordPress admin panel</li>
              <li>Navigate to WooCommerce → Settings → Advanced → REST API</li>
              <li>Click "Add key" to create new API credentials</li>
              <li>Set permissions to Read/Write</li>
              <li>Copy the Consumer Key and Consumer Secret</li>
              <li>Enter your store URL and credentials above</li>
            </ol>
          </div>

          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              <strong>Security Note:</strong> Your API credentials are encrypted and stored securely.
              They are only used to sync your product data and generate alt text.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
};

export default Integrations;