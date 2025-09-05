import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.isConnected = false;
    this.listeners = new Map();
  }

  async connect(userId) {
    if (this.socket?.connected) {
      return;
    }

    try {
      // First, discover the server port
      const response = await fetch('/api/server-info');
      const serverInfo = await response.json();
      const serverUrl = serverInfo.socketUrl;

      console.log('🔗 Connecting to server at:', serverUrl);

      this.socket = io(serverUrl, {
        transports: ['websocket', 'polling']
      });
    } catch (error) {
      console.warn('⚠️  Could not discover server port, using fallback:', error);
      // Fallback to default ports if discovery fails
      const fallbackPorts = [3002, 3003, 3004, 3005, 3006];

      for (const port of fallbackPorts) {
        try {
          const serverUrl = `http://localhost:${port}`;
          this.socket = io(serverUrl, {
            transports: ['websocket', 'polling'],
            timeout: 2000
          });
          break;
        } catch (fallbackError) {
          console.log(`Port ${port} not available, trying next...`);
        }
      }
    }

    this.socket.on('connect', () => {
      console.log('Connected to server');
      this.isConnected = true;

      // Join user-specific room
      if (userId) {
        this.socket.emit('join-user-room', userId);
      }
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from server');
      this.isConnected = false;
    });

    this.socket.on('notification', (data) => {
      this.handleNotification(data);
    });

    this.socket.on('new-message', (data) => {
      this.handleNewMessage(data);
    });

    this.socket.on('analytics-update', (data) => {
      this.handleAnalyticsUpdate(data);
    });

    this.socket.on('task-update', (data) => {
      this.handleTaskUpdate(data);
    });

    this.socket.on('sync-progress', (data) => {
      this.handleSyncProgress(data);
    });

    this.socket.on('ab-test-update', (data) => {
      this.handleABTestUpdate(data);
    });

    this.socket.on('wcag-validation-result', (data) => {
      this.handleWCAGValidation(data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  // Notification handling
  handleNotification(data) {
    // Show browser notification if permission granted
    if (Notification.permission === 'granted') {
      new Notification('AltText AI', {
        body: data.message,
        icon: '/favicon.ico'
      });
    }

    // Emit to listeners
    this.emit('notification', data);
  }

  handleNewMessage(data) {
    this.emit('new-message', data);
  }

  handleAnalyticsUpdate(data) {
    this.emit('analytics-update', data);
  }

  handleTaskUpdate(data) {
    this.emit('task-update', data);
  }

  handleSyncProgress(data) {
    this.emit('sync-progress', data);
  }

  handleABTestUpdate(data) {
    this.emit('ab-test-update', data);
  }

  handleWCAGValidation(data) {
    this.emit('wcag-validation-result', data);
  }

  // Event system for components
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => callback(data));
    }
  }

  // Send message
  sendMessage(message, room = 'support') {
    if (this.socket && this.isConnected) {
      this.socket.emit('send-message', {
        message,
        room
      });
    }
  }

  // Join project room for collaboration
  joinProjectRoom(projectId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('join-project-room', projectId);
    }
  }

  // Request analytics update
  requestAnalyticsUpdate(userId) {
    if (this.socket && this.isConnected) {
      this.socket.emit('request-analytics-update', userId);
    }
  }

  // Send task completion notification
  notifyTaskCompleted(userId, taskType, taskData) {
    if (this.socket && this.isConnected) {
      this.socket.emit('task-completed', {
        userId,
        taskType,
        taskData
      });
    }
  }
}

// Create singleton instance
const socketService = new SocketService();

export default socketService;