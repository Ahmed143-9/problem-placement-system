import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner, FaExchangeAlt, FaBell, FaUserCheck } from 'react-icons/fa';
import { toast } from 'react-toastify';

const MOTIVATIONAL_QUOTES = [
  "Great work starts with great attitude! 💪",
  "Every problem is an opportunity to shine! ✨",
  "You're making a difference, one solution at a time! 🌟",
  "Excellence is not a skill, it's an attitude! 🎯",
  "Stay focused, stay positive, stay productive! 🚀",
  "Your dedication drives success! 💼",
  "Together we solve, together we grow! 🌱",
  "Quality service, quality work! ⭐",
  "Innovation starts with you! 💡",
  "Keep pushing boundaries! 🏆"
];

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [myCreatedProblems, setMyCreatedProblems] = useState([]);
  const [assignedProblems, setAssignedProblems] = useState([]);
  const [stats, setStats] = useState(null);
  const [randomQuote, setRandomQuote] = useState('');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [transferTo, setTransferTo] = useState('');
  const [teamMembers, setTeamMembers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  // 🔥 FIXED: Fetch problems with PROPER assignment logic
  const fetchUserProblems = useCallback(() => {
    try {
      console.log('🔄 Fetching problems for user:', user?.name);
      
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      console.log('📝 All problems from localStorage:', allProblems);

      // 🔥 CRITICAL FIX: Check both assignedTo (ID) and assignedToName (Name)
      const assignedToMe = allProblems.filter(p => {
        const isAssignedById = p.assignedTo === user?.id;
        const isAssignedByName = p.assignedToName === user?.name;
        const isAssignedByCreatedBy = p.createdBy === user?.name; // Self-created issues
        
        console.log(`Problem ${p.id}:`, {
          id: p.id,
          assignedTo: p.assignedTo,
          assignedToName: p.assignedToName,
          createdBy: p.createdBy,
          isAssignedById,
          isAssignedByName,
          isAssignedByCreatedBy
        });

        return isAssignedById || isAssignedByName || isAssignedByCreatedBy;
      });

      // Problems created by user (Self Issues)
      const createdByMe = allProblems.filter(p => p.createdBy === user?.name);
      
      // Problems assigned to user (for work) - exclude self-created
      const workAssignedToMe = assignedToMe.filter(p => p.createdBy !== user?.name);

      console.log('✅ Created by me:', createdByMe.length);
      console.log('✅ Work assigned to me:', workAssignedToMe.length);
      console.log('✅ All assigned to me:', assignedToMe.length);

      setMyCreatedProblems(createdByMe);
      setAssignedProblems(workAssignedToMe);
      
      const statsData = {
        my_problems: createdByMe.length,
        assigned_to_me: workAssignedToMe.length,
        in_progress: workAssignedToMe.filter(p => p.status === 'in_progress').length,
        completed: workAssignedToMe.filter(p => p.status === 'done').length,
        total_assigned: assignedToMe.length
      };
      
      setStats(statsData);

    } catch (error) {
      console.error('❌ Failed to fetch problems:', error);
    }
  }, [user?.name, user?.id]); // dependencies যোগ করুন

  // Load notifications
  const fetchNotifications = useCallback(() => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const userNotifications = allNotifications.filter(notification => 
        notification.userId === user?.id || notification.userName === user?.name
      );
      setNotifications(userNotifications.filter(n => !n.isRead));
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }, [user?.id, user?.name]);

  const fetchTeamMembers = useCallback(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      // Filter to only include active users (don't exclude current user for transfer)
      const members = storedUsers.filter(u => 
        u.email !== 'admin@example.com' && u.status === 'active'
      );
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  }, []);

  useEffect(() => {
    fetchUserProblems();
    fetchTeamMembers();
    fetchNotifications();
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
    
    // Refresh every 5 seconds to catch new assignments
    const interval = setInterval(() => {
      fetchUserProblems();
      fetchNotifications();
    }, 5000);

    return () => clearInterval(interval);
  }, [fetchUserProblems, fetchTeamMembers, fetchNotifications]);

  const handleTransferClick = (problem) => {
    setSelectedProblem(problem);
    setTransferTo('');
    setShowTransferModal(true);
  };

  const handleTransferSubmit = () => {
    if (!transferTo) {
      toast.error('Please select a team member to transfer to');
      return;
    }

    try {
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // Find the user being transferred to by ID
      const transferToUser = teamMembers.find(member => member.id === parseInt(transferTo));
      
      if (!transferToUser) {
        toast.error('Selected team member not found');
        return;
      }
      
      const updatedProblems = allProblems.map(p => {
        if (p.id === selectedProblem.id) {
          return {
            ...p,
            assignedTo: transferToUser.id,
            assignedToName: transferToUser.name,
            transferHistory: [
              ...(p.transferHistory || []),
              {
                from: user?.name,
                to: transferToUser.name,
                date: new Date().toISOString(),
                by: user?.name,
                type: 'transfer'
              }
            ],
            actionHistory: [
              ...(p.actionHistory || []),
              {
                action: 'Transferred',
                by: user?.name,
                timestamp: new Date().toISOString(),
                comment: `Transferred from ${user?.name} to ${transferToUser.name}`
              }
            ]
          };
        }
        return p;
      });

      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      
      // Send notification to the new assignee
      sendTransferNotification(selectedProblem, transferToUser.name);
      
      setShowTransferModal(false);
      setTransferTo('');
      setSelectedProblem(null);
      fetchUserProblems();
      toast.success(`Work transferred to ${transferToUser.name} successfully!`);
    } catch (error) {
      console.error('Failed to transfer work:', error);
      toast.error('Failed to transfer work. Please try again.');
    }
  };

  // Send transfer notification
  const sendTransferNotification = (problem, newAssigneeName) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      // Find user by name since that's what we're passing
      const newAssigneeUser = teamMembers.find(member => member.name === newAssigneeName);
      
      const notification = {
        id: Date.now(),
        userId: newAssigneeUser ? newAssigneeUser.id : null,
        userName: newAssigneeName,
        type: 'problem_transferred',
        title: '🔄 Work Transferred to You',
        message: `Problem #${problem.id} has been transferred to you by ${user?.name}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        problemId: problem.id,
        problem: problem,
        transferredBy: user?.name
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('🔔 Transfer notification sent to:', newAssigneeName);
    } catch (error) {
      console.error('Failed to send transfer notification:', error);
    }
  };

  // Mark notification as read
  const markNotificationAsRead = (notificationId) => {
    try {
      const allNotifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const updatedNotifications = allNotifications.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      );
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  // Debug function to check assignment issues
  const debugAssignment = () => {
    console.log('🔍 === ASSIGNMENT DEBUG ===');
    console.log('Current User:', user);
    
    const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
    console.log('All Problems:', allProblems);
    
    const firstFaceAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
    console.log('First Face Assignments:', firstFaceAssignments);
    
    const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
    console.log('System Users:', systemUsers);
    
    toast.info('Check console for debug information');
  };

  return (
    <div>
      <Navbar />
      
      <div className="container mt-4">
        {/* Header with Notifications */}
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="mb-1">Welcome, {user?.name}!</h2>
            <p className="text-muted mb-0">Here's your work overview</p>
          </div>
          
          {/* <div className="d-flex gap-2 align-items-center">
           
            {notifications.length > 0 && (
              <div className="position-relative">
                <button 
                  className="btn btn-outline-primary position-relative"
                  onClick={debugAssignment}
                  title="Debug Assignment Issues"
                >
                  <FaBell />
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {notifications.length}
                  </span>
                </button>
              </div>
            )}
            
           
            <button 
              className="btn btn-outline-warning btn-sm"
              onClick={debugAssignment}
              title="Debug Assignment Issues"
            >
              Debug
            </button>
          </div> */}
        </div>

        {/* Motivational Banner */}
        <div className="alert alert-info mb-4 text-center" style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          border: 'none',
          fontSize: '1.2rem',
          fontWeight: '500'
        }}>
          {randomQuote}
        </div>

        {/* Notifications List */}
        {/* {notifications.length > 0 && (
          <div className="card border-warning mb-4">
            <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
              <h6 className="mb-0">
                <FaBell className="me-2" />
                New Notifications ({notifications.length})
              </h6>
              <small>Click to mark as read</small>
            </div>
            <div className="card-body p-2">
              {notifications.slice(0, 3).map(notification => (
                <div 
                  key={notification.id}
                  className="p-2 border-bottom cursor-pointer"
                  onClick={() => markNotificationAsRead(notification.id)}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="d-flex align-items-center">
                    <div className="flex-grow-1">
                      <strong>{notification.title}</strong>
                      <p className="mb-0 small">{notification.message}</p>
                      <small className="text-muted">
                        {new Date(notification.createdAt).toLocaleString()}
                      </small>
                    </div>
                    {notification.type === 'problem_assigned' && (
                      <FaUserCheck className="text-success ms-2" />
                    )}
                  </div>
                </div>
              ))}
              {notifications.length > 3 && (
                <div className="text-center mt-2">
                  <small className="text-muted">
                    +{notifications.length - 3} more notifications
                  </small>
                </div>
              )}
            </div>
          </div>
        )} */}

        {/* Stats Cards */}
        {stats && (
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaClipboardList style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.my_problems}</h2>
                  <p className="mb-0">My Self Issues</p>
                  <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Problems I raised</small>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #f6c23e 0%, #dda20a 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaTasks style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.assigned_to_me}</h2>
                  <p className="mb-0">Assigned to Me</p>
                  <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Work assigned</small>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #36b9cc 0%, #258fa4 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaSpinner style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.in_progress}</h2>
                  <p className="mb-0">In Progress</p>
                  <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Currently working on</small>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm" style={{
                background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaCheckCircle style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }} />
                  <h2 className="mb-0">{stats.completed}</h2>
                  <p className="mb-0">Completed</p>
                  <small style={{ fontSize: '0.8rem', opacity: '0.9' }}>Work done</small>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="row">
          {/* My Self Issues - Left Side */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow h-100">
              <div className="card-header bg-primary text-white">
                <h4 className="mb-0">My Self Issues</h4>
                <small>Problems I have raised - Track who is solving them</small>
              </div>
              <div className="card-body">
                {myCreatedProblems.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
                    <h6>No problems raised yet!</h6>
                    <p className="text-muted small">Create a problem ticket to get started</p>
                    <Link to="/problem/create" className="btn btn-primary btn-sm mt-2">
                      Create Problem
                    </Link>
                  </div>
                ) : (
                  <>
                    <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                      <table className="table table-hover table-sm">
                        <thead className="sticky-top bg-light">
                          <tr>
                            <th>ID</th>
                            <th>Priority</th>
                            <th>Status</th>
                            <th>Assigned To</th>
                            <th>Action</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myCreatedProblems.slice(0, 10).reverse().map(problem => (
                            <tr key={problem.id}>
                              <td>
                                <code>#{problem.id}</code>
                              </td>
                              <td>
                                <span className={`badge ${
                                  problem.priority === 'High' ? 'bg-danger' :
                                  problem.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                                }`}>
                                  {problem.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  problem.status === 'pending' ? 'bg-warning' :
                                  problem.status === 'in_progress' ? 'bg-info' : 'bg-success'
                                }`}>
                                  {problem.status === 'pending_approval' ? 'Approval' : problem.status.toUpperCase().replace('_', ' ')}
                                </span>
                              </td>
                              <td>
                                {problem.assignedToName ? (
                                  <span className="badge bg-info">{problem.assignedToName}</span>
                                ) : (
                                  <span className="badge bg-secondary">Not Assigned</span>
                                )}
                              </td>
                              <td>
                                <Link to={`/problem/${problem.id}`} className="btn btn-sm btn-outline-primary">
                                  View
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {myCreatedProblems.length > 10 && (
                      <div className="text-center mt-3">
                        <span className="badge bg-primary">
                          Total: {myCreatedProblems.length} issues
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Assigned Problems - Right Side */}
          <div className="col-lg-6 mb-4">
            <div className="card shadow h-100">
              <div className="card-header bg-warning text-dark">
                <h4 className="mb-0">
                  Work Assigned to Me 
                  {/* {assignedProblems.length > 0 && (
                    <span className="badge bg-danger ms-2">{assignedProblems.length}</span>
                  )} */}
                </h4>
                <small>Problems I need to solve</small>
              </div>
              <div className="card-body">
                {assignedProblems.length === 0 ? (
                  <div className="text-center py-5">
                    <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
                    <h6>No work assigned right now!</h6>
                    <p className="text-muted small">Enjoy your time or help others!</p>
                  </div>
                ) : (
                  <div className="table-responsive" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                    <table className="table table-hover table-sm">
                      <thead className="sticky-top bg-light">
                        <tr>
                          <th>ID</th>
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedProblems.slice(0, 10).reverse().map(problem => (
                          <tr key={problem.id}>
                            <td>
                              <code>#{problem.id}</code>
                            </td>
                            <td>{problem.department}</td>
                            <td>
                              <span className={`badge ${
                                problem.priority === 'High' ? 'bg-danger' :
                                problem.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                              }`}>
                                {problem.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${
                                problem.status === 'pending' ? 'bg-warning' :
                                problem.status === 'in_progress' ? 'bg-info' : 'bg-success'
                              }`}>
                                {problem.status === 'pending_approval' ? 'Approval' : problem.status.toUpperCase().replace('_', ' ')}
                              </span>
                            </td>
                            <td>
                              <Link to={`/problem/${problem.id}`} className="btn btn-sm btn-outline-primary me-1">
                                View
                              </Link>
                              <button 
                                onClick={() => handleTransferClick(problem)}
                                className="btn btn-sm btn-outline-warning"
                                title="Transfer this work"
                              >
                                <FaExchangeAlt />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="card shadow">
          <div className="card-header bg-info text-white">
            <h5 className="mb-0">Quick Actions</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6 mb-3">
                <Link to="/problem/create" className="btn btn-primary w-100 py-3">
                  <FaClipboardList className="me-2" style={{ fontSize: '1.5rem' }} />
                  <div>Create New Problem</div>
                </Link>
              </div>
              <div className="col-md-6 mb-3">
                <Link to="/reports" className="btn btn-secondary w-100 py-3">
                  <FaCheckCircle className="me-2" style={{ fontSize: '1.5rem' }} />
                  <div>Download Reports</div>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Transfer Modal */}
        {showTransferModal && (
          <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content">
                <div className="modal-header bg-warning">
                  <h5 className="modal-title">
                    <FaExchangeAlt className="me-2" />
                    Transfer Work
                  </h5>
                  <button 
                    type="button" 
                    className="btn-close" 
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferTo('');
                      setSelectedProblem(null);
                    }}
                  ></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <p className="text-muted">
                      <strong>Problem ID:</strong> #{selectedProblem?.id}<br />
                      <strong>Department:</strong> {selectedProblem?.department}<br />
                      <strong>Priority:</strong> <span className={`badge ${
                        selectedProblem?.priority === 'High' ? 'bg-danger' :
                        selectedProblem?.priority === 'Medium' ? 'bg-warning' : 'bg-success'
                      }`}>{selectedProblem?.priority}</span>
                    </p>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Transfer to:</label>
                    <select
                      className="form-control"
                      value={transferTo}
                      onChange={(e) => setTransferTo(e.target.value)}
                    >
                      <option value="">-- Select Team Member --</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.role === 'team_leader' ? 'Team Leader' : 'User'}) - {member.department}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Only active team members are shown
                    </small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowTransferModal(false);
                      setTransferTo('');
                      setSelectedProblem(null);
                    }}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-warning"
                    onClick={handleTransferSubmit}
                    disabled={!transferTo}
                  >
                    <FaExchangeAlt className="me-1" />
                    Transfer Work
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}