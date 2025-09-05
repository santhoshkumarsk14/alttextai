import React, { useState, useEffect } from "react";
import { StoreSettings, User } from "@/entities/all";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Settings, 
  Crown, 
  Sparkles, 
  Target, 
  Shield,
  Save,
  AlertCircle
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

import SubscriptionPlans from "../components/settings/SubscriptionPlans";
import IntegrationSettings from "../components/settings/IntegrationSettings";
import BrandVoiceEditor from "../components/settings/BrandVoiceEditor";

export default function SettingsPage() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [user, setUser] = useState(null);

  useEffect(() => {
    loadSettings();
    loadUser();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const userSettings = await StoreSettings.list();
      if (userSettings.length > 0) {
        setSettings(userSettings[0]);
      } else {
        // Create default settings
        const defaultSettings = await StoreSettings.create({
          store_name: "My Store",
          platform: "shopify",
          default_brand_voice: "professional",
          alt_text_template: "{Product Name} in {Color} - {Style} {Category}",
          keyword_blacklist: [],
          auto_processing_enabled: false,
          ada_compliance_mode: false,
          subscription_tier: "starter",
          monthly_image_limit: 500,
          images_processed_this_month: 0,
          target_market: "fashion"
        });
        setSettings(defaultSettings);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    }
    setIsLoading(false);
  };

  const loadUser = async () => {
    try {
      const currentUser = await User.me();
      setUser(currentUser);
    } catch (error) {
      console.error("Error loading user:", error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await StoreSettings.update(settings.id, settings);
      setMessage("Settings saved successfully!");
      setTimeout(() => setMessage(""), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
      setMessage("Error saving settings. Please try again.");
    }
    setIsSaving(false);
  };

  const handleSettingsChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addBlacklistWord = (word) => {
    if (word && !settings.keyword_blacklist.includes(word)) {
      handleSettingsChange('keyword_blacklist', [...settings.keyword_blacklist, word]);
    }
  };

  const removeBlacklistWord = (wordToRemove) => {
    handleSettingsChange('keyword_blacklist', 
      settings.keyword_blacklist.filter(word => word !== wordToRemove)
    );
  };

  const getPlanDetails = (tier) => {
    const plans = {
      starter: { name: "Starter", limit: 500, price: 19 },
      growth: { name: "Growth", limit: 5000, price: 49 },
      agency: { name: "Agency", limit: 50000, price: 199 }
    };
    return plans[tier] || plans.starter;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {Array(4).fill(0).map((_, i) => (
              <Card key={i} className="bg-white/70 animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-slate-200 rounded mb-4"></div>
                  <div className="h-8 bg-slate-200 rounded mb-2"></div>
                  <div className="h-4 bg-slate-200 rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const currentPlan = getPlanDetails(settings.subscription_tier);
  const usagePercentage = (settings.images_processed_this_month / settings.monthly_image_limit) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
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
              <Settings className="w-8 h-8 text-slate-600" />
              Store Settings & Configuration
            </h1>
            <p className="text-slate-600 mt-1">Customize your AI alt text generation and SEO optimization settings</p>
          </div>
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        {message && (
          <Alert className={message.includes("Error") ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Store Information */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Store Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="storeName">Store Name</Label>
                <Input
                  id="storeName"
                  value={settings.store_name}
                  onChange={(e) => handleSettingsChange('store_name', e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="platform">Platform</Label>
                <Select value={settings.platform} onValueChange={(value) => handleSettingsChange('platform', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shopify">Shopify</SelectItem>
                    <SelectItem value="woocommerce">WooCommerce</SelectItem>
                    <SelectItem value="magento">Magento</SelectItem>
                    <SelectItem value="bigcommerce">BigCommerce</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="targetMarket">Target Market</Label>
                <Select value={settings.target_market} onValueChange={(value) => handleSettingsChange('target_market', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fashion">Fashion & Apparel</SelectItem>
                    <SelectItem value="electronics">Electronics</SelectItem>
                    <SelectItem value="home">Home & Garden</SelectItem>
                    <SelectItem value="beauty">Beauty & Personal Care</SelectItem>
                    <SelectItem value="sports">Sports & Outdoors</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Brand Voice & Templates */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-600" />
                Brand Voice & Templates
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="brandVoice">Default Brand Voice</Label>
                <Select value={settings.default_brand_voice} onValueChange={(value) => handleSettingsChange('default_brand_voice', value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="descriptive">Descriptive</SelectItem>
                    <SelectItem value="professional">Professional</SelectItem>
                    <SelectItem value="playful">Playful</SelectItem>
                    <SelectItem value="luxury">Luxury</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="altTextTemplate">Alt Text Template</Label>
                <Textarea
                  id="altTextTemplate"
                  value={settings.alt_text_template}
                  onChange={(e) => handleSettingsChange('alt_text_template', e.target.value)}
                  placeholder="e.g., {Product Name} in {Color} - {Style} {Category}"
                  className="mt-1 h-20"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Use variables: {"{Product Name}, {Color}, {Style}, {Category}, {Brand Name}"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Current Plan */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-amber-500" />
                Current Plan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <h3 className="text-2xl font-bold text-slate-900">{currentPlan.name}</h3>
                <p className="text-slate-500">${currentPlan.price}/month</p>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Images Used</span>
                  <span>{settings.images_processed_this_month} / {settings.monthly_image_limit}</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      usagePercentage > 90 ? 'bg-red-500' : usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(100, usagePercentage)}%` }}
                  ></div>
                </div>
              </div>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate(createPageUrl("Settings", { tab: "billing" }))}
              >
                Manage Subscription
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Automation Settings */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-600" />
                Automation & Processing
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="autoProcessing">Auto-process new images</Label>
                  <p className="text-sm text-slate-500">Automatically generate alt text for new uploads</p>
                </div>
                <Switch
                  id="autoProcessing"
                  checked={settings.auto_processing_enabled}
                  onCheckedChange={(checked) => handleSettingsChange('auto_processing_enabled', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="adaCompliance">ADA Compliance Mode</Label>
                  <p className="text-sm text-slate-500">Generate detailed descriptions for accessibility</p>
                </div>
                <Switch
                  id="adaCompliance"
                  checked={settings.ada_compliance_mode}
                  onCheckedChange={(checked) => handleSettingsChange('ada_compliance_mode', checked)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="gscConnected">Google Search Console</Label>
                  <p className="text-sm text-slate-500">Connect for keyword insights</p>
                </div>
                <Badge variant={settings.google_search_console_connected ? "default" : "secondary"}>
                  {settings.google_search_console_connected ? "Connected" : "Not Connected"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Keyword Blacklist */}
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-600" />
                Keyword Blacklist
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="newBlacklistWord">Add word to avoid</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="newBlacklistWord"
                    placeholder="Enter word..."
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addBlacklistWord(e.target.value.trim());
                        e.target.value = '';
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = e.target.parentElement.querySelector('input');
                      addBlacklistWord(input.value.trim());
                      input.value = '';
                    }}
                  >
                    Add
                  </Button>
                </div>
              </div>
              <div>
                <Label>Blacklisted Words</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {settings.keyword_blacklist.length > 0 ? (
                    settings.keyword_blacklist.map((word, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-red-100"
                        onClick={() => removeBlacklistWord(word)}
                      >
                        {word} ×
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-slate-500">No blacklisted words yet</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Subscription Plans */}
        <SubscriptionPlans 
          currentTier={settings.subscription_tier}
          onUpgrade={(tier) => handleSettingsChange('subscription_tier', tier)}
        />
      </div>
    </div>
  );
}
