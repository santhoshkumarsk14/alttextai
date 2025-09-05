import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Settings, Link, CheckCircle, AlertCircle } from "lucide-react";

export default function IntegrationSettings({ settings, onUpdate }) {
  const integrations = [
    {
      id: "google_search_console",
      name: "Google Search Console",
      description: "Connect for keyword insights and performance tracking",
      connected: settings?.google_search_console_connected || false,
      icon: "🔍"
    },
    {
      id: "shopify",
      name: "Shopify",
      description: "Direct integration with your Shopify store",
      connected: settings?.platform === "shopify",
      icon: "🛍️"
    },
    {
      id: "woocommerce",
      name: "WooCommerce",
      description: "WordPress WooCommerce integration",
      connected: settings?.platform === "woocommerce",
      icon: "🛒"
    },
    {
      id: "analytics",
      name: "Google Analytics",
      description: "Track alt text performance in your analytics",
      connected: false,
      icon: "📊"
    }
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-blue-600" />
          Integrations
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {integrations.map((integration) => (
          <div key={integration.id} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg">
            <div className="flex items-center gap-4">
              <div className="text-2xl">{integration.icon}</div>
              <div>
                <h4 className="font-semibold text-slate-900">{integration.name}</h4>
                <p className="text-sm text-slate-500">{integration.description}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge 
                variant={integration.connected ? "default" : "secondary"}
                className={integration.connected ? "bg-green-100 text-green-800" : ""}
              >
                {integration.connected ? (
                  <>
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Connected
                  </>
                ) : (
                  <>
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Not Connected
                  </>
                )}
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (integration.connected) {
                    // Handle disconnect
                    onUpdate({ [integration.id]: false });
                  } else {
                    // Handle connect
                    onUpdate({ [integration.id]: true });
                  }
                }}
              >
                <Link className="w-4 h-4 mr-1" />
                {integration.connected ? 'Disconnect' : 'Connect'}
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
