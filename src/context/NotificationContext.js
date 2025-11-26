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

  // Get problem details by ID
  const getProblemDetails = (problemId) => {
    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      return problems.find(p => p.id === problemId);
    } catch (error) {
      return null;
    }
  };

  // Get all users who should be notified about discussion
  const getDiscussionParticipants = (problemId) => {
    try {
      const problem = getProblemDetails(problemId);
      if (!problem) return [];

      const users = JSON.parse(localStorage.getItem('system_users') || '[]');
      const participants = new Set();

      // 1. Problem Creator
      if (problem.createdBy) {
        participants.add(problem.createdBy);
      }

      // 2. Currently Assigned User
      if (problem.assignedToName) {
        participants.add(problem.assignedToName);
      }

      // 3. All users who commented on this problem
      if (problem.comments && problem.comments.length > 0) {
        problem.comments.forEach(comment => {
          if (comment.author) {
            participants.add(comment.author);
          }
        });
      }

      // 4. Admin and Team Leaders (if configured to receive all notifications)
      const adminAndLeaders = users.filter(u => 
        u.role === 'admin' || u.role === 'team_leader'
      ).map(u => u.name);
      
      adminAndLeaders.forEach(admin => participants.add(admin));

      // Convert to array and remove current comment author (if provided)
      return Array.from(participants);
    } catch (error) {
      console.error('Error getting discussion participants:', error);
      return [];
    }
  };

  // ==================== DOMAIN STATUS NOTIFICATIONS ====================

  // Notify when domain status changes (UP/DOWN)
  const notifyDomainStatusChange = (domain, fromStatus, toStatus) => {
    const priority = toStatus === 'DOWN' ? 'HIGH' : 'INFO';
    const icon = toStatus === 'UP' ? '🟢' : '🔴';
    const color = toStatus === 'UP' ? 'success' : 'danger';
    
    addNotification({
      type: 'domain_status_change',
      title: `${icon} Domain Status Changed`,
      message: `${domain.replace('https://', '')} changed from ${fromStatus} to ${toStatus}`,
      domain: domain,
      fromStatus: fromStatus,
      toStatus: toStatus,
      priority: priority,
      forAdminOrLeader: true,
      icon: icon,
      color: color,
      timestamp: new Date().toISOString(),
      isDomainNotification: true
    });

    console.log(`🔔 Domain Status Change: ${domain} - ${fromStatus} → ${toStatus}`);
  };

  // Notify when new domain is added to monitoring
  const notifyNewDomain = (domain, isUp) => {
    const status = isUp ? 'UP' : 'DOWN';
    const icon = isUp ? '🟢' : '🔴';
    
    addNotification({
      type: 'new_domain',
      title: '🌐 New Domain Added',
      message: `${domain.replace('https://', '')} is now being monitored (Status: ${status})`,
      domain: domain,
      isUp: isUp,
      forAdminOrLeader: true,
      icon: '🌐',
      color: 'info',
      timestamp: new Date().toISOString(),
      isDomainNotification: true
    });
  };

  // Notify when critical domain is down
  const notifyCriticalDomain = (domain) => {
    addNotification({
      type: 'critical_domain',
      title: '🚨 Critical Domain Alert',
      message: `${domain.replace('https://', '')} is DOWN and requires immediate attention`,
      domain: domain,
      priority: 'URGENT',
      forAdminOrLeader: true,
      icon: '🚨',
      color: 'danger',
      timestamp: new Date().toISOString(),
      isDomainNotification: true
    });
  };

  // Manual domain check notification
  const notifyManualDomainCheck = (domain, isUp) => {
    addNotification({
      type: 'manual_domain_check',
      title: '🔍 Manual Domain Check',
      message: `${domain.replace('https://', '')} is currently ${isUp ? 'UP' : 'DOWN'}`,
      domain: domain,
      isUp: isUp,
      forAdminOrLeader: true,
      icon: '🔍',
      color: isUp ? 'success' : 'warning',
      timestamp: new Date().toISOString(),
      isDomainNotification: true
    });
  };

  // Notify when multiple domains are down
  const notifyMultipleDomainsDown = (downDomains) => {
    if (downDomains.length === 0) return;

    addNotification({
      type: 'multiple_domains_down',
      title: '⚠️ Multiple Domains Down',
      message: `${downDomains.length} domain(s) are currently DOWN: ${downDomains.map(d => d.replace('https://', '')).join(', ')}`,
      domains: downDomains,
      count: downDomains.length,
      priority: 'HIGH',
      forAdminOrLeader: true,
      icon: '⚠️',
      color: 'danger',
      timestamp: new Date().toISOString(),
      isDomainNotification: true
    });
  };

  // Notify when domain uptime is low
  const notifyLowUptime = (uptimePercentage, totalDomains, downDomains) => {
    addNotification({
      type: 'low_uptime',
      title: '📉 Low Uptime Alert',
      message: `Domain uptime is ${uptimePercentage}% (${downDomains} out of ${totalDomains} domains are down)`,
      uptimePercentage: uptimePercentage,
      totalDomains: totalDomains,
      downDomains: downDomains,
      priority: 'MEDIUM',
      forAdminOrLeader: true,
      icon: '📉',
      color: 'warning',
      timestamp: new Date().toISOString(),
      isDomainNotification: true
    });
  };

  // ==================== PROBLEM MANAGEMENT NOTIFICATIONS ====================

  // Notify about new discussion comment
  const notifyDiscussionComment = (problemId, commentAuthor, commentText, problemDetails = null) => {
    try {
      console.log('🔔 Sending discussion notifications for problem:', problemId);
      
      const problem = problemDetails || getProblemDetails(problemId);
      if (!problem) {
        console.error('Problem not found for notification:', problemId);
        return;
      }

      // Get all participants who should be notified (excluding the comment author)
      const participants = getDiscussionParticipants(problemId).filter(
        participant => participant !== commentAuthor
      );

      console.log('👥 Discussion participants to notify:', participants);

      // Send notification to each participant
      participants.forEach(participant => {
        const userId = getUserIdByUsername(participant);
        
        if (userId) {
          addNotification({
            type: 'discussion_comment',
            title: '💬 New Discussion Message',
            message: `${commentAuthor} commented on Problem #${problemId}: "${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}"`,
            problemId,
            targetUsername: participant,
            userId: userId,
            commentAuthor: commentAuthor,
            commentText: commentText,
            problemTitle: problem.statement?.substring(0, 30) || `Problem #${problemId}`,
            icon: '💬',
            color: 'info',
            isDiscussion: true
          });
        }
      });

      // Also notify Admin and Team Leaders (as backup)
      addNotification({
        type: 'discussion_comment',
        title: '💬 New Discussion Activity',
        message: `${commentAuthor} commented on Problem #${problemId}`,
        problemId,
        forAdminOrLeader: true,
        commentAuthor: commentAuthor,
        commentText: commentText,
        icon: '💬',
        color: 'info',
        isDiscussion: true
      });

      console.log(`Discussion notifications sent to ${participants.length} participants`);
      
    } catch (error) {
      console.error('❌ Failed to send discussion notifications:', error);
    }
  };

  // Notify about solution comment (special type)
  const notifySolutionComment = (problemId, solvedBy, solutionText, problemDetails = null) => {
    try {
      const problem = problemDetails || getProblemDetails(problemId);
      if (!problem) return;

      // Get problem creator and assigned user
      const participants = new Set();
      
      if (problem.createdBy && problem.createdBy !== solvedBy) {
        participants.add(problem.createdBy);
      }
      
      if (problem.assignedToName && problem.assignedToName !== solvedBy) {
        participants.add(problem.assignedToName);
      }

      // Notify participants
      participants.forEach(participant => {
        const userId = getUserIdByUsername(participant);
        
        if (userId) {
          addNotification({
            type: 'solution_comment',
            title: '✅ Solution Provided',
            message: `${solvedBy} provided a solution for Problem #${problemId}`,
            problemId,
            targetUsername: participant,
            userId: userId,
            solvedBy: solvedBy,
            solutionText: solutionText,
            icon: '✅',
            color: 'success',
            isSolution: true
          });
        }
      });

      // Notify Admin and Team Leaders for approval
      addNotification({
        type: 'solution_comment',
        title: '✅ Solution Ready for Review',
        message: `${solvedBy} submitted a solution for Problem #${problemId}`,
        problemId,
        forAdminOrLeader: true,
        solvedBy: solvedBy,
        solutionText: solutionText,
        icon: '✅',
        color: 'success',
        isSolution: true
      });

    } catch (error) {
      console.error('Failed to send solution notification:', error);
    }
  };

  // Existing notification helpers
  const notifyNewProblem = (problemId, createdBy, department) => {
    addNotification({
      type: 'new_problem',
      title: '🆕 New Problem Raised',
      message: `${createdBy} raised a new problem (#${problemId}) in ${department} department`,
      problemId,
      forAdminOrLeader: true,
      icon: '🆕',
      color: 'primary'
    });
  };

  const notifyAssignment = (problemId, assignedToUsername, assignedBy) => {
    const userId = getUserIdByUsername(assignedToUsername);
    
    addNotification({
      type: 'assignment',
      title: '📌 Problem Assigned',
      message: `You have been assigned problem #${problemId} by ${assignedBy}`,
      problemId,
      targetUsername: assignedToUsername,
      userId: userId,
      icon: '📌',
      color: 'info'
    });
  };

  const notifyStatusChange = (problemId, newStatus, changedBy, assignedToUsername) => {
    if (assignedToUsername) {
      const userId = getUserIdByUsername(assignedToUsername);
      
      addNotification({
        type: 'status_change',
        title: '🔄 Status Updated',
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
    const toUserId = getUserIdByUsername(toUsername);
    
    addNotification({
      type: 'transfer',
      title: '⇄ Problem Transferred to You',
      message: `Problem #${problemId} has been transferred to you from ${fromUsername} by ${transferredBy}`,
      problemId,
      targetUsername: toUsername,
      userId: toUserId,
      icon: '⇄',
      color: 'warning'
    });

    addNotification({
      type: 'transfer',
      title: '⇄ Problem Transferred',
      message: `Problem #${problemId} transferred from ${fromUsername} to ${toUsername}`,
      problemId,
      forAdminOrLeader: true,
      icon: '⇄',
      color: 'secondary'
    });
  };

  const notifyCompletion = (problemId, completedBy) => {
    addNotification({
      type: 'completion',
      title: '✅ Problem Completed',
      message: `Problem #${problemId} has been marked as completed by ${completedBy}`,
      problemId,
      forAdminOrLeader: true,
      icon: '✅',
      color: 'success'
    });
  };

  // ==================== SYSTEM NOTIFICATIONS ====================

  // System maintenance notification
  const notifySystemMaintenance = (message, duration) => {
    addNotification({
      type: 'system_maintenance',
      title: '🔧 System Maintenance',
      message: message,
      duration: duration,
      forAdminOrLeader: false, // All users see this
      icon: '🔧',
      color: 'info',
      isSystemNotification: true
    });
  };

  // System error notification
  const notifySystemError = (errorMessage, component) => {
    addNotification({
      type: 'system_error',
      title: '❌ System Error',
      message: `${component}: ${errorMessage}`,
      component: component,
      forAdminOrLeader: true,
      icon: '❌',
      color: 'danger',
      isSystemNotification: true
    });
  };

  // Backup completed notification
  const notifyBackupCompleted = (backupType, size) => {
    addNotification({
      type: 'backup_completed',
      title: '💾 Backup Completed',
      message: `${backupType} backup completed successfully (${size})`,
      backupType: backupType,
      size: size,
      forAdminOrLeader: true,
      icon: '💾',
      color: 'success',
      isSystemNotification: true
    });
  };

  return (
    <NotificationContext.Provider
      value={{
        // Core notification functions
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearNotifications,
        loadNotifications,

        // Helper functions
        getUserIdByUsername,
        getProblemDetails,
        getDiscussionParticipants,

        // 🔥 DOMAIN STATUS NOTIFICATIONS
        notifyDomainStatusChange,
        notifyNewDomain,
        notifyCriticalDomain,
        notifyManualDomainCheck,
        notifyMultipleDomainsDown,
        notifyLowUptime,

        // 🔥 PROBLEM MANAGEMENT NOTIFICATIONS
        notifyNewProblem,
        notifyAssignment,
        notifyStatusChange,
        notifyTransfer,
        notifyCompletion,
        notifyDiscussionComment,
        notifySolutionComment,

        // 🔥 SYSTEM NOTIFICATIONS
        notifySystemMaintenance,
        notifySystemError,
        notifyBackupCompleted
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