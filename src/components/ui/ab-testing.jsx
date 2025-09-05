import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, Play, Pause, BarChart3, TrendingUp, Eye } from 'lucide-react';
import socketService from '../../services/socketService';

const ABTesting = () => {
  const [tests, setTests] = useState([]);
  const [newTest, setNewTest] = useState({
    name: '',
    variantA: '',
    variantB: '',
    imageUrl: ''
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    // Listen for A/B test updates
    const handleTestUpdate = (data) => {
      setTests(prev => prev.map(test =>
        test.id === data.testId ? { ...test, ...data } : test
      ));
    };

    socketService.on('ab-test-update', handleTestUpdate);

    // Load existing tests
    loadTests();

    return () => {
      socketService.off('ab-test-update', handleTestUpdate);
    };
  }, []);

  const loadTests = async () => {
    try {
      const response = await fetch('/api/ab-tests', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTests(data.tests);
      }
    } catch (error) {
      console.error('Error loading A/B tests:', error);
    }
  };

  const createTest = async () => {
    if (!newTest.name || !newTest.variantA || !newTest.variantB || !newTest.imageUrl) {
      return;
    }

    try {
      const response = await fetch('/api/ab-tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newTest)
      });

      const data = await response.json();
      if (data.success) {
        setTests(prev => [...prev, data.test]);
        setNewTest({ name: '', variantA: '', variantB: '', imageUrl: '' });
        setIsCreating(false);
      }
    } catch (error) {
      console.error('Error creating A/B test:', error);
    }
  };

  const startTest = async (testId) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(test =>
          test.id === testId ? { ...test, status: 'running' } : test
        ));
      }
    } catch (error) {
      console.error('Error starting A/B test:', error);
    }
  };

  const stopTest = async (testId) => {
    try {
      const response = await fetch(`/api/ab-tests/${testId}/stop`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setTests(prev => prev.map(test =>
          test.id === testId ? { ...test, status: 'stopped' } : test
        ));
      }
    } catch (error) {
      console.error('Error stopping A/B test:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">A/B Testing</h2>
        <Button
          onClick={() => setIsCreating(!isCreating)}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Test</span>
        </Button>
      </div>

      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>Create New A/B Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="test-name">Test Name</Label>
              <Input
                id="test-name"
                value={newTest.name}
                onChange={(e) => setNewTest(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter test name"
              />
            </div>

            <div>
              <Label htmlFor="image-url">Image URL</Label>
              <Input
                id="image-url"
                value={newTest.imageUrl}
                onChange={(e) => setNewTest(prev => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Enter image URL"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="variant-a">Variant A (Alt Text)</Label>
                <Input
                  id="variant-a"
                  value={newTest.variantA}
                  onChange={(e) => setNewTest(prev => ({ ...prev, variantA: e.target.value }))}
                  placeholder="Alt text variant A"
                />
              </div>
              <div>
                <Label htmlFor="variant-b">Variant B (Alt Text)</Label>
                <Input
                  id="variant-b"
                  value={newTest.variantB}
                  onChange={(e) => setNewTest(prev => ({ ...prev, variantB: e.target.value }))}
                  placeholder="Alt text variant B"
                />
              </div>
            </div>

            <div className="flex space-x-2">
              <Button onClick={createTest} disabled={!newTest.name || !newTest.variantA || !newTest.variantB || !newTest.imageUrl}>
                Create Test
              </Button>
              <Button variant="outline" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tests.map((test) => (
          <Card key={test.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{test.name}</CardTitle>
                <Badge variant={test.status === 'running' ? 'default' : 'secondary'}>
                  {test.status || 'draft'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={test.imageUrl}
                  alt="Test image"
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Variant A</span>
                    <span>{test.variantAViews || 0} views</span>
                  </div>
                  <Progress value={(test.variantAViews || 0) / ((test.variantAViews || 0) + (test.variantBViews || 0)) * 100 || 0} />
                  <p className="text-xs text-gray-600 mt-1">{test.variantA}</p>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Variant B</span>
                    <span>{test.variantBViews || 0} views</span>
                  </div>
                  <Progress value={(test.variantBViews || 0) / ((test.variantAViews || 0) + (test.variantBViews || 0)) * 100 || 0} />
                  <p className="text-xs text-gray-600 mt-1">{test.variantB}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Eye className="w-4 h-4" />
                    <span>{(test.variantAViews || 0) + (test.variantBViews || 0)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{test.conversionRate || 0}%</span>
                  </div>
                </div>

                <div className="flex space-x-2">
                  {test.status === 'running' ? (
                    <Button size="sm" variant="outline" onClick={() => stopTest(test.id)}>
                      <Pause className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => startTest(test.id)}>
                      <Play className="w-4 h-4" />
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    <BarChart3 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {tests.length === 0 && !isCreating && (
        <div className="text-center py-12">
          <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No A/B Tests Yet</h3>
          <p className="text-gray-600 mb-4">Create your first A/B test to compare alt text performance</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Test
          </Button>
        </div>
      )}
    </div>
  );
};

export default ABTesting;