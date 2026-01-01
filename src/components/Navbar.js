import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { 
  FaBell, 
  FaUser, 
  FaSignOutAlt, 
  FaHome, 
  FaPlusCircle, 
  FaTasks, 
  FaCheckCircle,
  FaExclamationCircle,
  FaFileAlt,
  FaEye,
  FaTrash,
  FaCheck,
  FaUsersCog,
  FaGlobe
} from 'react-icons/fa';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  // Notification state
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Load notifications for current user
  const loadNotifications = () => {
    try {
      setLoadingNotifications(true);
      
      // Get current user ID
      const currentUserId = user?.id;
      if (!currentUserId) {
        // Try to get from localStorage as fallback
        const storedUserId = localStorage.getItem('current_user_id');
        if (!storedUserId) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
      }
      
      // Get all notifications from localStorage
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      
      // Get notifications for current user
      const userNotifications = allNotifications[user?.id] || [];
      
      // Sort by date (newest first)
      const sortedNotifications = userNotifications.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setNotifications(sortedNotifications);
      
      // Calculate unread count
      const unread = sortedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      console.log(`🔔 Loaded ${sortedNotifications.length} notifications (${unread} unread)`);
      
    } catch (error) {
      console.error('Error loading notifications:', error);
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Mark notification as read
  const markAsRead = (notificationId) => {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) return;
      
      // Get all notifications
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      const userNotifications = allNotifications[currentUserId] || [];
      
      // Find and mark as read
      const updatedNotifications = userNotifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      // Update localStorage
      allNotifications[currentUserId] = updatedNotifications;
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
      
      // Update state
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ Marked notification ${notificationId} as read`);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = () => {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) return;
      
      // Get all notifications
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      const userNotifications = allNotifications[currentUserId] || [];
      
      // Mark all as read
      const updatedNotifications = userNotifications.map(notification => ({
        ...notification,
        read: true
      }));
      
      // Update localStorage
      allNotifications[currentUserId] = updatedNotifications;
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
      
      // Update state
      setNotifications(updatedNotifications);
      setUnreadCount(0);
      
      toast.success('All notifications marked as read', { autoClose: 2000 });
      
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  // Clear all notifications
  const clearNotifications = () => {
    try {
      const currentUserId = user?.id;
      if (!currentUserId) return;
      
      // Get all notifications
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      
      // Clear user's notifications
      allNotifications[currentUserId] = [];
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
      
      // Update state
      setNotifications([]);
      setUnreadCount(0);
      
      toast.success('All notifications cleared', { autoClose: 2000 });
      
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  };

  // Delete a single notification
  const deleteNotification = (notificationId, e) => {
    e.stopPropagation(); // Prevent triggering notification click
    
    try {
      const currentUserId = user?.id;
      if (!currentUserId) return;
      
      // Get all notifications
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      const userNotifications = allNotifications[currentUserId] || [];
      
      // Filter out the notification to delete
      const updatedNotifications = userNotifications.filter(n => n.id !== notificationId);
      
      // Update localStorage
      allNotifications[currentUserId] = updatedNotifications;
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
      
      // Update state
      setNotifications(updatedNotifications);
      
      // Update unread count
      const deletedNotification = userNotifications.find(n => n.id === notificationId);
      if (deletedNotification && !deletedNotification.read) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      toast.info('Notification deleted', { autoClose: 2000 });
      
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Navigate to problem when clicking notification
  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    // Navigate to problem if problem_id exists
    if (notification.problem_id) {
      navigate(`/problem/${notification.problem_id}`);
    }
    
    // Close dropdown
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
      const bsDropdown = window.bootstrap?.Dropdown?.getInstance(dropdown);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
  };

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment':
        return '📌';
      case 'new_problem':
        return '🆕';
      case 'status_change':
        return '🔄';
      case 'transfer':
        return '⇄';
      case 'priority_change':
        return '⚠️';
      case 'solution':
        return '✅';
      case 'comment':
        return '💬';
      case 'escalation':
        return '🚨';
      default:
        return '🔔';
    }
  };

  // Get notification badge color
  const getNotificationBadge = (type) => {
    switch (type) {
      case 'assignment':
        return 'badge bg-primary';
      case 'new_problem':
        return 'badge bg-info';
      case 'status_change':
        return 'badge bg-warning';
      case 'priority_change':
        return 'badge bg-danger';
      case 'solution':
        return 'badge bg-success';
      case 'escalation':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  };

  // Format time ago
  const getTimeAgo = (timestamp) => {
    try {
      const now = new Date();
      const time = new Date(timestamp);
      const diffInSeconds = Math.floor((now - time) / 1000);

      if (diffInSeconds < 60) return 'Just now';
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
      return time.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (error) {
      return 'Recently';
    }
  };

  // Get notification type display name
  const getNotificationTypeDisplay = (type) => {
    switch (type) {
      case 'assignment':
        return 'Assignment';
      case 'new_problem':
        return 'New Problem';
      case 'status_change':
        return 'Status Update';
      case 'transfer':
        return 'Transfer';
      case 'priority_change':
        return 'Priority Change';
      case 'solution':
        return 'Solution';
      case 'escalation':
        return 'Escalation';
      default:
        return type.replace('_', ' ');
    }
  };

  // Handle logout
  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (user?.role === 'admin' || user?.role === 'team_leader') {
      return '/dashboard';
    } else {
      return '/employee-dashboard';
    }
  };

  // Get role display name
  const getRoleDisplay = () => {
    if (user?.role === 'admin') return 'Administrator';
    if (user?.role === 'team_leader') return 'Team Leader';
    return 'Employee';
  };

  // Get role badge color
  const getRoleBadgeClass = () => {
    if (user?.role === 'admin') return 'bg-danger';
    if (user?.role === 'team_leader') return 'bg-warning text-dark';
    return 'bg-info';
  };

  // Load notifications on component mount and user change
  useEffect(() => {
    if (user?.id) {
      // Initial load
      loadNotifications();
      
      // Set up interval to check for new notifications
      const intervalId = setInterval(loadNotifications, 10000); // Every 10 seconds
      
      // Listen for storage changes (when new notifications are added)
      const handleStorageChange = (event) => {
        if (event.key === 'system_notifications') {
          loadNotifications();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      // Also listen for custom events
      const handleCustomEvent = () => {
        loadNotifications();
      };
      
      window.addEventListener('notification_created', handleCustomEvent);
      window.addEventListener('localStorageChange', handleCustomEvent);
      
      return () => {
        clearInterval(intervalId);
        window.removeEventListener('storage', handleStorageChange);
        window.removeEventListener('notification_created', handleCustomEvent);
        window.removeEventListener('localStorageChange', handleCustomEvent);
      };
    }
  }, [user?.id]);

  // Check if admin or team leader
  const isAdminOrLeader = user?.role === 'admin' || user?.role === 'team_leader';
  
  // Check if regular user (not admin or team leader)
  const isRegularUser = !isAdminOrLeader;

  return (
    <>
      <nav className="navbar navbar-expand-lg navbar-dark shadow-sm" style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        borderBottom: '3px solid rgba(255,255,255,0.1)'
      }}>
        <div className="container-fluid px-4">
          {/* Brand with Icon */}
          <Link 
            className="navbar-brand d-flex align-items-center" 
            to={getDashboardPath()}
            style={{ 
              fontFamily: 'Poppins, sans-serif',
              fontSize: '1.4rem',
              fontWeight: '700',
              letterSpacing: '-0.02em'
            }}
          >
            <div 
              className="d-flex align-items-center justify-content-center me-2"
              style={{
                width: '40px',
                height: '40px',
                background: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                backdropFilter: 'blur(10px)'
              }}
            >
              <FaTasks style={{ fontSize: '1.2rem' }} />
            </div>
            <span className="d-none d-md-inline">Issue Ticket</span>
            <span className="d-inline d-md-none">Issue Ticket</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarNav"
            style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)'
            }}
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className="collapse navbar-collapse" id="navbarNav">
            {/* Main Navigation Links */}
            <ul className="navbar-nav me-auto ms-lg-4">
              <li className="nav-item">
                <Link 
                  className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                  to={getDashboardPath()}
                  style={{
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                >
                  <FaHome className="me-2" />
                  {isAdminOrLeader ? 'Admin Dashboard' : 'My Dashboard'}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                  to="/problem/create"
                  style={{
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                >
                  <FaPlusCircle className="me-2" />
                  Create Problem
                </Link>
              </li>

              {/* Show Reports only for Regular Users (NOT Admin/Team Leader) */}
              {isRegularUser && (
                <li className="nav-item">
                  <Link 
                    className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                    to="/reports"
                    style={{
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}
                  >
                    <FaFileAlt className="me-2" />
                    Reports
                  </Link>
                </li>
              )}

              {/* Show All Problems only for Admin/Team Leader */}
              {isAdminOrLeader && (
                <li className="nav-item">
                  <Link 
                    className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                    to="/problems"
                    style={{
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}
                  >
                    <FaExclamationCircle className="me-2" />
                    All Problems
                  </Link>
                </li>
              )}
              
              {/* Show Domain Status for Admin/Team Leader */}
              {isAdminOrLeader && (
                <li className="nav-item">
                  <Link 
                    className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                    to="/domain-status"
                    style={{
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}
                  >
                    <FaGlobe className="me-2" />
                    Domain Status
                  </Link>
                </li>
              )}
              
              {/* Show Admin Panel only for Admin */}
              {user?.role === 'admin' && (
                <li className="nav-item">
                  <Link 
                    className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                    to="/admin"
                    style={{
                      fontWeight: '500',
                      fontSize: '0.95rem'
                    }}
                  >
                    <FaUsersCog className="me-2" />
                    User Management
                  </Link>
                </li>
              )}
            </ul>
            
            {/* Right Side Items */}
            <ul className="navbar-nav align-items-lg-center">
              {/* Notification Bell - Enhanced */}
              <li className="nav-item dropdown me-2">
                <button
                  className="nav-link position-relative d-flex align-items-center justify-content-center rounded-circle border-0"
                  id="notificationDropdown"
                  type="button"
                  data-bs-toggle="dropdown"
                  onClick={loadNotifications}
                  style={{ 
                    width: '45px',
                    height: '45px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid transparent',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                >
                  <FaBell style={{ fontSize: '1.1rem' }} />
                  {unreadCount > 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-danger"
                      style={{ 
                        top: '0',
                        right: '0',
                        fontSize: '0.65rem',
                        padding: '0.3em 0.5em',
                        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.5)'
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {/* Notification Dropdown - Enhanced */}
                <ul 
                  className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" 
                  style={{ 
                    width: '380px', 
                    maxHeight: '500px', 
                    overflowY: 'auto',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  {/* Header */}
                  <li className="dropdown-header d-flex justify-content-between align-items-center py-2 px-3" 
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '12px 12px 0 0',
                        color: '#fff'
                      }}>
                    <div>
                      <strong style={{ fontSize: '1rem', fontFamily: 'Poppins, sans-serif' }}>
                        <FaBell className="me-2" style={{ fontSize: '0.9rem' }} />
                        Notifications
                      </strong>
                      {unreadCount > 0 && (
                        <span className="badge bg-light text-dark ms-2" style={{ fontSize: '0.7rem' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="d-flex gap-1">
                        {unreadCount > 0 && (
                          <button 
                            className="btn btn-sm btn-light text-primary"
                            onClick={markAllAsRead}
                            style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '15px' }}
                          >
                            <FaCheck style={{ fontSize: '0.7rem' }} className="me-1" />
                            Mark all
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-light text-danger"
                          onClick={clearNotifications}
                          style={{ fontSize: '0.7rem', padding: '0.2rem 0.6rem', borderRadius: '15px' }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </li>
                  
                  {loadingNotifications ? (
                    <li className="dropdown-item text-center py-4">
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                      <span className="ms-2">Loading notifications...</span>
                    </li>
                  ) : notifications.length === 0 ? (
                    <li className="dropdown-item text-center py-5">
                      <div style={{ fontSize: '3rem', opacity: '0.3', marginBottom: '0.5rem' }}>🔕</div>
                      <p className="text-muted mb-0" style={{ fontWeight: '500', fontSize: '0.9rem' }}>No notifications yet</p>
                      <small className="text-muted" style={{ fontSize: '0.8rem' }}>You're all caught up!</small>
                    </li>
                  ) : (
                    notifications.slice(0, 10).map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <li>
                          <div className="position-relative">
                            <button
                              className={`dropdown-item ${!notification.read ? 'bg-light' : ''} position-relative`}
                              onClick={() => handleNotificationClick(notification)}
                              style={{ 
                                padding: '0.75rem 1rem', 
                                borderLeft: !notification.read ? '3px solid #667eea' : '3px solid transparent',
                                background: !notification.read ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%)' : 'transparent',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                paddingRight: '2.5rem'
                              }}
                            >
                              <div className="d-flex align-items-start">
                                <div className="d-flex align-items-center justify-content-center flex-shrink-0" 
                                     style={{ 
                                       fontSize: '1.2rem', 
                                       marginRight: '10px', 
                                       minWidth: '32px', 
                                       height: '32px', 
                                       background: 'rgba(102, 126, 234, 0.1)', 
                                       borderRadius: '8px' 
                                     }}>
                                  {getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <strong className="d-block text-truncate" style={{ 
                                      fontSize: '0.85rem', 
                                      lineHeight: '1.3',
                                      fontFamily: 'Poppins, sans-serif',
                                      color: '#1a202c', 
                                      maxWidth: '85%' 
                                    }}>
                                      {notification.title}
                                    </strong>
                                    {!notification.read && (
                                      <span className="badge rounded-circle flex-shrink-0" 
                                            style={{ 
                                              width: '8px', 
                                              height: '8px', 
                                              padding: '0', 
                                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                              boxShadow: '0 0 8px rgba(102, 126, 234, 0.5)'
                                            }} 
                                            title="Unread" />
                                    )}
                                  </div>
                                  <small className="d-block text-muted mb-1" style={{ 
                                    fontSize: '0.8rem', 
                                    lineHeight: '1.4',
                                    color: '#4a5568',
                                    display: '-webkit-box',
                                    WebkitLineClamp: '2',
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden'
                                  }}>
                                    {notification.message}
                                  </small>
                                  <div className="d-flex justify-content-between align-items-center">
                                    <small className="text-muted d-flex align-items-center" style={{ 
                                      fontSize: '0.7rem', 
                                      color: '#718096' 
                                    }}>
                                      <span className="me-1" style={{ fontSize: '0.8rem' }}>🕐</span>
                                      {getTimeAgo(notification.created_at)}
                                    </small>
                                    <span className={getNotificationBadge(notification.type)} 
                                          style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                                      {getNotificationTypeDisplay(notification.type)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </button>
                            <button 
                              className="position-absolute top-0 end-0 mt-2 me-2 btn btn-sm btn-light"
                              onClick={(e) => deleteNotification(notification.id, e)}
                              style={{ 
                                fontSize: '0.7rem', 
                                padding: '0.2rem 0.4rem', 
                                lineHeight: '1', 
                                opacity: '0.6',
                                zIndex: '1',
                                border: 'none',
                                background: 'transparent',
                                color: '#6c757d'
                              }}
                              title="Delete notification"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </li>
                        {index < Math.min(notifications.length, 10) - 1 && (
                          <li><hr className="dropdown-divider my-0" style={{ opacity: '0.08' }} /></li>
                        )}
                      </React.Fragment>
                    ))
                  )}
                  
                  {notifications.length > 10 && (
                    <li>
                      <div className="dropdown-item text-center py-2" style={{ background: '#f8f9fa', borderRadius: '0 0 12px 12px' }}>
                        <small className="text-muted" style={{ fontWeight: '500', fontSize: '0.75rem' }}>
                          Showing latest 10 of {notifications.length} notifications
                        </small>
                      </div>
                    </li>
                  )}
                </ul>
              </li>

              {/* User Profile Dropdown - Enhanced */}
              <li className="nav-item dropdown">
                <button
                  className="nav-link d-flex align-items-center px-3 py-2 rounded-3 border-0"
                  id="userDropdown"
                  type="button"
                  data-bs-toggle="dropdown"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid transparent',
                    fontWeight: '500',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.25)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.15)'}
                >
                  <div 
                    className="d-flex align-items-center justify-content-center rounded-circle me-2"
                    style={{
                      width: '35px',
                      height: '35px',
                      background: 'rgba(255,255,255,0.3)',
                      fontWeight: '700',
                      fontSize: '0.9rem'
                    }}
                  >
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="d-none d-lg-block">
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                      {user?.name || 'User'}
                    </div>
                    <div style={{ fontSize: '0.75rem', opacity: '0.9' }}>
                      {getRoleDisplay()}
                    </div>
                  </div>
                </button>

                <ul className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" 
                    style={{ 
                      minWidth: '280px',
                      borderRadius: '15px',
                      overflow: 'hidden'
                    }}>
                  {/* User Info Header */}
                  <li style={{ 
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    padding: '1.5rem',
                    color: '#fff'
                  }}>
                    <div className="d-flex align-items-center mb-2">
                      <div 
                        className="d-flex align-items-center justify-content-center rounded-circle me-3"
                        style={{
                          width: '50px',
                          height: '50px',
                          background: 'rgba(255,255,255,0.3)',
                          fontSize: '1.5rem',
                          fontWeight: '700'
                        }}
                      >
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div>
                        <strong style={{ 
                          fontSize: '1.1rem',
                          fontFamily: 'Poppins, sans-serif',
                          display: 'block',
                          marginBottom: '0.25rem'
                        }}>
                          {user?.name || 'User'}
                        </strong>
                        <span 
                          className={`badge ${getRoleBadgeClass()}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {getRoleDisplay()}
                        </span>
                      </div>
                    </div>
                    <small style={{ 
                      opacity: '0.9',
                      fontSize: '0.85rem',
                      display: 'block'
                    }}>
                      📧 {user?.email || 'No email'}
                    </small>
                  </li>

                  <li><hr className="dropdown-divider m-0" /></li>

                  {/* Logout Button */}
                  <li className="p-2">
                    <button 
                      className="dropdown-item d-flex align-items-center justify-content-center text-danger rounded-3 py-2"
                      onClick={handleLogout}
                      style={{
                        fontWeight: '600',
                        fontSize: '0.95rem',
                        backgroundColor: 'transparent',
                        border: 'none',
                        width: '100%',
                        textAlign: 'left'
                      }}
                    >
                      <FaSignOutAlt className="me-2" />
                      Logout
                    </button>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </div>
      </nav>

      {/* Add Custom Styles */}
      <style>
        {`
          /* Smooth scrollbar for notifications */
          .dropdown-menu::-webkit-scrollbar {
            width: 5px;
          }

          .dropdown-menu::-webkit-scrollbar-track {
            background: transparent;
          }

          .dropdown-menu::-webkit-scrollbar-thumb {
            background: rgba(102, 126, 234, 0.3);
            border-radius: 10px;
          }

          .dropdown-menu::-webkit-scrollbar-thumb:hover {
            background: rgba(102, 126, 234, 0.5);
          }

          /* Dropdown animation */
          .dropdown-menu {
            animation: dropdownFadeIn 0.3s ease-out;
          }

          @keyframes dropdownFadeIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          /* Mobile responsive */
          @media (max-width: 991px) {
            .navbar-collapse {
              background: rgba(102, 126, 234, 0.95);
              backdrop-filter: blur(20px);
              padding: 1rem;
              border-radius: 15px;
              margin-top: 1rem;
            }

            .nav-item {
              margin: 0.25rem 0;
            }
          }
        `}
      </style>
    </>
  );
}