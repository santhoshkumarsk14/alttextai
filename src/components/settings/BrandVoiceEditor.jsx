import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Sparkles, Palette } from "lucide-react";

export default function BrandVoiceEditor({ settings, onUpdate }) {
  const brandVoices = [
    {
      id: "descriptive",
      name: "Descriptive",
      description: "Detailed and informative descriptions",
      example: "Premium organic cotton t-shirt in navy blue with a classic crew neck design and comfortable fit, perfect for casual wear and sustainable fashion enthusiasts."
    },
    {
      id: "professional",
      name: "Professional",
      description: "Clean and business-focused tone",
      example: "Navy blue organic cotton t-shirt with crew neck design. High-quality sustainable material for professional casual wear."
    },
    {
      id: "playful",
      name: "Playful",
      description: "Fun and engaging language",
      example: "Super soft navy blue cotton tee that's perfect for your everyday adventures! Made with love for the planet and your comfort."
    },
    {
      id: "luxury",
      name: "Luxury",
      description: "Sophisticated and premium tone",
      example: "Exquisite navy blue organic cotton t-shirt featuring a refined crew neck silhouette. Crafted from the finest sustainable materials for the discerning individual."
    }
  ];

  return (
    <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-purple-600" />
          Brand Voice & Templates
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-sm font-semibold text-slate-700 mb-3 block">
            Brand Voice Examples
          </Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {brandVoices.map((voice) => (
              <div
                key={voice.id}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                  settings?.default_brand_voice === voice.id
                    ? "border-purple-500 bg-purple-50"
                    : "border-slate-200 hover:border-slate-300 bg-white/50"
                }`}
                onClick={() => onUpdate({ default_brand_voice: voice.id })}
              >
                <h4 className="font-semibold text-slate-900 mb-2">{voice.name}</h4>
                <p className="text-sm text-slate-600 mb-3">{voice.description}</p>
                <div className="bg-slate-50 rounded p-3">
                  <p className="text-xs text-slate-700 italic">"{voice.example}"</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Label htmlFor="altTextTemplate" className="text-sm font-semibold text-slate-700 mb-2 block">
            Custom Alt Text Template
          </Label>
          <Textarea
            id="altTextTemplate"
            value={settings?.alt_text_template || ""}
            onChange={(e) => onUpdate({ alt_text_template: e.target.value })}
            placeholder="e.g., {Product Name} in {Color} - {Style} {Category}"
            className="min-h-20 bg-white/80"
          />
          <p className="text-xs text-slate-500 mt-2">
            Use variables: {"{Product Name}, {Color}, {Style}, {Category}, {Brand Name}"}
          </p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <h4 className="font-semibold text-purple-900 mb-1">Pro Tip</h4>
              <p className="text-sm text-purple-800">
                Your brand voice will be applied to all AI-generated alt text. Choose the tone that best represents your brand and resonates with your target audience.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
