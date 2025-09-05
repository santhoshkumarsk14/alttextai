import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  User,
  CreditCard,
  Key,
  Settings,
  Bell,
  Store,
  Download,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useAuth } from "@/contexts/AuthContext";

export default function UserProfilePage() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuth();
  const [activeTab, setActiveTab] = useState("personal");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Personal Information State
  const [personalInfo, setPersonalInfo] = useState({
    name: user?.name || '',
    email: user?.email || '',
    company: '',
    phone: ''
  });

  // Password Change State
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Subscription State
  const [subscription, setSubscription] = useState({
    plan: 'Pro',
    monthlyLimit: 1000,
    usedThisMonth: 247,
    nextBilling: '2024-02-15',
    price: 29.99
  });

  // API Keys State
  const [apiKeys, setApiKeys] = useState([
    {
      id: '1',
      name: 'Production API',
      key: 'sk_live_******************************abcd',
      created: '2024-01-15',
      usage: 1250,
      limit: 5000
    }
  ]);

  // Integrations State
  const [integrations, setIntegrations] = useState([
    {
      id: '1',
      platform: 'Shopify',
      storeName: 'MyStore',
      status: 'connected',
      lastSync: '2024-01-20 14:30'
    },
    {
      id: '2',
      platform: 'WooCommerce',
      storeName: 'MyShop',
      status: 'disconnected',
      lastSync: null
    }
  ]);

  // Notifications State
  const [notifications, setNotifications] = useState({
    emailUsageLimit: true,
    emailProcessingComplete: false,
    emailWeeklyReport: true,
    pushUsageLimit: true,
    pushProcessingComplete: false
  });

  const handlePersonalInfoUpdate = async () => {
    setIsLoading(true);
    try {
      const result = await updateProfile(personalInfo);
      if (result.success) {
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      alert('Error updating profile');
    }
    setIsLoading(false);
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    setIsLoading(true);
    // Here you would call your password change API
    setTimeout(() => {
      alert('Password changed successfully!');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setIsLoading(false);
    }, 1000);
  };

  const generateApiKey = () => {
    const newKey = {
      id: Date.now().toString(),
      name: 'New API Key',
      key: 'sk_live_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15),
      created: new Date().toISOString().split('T')[0],
      usage: 0,
      limit: 1000
    };
    setApiKeys([...apiKeys, newKey]);
  };

  const copyApiKey = (key) => {
    navigator.clipboard.writeText(key);
    alert('API key copied to clipboard!');
  };

  const deleteApiKey = (keyId) => {
    if (window.confirm('Are you sure you want to delete this API key?')) {
      setApiKeys(apiKeys.filter(key => key.id !== keyId));
    }
  };

  const handleNotificationChange = (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
  };

  const downloadInvoice = (invoiceId) => {
    // Mock invoice download
    alert('Invoice download would be implemented here');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(createPageUrl("Dashboard"))}
            className="hover:bg-slate-100"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <User className="w-8 h-8 text-blue-600" />
              Profile & Settings
            </h1>
            <p className="text-slate-600 mt-1">Manage your account, subscription, and preferences</p>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="personal" className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal
            </TabsTrigger>
            <TabsTrigger value="subscription" className="flex items-center gap-2">
              <CreditCard className="w-4 h-4" />
              Billing
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Key className="w-4 h-4" />
              API Keys
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Store className="w-4 h-4" />
              Integrations
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
          </TabsList>

          {/* Personal Information Tab */}
          <TabsContent value="personal" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={personalInfo.name}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={personalInfo.email}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Company Name</Label>
                    <Input
                      id="company"
                      value={personalInfo.company}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, company: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      value={personalInfo.phone}
                      onChange={(e) => setPersonalInfo(prev => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <Button onClick={handlePersonalInfoUpdate} disabled={isLoading}>
                  {isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="relative">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  />
                </div>
                <Button onClick={handlePasswordChange} disabled={isLoading}>
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Subscription & Billing Tab */}
          <TabsContent value="subscription" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Current Subscription</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{subscription.plan} Plan</h3>
                    <p className="text-gray-600">${subscription.price}/month</p>
                  </div>
                  <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Monthly Usage</span>
                    <span>{subscription.usedThisMonth} / {subscription.monthlyLimit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${(subscription.usedThisMonth / subscription.monthlyLimit) * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-sm text-gray-600">
                  Next billing date: {subscription.nextBilling}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline">Upgrade Plan</Button>
                  <Button variant="outline">Cancel Subscription</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { id: 'INV-001', date: '2024-01-15', amount: '$29.99', status: 'Paid' },
                    { id: 'INV-002', date: '2023-12-15', amount: '$29.99', status: 'Paid' },
                    { id: 'INV-003', date: '2023-11-15', amount: '$29.99', status: 'Paid' }
                  ].map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{invoice.id}</p>
                        <p className="text-sm text-gray-600">{invoice.date}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-medium">{invoice.amount}</span>
                        <Badge variant="outline">{invoice.status}</Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => downloadInvoice(invoice.id)}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* API Keys Tab */}
          <TabsContent value="api" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>API Keys</CardTitle>
                  <Button onClick={generateApiKey}>
                    <Key className="w-4 h-4 mr-2" />
                    Generate New Key
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {apiKeys.map((apiKey) => (
                    <div key={apiKey.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{apiKey.name}</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteApiKey(apiKey.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          Delete
                        </Button>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <code className="flex-1 p-2 bg-gray-100 rounded text-sm font-mono">
                          {apiKey.key}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyApiKey(apiKey.key)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Created: {apiKey.created}</span>
                        <span>Usage: {apiKey.usage} / {apiKey.limit}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Connected Platforms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {integrations.map((integration) => (
                    <div key={integration.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Store className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium">{integration.platform}</p>
                          <p className="text-sm text-gray-600">{integration.storeName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={integration.status === 'connected' ? 'default' : 'secondary'}
                        >
                          {integration.status}
                        </Badge>
                        {integration.lastSync && (
                          <span className="text-sm text-gray-600">
                            Last sync: {integration.lastSync}
                          </span>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(createPageUrl("Integrations"))}
                        >
                          {integration.status === 'connected' ? 'Manage' : 'Connect'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailUsageLimit">Usage Limit Alerts</Label>
                    <p className="text-sm text-gray-600">Get notified when approaching monthly limits</p>
                  </div>
                  <Switch
                    id="emailUsageLimit"
                    checked={notifications.emailUsageLimit}
                    onCheckedChange={(checked) => handleNotificationChange('emailUsageLimit', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailProcessingComplete">Processing Complete</Label>
                    <p className="text-sm text-gray-600">Receive notifications when batch processing finishes</p>
                  </div>
                  <Switch
                    id="emailProcessingComplete"
                    checked={notifications.emailProcessingComplete}
                    onCheckedChange={(checked) => handleNotificationChange('emailProcessingComplete', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailWeeklyReport">Weekly Reports</Label>
                    <p className="text-sm text-gray-600">Get weekly usage and performance summaries</p>
                  </div>
                  <Switch
                    id="emailWeeklyReport"
                    checked={notifications.emailWeeklyReport}
                    onCheckedChange={(checked) => handleNotificationChange('emailWeeklyReport', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Push Notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushUsageLimit">Usage Limit Alerts</Label>
                    <p className="text-sm text-gray-600">Browser notifications for usage limits</p>
                  </div>
                  <Switch
                    id="pushUsageLimit"
                    checked={notifications.pushUsageLimit}
                    onCheckedChange={(checked) => handleNotificationChange('pushUsageLimit', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="pushProcessingComplete">Processing Complete</Label>
                    <p className="text-sm text-gray-600">Browser notifications for completed tasks</p>
                  </div>
                  <Switch
                    id="pushProcessingComplete"
                    checked={notifications.pushProcessingComplete}
                    onCheckedChange={(checked) => handleNotificationChange('pushProcessingComplete', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}