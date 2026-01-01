// src/services/notificationService.js
class NotificationService {
  constructor() {
    this.pollingInterval = null;
    this.pollingEnabled = false;
    this.currentUserId = null;
    this.listeners = new Map();
    this.lastCheckTime = null;
  }

  // Initialize service
  init(userId) {
    this.currentUserId = userId;
    this.lastCheckTime = new Date().toISOString();
    
    // Start polling
    this.startPolling();
    
    // Listen for storage events (for cross-tab communication)
    window.addEventListener('storage', this.handleStorageEvent.bind(this));
    
    console.log('🔔 Notification service initialized for user:', userId);
  }

  // Start polling for notifications
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }

    // Poll every 10 seconds
    this.pollingInterval = setInterval(() => {
      if (this.pollingEnabled && this.currentUserId) {
        this.checkForNewNotifications();
      }
    }, 10000); // 10 seconds

    this.pollingEnabled = true;
    
    // Initial check
    setTimeout(() => {
      this.checkForNewNotifications();
    }, 2000);
  }

  // Stop polling
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.pollingEnabled = false;
  }

  // Check for new notifications from localStorage
  async checkForNewNotifications() {
    try {
      if (!this.currentUserId) return;

      // Get notifications from localStorage
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      
      // Get notifications for current user
      const userNotifications = allNotifications[this.currentUserId] || [];
      
      // Filter new notifications (after lastCheckTime)
      const newNotifications = userNotifications.filter(notification => {
        return new Date(notification.created_at) > new Date(this.lastCheckTime);
      });

      // Update last check time
      this.lastCheckTime = new Date().toISOString();

      // Notify listeners about new notifications
      if (newNotifications.length > 0) {
        console.log(`🔔 Found ${newNotifications.length} new notifications`);
        this.notifyListeners('new_notifications', newNotifications);
      }

      return newNotifications;
      
    } catch (error) {
      console.error('Error checking notifications:', error);
      return [];
    }
  }

  // Create a new notification (when assigning a problem)
  createNotification(notificationData) {
    try {
      const {
        recipient_id,
        recipient_name,
        type,
        title,
        message,
        problem_id,
        problem_statement,
        priority,
        department,
        sender_id,
        sender_name
      } = notificationData;

      if (!recipient_id) {
        throw new Error('Recipient ID is required');
      }

      const notification = {
        id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: type || 'assignment',
        title: title || 'New Problem Assigned',
        message: message || 'You have been assigned a new problem',
        recipient_id,
        recipient_name,
        sender_id: sender_id || 'system',
        sender_name: sender_name || 'System',
        problem_id: problem_id || null,
        problem_statement: problem_statement || '',
        priority: priority || 'Medium',
        department: department || '',
        read: false,
        created_at: new Date().toISOString(),
        delivered: false
      };

      console.log('📨 Creating notification:', notification);

      // Get existing notifications
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      
      // Initialize array for recipient if not exists
      if (!allNotifications[recipient_id]) {
        allNotifications[recipient_id] = [];
      }

      // Add new notification
      allNotifications[recipient_id].unshift(notification); // Add to beginning
      
      // Keep only last 50 notifications per user
      if (allNotifications[recipient_id].length > 50) {
        allNotifications[recipient_id] = allNotifications[recipient_id].slice(0, 50);
      }

      // Save to localStorage
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));

      // Also add to global notifications for display
      this.addToGlobalNotifications(notification);

      // Trigger storage event for cross-tab communication
      this.triggerStorageEvent('notification_created', notification);

      console.log(`✅ Notification created for user ${recipient_id}`);
      
      return notification;
      
    } catch (error) {
      console.error('Error creating notification:', error);
      throw error;
    }
  }

  // Add notification to global notifications list (for current session)
  addToGlobalNotifications(notification) {
    try {
      const globalNotifications = JSON.parse(localStorage.getItem('global_notifications') || '[]');
      
      globalNotifications.unshift({
        ...notification,
        local_timestamp: new Date().toISOString()
      });

      // Keep only last 100 global notifications
      if (globalNotifications.length > 100) {
        globalNotifications.length = 100;
      }

      localStorage.setItem('global_notifications', JSON.stringify(globalNotifications));
      
    } catch (error) {
      console.error('Error adding to global notifications:', error);
    }
  }

  // Mark notification as read
  markAsRead(notificationId) {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      let found = false;

      // Find and mark notification as read
      for (const userId in allNotifications) {
        const userNotifications = allNotifications[userId];
        const notificationIndex = userNotifications.findIndex(n => n.id === notificationId);
        
        if (notificationIndex !== -1) {
          userNotifications[notificationIndex].read = true;
          found = true;
          break;
        }
      }

      if (found) {
        localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
        console.log(`✅ Notification ${notificationId} marked as read`);
      }

      return found;
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  }

  // Get notifications for current user
  getUserNotifications(userId = null) {
    try {
      const targetUserId = userId || this.currentUserId;
      if (!targetUserId) return [];

      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      return allNotifications[targetUserId] || [];
      
    } catch (error) {
      console.error('Error getting user notifications:', error);
      return [];
    }
  }

  // Get unread count for current user
  getUnreadCount(userId = null) {
    const notifications = this.getUserNotifications(userId);
    return notifications.filter(n => !n.read).length;
  }

  // Clear all notifications for current user
  clearUserNotifications(userId = null) {
    try {
      const targetUserId = userId || this.currentUserId;
      if (!targetUserId) return false;

      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      allNotifications[targetUserId] = [];
      
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
      
      // Notify listeners
      this.notifyListeners('notifications_cleared', []);
      
      return true;
      
    } catch (error) {
      console.error('Error clearing notifications:', error);
      return false;
    }
  }

  // Event listener system
  addEventListener(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.listeners.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }

  notifyListeners(event, data) {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in notification listener:', error);
        }
      });
    }
  }

  // Handle storage events (cross-tab communication)
  handleStorageEvent(event) {
    if (event.key === 'system_notifications' && event.newValue) {
      try {
        const newNotifications = JSON.parse(event.newValue);
        const userNotifications = newNotifications[this.currentUserId] || [];
        
        // Check for new notifications
        if (userNotifications.length > 0) {
          const lastNotification = userNotifications[0];
          if (lastNotification.created_at > this.lastCheckTime) {
            this.notifyListeners('new_notifications', [lastNotification]);
          }
        }
      } catch (error) {
        console.error('Error handling storage event:', error);
      }
    }
  }

  // Trigger custom storage event
  triggerStorageEvent(eventName, data) {
    try {
      const event = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(event);
      
      // Also use localStorage change to trigger cross-tab events
      const timestamp = Date.now();
      localStorage.setItem('notification_event_timestamp', timestamp.toString());
    } catch (error) {
      console.error('Error triggering storage event:', error);
    }
  }

  // Cleanup
  destroy() {
    this.stopPolling();
    this.listeners.clear();
    window.removeEventListener('storage', this.handleStorageEvent.bind(this));
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export default notificationService;