import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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
  FaFileAlt
} from 'react-icons/fa';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { 
    notifications, 
    unreadCount, 
    assignedProblems,
    assignedUnreadCount,
    markAssignedAsRead,
    markAsRead, 
    markAllAsRead, 
    clearNotifications,
    clearAllNotifications,
    loadNotifications,
    removeNotification
  } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    clearAllNotifications(); // Clear all notifications on logout
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    // Mark as read immediately
    markAsRead(notification.id);
    
    // Close the dropdown
    const dropdownElement = document.querySelector('#notificationDropdown');
    if (dropdownElement) {
      const bsDropdown = window.bootstrap?.Dropdown?.getInstance(dropdownElement);
      if (bsDropdown) {
        bsDropdown.hide();
      }
    }
    
    // Navigate if needed
    if (notification.problemId) {
      navigate(`/problem/${notification.problemId}`);
    }
    
    // If notification has autoDismiss enabled, remove it after a short delay
    // to allow the user to see that it was marked as read
    if (notification.autoDismiss !== false) {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 2000); // 2 seconds delay before removal
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_problem: '🆕',
      assignment: '📌',
      status_change: '🔄',
      transfer: '⇄',
      completion: '✅',
      domain_status_change: '🌐',
      new_domain: '🌐',
      critical_domain: '🚨',
      manual_domain_check: '🔍',
      multiple_domains_down: '⚠️',
      low_uptime: '📉',
      discussion_comment: '💬',
      solution_comment: '✅',
      system_maintenance: '🔧',
      system_error: '❌',
      backup_completed: '💾'
    };
    return icons[type] || '🔔';
  };

  // Sort notifications - unread first
  const sortedNotifications = [...notifications].sort((a, b) => {
    if (a.read === b.read) {
      return new Date(b.timestamp) - new Date(a.timestamp);
    }
    return a.read ? 1 : -1;
  });

  // Check if admin or team leader
  const isAdminOrLeader = user?.role === 'admin' || user?.role === 'team_leader';

  // Check if regular user (not admin or team leader)
  const isRegularUser = !isAdminOrLeader;

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

  // Auto-dismiss notifications after a certain time
  useEffect(() => {
    const timers = [];
    
    notifications.forEach(notification => {
      // Only auto-dismiss if it hasn't been read yet and has autoDismiss enabled
      if (!notification.read && notification.autoDismiss !== false) {
        const timer = setTimeout(() => {
          // Check if the notification still exists before removing
          const currentNotifications = notifications;
          const notificationStillExists = currentNotifications.some(n => n.id === notification.id);
          
          if (notificationStillExists) {
            removeNotification(notification.id);
          }
        }, 15000); // 15 seconds to give users more time to see the notification
        timers.push(timer);
      }
    });
    
    // Cleanup function to clear all timers when component unmounts or notifications change
    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [notifications, removeNotification]);

  // Force refresh notifications when component mounts
  useEffect(() => {
    loadNotifications();
    
    // Set up interval to periodically refresh notifications
    const intervalId = setInterval(loadNotifications, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(intervalId);
  }, [loadNotifications]);

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
            to={isAdminOrLeader ? "/dashboard" : "/employee-dashboard"}
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
                  to={isAdminOrLeader ? "/dashboard" : "/employee-dashboard"}
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
                  onClick={() => { loadNotifications(); markAllAsRead(); markAssignedAsRead(); }} // Refresh and mark all as read on open
                  style={{ 
                    width: '45px',
                    height: '45px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    border: '2px solid transparent'
                  }}
                >
                  <FaBell style={{ fontSize: '1.1rem' }} />
                  {(unreadCount + (assignedUnreadCount || 0)) > 0 && (
                    <span 
                      className="position-absolute badge rounded-pill bg-danger"
                      style={{ 
                        top: '0',
                        right: '0',
                        fontSize: '0.65rem',
                        padding: '0.3em 0.5em',
                        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.5)'
                      }}
                      key={`badge-${unreadCount}-${assignedUnreadCount}`}
                    >
                      { (unreadCount + (assignedUnreadCount || 0)) > 9 ? '9+' : (unreadCount + (assignedUnreadCount || 0)) }
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
                            <FaCheckCircle style={{ fontSize: '0.7rem' }} className="me-1" />
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
                  
                  {assignedProblems && assignedProblems.length > 0 ? (
                    // Show assigned problems first
                    assignedProblems.slice(0, 10).map((p, idx) => (
                      <React.Fragment key={`assigned-${p.id}`}>
                        <li>
                          <div className="position-relative">
                            <button
                              className={`dropdown-item bg-light position-relative`}
                              onClick={() => { handleNotificationClick({ id: `assigned-${p.id}`, problemId: p.id }); }}
                              style={{ padding: '0.75rem 1rem', borderLeft: '3px solid #667eea', background: 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%)', border: 'none', width: '100%', textAlign: 'left', paddingRight: '2.5rem' }}
                            >
                              <div className="d-flex align-items-start">
                                <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ fontSize: '1.2rem', marginRight: '10px', minWidth: '32px', height: '32px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                                  📌
                                </div>
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <strong className="d-block text-truncate" style={{ fontSize: '0.85rem', lineHeight: '1.3', fontFamily: 'Poppins, sans-serif', color: '#1a202c', maxWidth: '85%' }}>
                                      {`Assigned: ${p.statement}`}
                                    </strong>
                                  </div>
                                  <small className="d-block text-muted mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#4a5568' }}>{`${p.priority || ''} — ${p.department || ''}`}</small>
                                  <small className="text-muted d-flex align-items-center" style={{ fontSize: '0.7rem', color: '#718096' }}><span className="me-1" style={{ fontSize: '0.8rem' }}>🕐</span>{getTimeAgo(p.updated_at || p.created_at)}</small>
                                </div>
                              </div>
                            </button>
                          </div>
                        </li>
                        {idx < Math.min(assignedProblems.length, 10) - 1 && (<li><hr className="dropdown-divider my-0" style={{ opacity: '0.08' }} /></li>)}
                      </React.Fragment>
                    ))
                  ) : notifications.length === 0 ? (
                    <li className="dropdown-item text-center py-5">
                      <div style={{ fontSize: '3rem', opacity: '0.3', marginBottom: '0.5rem' }}>🔕</div>
                      <p className="text-muted mb-0" style={{ fontWeight: '500', fontSize: '0.9rem' }}>No notifications yet</p>
                      <small className="text-muted" style={{ fontSize: '0.8rem' }}>You're all caught up!</small>
                    </li>
                  ) : (
                    sortedNotifications.slice(0, 10).map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <li>
                          <div className="position-relative">
                            <button
                              className={`dropdown-item ${!notification.read ? 'bg-light' : ''} position-relative`}
                              onClick={() => handleNotificationClick(notification)}
                              style={{ padding: '0.75rem 1rem', borderLeft: !notification.read ? '3px solid #667eea' : '3px solid transparent', background: !notification.read ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%)' : 'transparent', border: 'none', width: '100%', textAlign: 'left', paddingRight: '2.5rem' }}
                            >
                              <div className="d-flex align-items-start">
                                <div className="d-flex align-items-center justify-content-center flex-shrink-0" style={{ fontSize: '1.2rem', marginRight: '10px', minWidth: '32px', height: '32px', background: 'rgba(102, 126, 234, 0.1)', borderRadius: '8px' }}>
                                  {notification.icon || getNotificationIcon(notification.type)}
                                </div>
                                <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                  <div className="d-flex justify-content-between align-items-start mb-1">
                                    <strong className="d-block text-truncate" style={{ fontSize: '0.85rem', lineHeight: '1.3', fontFamily: 'Poppins, sans-serif', color: '#1a202c', maxWidth: '85%' }}>
                                      {notification.title}
                                    </strong>
                                    {!notification.read && (
                                      <span className="badge rounded-circle flex-shrink-0" style={{ width: '8px', height: '8px', padding: '0', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', boxShadow: '0 0 8px rgba(102, 126, 234, 0.5)' }} title="Unread" />
                                    )}
                                  </div>
                                  <small className="d-block text-muted mb-1" style={{ fontSize: '0.8rem', lineHeight: '1.4', color: '#4a5568', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{notification.message}</small>
                                  <small className="text-muted d-flex align-items-center" style={{ fontSize: '0.7rem', color: '#718096' }}><span className="me-1" style={{ fontSize: '0.8rem' }}>🕐</span>{getTimeAgo(notification.timestamp)}</small>
                                </div>
                              </div>
                            </button>
                            <button className="position-absolute top-0 end-0 mt-2 me-2 btn btn-sm btn-light" onClick={(e) => { e.stopPropagation(); removeNotification(notification.id); }} style={{ fontSize: '0.7rem', padding: '0.2rem 0.4rem', lineHeight: '1', opacity: '0.6', zIndex: '1', border: 'none', background: 'transparent', color: '#6c757d' }} title="Dismiss notification">×</button>
                          </div>
                        </li>
                        {index < sortedNotifications.slice(0, 10).length - 1 && (<li><hr className="dropdown-divider my-0" style={{ opacity: '0.08' }} /></li>)}
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
                    fontWeight: '500'
                  }}
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
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div className="d-none d-lg-block">
                    <div style={{ fontSize: '0.9rem', lineHeight: '1.2' }}>
                      {user?.name}
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
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <strong style={{ 
                          fontSize: '1.1rem',
                          fontFamily: 'Poppins, sans-serif',
                          display: 'block',
                          marginBottom: '0.25rem'
                        }}>
                          {user?.name}
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
                      📧 {user?.email}
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
              backdropFilter: blur(20px);
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

// Helper function to show time ago
function getTimeAgo(timestamp) {
  const now = new Date();
  const time = new Date(timestamp);
  const diffInSeconds = Math.floor((now - time) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  } else {
    return time.toLocaleDateString();
  }
}

