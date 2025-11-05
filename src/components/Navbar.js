import React from 'react';
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
  FaExclamationCircle
} from 'react-icons/fa';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.problemId) {
      navigate(`/problem/${notification.problemId}`);
    }
  };

  const getNotificationIcon = (type) => {
    const icons = {
      new_problem: '🆕',
      assignment: '📌',
      status_change: '🔄',
      transfer: '⇄',
      completion: '✅'
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
            <span className="d-none d-md-inline">Problem Management</span>
            <span className="d-inline d-md-none">PMS</span>
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
                    transition: 'all 0.3s ease',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaHome className="me-2" />
                  {isAdminOrLeader ? 'Dashboard' : 'My Dashboard'}
                </Link>
              </li>
              
              <li className="nav-item">
                <Link 
                  className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                  to="/problem/create"
                  style={{
                    transition: 'all 0.3s ease',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaPlusCircle className="me-2" />
                  Create Problem
                </Link>
              </li>

              <li className="nav-item">
                <Link 
                  className="nav-link d-flex align-items-center px-3 py-2 rounded-3 mx-1" 
                  to="/problems"
                  style={{
                    transition: 'all 0.3s ease',
                    fontWeight: '500',
                    fontSize: '0.95rem'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <FaExclamationCircle className="me-2" />
                  All Problems
                </Link>
              </li>
            </ul>
            
            {/* Right Side Items */}
            <ul className="navbar-nav align-items-lg-center">
              {/* Notification Bell - Enhanced */}
              <li className="nav-item dropdown me-2">
                <a
                  className="nav-link position-relative d-flex align-items-center justify-content-center rounded-circle"
                  href="#"
                  id="notificationDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={{ 
                    width: '45px',
                    height: '45px',
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.transform = 'scale(1.1)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
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
                        boxShadow: '0 2px 8px rgba(220, 53, 69, 0.5)',
                        animation: 'pulse 2s infinite'
                      }}
                    >
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </a>

                {/* Notification Dropdown - Enhanced */}
                <ul 
                  className="dropdown-menu dropdown-menu-end shadow-lg border-0 mt-2" 
                  style={{ 
                    width: '420px', 
                    maxHeight: '550px', 
                    overflowY: 'auto',
                    borderRadius: '15px',
                    background: 'rgba(255,255,255,0.98)',
                    backdropFilter: 'blur(20px)'
                  }}
                >
                  {/* Header */}
                  <li className="dropdown-header d-flex justify-content-between align-items-center py-3 px-4" 
                      style={{ 
                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                        borderRadius: '15px 15px 0 0',
                        color: '#fff'
                      }}>
                    <div>
                      <strong style={{ fontSize: '1.1rem', fontFamily: 'Poppins, sans-serif' }}>
                        <FaBell className="me-2" />
                        Notifications
                      </strong>
                      {unreadCount > 0 && (
                        <span className="badge bg-light text-dark ms-2" style={{ fontSize: '0.75rem' }}>
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {notifications.length > 0 && (
                      <div className="d-flex gap-2">
                        {unreadCount > 0 && (
                          <button 
                            className="btn btn-sm btn-light text-primary"
                            onClick={markAllAsRead}
                            style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '20px' }}
                          >
                            <FaCheckCircle className="me-1" />
                            Mark all read
                          </button>
                        )}
                        <button 
                          className="btn btn-sm btn-light text-danger"
                          onClick={clearNotifications}
                          style={{ fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '20px' }}
                        >
                          Clear
                        </button>
                      </div>
                    )}
                  </li>
                  
                  {notifications.length === 0 ? (
                    <li className="dropdown-item text-center py-5">
                      <div style={{ fontSize: '4rem', opacity: '0.3', marginBottom: '1rem' }}>🔕</div>
                      <p className="text-muted mb-0" style={{ fontWeight: '500' }}>No notifications yet</p>
                      <small className="text-muted">You're all caught up!</small>
                    </li>
                  ) : (
                    sortedNotifications.slice(0, 10).map((notification, index) => (
                      <React.Fragment key={notification.id}>
                        <li>
                          <button
                            className={`dropdown-item ${!notification.read ? 'bg-light' : ''} position-relative`}
                            onClick={() => handleNotificationClick(notification)}
                            style={{ 
                              padding: '1rem 1.25rem',
                              borderLeft: !notification.read ? '4px solid #667eea' : '4px solid transparent',
                              transition: 'all 0.2s',
                              background: !notification.read ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%)' : 'transparent'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.background = 'rgba(102, 126, 234, 0.08)';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.background = !notification.read 
                                ? 'linear-gradient(90deg, rgba(102, 126, 234, 0.05) 0%, transparent 100%)' 
                                : 'transparent';
                            }}
                          >
                            <div className="d-flex align-items-start">
                              <div 
                                className="d-flex align-items-center justify-content-center"
                                style={{ 
                                  fontSize: '2rem', 
                                  marginRight: '15px',
                                  minWidth: '50px',
                                  height: '50px',
                                  background: 'rgba(102, 126, 234, 0.1)',
                                  borderRadius: '12px'
                                }}
                              >
                                {notification.icon || getNotificationIcon(notification.type)}
                              </div>
                              <div className="flex-grow-1">
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <strong 
                                    className="d-block" 
                                    style={{ 
                                      fontSize: '0.95rem', 
                                      lineHeight: '1.4',
                                      fontFamily: 'Poppins, sans-serif',
                                      color: '#1a202c'
                                    }}
                                  >
                                    {notification.title}
                                  </strong>
                                  {!notification.read && (
                                    <span 
                                      className="badge rounded-circle ms-2" 
                                      style={{ 
                                        width: '10px', 
                                        height: '10px', 
                                        padding: '0',
                                        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        boxShadow: '0 0 10px rgba(102, 126, 234, 0.5)'
                                      }}
                                      title="Unread"
                                    />
                                  )}
                                </div>
                                <small 
                                  className="d-block text-muted mb-2" 
                                  style={{ 
                                    fontSize: '0.85rem', 
                                    lineHeight: '1.5',
                                    color: '#4a5568'
                                  }}
                                >
                                  {notification.message}
                                </small>
                                <small 
                                  className="text-muted d-flex align-items-center" 
                                  style={{ fontSize: '0.75rem', color: '#718096' }}
                                >
                                  <span className="me-1">🕐</span>
                                  {getTimeAgo(notification.timestamp)}
                                </small>
                              </div>
                            </div>
                          </button>
                        </li>
                        {index < sortedNotifications.slice(0, 10).length - 1 && (
                          <li><hr className="dropdown-divider my-0" style={{ opacity: '0.1' }} /></li>
                        )}
                      </React.Fragment>
                    ))
                  )}
                  
                  {notifications.length > 10 && (
                    <li>
                      <div className="dropdown-item text-center py-3" style={{ background: '#f8f9fa', borderRadius: '0 0 15px 15px' }}>
                        <small className="text-muted" style={{ fontWeight: '500' }}>
                          Showing latest 10 of {notifications.length} notifications
                        </small>
                      </div>
                    </li>
                  )}
                </ul>
              </li>

              {/* User Profile Dropdown - Enhanced */}
              <li className="nav-item dropdown">
                <a
                  className="nav-link d-flex align-items-center px-3 py-2 rounded-3"
                  href="#"
                  id="userDropdown"
                  role="button"
                  data-bs-toggle="dropdown"
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(10px)',
                    transition: 'all 0.3s ease',
                    border: '2px solid transparent',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.borderColor = 'transparent';
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
                </a>

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
                        transition: 'all 0.2s',
                        fontSize: '0.95rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(220, 53, 69, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
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
          @keyframes pulse {
            0%, 100% {
              transform: scale(1);
              opacity: 1;
            }
            50% {
              transform: scale(1.1);
              opacity: 0.8;
            }
          }

          /* Smooth scrollbar for notifications */
          .dropdown-menu::-webkit-scrollbar {
            width: 6px;
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