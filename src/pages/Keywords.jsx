import React, { useState, useEffect } from "react";
import { KeywordInsight } from "@/entities/KeywordInsight";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Target, TrendingUp, Search, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function KeywordsPage() {
  const navigate = useNavigate();
  const [keywords, setKeywords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newKeyword, setNewKeyword] = useState({
    keyword: '',
    search_volume: '',
    competition: 'medium',
    category: '',
    opportunity_score: ''
  });

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setIsLoading(true);
    try {
      // Generate mock data if none exists
      await KeywordInsight.generateMockData();
      const allKeywords = await KeywordInsight.list("-opportunity_score", 50);
      setKeywords(allKeywords);
    } catch (error) {
      console.error("Error loading keywords:", error);
    }
    setIsLoading(false);
  };

  const handleAddKeyword = async () => {
    if (!newKeyword.keyword.trim()) return;

    try {
      const keywordData = {
        keyword: newKeyword.keyword.trim(),
        search_volume: parseInt(newKeyword.search_volume) || 1000,
        competition: newKeyword.competition,
        category: newKeyword.category || 'general',
        opportunity_score: parseInt(newKeyword.opportunity_score) || 50,
        competitor_using: Math.random() > 0.5,
        suggested_for_images: Math.floor(Math.random() * 10) + 1
      };

      await KeywordInsight.create(keywordData);
      await loadKeywords(); // Reload keywords

      // Reset form
      setNewKeyword({
        keyword: '',
        search_volume: '',
        competition: 'medium',
        category: '',
        opportunity_score: ''
      });
      setIsAddModalOpen(false);
    } catch (error) {
      console.error("Error adding keyword:", error);
    }
  };

  const getCompetitionColor = (competition) => {
    switch (competition) {
      case 'low': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getOpportunityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-4 lg:p-8">
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
              <Target className="w-8 h-8 text-green-600" />
              Keyword Research & Insights
            </h1>
            <p className="text-slate-600 mt-1">Discover high-opportunity keywords for your product images</p>
          </div>
          <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Keywords
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Total Keywords</p>
                  <p className="text-3xl font-bold text-slate-900">{keywords.length}</p>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <Search className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">High Opportunity</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {keywords.filter(k => k.opportunity_score >= 80).length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-green-50">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Competitor Keywords</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {keywords.filter(k => k.competitor_using).length}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-orange-50">
                  <Target className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-500 mb-1">Avg. Opportunity</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {keywords.length > 0 ? Math.round(keywords.reduce((sum, k) => sum + k.opportunity_score, 0) / keywords.length) : 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-purple-50">
                  <Target className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Keywords Table */}
        <Card className="bg-white/70 backdrop-blur-sm border-slate-200/60 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5 text-green-600" />
              Keyword Opportunities
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-slate-200 rounded-lg animate-pulse">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-slate-200 rounded"></div>
                      <div>
                        <div className="h-4 bg-slate-200 rounded w-32 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-24"></div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <div className="h-6 w-16 bg-slate-200 rounded"></div>
                      <div className="h-6 w-20 bg-slate-200 rounded"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : keywords.length > 0 ? (
              <div className="space-y-4">
                {keywords.map((keyword, index) => (
                  <div key={keyword.id} className="flex items-center justify-between p-4 border border-slate-200/60 rounded-lg hover:bg-slate-50/50 transition-all duration-200">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-slate-900">{keyword.keyword}</h3>
                        <p className="text-sm text-slate-500">
                          {keyword.search_volume.toLocaleString()} monthly searches • {keyword.category}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getCompetitionColor(keyword.competition)}>
                        {keyword.competition} competition
                      </Badge>
                      <div className="text-right">
                        <p className={`font-bold ${getOpportunityColor(keyword.opportunity_score)}`}>
                          {keyword.opportunity_score}%
                        </p>
                        <p className="text-xs text-slate-500">opportunity</p>
                      </div>
                      {keyword.competitor_using && (
                        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                          Competitor
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Target className="w-8 h-8 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Keywords Found</h3>
                <p className="text-slate-500 mb-6">Start by adding some keywords to analyze opportunities</p>
                <Button onClick={() => setIsAddModalOpen(true)} className="bg-green-600 hover:bg-green-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Keywords
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Keyword Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Add New Keyword</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsAddModalOpen(false)}
                className="h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="modal-keyword">Keyword</Label>
                <Input
                  id="modal-keyword"
                  placeholder="Enter keyword"
                  value={newKeyword.keyword}
                  onChange={(e) => setNewKeyword({...newKeyword, keyword: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="modal-search_volume">Search Volume</Label>
                <Input
                  id="modal-search_volume"
                  type="number"
                  placeholder="1000"
                  value={newKeyword.search_volume}
                  onChange={(e) => setNewKeyword({...newKeyword, search_volume: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="modal-competition">Competition</Label>
                <Select value={newKeyword.competition} onValueChange={(value) => setNewKeyword({...newKeyword, competition: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select competition level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="modal-category">Category</Label>
                <Input
                  id="modal-category"
                  placeholder="e.g., clothing, electronics"
                  value={newKeyword.category}
                  onChange={(e) => setNewKeyword({...newKeyword, category: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="modal-opportunity_score">Opportunity Score</Label>
                <Input
                  id="modal-opportunity_score"
                  type="number"
                  placeholder="50"
                  value={newKeyword.opportunity_score}
                  onChange={(e) => setNewKeyword({...newKeyword, opportunity_score: e.target.value})}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddKeyword} className="bg-green-600 hover:bg-green-700">
                  Add Keyword
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
