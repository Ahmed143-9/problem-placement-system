import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'react-toastify';

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

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-primary">
      <div className="container-fluid">
        <Link className="navbar-brand fw-bold" to={isAdminOrLeader ? "/dashboard" : "/employee-dashboard"}>
          Problem Management System
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {/* Dashboard Link - Different for Admin/Leader vs Regular User */}
            <li className="nav-item">
              <Link 
                className="nav-link" 
                to={isAdminOrLeader ? "/dashboard" : "/employee-dashboard"}
              >
                {isAdminOrLeader ? 'Analytics Dashboard' : 'My Dashboard'}
              </Link>
            </li>
            
            <li className="nav-item">
              <Link className="nav-link" to="/problem/create">
                Create Problem
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/problems">
                All Problems
              </Link>
            </li>
            {/* <li className="nav-item">
              <Link className="nav-link" to="/reports">
                Reports
              </Link>
            </li> */}
            
            {/* Admin Panel - Only for Admin and Team Leader */}
            {/* {isAdminOrLeader && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  Admin Panel {user?.role === 'team_leader' && <small>(View)</small>}
                </Link>
              </li>
            )} */}
          </ul>
          
          <ul className="navbar-nav">
            {/* Notification Bell */}
            <li className="nav-item dropdown">
              <a
                className="nav-link position-relative d-flex align-items-center"
                href="#"
                id="notificationDropdown"
                role="button"
                data-bs-toggle="dropdown"
                style={{ fontSize: '1.4rem', padding: '0.5rem 1rem' }}
              >
                🔔
                {unreadCount > 0 && (
                  <span 
                    className="position-absolute badge rounded-pill bg-danger"
                    style={{ 
                      top: '2px', 
                      right: '6px',
                      fontSize: '0.65rem',
                      padding: '0.25em 0.5em'
                    }}
                  >
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </a>
              <ul 
                className="dropdown-menu dropdown-menu-end" 
                style={{ width: '380px', maxHeight: '500px', overflowY: 'auto' }}
              >
                <li className="dropdown-header d-flex justify-content-between align-items-center py-2 px-3" style={{ backgroundColor: '#f8f9fa' }}>
                  <strong style={{ fontSize: '1rem' }}>
                    Notifications {unreadCount > 0 && `(${unreadCount} new)`}
                  </strong>
                  {notifications.length > 0 && (
                    <div className="d-flex gap-2">
                      {unreadCount > 0 && (
                        <button 
                          className="btn btn-sm btn-link text-decoration-none p-0"
                          onClick={markAllAsRead}
                          style={{ fontSize: '0.8rem' }}
                        >
                          Mark all read
                        </button>
                      )}
                      <button 
                        className="btn btn-sm btn-link text-decoration-none text-danger p-0"
                        onClick={clearNotifications}
                        style={{ fontSize: '0.8rem' }}
                      >
                        Clear all
                      </button>
                    </div>
                  )}
                </li>
                <li><hr className="dropdown-divider m-0" /></li>
                
                {notifications.length === 0 ? (
                  <li className="dropdown-item text-center text-muted py-4">
                    <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🔕</div>
                    <div>No notifications</div>
                  </li>
                ) : (
                  sortedNotifications.slice(0, 10).map((notification, index) => (
                    <React.Fragment key={notification.id}>
                      <li>
                        <button
                          className={`dropdown-item ${!notification.read ? 'bg-light' : ''} position-relative`}
                          onClick={() => handleNotificationClick(notification)}
                          style={{ 
                            padding: '0.75rem 1rem',
                            borderLeft: !notification.read ? '3px solid #0d6efd' : '3px solid transparent',
                            transition: 'all 0.2s'
                          }}
                        >
                          <div className="d-flex align-items-start">
                            <span style={{ fontSize: '1.8rem', marginRight: '12px', lineHeight: '1' }}>
                              {notification.icon || getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-start mb-1">
                                <strong className="d-block" style={{ fontSize: '0.9rem', lineHeight: '1.3' }}>
                                  {notification.title}
                                </strong>
                                {!notification.read && (
                                  <span 
                                    className="badge bg-primary rounded-circle ms-2" 
                                    style={{ 
                                      width: '8px', 
                                      height: '8px', 
                                      padding: '0',
                                      fontSize: '0'
                                    }}
                                    title="Unread"
                                  >
                                    •
                                  </span>
                                )}
                              </div>
                              <small className="d-block text-muted mb-1" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                {notification.message}
                              </small>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {getTimeAgo(notification.timestamp)}
                              </small>
                            </div>
                          </div>
                        </button>
                      </li>
                      {index < sortedNotifications.slice(0, 10).length - 1 && (
                        <li><hr className="dropdown-divider m-0" /></li>
                      )}
                    </React.Fragment>
                  ))
                )}
                
                {notifications.length > 10 && (
                  <li>
                    <div className="dropdown-item text-center py-2" style={{ backgroundColor: '#f8f9fa' }}>
                      <small className="text-muted">Showing latest 10 of {notifications.length} notifications</small>
                    </div>
                  </li>
                )}
              </ul>
            </li>

            {/* User Dropdown */}
            <li className="nav-item dropdown">
              <a
                className="nav-link dropdown-toggle"
                href="#"
                id="userDropdown"
                role="button"
                data-bs-toggle="dropdown"
              >
                {user?.name} ({user?.role === 'team_leader' ? 'Team Leader' : user?.role})
              </a>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <span className="dropdown-item-text">
                    <strong>{user?.name}</strong>
                    <br />
                    <small>{user?.email}</small>
                    <br />
                    <small className="text-muted">
                      {user?.role === 'admin' ? 'Administrator' : 
                       user?.role === 'team_leader' ? 'Team Leader' : 'Employee'}
                    </small>
                    {user?.role === 'team_leader' && (
                      <>
                        {/* <br />
                        <small className="text-info">
                          ℹ️ Can assign & monitor only
                        </small> */}
                      </>
                    )}
                  </span>
                </li>
                <li><hr className="dropdown-divider" /></li>
                <li>
                  <button className="dropdown-item text-danger" onClick={handleLogout}>
                    Logout
                  </button>
                </li>
              </ul>
            </li>
          </ul>
        </div>
      </div>
    </nav>
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