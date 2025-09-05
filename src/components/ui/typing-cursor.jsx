import React, { useState, useEffect } from 'react';

export default function TypingCursor({ isTyping = false, className = "" }) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!isTyping) {
      setIsVisible(false);
      return;
    }

    // Blinking cursor effect
    const interval = setInterval(() => {
      setIsVisible(prev => !prev);
    }, 500);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <span 
      className={`inline-block w-0.5 h-4 bg-blue-600 transition-opacity duration-75 ${className}`}
      style={{ 
        opacity: isVisible ? 1 : 0,
        animation: isTyping ? 'blink 1s infinite' : 'none'
      }}
    >
      <style jsx="true">{`
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

// Enhanced typing indicator with dots
export function TypingIndicator({ isTyping = false, className = "" }) {
  const [dotStates, setDotStates] = useState([false, false, false]);

  useEffect(() => {
    if (!isTyping) {
      setDotStates([false, false, false]);
      return;
    }

    const interval = setInterval(() => {
      setDotStates(prev => {
        const newStates = [...prev];
        const activeIndex = newStates.findIndex(state => !state);
        if (activeIndex !== -1) {
          newStates[activeIndex] = true;
        } else {
          // Reset all dots
          return [false, false, false];
        }
        return newStates;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [isTyping]);

  if (!isTyping) return null;

  return (
    <div className={`flex space-x-1 ${className}`}>
      {dotStates.map((isActive, index) => (
        <div
          key={index}
          className={`w-2 h-2 rounded-full transition-all duration-200 ${
            isActive 
              ? 'bg-blue-600 scale-110' 
              : 'bg-gray-300 scale-100'
          }`}
          style={{
            animationDelay: `${index * 100}ms`
          }}
        />
      ))}
    </div>
  );
}

// Real-time streaming progress indicator
export function StreamingProgress({ progress = 0, className = "" }) {
  return (
    <div className={`w-full bg-gray-200 rounded-full h-1 ${className}`}>
      <div 
        className="bg-blue-600 h-1 rounded-full transition-all duration-300 ease-out"
        style={{ width: `${Math.min(progress, 100)}%` }}
      />
    </div>
  );
}

// Token counter for AI responses
export function TokenCounter({ tokens = 0, maxTokens = 1000, className = "" }) {
  const percentage = (tokens / maxTokens) * 100;
  const isNearLimit = percentage > 80;

  return (
    <div className={`flex items-center space-x-2 text-xs ${className}`}>
      <div className="flex-1 bg-gray-200 rounded-full h-1">
        <div 
          className={`h-1 rounded-full transition-all duration-300 ${
            isNearLimit ? 'bg-red-500' : 'bg-green-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className={`font-mono ${isNearLimit ? 'text-red-600' : 'text-gray-600'}`}>
        {tokens}/{maxTokens}
      </span>
    </div>
  );
}





