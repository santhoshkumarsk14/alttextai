import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertTriangle, XCircle, RefreshCw, Shield } from 'lucide-react';
import socketService from '../../services/socketService';

const WCAGValidator = ({ altText, onValidation }) => {
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (altText) {
      validateAltText(altText);
    }
  }, [altText]);

  const validateAltText = async (text) => {
    setIsValidating(true);

    try {
      const response = await fetch('/api/wcag/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ altText: text })
      });

      const data = await response.json();

      if (data.success) {
        setValidationResult(data.result);
        onValidation && onValidation(data.result);

        // Emit real-time validation result
        socketService.socket?.emit('wcag-validation', {
          altText: text,
          result: data.result
        });
      }
    } catch (error) {
      console.error('WCAG validation error:', error);
      setValidationResult({
        score: 0,
        level: 'Fail',
        issues: ['Validation service unavailable']
      });
    } finally {
      setIsValidating(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreIcon = (score) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case 'AAA':
        return <Badge className="bg-green-100 text-green-800">WCAG AAA</Badge>;
      case 'AA':
        return <Badge className="bg-blue-100 text-blue-800">WCAG AA</Badge>;
      case 'A':
        return <Badge className="bg-yellow-100 text-yellow-800">WCAG A</Badge>;
      default:
        return <Badge variant="destructive">Fail</Badge>;
    }
  };

  if (!altText) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>WCAG Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-sm">Enter alt text to validate WCAG compliance</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Shield className="w-5 h-5" />
            <span>WCAG Compliance</span>
          </CardTitle>
          <Button
            onClick={() => validateAltText(altText)}
            disabled={isValidating}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isValidating ? 'animate-spin' : ''}`} />
            Re-validate
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {validationResult && (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                {getScoreIcon(validationResult.score)}
                <div>
                  <p className="text-sm font-medium">Compliance Score</p>
                  <p className={`text-2xl font-bold ${getScoreColor(validationResult.score)}`}>
                    {validationResult.score}/100
                  </p>
                </div>
              </div>
              {getLevelBadge(validationResult.level)}
            </div>

            {validationResult.issues && validationResult.issues.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Issues Found:</h4>
                {validationResult.issues.map((issue, index) => (
                  <Alert key={index} className="border-yellow-200 bg-yellow-50">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-yellow-800">
                      {issue}
                    </AlertDescription>
                  </Alert>
                ))}
              </div>
            )}

            {validationResult.suggestions && validationResult.suggestions.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Suggestions:</h4>
                <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                  {validationResult.suggestions.map((suggestion, index) => (
                    <li key={index}>{suggestion}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4 pt-4 border-t">
              <div className="text-center">
                <p className="text-sm text-gray-600">Character Count</p>
                <p className="text-lg font-semibold">{altText.length}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-gray-600">Word Count</p>
                <p className="text-lg font-semibold">{altText.split(' ').length}</p>
              </div>
            </div>
          </>
        )}

        {isValidating && (
          <div className="flex items-center justify-center py-4">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500 mr-2" />
            <span className="text-sm text-gray-600">Validating...</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WCAGValidator;