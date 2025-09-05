import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, X, Minimize2, Maximize2 } from 'lucide-react';
import socketService from '../../services/socketService';
import { useAuth } from '../../contexts/AuthContext';

const ChatWidget = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen && user?.id) {
      // Load chat history
      loadChatHistory();

      // Listen for new messages
      const handleNewMessage = (data) => {
        setMessages(prev => [...prev, {
          id: data.id,
          content: data.content,
          type: data.type,
          timestamp: data.timestamp
        }]);
      };

      socketService.on('new-message', handleNewMessage);

      return () => {
        socketService.off('new-message', handleNewMessage);
      };
    }
  }, [isOpen, user?.id]);

  const loadChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    socketService.sendMessage(newMessage);
    setNewMessage('');

    // Add message to local state immediately for better UX
    setMessages(prev => [...prev, {
      id: Date.now(),
      content: newMessage,
      type: 'user',
      timestamp: new Date().toISOString()
    }]);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!isOpen) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-4 shadow-lg transition-colors"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`bg-white rounded-lg shadow-xl border border-gray-200 ${
        isMinimized ? 'w-80 h-14' : 'w-80 h-96'
      } flex flex-col transition-all duration-300`}>
        {/* Header */}
        <div className="bg-blue-600 text-white p-3 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Support Chat</span>
            {isTyping && (
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            <button
              onClick={() => setIsMinimized(!isMinimized)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-blue-700 p-1 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 text-sm mt-8">
                  <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Start a conversation with our support team</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {message.content}
                      <div className={`text-xs mt-1 ${
                        message.type === 'user' ? 'text-blue-200' : 'text-gray-500'
                      }`}>
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t border-gray-200 p-3">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
                <button
                  onClick={sendMessage}
                  disabled={!newMessage.trim()}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white p-2 rounded-lg transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ChatWidget;