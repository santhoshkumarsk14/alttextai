import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Users, Edit3, Save, User } from 'lucide-react';
import socketService from '../../services/socketService';

const CollaborativeEditor = ({ projectId, initialContent = '' }) => {
  const [content, setContent] = useState(initialContent);
  const [isEditing, setIsEditing] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    if (projectId) {
      // Join project room
      socketService.joinProjectRoom(projectId);

      // Listen for collaboration events
      const handleUserJoined = (data) => {
        setActiveUsers(prev => [...prev.filter(u => u.id !== data.userId), data]);
      };

      const handleUserLeft = (data) => {
        setActiveUsers(prev => prev.filter(u => u.id !== data.userId));
      };

      const handleContentUpdate = (data) => {
        if (data.userId !== currentUser?.id) {
          setContent(data.content);
        }
      };

      const handleEditingStatus = (data) => {
        setActiveUsers(prev => prev.map(user =>
          user.id === data.userId ? { ...user, isEditing: data.isEditing } : user
        ));
      };

      socketService.on('user-joined-project', handleUserJoined);
      socketService.on('user-left-project', handleUserLeft);
      socketService.on('content-update', handleContentUpdate);
      socketService.on('editing-status', handleEditingStatus);

      // Get current user
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser({ id: payload.id, name: payload.name || 'You' });
        } catch (error) {
          console.error('Error parsing token:', error);
        }
      }

      return () => {
        socketService.off('user-joined-project', handleUserJoined);
        socketService.off('user-left-project', handleUserLeft);
        socketService.off('content-update', handleContentUpdate);
        socketService.off('editing-status', handleEditingStatus);
      };
    }
  }, [projectId, currentUser?.id]);

  const handleContentChange = (newContent) => {
    setContent(newContent);

    // Emit content update
    socketService.socket?.emit('content-update', {
      projectId,
      content: newContent,
      userId: currentUser?.id
    });
  };

  const handleEditStart = () => {
    setIsEditing(true);
    socketService.socket?.emit('editing-status', {
      projectId,
      isEditing: true,
      userId: currentUser?.id
    });
  };

  const handleEditEnd = () => {
    setIsEditing(false);
    socketService.socket?.emit('editing-status', {
      projectId,
      isEditing: false,
      userId: currentUser?.id
    });
  };

  const saveContent = () => {
    // Here you would typically save to backend
    handleEditEnd();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Edit3 className="w-5 h-5" />
            <span>Collaborative Editor</span>
          </CardTitle>

          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-500" />
            <div className="flex -space-x-2">
              {activeUsers.slice(0, 3).map((user) => (
                <div
                  key={user.id}
                  className={`w-8 h-8 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center text-white text-xs font-medium ${
                    user.isEditing ? 'ring-2 ring-yellow-400' : ''
                  }`}
                  title={`${user.name}${user.isEditing ? ' (editing)' : ''}`}
                >
                  {user.name.charAt(0).toUpperCase()}
                </div>
              ))}
              {activeUsers.length > 3 && (
                <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                  +{activeUsers.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge variant={isEditing ? 'default' : 'secondary'}>
              {isEditing ? 'Editing' : 'Viewing'}
            </Badge>
            {activeUsers.some(u => u.isEditing) && (
              <Badge variant="outline" className="text-yellow-600 border-yellow-300">
                Someone is editing
              </Badge>
            )}
          </div>

          <div className="flex space-x-2">
            {!isEditing ? (
              <Button onClick={handleEditStart} size="sm">
                <Edit3 className="w-4 h-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={saveContent} size="sm">
                  <Save className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button onClick={handleEditEnd} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="relative">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            disabled={!isEditing}
            className={`w-full h-64 p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              !isEditing ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'
            }`}
            placeholder="Start collaborating on alt text..."
          />

          {isEditing && (
            <div className="absolute top-2 right-2">
              <div className="flex items-center space-x-1 bg-yellow-100 px-2 py-1 rounded text-xs text-yellow-800">
                <User className="w-3 h-3" />
                <span>You are editing</span>
              </div>
            </div>
          )}
        </div>

        <div className="text-sm text-gray-600">
          <p>{content.length} characters</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default CollaborativeEditor;