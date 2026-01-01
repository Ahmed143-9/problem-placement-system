// src/pages/EmployeeDashboard.js - UPDATED WITH NOTIFICATION SUPPORT

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner, FaBell, FaExclamationTriangle, FaCheck } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [assignedProblems, setAssignedProblems] = useState([]);
  const [myCreatedProblems, setMyCreatedProblems] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingCreated, setLoadingCreated] = useState(false);
  
  // Notification state for dashboard
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  /* ==============================
     Fetch problems assigned to me
     ============================== */
  const loadAssignedProblems = async () => {
    if (!user?.id) return;

    setLoadingAssigned(true);
    try {
      const res = await fetch(
        'https://ticketapi.wineds.com/api/problems/assigned-by-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      const data = await res.json();

      if (data.status === 'success') {
        const assigned = data.data || [];
        setAssignedProblems(assigned);
        
        // Check if there are newly assigned problems and show notification
        checkForNewAssignments(assigned);
        
      } else {
        toast.error(data.messages?.[0] || 'Failed to load assigned problems');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assigned problems');
    } finally {
      setLoadingAssigned(false);
    }
  };

  /* ==============================
     Fetch problems created by me
     ============================== */
  const loadMyCreatedProblems = async () => {
    if (!user?.id) return;

    setLoadingCreated(true);
    try {
      const res = await fetch(
        'https://ticketapi.wineds.com/api/problems/getAll',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );

      const data = await res.json();

      if (data.status === 'success') {
        const mine = data.data.filter((p) => p.created_by.id === user.id);
        setMyCreatedProblems(mine);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCreated(false);
    }
  };

  /* ==============================
     Load notifications from localStorage
     ============================== */
  const loadNotifications = () => {
    try {
      if (!user?.id) return;
      
      // Get all notifications from localStorage
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      
      // Get notifications for current user
      const userNotifications = allNotifications[user.id] || [];
      
      // Sort by date (newest first)
      const sortedNotifications = userNotifications.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      
      setNotifications(sortedNotifications);
      
      // Calculate unread count
      const unread = sortedNotifications.filter(n => !n.read).length;
      setUnreadCount(unread);
      
      console.log(`🔔 Dashboard: Loaded ${sortedNotifications.length} notifications (${unread} unread)`);
      
    } catch (error) {
      console.error('Error loading notifications in dashboard:', error);
    }
  };

  /* ==============================
     Mark notification as read
     ============================== */
  const markAsRead = (notificationId) => {
    try {
      if (!user?.id) return;
      
      // Get all notifications
      const allNotifications = JSON.parse(localStorage.getItem('system_notifications') || '{}');
      const userNotifications = allNotifications[user.id] || [];
      
      // Find and mark as read
      const updatedNotifications = userNotifications.map(notification => {
        if (notification.id === notificationId) {
          return { ...notification, read: true };
        }
        return notification;
      });
      
      // Update localStorage
      allNotifications[user.id] = updatedNotifications;
      localStorage.setItem('system_notifications', JSON.stringify(allNotifications));
      
      // Update state
      setNotifications(updatedNotifications);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      console.log(`✅ Dashboard: Marked notification ${notificationId} as read`);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  /* ==============================
     Check for newly assigned problems
     ============================== */
  const checkForNewAssignments = (currentAssignedProblems) => {
    try {
      if (!user?.id) return;
      
      // Get last check time from localStorage
      const lastCheckTime = localStorage.getItem(`last_assignment_check_${user.id}`);
      const now = new Date().toISOString();
      
      // If this is first check, just store time and return
      if (!lastCheckTime) {
        localStorage.setItem(`last_assignment_check_${user.id}`, now);
        return;
      }
      
      // Check if any problem was assigned after last check
      const newAssignments = currentAssignedProblems.filter(problem => {
        const assignedTime = problem.assigned_at || problem.created_at;
        return new Date(assignedTime) > new Date(lastCheckTime);
      });
      
      // If there are new assignments, show notification
      if (newAssignments.length > 0) {
        toast.info(`📌 You have ${newAssignments.length} newly assigned problem(s)`, {
          autoClose: 5000,
          position: "top-right"
        });
      }
      
      // Update last check time
      localStorage.setItem(`last_assignment_check_${user.id}`, now);
      
    } catch (error) {
      console.error('Error checking new assignments:', error);
    }
  };

  /* ==============================
     Get notification icon
     ============================== */
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'assignment': return '📌';
      case 'new_problem': return '🆕';
      case 'status_change': return '🔄';
      case 'transfer': return '⇄';
      case 'priority_change': return '⚠️';
      default: return '🔔';
    }
  };

  /* ==============================
     Format time ago
     ============================== */
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

  /* ==============================
     Load on mount
     ============================== */
  useEffect(() => {
    loadAssignedProblems();
    loadMyCreatedProblems();
    loadNotifications();
    
    // Set up interval to refresh data
    const intervalId = setInterval(() => {
      loadAssignedProblems();
      loadNotifications();
    }, 30000); // Refresh every 30 seconds
    
    // Listen for storage changes (when new notifications are added)
    const handleStorageChange = (event) => {
      if (event.key === 'system_notifications') {
        loadNotifications();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Also listen for custom events
    window.addEventListener('notification_created', loadNotifications);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('notification_created', loadNotifications);
    };
  }, [user?.id]);

  return (
    <div style={{ backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Navbar />

      <div className="container mt-4">
        {/* Header with Notifications */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h3 className="mb-1">Welcome, {user?.name}</h3>
            <p className="text-muted mb-0">Employee Dashboard</p>
          </div>
          
          {/* Notification Bell for Dashboard */}
          <div className="position-relative">
            <button
              className="btn btn-outline-primary position-relative"
              onClick={() => setShowNotifications(!showNotifications)}
            >
              <FaBell />
              {unreadCount > 0 && (
                <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                  {unreadCount > 9 ? '9+' : unreadCount}
                  <span className="visually-hidden">unread notifications</span>
                </span>
              )}
            </button>
            
            {/* Notifications Dropdown */}
            {showNotifications && notifications.length > 0 && (
              <div className="position-absolute end-0 mt-2 shadow-lg rounded border bg-white"
                   style={{ width: '350px', maxHeight: '400px', overflowY: 'auto', zIndex: 1000 }}>
                <div className="p-3 border-bottom bg-primary text-white">
                  <div className="d-flex justify-content-between align-items-center">
                    <h6 className="mb-0"><FaBell className="me-2" /> Notifications</h6>
                    <small>{unreadCount} unread</small>
                  </div>
                </div>
                
                <div className="p-0">
                  {notifications.slice(0, 5).map((notification, index) => (
                    <div key={notification.id} 
                         className={`p-3 border-bottom ${!notification.read ? 'bg-light' : ''}`}
                         style={{ cursor: 'pointer' }}
                         onClick={() => {
                           markAsRead(notification.id);
                           if (notification.problem_id) {
                             window.location.href = `/problem/${notification.problem_id}`;
                           }
                         }}>
                      <div className="d-flex">
                        <div className="me-3" style={{ fontSize: '1.2rem' }}>
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between">
                            <strong className="text-truncate" style={{ maxWidth: '200px' }}>
                              {notification.title}
                            </strong>
                            {!notification.read && (
                              <span className="badge bg-primary rounded-circle" style={{ width: '8px', height: '8px' }}></span>
                            )}
                          </div>
                          <small className="text-muted d-block">{notification.message}</small>
                          <small className="text-muted">{getTimeAgo(notification.created_at)}</small>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {notifications.length > 5 && (
                    <div className="p-3 text-center border-top">
                      <small className="text-muted">
                        Showing 5 of {notifications.length} notifications
                      </small>
                    </div>
                  )}
                  
                  {notifications.length === 0 && (
                    <div className="p-4 text-center">
                      <div className="mb-2" style={{ fontSize: '2rem', opacity: '0.3' }}>🔕</div>
                      <p className="text-muted mb-0">No notifications</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body text-center">
                <div className="d-flex justify-content-center align-items-center mb-2">
                  <div className="rounded-circle bg-primary d-flex align-items-center justify-content-center"
                       style={{ width: '50px', height: '50px' }}>
                    <FaClipboardList size={24} color="white" />
                  </div>
                </div>
                <h4 className="mt-2 text-primary">{myCreatedProblems.length}</h4>
                <p className="mb-0 fw-semibold">My Created Problems</p>
                <small className="text-muted">Total problems created by you</small>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body text-center">
                <div className="d-flex justify-content-center align-items-center mb-2">
                  <div className="rounded-circle bg-warning d-flex align-items-center justify-content-center"
                       style={{ width: '50px', height: '50px' }}>
                    <FaTasks size={24} color="white" />
                  </div>
                </div>
                <h4 className="mt-2 text-warning">{assignedProblems.length}</h4>
                <p className="mb-0 fw-semibold">Assigned To Me</p>
                <small className="text-muted">Problems assigned to you</small>
              </div>
            </div>
          </div>

          <div className="col-md-4 mb-3">
            <div className="card shadow-sm h-100 border-0">
              <div className="card-body text-center">
                <div className="d-flex justify-content-center align-items-center mb-2">
                  <div className="rounded-circle bg-success d-flex align-items-center justify-content-center"
                       style={{ width: '50px', height: '50px' }}>
                    <FaCheckCircle size={24} color="white" />
                  </div>
                </div>
                <h4 className="mt-2 text-success">
                  {assignedProblems.filter(p => p.status === 'resolved' || p.status === 'done').length}
                </h4>
                <p className="mb-0 fw-semibold">Resolved</p>
                <small className="text-muted">Problems you have resolved</small>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Alert if there are unread notifications */}
        {unreadCount > 0 && (
          <div className="alert alert-info alert-dismissible fade show mb-4" role="alert">
            <div className="d-flex align-items-center">
              <FaBell className="me-2" />
              <div className="flex-grow-1">
                You have <strong>{unreadCount} unread notification(s)</strong>
                {notifications[0] && (
                  <div className="small mt-1">
                    Latest: "{notifications[0].message}"
                  </div>
                )}
              </div>
              <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
          </div>
        )}

        {/* ===================== CONTENT ===================== */}
        <div className="row">
          {/* -------- CREATED BY ME -------- */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow border-0 h-100">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaClipboardList className="me-2" />
                  My Created Problems
                </h5>
                <span className="badge bg-light text-primary">{myCreatedProblems.length}</span>
              </div>
              <div className="card-body p-0">
                {loadingCreated ? (
                  <div className="text-center py-5">
                    <FaSpinner className="fa-spin fs-4 text-primary mb-3" />
                    <p className="text-muted">Loading your problems...</p>
                  </div>
                ) : myCreatedProblems.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3" style={{ fontSize: '3rem', opacity: '0.2' }}>
                      <FaClipboardList />
                    </div>
                    <h5 className="text-muted">No problems created yet</h5>
                    <p className="text-muted mb-4">Create your first problem to get started</p>
                    <Link to="/problem/create" className="btn btn-primary">
                      <FaTasks className="me-2" />
                      Create First Problem
                    </Link>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myCreatedProblems.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td>
                              <span className="badge bg-secondary">#{p.id}</span>
                            </td>
                            <td>{p.department}</td>
                            <td>
                              <span className={`badge ${
                                p.priority === 'High'
                                  ? 'bg-danger'
                                  : p.priority === 'Medium'
                                  ? 'bg-warning'
                                  : 'bg-success'
                              }`}>
                                {p.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                p.status === 'pending' ? 'bg-warning' :
                                p.status === 'in_progress' ? 'bg-info' :
                                p.status === 'resolved' || p.status === 'done' ? 'bg-success' :
                                p.status === 'escalated' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {p.status === 'in_progress' ? 'In Progress' : 
                                 p.status === 'done' ? 'Resolved' : p.status}
                              </span>
                            </td>
                            <td>
                              <Link
                                to={`/problem/${p.id}`}
                                className="btn btn-sm btn-outline-primary"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {myCreatedProblems.length > 5 && (
                      <div className="p-3 border-top text-center">
                        <small className="text-muted">
                          Showing 5 of {myCreatedProblems.length} problems
                        </small>
                        <br />
                        <Link to="/my-issues" className="btn btn-sm btn-link">
                          View All My Problems
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* -------- ASSIGNED TO ME -------- */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow border-0 h-100">
              <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                <h5 className="mb-0">
                  <FaTasks className="me-2" />
                  Problems Assigned To Me
                </h5>
                <span className="badge bg-dark text-white">{assignedProblems.length}</span>
              </div>
              <div className="card-body p-0">
                {loadingAssigned ? (
                  <div className="text-center py-5">
                    <FaSpinner className="fa-spin fs-4 text-warning mb-3" />
                    <p className="text-muted">Loading assigned problems...</p>
                  </div>
                ) : assignedProblems.length === 0 ? (
                  <div className="text-center py-5">
                    <div className="mb-3" style={{ fontSize: '3rem', opacity: '0.2' }}>
                      <FaTasks />
                    </div>
                    <h5 className="text-muted">No work assigned</h5>
                    <p className="text-muted mb-4">You have no assigned problems at the moment</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedProblems.slice(0, 5).map((p) => (
                          <tr key={p.id}>
                            <td>
                              <span className="badge bg-secondary">#{p.id}</span>
                            </td>
                            <td>{p.department}</td>
                            <td>
                              <span className={`badge ${
                                p.priority === 'High'
                                  ? 'bg-danger'
                                  : p.priority === 'Medium'
                                  ? 'bg-warning'
                                  : 'bg-success'
                              }`}>
                                {p.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                p.status === 'pending' ? 'bg-warning' :
                                p.status === 'in_progress' ? 'bg-info' :
                                p.status === 'resolved' || p.status === 'done' ? 'bg-success' :
                                p.status === 'escalated' ? 'bg-danger' : 'bg-secondary'
                              }`}>
                                {p.status === 'in_progress' ? 'In Progress' : 
                                 p.status === 'done' ? 'Resolved' : p.status}
                              </span>
                            </td>
                            <td>
                              <Link
                                to={`/problem/${p.id}`}
                                className="btn btn-sm btn-outline-warning"
                              >
                                View Details
                              </Link>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {assignedProblems.length > 5 && (
                      <div className="p-3 border-top text-center">
                        <small className="text-muted">
                          Showing 5 of {assignedProblems.length} assigned problems
                        </small>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="row mt-4">
          <div className="col-12">
            <div className="card shadow border-0">
              <div className="card-body p-4">
                <div className="row align-items-center">
                  <div className="col-md-8">
                    <h5 className="mb-2">Need to report a new problem?</h5>
                    <p className="text-muted mb-0">
                      Create a new problem ticket to get support from your team.
                    </p>
                  </div>
                  <div className="col-md-4 text-end">
                    <Link to="/problem/create" className="btn btn-success btn-lg px-4">
                      <FaTasks className="me-2" />
                      Create New Problem
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Notification Instructions */}
        {notifications.length === 0 && (
          <div className="row mt-4">
            <div className="col-12">
              <div className="card border-info">
                <div className="card-header bg-info text-white">
                  <FaBell className="me-2" />
                  About Notifications
                </div>
                <div className="card-body">
                  <p className="mb-2">
                    You'll receive notifications here when:
                  </p>
                  <ul className="mb-0">
                    <li>A new problem is assigned to you</li>
                    <li>Someone comments on your problem</li>
                    <li>Problem status changes</li>
                    <li>You're mentioned in a discussion</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close notifications dropdown */}
      {showNotifications && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100"
          style={{ zIndex: 999 }}
          onClick={() => setShowNotifications(false)}
        ></div>
      )}

      <style>{`
        .card {
          transition: transform 0.2s ease-in-out;
        }
        .card:hover {
          transform: translateY(-2px);
        }
        .table tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05);
        }
        .notification-dropdown {
          max-height: 400px;
          overflow-y: auto;
          box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }
      `}</style>
    </div>
  );
}