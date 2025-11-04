import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      // Filter notifications based on user role
      const userNotifications = allNotifications.filter(n => {
        // Admin and Team Leader see all notifications
        if (user?.role === 'admin' || user?.role === 'team_leader') {
          return n.forAdminOrLeader || n.userId === user?.id || n.targetUsername === user?.name;
        }
        
        // Regular users only see notifications specifically for them
        return n.userId === user?.id || n.targetUsername === user?.name;
      });
      
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const addNotification = (notification) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const newNotification = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        read: false,
        ...notification
      };
      allNotifications.push(newNotification);
      localStorage.setItem('notifications', JSON.stringify(allNotifications));
      loadNotifications();
    } catch (error) {
      console.error('Failed to add notification:', error);
    }
  };

  const markAsRead = (notificationId) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updatedNotifications = allNotifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updatedNotifications = allNotifications.map(n => {
        // Only mark as read if it's for current user
        if (user?.role === 'admin' || user?.role === 'team_leader') {
          if (n.forAdminOrLeader || n.userId === user?.id || n.targetUsername === user?.name) {
            return { ...n, read: true };
          }
        } else if (n.userId === user?.id || n.targetUsername === user?.name) {
          return { ...n, read: true };
        }
        return n;
      });
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const clearNotifications = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const otherUserNotifications = allNotifications.filter(n => {
        if (user?.role === 'admin' || user?.role === 'team_leader') {
          return !(n.forAdminOrLeader || n.userId === user?.id || n.targetUsername === user?.name);
        }
        return !(n.userId === user?.id || n.targetUsername === user?.name);
      });
      localStorage.setItem('notifications', JSON.stringify(otherUserNotifications));
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Get user ID by username
  const getUserIdByUsername = (username) => {
    try {
      const users = JSON.parse(localStorage.getItem('system_users') || '[]');
      const foundUser = users.find(u => u.name === username);
      return foundUser?.id;
    } catch (error) {
      return null;
    }
  };

  // Notification helpers
  const notifyNewProblem = (problemId, createdBy, department) => {
    // Only notify Admin and Team Leaders
    addNotification({
      type: 'new_problem',
      title: 'New Problem Raised',
      message: `${createdBy} raised a new problem (#${problemId}) in ${department} department`,
      problemId,
      forAdminOrLeader: true,
      icon: '🆕',
      color: 'primary'
    });
  };

  const notifyAssignment = (problemId, assignedToUsername, assignedBy) => {
    // Only notify the specific person assigned
    const userId = getUserIdByUsername(assignedToUsername);
    
    addNotification({
      type: 'assignment',
      title: 'Problem Assigned',
      message: `You have been assigned problem #${problemId} by ${assignedBy}`,
      problemId,
      targetUsername: assignedToUsername,
      userId: userId,
      icon: '📌',
      color: 'info'
    });
  };

  const notifyStatusChange = (problemId, newStatus, changedBy, assignedToUsername) => {
    // Notify the assigned person
    if (assignedToUsername) {
      const userId = getUserIdByUsername(assignedToUsername);
      
      addNotification({
        type: 'status_change',
        title: 'Status Updated',
        message: `Problem #${problemId} status changed to ${newStatus.replace('_', ' ').toUpperCase()} by ${changedBy}`,
        problemId,
        targetUsername: assignedToUsername,
        userId: userId,
        icon: '🔄',
        color: 'warning'
      });
    }
  };

  const notifyTransfer = (problemId, fromUsername, toUsername, transferredBy) => {
    // Notify the new assignee
    const toUserId = getUserIdByUsername(toUsername);
    
    addNotification({
      type: 'transfer',
      title: 'Problem Transferred to You',
      message: `Problem #${problemId} has been transferred to you from ${fromUsername} by ${transferredBy}`,
      problemId,
      targetUsername: toUsername,
      userId: toUserId,
      icon: '⇄',
      color: 'warning'
    });

    // Notify admin and team leaders
    addNotification({
      type: 'transfer',
      title: 'Problem Transferred',
      message: `Problem #${problemId} transferred from ${fromUsername} to ${toUsername}`,
      problemId,
      forAdminOrLeader: true,
      icon: '⇄',
      color: 'secondary'
    });
  };

  const notifyCompletion = (problemId, completedBy) => {
    // Only notify Admin and Team Leaders for completion
    addNotification({
      type: 'completion',
      title: 'Problem Completed',
      message: `Problem #${problemId} has been marked as completed by ${completedBy}`,
      problemId,
      forAdminOrLeader: true,
      icon: '✅',
      color: 'success'
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        loadNotifications,
        // Helper functions
        notifyNewProblem,
        notifyAssignment,
        notifyStatusChange,
        notifyTransfer,
        notifyCompletion
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};