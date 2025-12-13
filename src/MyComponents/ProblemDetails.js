// src/pages/ProblemDetails.js - UPDATED FOR NEW COMMENT API
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { 
  FaChevronLeft, FaChevronRight, FaHome, FaPlusCircle, FaExclamationTriangle, 
  FaFileAlt, FaUsersCog, FaArrowLeft, FaTimes, FaClock, FaExchangeAlt, 
  FaComments, FaPaperPlane, FaUser, FaBan, FaSpinner, FaTrash, FaEdit, FaEye,
  FaCheckCircle, FaTimesCircle, FaCheck, FaHistory, FaCalendar, FaTag,
  FaBuilding, FaUserTie, FaUserCheck, FaUserTimes, FaArrowRight, FaPaperclip,
  FaImage, FaInfoCircle, FaBell, FaShareAlt, FaSync, FaPhone, FaEnvelope,
  FaThumbsUp, FaThumbsDown, FaStar, FaChartLine, FaFileDownload
} from 'react-icons/fa';

export default function ProblemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notifyStatusChange, notifyCompletion, notifyDiscussionComment, notifySolutionComment } = useNotifications();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showSolutionComment, setShowSolutionComment] = useState(false);
  const [pendingStatus, setPendingStatus] = useState(null);
  const [rightSidebarMinimized, setRightSidebarMinimized] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferTo, setTransferTo] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingProblem, setLoadingProblem] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [activeTab, setActiveTab] = useState('details');
  const [showHistory, setShowHistory] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchProblemDetails();
    if (showTransferModal) {
      loadAvailableUsers();
    }
  }, [id, showTransferModal]);

  // Load problem details from backend API
  const fetchProblemDetails = async () => {
    if (!refreshing) setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/problems/get', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ id: parseInt(id) }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success') {
        setProblem(data.data);
        console.log('✅ Problem details loaded:', data.data);
      } else {
        toast.error(data.messages?.[0] || 'Failed to fetch problem details');
        setProblem(null);
      }
    } catch (error) {
      console.error('❌ Fetch problem details error:', error);
      toast.error('Failed to fetch problem details. Please try again.');
      setProblem(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Refresh problem details
  const refreshProblem = () => {
    setRefreshing(true);
    fetchProblemDetails();
  };

  // Load available users for transfer from backend
  const loadAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/getAllUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Filter active users (excluding current user and problem creator)
          const activeUsers = data.data.filter(u => 
            // u.status === 'active' && 
            u.id !== user?.id &&
            u.name !== problem?.created_by?.name
          );
          setAvailableUsers(activeUsers);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load users:', error);
      toast.error('Failed to load users for transfer');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Check if current user can transfer this problem
  const canTransferProblem = () => {
    if (!problem || !user) return false;
    
    // Admin and Team Leaders can always transfer
    if (user.role === 'admin' || user.role === 'team_leader') {
      return true;
    }
    
    // Regular users cannot transfer
    return false;
  };
 const handleTransferProblem = async () => {
  if (!transferTo) {
    toast.error('Please select a user to transfer to');
    return;
  }

  const selectedUser = availableUsers.find(u => u.id == transferTo);
  if (!selectedUser) {
    toast.error('Selected user not found');
    return;
  }

  // ✅ FIXED: Only non-admin users can't transfer to problem creator
  if (problem.created_by && selectedUser.id === problem.created_by.id && user?.role !== 'admin') {
    toast.error('Cannot transfer problem to the person who created it');
    return;
  }

  // Prevent transferring to current assignee
  if (problem.assigned_to && selectedUser.id === problem.assigned_to.id) {
    toast.error('Cannot transfer problem to the current assignee');
    return;
  }

  setTransferring(true);
  try {
    const token = localStorage.getItem('token');
    
    // Create transfer record for history
    const transferRecord = {
      assigned_to: selectedUser.id,
      assigned_to_name: selectedUser.name,
      assigned_by: user.id,
      assigned_by_name: user.name,
      assigned_at: new Date().toISOString(),
      type: 'reassignment',
      reason: comment.trim() || 'No reason provided'
    };

    // Get current assignment history - handle both array and string formats
    let currentHistory = [];
    try {
      if (problem.assignment_history) {
        if (Array.isArray(problem.assignment_history)) {
          // Already an array
          currentHistory = problem.assignment_history;
        } else if (typeof problem.assignment_history === 'string') {
          // Parse JSON string
          currentHistory = JSON.parse(problem.assignment_history);
        }
      }
    } catch (e) {
      console.error('Error parsing assignment history:', e);
      currentHistory = [];
    }

    // ✅ FIX: Ensure currentHistory is an array
    if (!Array.isArray(currentHistory)) {
      currentHistory = [];
    }

    // ✅ FIX: Send as array, not JSON string
    const updatePayload = {
      id: parseInt(id),
      assigned_to: selectedUser.id,
      status: 'pending',
      transfer_reason: comment.trim() || 'Transferred by ' + user.name,
      assignment_history: [...currentHistory, transferRecord] // ✅ Send as array, not string
    };

    console.log('📤 Transfer update payload:', updatePayload);
    console.log('📊 Assignment history type:', typeof updatePayload.assignment_history);
    console.log('🔢 Assignment history is array?', Array.isArray(updatePayload.assignment_history));

    const updateResponse = await fetch('http://localhost:8000/api/problems/update', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(updatePayload),
    });

    const updateData = await updateResponse.json();
    console.log('📥 Update response:', updateData);

    if (updateData.status !== 'success') {
      throw new Error(updateData.messages?.[0] || 'Failed to transfer problem');
    }

    // Add transfer comment
    const transferText = `Problem transferred from ${problem.assigned_to?.name || 'Unassigned'} to ${selectedUser.name}${comment.trim() ? `: ${comment}` : ''}`;

    // Try to add comment
    try {
      const commentResponse = await fetch('http://localhost:8000/api/problems/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          problem_id: parseInt(id),
          text: transferText,
          type: 'transfer'
        }),
      });

      const commentData = await commentResponse.json();
      if (commentData.status !== 'success') {
        console.warn('Could not add transfer comment:', commentData.messages?.[0]);
      }
    } catch (commentError) {
      console.warn('Failed to add comment:', commentError);
    }

    toast.success(`✅ Problem transferred to ${selectedUser.name} successfully!`);
    
    if (notifyStatusChange && typeof notifyStatusChange === 'function') {
      try {
        notifyStatusChange(problem.id, 'pending', user.name, selectedUser.name);
      } catch (notifyError) {
        console.error('Notification error:', notifyError);
      }
    }
    
    setShowTransferModal(false);
    setTransferTo('');
    setComment('');
    
    setTimeout(() => {
      fetchProblemDetails();
    }, 500);
    
  } catch (error) {
    console.error('❌ Transfer error:', error);
    toast.error(error.message || 'Failed to transfer problem');
  } finally {
    setTransferring(false);
  }
};

  // Calculate duration between two dates
  const calculateDuration = (start, end) => {
    if (!start || !end) return 'N/A';
    
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffMs = endDate - startDate;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m`;
    } else {
      return 'Just now';
    }
  };

  // Calculate time elapsed since creation
  const getTimeElapsed = (start) => {
    if (!start) return 'N/A';
    
    const startDate = new Date(start);
    const now = new Date();
    const diffMs = now - startDate;
    
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) {
      return `${days} day${days > 1 ? 's' : ''} ago`;
    } else if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else if (minutes > 0) {
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else {
      return 'Just now';
    }
  };

  // Handle add general comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/problems/comment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          problem_id: parseInt(id),
          text: comment.trim(),
          type: 'general'
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('💬 Comment added successfully!');
        setComment('');
        fetchProblemDetails();
        
        if (notifyDiscussionComment) {
          notifyDiscussionComment(problem.id, user.name, comment.trim(), problem);
        }
      } else {
        toast.error(data.messages?.[0] || 'Failed to add comment');
      }
    } catch (error) {
      console.error('❌ Add comment error:', error);
      toast.error('Failed to add comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  // Handle status change via backend API
  const handleStatusChange = async (newStatus) => {
    if ((newStatus === 'resolved' || newStatus === 'pending_approval') && !comment.trim()) { // Adjusted 'done' to 'resolved'
      toast.error('Please add a comment explaining the solution before marking as solved');
      setShowSolutionComment(true);
      setPendingStatus(newStatus);
      return;
    }

    if (newStatus === 'resolved' && !canApprove()) {
      newStatus = 'pending_approval';
    }

    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem('token');
      
      // Add comment if provided
      if (comment.trim()) {
        const commentType = (newStatus === 'resolved' || newStatus === 'pending_approval') ? 'solution' : 'status_change';
        const commentResponse = await fetch('http://localhost:8000/api/problems/comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            problem_id: parseInt(id),
            text: comment.trim(),
            type: commentType
          }),
        });

        const commentData = await commentResponse.json();
        if (commentData.status !== 'success') {
          throw new Error(commentData.messages?.[0] || 'Failed to add comment');
        }
      }

      // Update status
      const updateData = {
        id: parseInt(id),
        status: newStatus
      };

      // Add resolved_at for resolved status (if field exists; otherwise remove)
      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
      }

      const response = await fetch('http://localhost:8000/api/problems/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(updateData),
      });

      const data = await response.json();

      if (data.status === 'success') {
        const statusMsg = newStatus === 'pending_approval'
          ? '✅ Submitted for approval! Admin/Team Leader will review.'
          : '✅ Status updated successfully!';
        
        toast.success(statusMsg);
        setComment('');
        setShowSolutionComment(false);
        setPendingStatus(null);
        fetchProblemDetails();
        
        // Send notifications
        if (newStatus === 'pending_approval' && notifyStatusChange) {
          // Notify all admins and team leaders
          notifyStatusChange(problem.id, 'pending_approval', user.name, 'admin');
        } else if (problem.assigned_to && newStatus !== 'resolved' && notifyStatusChange) {
          notifyStatusChange(problem.id, newStatus, user.name, problem.assigned_to.name);
        }
        
        if (newStatus === 'resolved' && canApprove() && notifyCompletion) {
          notifyCompletion(problem.id, user.name);
        }
      } else {
        toast.error(data.messages?.[0] || 'Failed to update status');
      }
    } catch (error) {
      console.error('❌ Status change error:', error);
      toast.error('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleSubmitSolution = () => {
    if (!comment.trim()) {
      toast.error('Please add a comment explaining the solution');
      return;
    }
    handleStatusChange(pendingStatus);
  };

  // Handle approve completion via backend API
  const handleApproveCompletion = async () => {
    if (!window.confirm('Are you sure this problem is resolved and ready to be marked as completed?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/problems/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          id: parseInt(id),
          status: 'resolved', // Adjusted from 'done'
          // approved_by: user.id, // Remove if field doesn't exist
          // approved_at: new Date().toISOString(),
          // resolved_at: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('✅ Problem marked as completed!');
        fetchProblemDetails();
        
        if (notifyCompletion) {
          notifyCompletion(problem.id, user.name);
        }
      } else {
        toast.error(data.messages?.[0] || 'Failed to approve completion');
      }
    } catch (error) {
      console.error('❌ Approve completion error:', error);
      toast.error('Failed to approve completion');
    }
  };

  // Handle reject completion via backend API
  const handleRejectCompletion = async () => {
    const reason = window.prompt('Reason for rejection (optional):');

    try {
      const token = localStorage.getItem('token');

      // Add rejection comment if reason provided
      if (reason?.trim()) {
        const commentResponse = await fetch('http://localhost:8000/api/problems/comment', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            problem_id: parseInt(id),
            text: `Completion rejected: ${reason.trim()}`,
            type: 'status_change'
          }),
        });

        const commentData = await commentResponse.json();
        if (commentData.status !== 'success') {
          throw new Error(commentData.messages?.[0] || 'Failed to add rejection comment');
        }
      }

      // Update status
      const response = await fetch('http://localhost:8000/api/problems/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({
          id: parseInt(id),
          status: 'in_progress',
          // rejection_reason: reason || 'Needs more work', // Remove if no field
          // rejected_by: user.id,
          // rejected_at: new Date().toISOString()
        }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.warning('⚠️ Completion rejected. Status changed to In Progress.');
        fetchProblemDetails();
      } else {
        toast.error(data.messages?.[0] || 'Failed to reject completion');
      }
    } catch (error) {
      console.error('❌ Reject completion error:', error);
      toast.error('Failed to reject completion');
    }
  };

  // Assume getUserInitials and formatDate are defined elsewhere
  const getUserInitials = (name) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  // Check if user can approve
  const canApprove = () => {
    return user.role === 'admin' || user.role === 'team_leader';
  };

  // Placeholder for images/attachments if needed
  // Assuming problem.images is an array of image URLs

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center vh-100">
        <FaSpinner className="fa-spin text-primary" size={48} />
      </div>
    );
  }

  if (!problem) {
    return (
      <div className="container mt-5">
        <div className="alert alert-danger">
          <FaExclamationTriangle className="me-2" />
          Problem not found or failed to load.
        </div>
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>
          <FaArrowLeft className="me-2" />
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100 bg-light">
      <Navbar />
      <div className="container-fluid flex-grow-1 d-flex">
        {/* Left Sidebar */}
        <div className={`bg-white border-end transition-all ${sidebarMinimized ? 'w-20' : 'w-250px'}`} style={{ transition: 'width 0.3s' }}>
          {/* Sidebar content */}
          <div className="p-3">
            <button onClick={() => setSidebarMinimized(!sidebarMinimized)} className="btn btn-sm btn-light mb-3">
              {sidebarMinimized ? <FaChevronRight /> : <FaChevronLeft />}
            </button>
            {!sidebarMinimized && (
              <>
                <h6 className="mb-3">Navigation</h6>
                <ul className="list-unstyled">
                  <li className="mb-2"><Link to="/dashboard"><FaHome className="me-2" /> Dashboard</Link></li>
                  <li className="mb-2"><Link to="/problems"><FaFileAlt className="me-2" /> All Problems</Link></li>
                  <li className="mb-2"><Link to="/users"><FaUsersCog className="me-2" /> Users</Link></li>
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              Problem #{problem.id}: {problem.statement}
            </h2>
            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary" onClick={refreshProblem} disabled={refreshing}>
                <FaSync className={refreshing ? 'fa-spin' : ''} />
              </button>
              {canTransferProblem() && (
                <button className="btn btn-warning" onClick={() => setShowTransferModal(true)}>
                  <FaExchangeAlt className="me-2" />
                  Transfer
                </button>
              )}
              {/* Add other buttons as needed */}
            </div>
          </div>

          {/* Tabs */}
          <ul className="nav nav-tabs mb-4">
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'details' ? 'active' : ''}`} onClick={() => setActiveTab('details')}>
                Details
              </button>
            </li>
            <li className="nav-item">
              <button className={`nav-link ${activeTab === 'discussion' ? 'active' : ''}`} onClick={() => setActiveTab('discussion')}>
                Discussion
              </button>
            </li>
            {/* Add more tabs if needed */}
          </ul>

          {activeTab === 'details' && (
            <div className="row">
              <div className="col-md-6">
                <div className="card mb-4">
                  <div className="card-body">
                    <h5 className="card-title">Problem Information</h5>
                    <dl className="row">
                      <dt className="col-sm-4">Department</dt>
                      <dd className="col-sm-8">{problem.department}</dd>
                      <dt className="col-sm-4">Priority</dt>
                      <dd className="col-sm-8">
                        <span className={`badge bg-${problem.priority === 'High' ? 'danger' : problem.priority === 'Medium' ? 'warning' : 'success'}`}>
                          {problem.priority}
                        </span>
                      </dd>
                      <dt className="col-sm-4">Status</dt>
                      <dd className="col-sm-8">
                        <span className={`badge bg-${problem.status === 'resolved' ? 'success' : problem.status === 'in_progress' ? 'primary' : 'secondary'}`}>
                          {problem.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </dd>
                      <dt className="col-sm-4">Created By</dt>
                      <dd className="col-sm-8">{problem.created_by.name}</dd>
                      <dt className="col-sm-4">Assigned To</dt>
                      <dd className="col-sm-8">{problem.assigned_to?.name || 'Unassigned'}</dd>
                      <dt className="col-sm-4">Created At</dt>
                      <dd className="col-sm-8">{formatDate(problem.created_at)}</dd>
                    </dl>
                    <h6>Description</h6>
                    <p>{problem.description || 'No description provided'}</p>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                {/* Attachments if any */}
                {problem.images && problem.images.length > 0 && (
                  <div className="card mb-4">
                    <div className="card-body">
                      <h5 className="card-title">Attachments</h5>
                      <div className="d-flex gap-2">
                        {problem.images.map((img, idx) => (
                          <img key={idx} src={img} alt={`Attachment ${idx+1}`} className="img-thumbnail" style={{width: '100px'}} onClick={() => setSelectedImage(img)} />
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Stats */}
                <div className="card shadow-sm border-0 mt-4">
                  <div className="card-header bg-white border-bottom-0">
                    <h6 className="mb-0">
                      <FaChartLine className="me-2" />
                      Quick Stats
                    </h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-6 mb-3">
                        <div className="bg-light rounded p-2">
                          <h4 className="mb-0 text-primary">
                            {problem.comments?.length || 0}
                          </h4>
                          <small className="text-muted">Comments</small>
                        </div>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="bg-light rounded p-2">
                          <h4 className="mb-0 text-info">
                            {problem.images?.length || 0}
                          </h4>
                          <small className="text-muted">Attachments</small>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="bg-light rounded p-2">
                          <h6 className="mb-1">Time Open</h6>
                          <p className="mb-0 text-success fw-bold">
                            {getTimeElapsed(problem.created_at)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'discussion' && (
            <div className="card">
              <div className="card-body">
                <h5 className="card-title">Discussion</h5>
                {problem.comments && problem.comments.length > 0 ? (
                  <div className="space-y-3">
                    {problem.comments.map((comment, index) => (
                      <div key={index} className="mb-3 pb-3 border-bottom">
                        <div className="d-flex">
                          <div className="flex-shrink-0">
                            <div className={`rounded-circle text-white d-flex align-items-center justify-content-center`}
                              style={{ 
                                width: '36px', 
                                height: '36px', 
                                fontSize: '0.9rem',
                                backgroundColor: comment.user.role === 'admin' ? '#dc3545' : 
                                              comment.user.role === 'team_leader' ? '#0d6efd' : '#6c757d'
                              }}>
                              {getUserInitials(comment.user.name)}
                            </div>
                          </div>
                          <div className="flex-grow-1 ms-3">
                            <div className="d-flex justify-content-between align-items-start">
                              <div>
                                <h6 className="mb-0">{comment.user.name}</h6>
                                <small className="text-muted">
                                  {comment.user.role === 'admin' && 'Admin • '}
                                  {comment.user.role === 'team_leader' && 'Team Leader • '}
                                  {comment.user.role === 'user' && 'User • '}
                                  {formatDate(comment.created_at)}
                                </small>
                              </div>
                              {comment.type === 'solution' && (
                                <span className="badge bg-success">
                                  <FaCheckCircle className="me-1" />
                                  Solution
                                </span>
                              )}
                            </div>
                            <p className="mt-2 mb-0">{comment.text}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <FaComments className="text-muted mb-3" size={48} />
                    <p className="text-muted">No comments yet</p>
                    <small className="text-muted">Start the discussion...</small>
                  </div>
                )}
              </div>

              {/* Add Comment Form */}
              <div className="p-3">
                <form onSubmit={handleAddComment}>
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Add Comment</label>
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Type your comment here..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      style={{ resize: 'none' }}
                      disabled={submittingComment}
                    ></textarea>
                  </div>
                  <div className="d-flex justify-content-between">
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submittingComment || !comment.trim()}
                    >
                      {submittingComment ? (
                        <>
                          <FaSpinner className="fa-spin me-2" />
                          Posting...
                        </>
                      ) : (
                        <>
                          <FaPaperPlane className="me-2" />
                          Post Comment
                        </>
                      )}
                    </button>
                    <small className="text-muted align-self-center">
                      Press Enter to post
                    </small>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Image Modal */}
          {selectedImage && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.9)', zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-centered modal-xl">
                <div className="modal-content border-0 bg-transparent">
                  <div className="modal-header border-0">
                    <button
                      className="btn btn-danger btn-sm position-absolute top-0 end-0 m-3"
                      onClick={() => setSelectedImage(null)}
                      style={{ zIndex: 1051 }}
                    >
                      <FaTimes />
                    </button>
                  </div>
                  <div className="modal-body d-flex justify-content-center align-items-center">
                    <img 
                      src={selectedImage}
                      alt="Full Size"
                      className="img-fluid rounded shadow-lg"
                      style={{ maxHeight: '80vh', maxWidth: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Transfer Problem Modal */}
          {showTransferModal && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header bg-warning text-dark">
                    <h5 className="modal-title">
                      <FaExchangeAlt className="me-2" />
                      Transfer Problem #{problem.id}
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => {
                        setShowTransferModal(false);
                        setTransferTo('');
                        setComment('');
                      }}
                      disabled={transferring}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-info">
                      <h6 className="alert-heading mb-2">Transfer Rules</h6>
                      <ul className="mb-0 small">
                        <li>You cannot transfer problems to the person who created it</li>
                        <li>Only Admin and Team Leaders can transfer problems</li>
                        <li>Problem status will be reset to "Pending" after transfer</li>
                        <li>The assigned user will receive a notification</li>
                      </ul>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Transfer To:</label>
                      {loadingUsers ? (
                        <div className="text-center py-4">
                          <FaSpinner className="fa-spin text-warning me-2" />
                          Loading available users...
                        </div>
                      ) : (
                        <select
                          className="form-control"
                          value={transferTo}
                          onChange={(e) => setTransferTo(e.target.value)}
                          disabled={transferring}
                        >
                          <option value="">-- Select User --</option>
                          {availableUsers.map(user => (
                            <option key={user.id} value={user.id}>
                              {user.name} 
                              {user.role === 'team_leader' && ' (Team Leader)'} 
                              {user.role === 'admin' && ' (Admin)'} 
                              {user.department && ` - ${user.department}`}
                            </option>
                          ))}
                        </select>
                      )}
                      <small className="text-muted">
                        Available users for transfer (excluding problem creator and current assignee)
                      </small>
                    </div>

                    {/* <div className="mb-3">
                      <label className="form-label fw-semibold">Transfer Reason (Optional):</label>
                      <textarea
                        className="form-control"
                        rows="3"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Explain why you are transferring this problem..."
                        disabled={transferring}
                      ></textarea>
                      <small className="text-muted">This will be added as a comment</small>
                    </div> */}

                    <div className="d-flex gap-2 mt-4">
                      <button 
                        className="btn btn-warning flex-grow-1"
                        onClick={handleTransferProblem}
                        disabled={!transferTo || transferring || loadingUsers}
                      >
                        {transferring ? (
                          <>
                            <FaSpinner className="fa-spin me-2" />
                            Transferring...
                          </>
                        ) : (
                          <>
                            <FaExchangeAlt className="me-2" />
                            Transfer Problem
                          </>
                        )}
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowTransferModal(false);
                          setTransferTo('');
                          setComment('');
                        }}
                        disabled={transferring}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Solution Comment Required Modal */}
          {showSolutionComment && (
            <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
              <div className="modal-dialog modal-dialog-centered">
                <div className="modal-content">
                  <div className="modal-header bg-warning text-dark">
                    <h5 className="modal-title">
                      <FaCheckCircle className="me-2" />
                      Solution Comment Required
                    </h5>
                    <button 
                      type="button" 
                      className="btn-close" 
                      onClick={() => {
                        setShowSolutionComment(false);
                        setPendingStatus(null);
                        setComment('');
                      }}
                    ></button>
                  </div>
                  <div className="modal-body">
                    <div className="alert alert-warning">
                      <h6 className="alert-heading mb-2">💡 Please Describe Your Solution</h6>
                      <p className="mb-0">
                        Before marking this problem as {pendingStatus === 'resolved' ? 'solved' : 'pending approval'}, 
                        please describe how you resolved it. This helps with documentation and future reference.
                      </p>
                    </div>
                    
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Solution Description:</label>
                      <textarea
                        className="form-control"
                        rows="4"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Describe your solution in detail..."
                        autoFocus
                      ></textarea>
                      <small className="text-muted">Be specific about the steps taken and resolution</small>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                      <button 
                        className="btn btn-success flex-grow-1"
                        onClick={handleSubmitSolution}
                        disabled={!comment.trim()}
                      >
                        <FaCheckCircle className="me-2" />
                        Submit Solution & Mark as {pendingStatus === 'resolved' ? 'Solved' : 'Pending Approval'}
                      </button>
                      <button 
                        className="btn btn-secondary"
                        onClick={() => {
                          setShowSolutionComment(false);
                          setPendingStatus(null);
                          setComment('');
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}