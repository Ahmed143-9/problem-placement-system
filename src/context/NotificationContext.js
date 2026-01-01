import React, { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { toast } from 'react-toastify';
import webSocketService from '../services/websocket';

const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [assignedProblems, setAssignedProblems] = useState([]);
  const [assignedUnreadCount, setAssignedUnreadCount] = useState(0);

  // Load notifications from localStorage
  const loadNotifications = useCallback(() => {
    try {
      const storedNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const storedAssignedProblems = JSON.parse(localStorage.getItem('assignedProblems') || '[]');
      
      setNotifications(storedNotifications);
      setAssignedProblems(storedAssignedProblems);
      
      // Calculate unread counts
      const unread = storedNotifications.filter(n => !n.read).length;
      const assignedUnread = storedAssignedProblems.filter(p => !p.read).length;
      
      setUnreadCount(unread);
      setAssignedUnreadCount(assignedUnread);
      
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  }, []);

  // Save notifications to localStorage
  const saveNotifications = useCallback((newNotifications, newAssignedProblems = null) => {
    try {
      localStorage.setItem('notifications', JSON.stringify(newNotifications));
      if (newAssignedProblems !== null) {
        localStorage.setItem('assignedProblems', JSON.stringify(newAssignedProblems));
      }
    } catch (error) {
      console.error('Failed to save notifications:', error);
    }
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    // Load initial notifications
    loadNotifications();
    
    // Connect WebSocket
    webSocketService.connect();
    
    // Subscribe to WebSocket events
    const unsubscribeNotification = webSocketService.subscribe('notification', (data) => {
      console.log('📨 New notification from WebSocket:', data);
      addNotification({
        type: data.type,
        title: data.title,
        message: data.message,
        problemId: data.problem_id,
        senderId: data.sender_id,
        autoDismiss: data.auto_dismiss !== false,
        timestamp: new Date().toISOString()
      });
    });
    
    const unsubscribeAssignedProblem = webSocketService.subscribe('assigned_problem', (data) => {
      console.log('📨 New assigned problem from WebSocket:', data);
      addAssignedProblem(data);
    });
    
    const unsubscribeConnected = webSocketService.subscribe('connected', () => {
      console.log('✅ WebSocket connected, reloading notifications');
      loadNotifications();
    });
    
    // Cleanup on unmount
    return () => {
      unsubscribeNotification();
      unsubscribeAssignedProblem();
      unsubscribeConnected();
      webSocketService.disconnect();
    };
  }, [loadNotifications]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      read: false,
      timestamp: new Date().toISOString(),
      ...notification
    };
    
    setNotifications(prev => {
      const updated = [newNotification, ...prev.slice(0, 49)]; // Keep last 50 notifications
      saveNotifications(updated);
      return updated;
    });
    
    setUnreadCount(prev => prev + 1);
    
    // Show toast for important notifications
    if (notification.type === 'assignment' || notification.type === 'transfer') {
      toast.info(notification.message, {
        position: "top-right",
        autoClose: 5000,
      });
    }
  }, [saveNotifications]);

  // Add an assigned problem
  const addAssignedProblem = useCallback((problem) => {
    setAssignedProblems(prev => {
      const updated = [{ ...problem, read: false }, ...prev.slice(0, 49)];
      saveNotifications(null, updated);
      return updated;
    });
    
    setAssignedUnreadCount(prev => prev + 1);
    
    // Show toast for new assignments
    toast.info(`New problem assigned: ${problem.statement || problem.department}`, {
      position: "top-right",
      autoClose: 5000,
    });
  }, [saveNotifications]);

  // Mark notification as read
  const markAsRead = useCallback((notificationId) => {
    setNotifications(prev => {
      const updated = prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      saveNotifications(updated);
      return updated;
    });
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, [saveNotifications]);

  // Mark assigned problem as read
  const markAssignedAsRead = useCallback((problemId) => {
    setAssignedProblems(prev => {
      const updated = prev.map(p =>
        p.id === problemId ? { ...p, read: true } : p
      );
      saveNotifications(null, updated);
      return updated;
    });
    
    setAssignedUnreadCount(prev => Math.max(0, prev - 1));
  }, [saveNotifications]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
    
    setUnreadCount(0);
  }, [saveNotifications]);

  // Mark all assigned problems as read
  const markAllAssignedAsRead = useCallback(() => {
    setAssignedProblems(prev => {
      const updated = prev.map(p => ({ ...p, read: true }));
      saveNotifications(null, updated);
      return updated;
    });
    
    setAssignedUnreadCount(0);
  }, [saveNotifications]);

  // Clear all notifications
  const clearNotifications = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
    saveNotifications([]);
  }, [saveNotifications]);

  // Clear all assigned problems
  const clearAssignedProblems = useCallback(() => {
    setAssignedProblems([]);
    setAssignedUnreadCount(0);
    saveNotifications(null, []);
  }, [saveNotifications]);

  // Clear everything
  const clearAllNotifications = useCallback(() => {
    clearNotifications();
    clearAssignedProblems();
  }, [clearNotifications, clearAssignedProblems]);

  // Remove a specific notification
  const removeNotification = useCallback((notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      const updated = prev.filter(n => n.id !== notificationId);
      saveNotifications(updated);
      
      // Update unread count if notification was unread
      if (notification && !notification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return updated;
    });
  }, [saveNotifications]);

  // Remove a specific assigned problem
  const removeAssignedProblem = useCallback((problemId) => {
    setAssignedProblems(prev => {
      const problem = prev.find(p => p.id === problemId);
      const updated = prev.filter(p => p.id !== problemId);
      saveNotifications(null, updated);
      
      // Update unread count if problem was unread
      if (problem && !problem.read) {
        setAssignedUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      return updated;
    });
  }, [saveNotifications]);

  // Send notification via WebSocket
  const sendNotification = useCallback((data) => {
    webSocketService.sendMessage('notification', data);
  }, []);

  // Send assigned problem via WebSocket
  const sendAssignedProblem = useCallback((data) => {
    webSocketService.sendMessage('assign_problem', data);
  }, []);

  const value = {
    notifications,
    unreadCount,
    assignedProblems,
    assignedUnreadCount,
    loadNotifications,
    addNotification,
    addAssignedProblem,
    markAsRead,
    markAssignedAsRead,
    markAllAsRead,
    markAllAssignedAsRead,
    clearNotifications,
    clearAssignedProblems,
    clearAllNotifications,
    removeNotification,
    removeAssignedProblem,
    sendNotification,
    sendAssignedProblem
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}