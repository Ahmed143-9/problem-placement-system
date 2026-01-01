// src/services/websocket.js
class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000;
    this.subscribers = new Map();
    this.isConnected = false;
  }

  connect() {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.warn('No token available for WebSocket connection');
        return;
      }

      // Construct WebSocket URL
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `ws://ticketapi.wineds.com/ws/notifications?token=${token}`;
      
      console.log('🔌 Attempting WebSocket connection to:', wsUrl);
      
      this.socket = new WebSocket(wsUrl);
      
      this.socket.onopen = () => {
        console.log('✅ WebSocket connected successfully');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        
        // Notify all subscribers that connection is established
        this.notifySubscribers('connected', {});
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📨 WebSocket message received:', data);
          
          // Handle different message types
          if (data.type === 'notification') {
            this.notifySubscribers('notification', data.payload);
          } else if (data.type === 'assigned_problem') {
            this.notifySubscribers('assigned_problem', data.payload);
          } else if (data.type === 'ping') {
            this.sendPong();
          }
        } catch (error) {
          console.error('❌ Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = (event) => {
        console.log('🔌 WebSocket disconnected:', event.code, event.reason);
        this.isConnected = false;
        this.handleReconnection();
      };

      this.socket.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
      };

    } catch (error) {
      console.error('❌ WebSocket connection error:', error);
    }
  }

  sendPong() {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type: 'pong' }));
    }
  }

  sendMessage(type, payload) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, ...payload }));
    }
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, []);
    }
    this.subscribers.get(eventType).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  notifySubscribers(eventType, data) {
    const callbacks = this.subscribers.get(eventType);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ Error in WebSocket callback:', error);
        }
      });
    }
  }

  handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`🔄 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      
      setTimeout(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, this.reconnectInterval * this.reconnectAttempts);
    } else {
      console.error('❌ Max reconnection attempts reached. Falling back to polling.');
      this.startPolling();
    }
  }

  startPolling() {
    // Fallback to polling if WebSocket fails
    setInterval(() => {
      if (this.isConnected) {
        this.sendMessage('ping', {});
      }
    }, 30000);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
      this.isConnected = false;
    }
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();

export default webSocketService;