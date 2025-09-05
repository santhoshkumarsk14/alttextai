import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles, 
  Loader2, 
  ImageIcon, 
  Target, 
  Zap 
} from "lucide-react";
import { InvokeLLMRealTime } from "@/integrations/Core";
import TypingCursor, { TypingIndicator, StreamingProgress, TokenCounter } from "@/components/ui/typing-cursor";

// Convert File/Blob to Base64 data URL with validation
async function blobToDataURL(file) {
  return new Promise((resolve, reject) => {
    // Validate file type
    const supportedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (!supportedTypes.includes(file.type)) {
      reject(new Error(`Unsupported image type: ${file.type}`));
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const dataURL = reader.result;
      // Validate data URL format
      if (!dataURL || !dataURL.startsWith('data:image/')) {
        reject(new Error('Invalid data URL generated'));
        return;
      }
      resolve(dataURL);
    };
    reader.onerror = () => reject(new Error('Failed to read file as data URL'));
    reader.readAsDataURL(file);
  });
}

export default function RealTimeAIChat({ onAltTextGenerated, currentImage = null }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: "Hello! I'm your AI assistant for image analysis and alt text optimization. I can help you analyze images, generate SEO-optimized alt text, and provide detailed insights. What would you like to know about your image?",
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState(0);
  const [tokenCount, setTokenCount] = useState(0);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || isProcessing) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsTyping(true);
    setIsProcessing(true);

    // Typing placeholder
    const typingMessage = {
      id: Date.now() + 1,
      type: 'ai',
      content: "",
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Prepare file URLs
      let fileUrls = [];
      if (currentImage?.file) {
        const dataURL = await blobToDataURL(currentImage.file);
        fileUrls = [dataURL];
      }

      // Call OpenAI streaming
      const aiResponse = await InvokeLLMRealTime({
        prompt: inputMessage,
        file_urls: fileUrls,
        response_json_schema: {
          type: "object",
          properties: {
            response: { type: "string" },
            alt_text: { type: "string" },
            seo_score: { type: "number" },
            keywords: { type: "array", items: { type: "string" } }
          }
        },
        onChunk: (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.isTyping ? { ...msg, content: (msg.content || '') + chunk } : msg
          ));
        },
        onProgress: (progress) => {
          setStreamingProgress(progress);
          setTokenCount(progress);
        }
      });

      // Remove typing indicator
      setMessages(prev => prev.map(msg => 
        msg.isTyping ? { ...msg, isTyping: false } : msg
      ));

      // Callback for alt text
      if (aiResponse?.alt_text && onAltTextGenerated) {
        onAltTextGenerated(aiResponse.alt_text);
      }

    } catch (error) {
      console.error('AI response error:', error);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        type: 'ai',
        content: "I apologize, but I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const quickActions = [
    { label: "Analyze Image", icon: ImageIcon, action: "Can you analyze this image for me?" },
    { label: "Generate Alt Text", icon: Target, action: "Generate SEO-optimized alt text for this image" },
    { label: "Accessibility Check", icon: Sparkles, action: "Check if this alt text meets accessibility standards" },
    { label: "Style Analysis", icon: Zap, action: "What style and aesthetic does this image convey?" }
  ];

  const triggerQuickAction = (action) => {
    setInputMessage(action);
    setTimeout(() => sendMessage(), 100);
  };

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-lg h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          AI Assistant
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            Real-time
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.type === 'ai' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div className={`max-w-[80%] ${message.type === 'user' ? 'order-first' : ''}`}>
                <div className={`rounded-lg p-3 ${
                  message.type === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content}
                    <TypingCursor isTyping={message.isTyping} />
                  </p>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
              {message.type === 'user' && (
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-blue-600" />
              </div>
              <div className="bg-slate-100 rounded-lg p-3">
                <TypingIndicator isTyping={isTyping} />
                {streamingProgress > 0 && (
                  <div className="mt-2">
                    <StreamingProgress progress={streamingProgress} />
                    <TokenCounter tokens={tokenCount} maxTokens={1000} className="mt-1" />
                  </div>
                )}
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-2 mb-3">
            {quickActions.map((action, index) => (
              <Button
                key={index}
                variant="outline"
                size="sm"
                onClick={() => triggerQuickAction(action.action)}
                disabled={isProcessing}
                className="text-xs"
              >
                <action.icon className="w-3 h-3 mr-1" />
                {action.label}
              </Button>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about image analysis, SEO, or accessibility..."
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputMessage.trim() || isProcessing}
              size="icon"
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
