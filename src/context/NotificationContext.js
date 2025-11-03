import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Load notifications from localStorage
  useEffect(() => {
    if (user) {
      loadNotifications();
    }
  }, [user]);

  const loadNotifications = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      // Filter notifications for current user
      const userNotifications = allNotifications.filter(
        n => n.userId === user?.id || n.userId === 'all' || (user?.role === 'admin' && n.forAdmin)
      );
      setNotifications(userNotifications);
      setUnreadCount(userNotifications.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  // Add new notification
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

  // Mark notification as read
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

  // Mark all as read
  const markAllAsRead = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updatedNotifications = allNotifications.map(n => ({ ...n, read: true }));
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      loadNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const otherUserNotifications = allNotifications.filter(
        n => n.userId !== user?.id && n.userId !== 'all' && !(user?.role === 'admin' && n.forAdmin)
      );
      localStorage.setItem('notifications', JSON.stringify(otherUserNotifications));
      setNotifications([]);
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  };

  // Notification helpers
  const notifyNewProblem = (problemId, createdBy, department) => {
    addNotification({
      type: 'new_problem',
      title: 'New Problem Raised',
      message: `${createdBy} raised a new problem (#${problemId}) in ${department} department`,
      problemId,
      forAdmin: true,
      icon: '🆕',
      color: 'primary'
    });
  };

  const notifyAssignment = (problemId, assignedTo, assignedBy) => {
    addNotification({
      type: 'assignment',
      title: 'Problem Assigned',
      message: `You have been assigned problem #${problemId} by ${assignedBy}`,
      problemId,
      userId: assignedTo,
      icon: '📌',
      color: 'info'
    });
  };

  const notifyStatusChange = (problemId, newStatus, changedBy, assignedTo) => {
    addNotification({
      type: 'status_change',
      title: 'Status Updated',
      message: `Problem #${problemId} status changed to ${newStatus.replace('_', ' ').toUpperCase()} by ${changedBy}`,
      problemId,
      userId: assignedTo,
      icon: '🔄',
      color: 'warning'
    });
  };

  const notifyTransfer = (problemId, from, to, transferredBy) => {
    // Notify the new assignee
    addNotification({
      type: 'transfer',
      title: 'Problem Transferred to You',
      message: `Problem #${problemId} has been transferred to you from ${from} by ${transferredBy}`,
      problemId,
      userId: to,
      icon: '⇄',
      color: 'warning'
    });

    // Notify admin
    addNotification({
      type: 'transfer',
      title: 'Problem Transferred',
      message: `Problem #${problemId} transferred from ${from} to ${to}`,
      problemId,
      forAdmin: true,
      icon: '⇄',
      color: 'secondary'
    });
  };

  const notifyCompletion = (problemId, completedBy) => {
    addNotification({
      type: 'completion',
      title: 'Problem Completed',
      message: `Problem #${problemId} has been marked as completed by ${completedBy}`,
      problemId,
      forAdmin: true,
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