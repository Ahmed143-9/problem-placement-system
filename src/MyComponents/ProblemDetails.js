import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaChevronLeft, FaChevronRight, FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaArrowLeft, FaTimes, FaClock, FaExchangeAlt, FaComments, FaPaperPlane, FaUser, FaBan } from 'react-icons/fa';

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

  useEffect(() => {
    fetchProblemDetails();
  }, [id]);

  const fetchProblemDetails = () => {
    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const foundProblem = problems.find(p => p.id === parseInt(id));
      if (foundProblem) {
        setProblem(foundProblem);
      } else {
        setProblem(null);
      }
    } catch (error) {
      toast.error('Failed to fetch problem details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get user name from ID
  const getUserName = (userId) => {
    if (!userId) return 'Unassigned';
    const users = JSON.parse(localStorage.getItem('system_users') || '[]');
    const user = users.find(u => u.id === userId || u.name === userId);
    return user ? user.name : userId;
  };

  // ✅ Check if current user can transfer this problem
  const canTransferProblem = () => {
    if (!problem || !user) return false;
    
    // Admin and Team Leaders can always transfer
    if (user.role === 'admin' || user.role === 'team_leader') {
      return true;
    }
    
    // Regular users cannot transfer problems they created
    // They can only work on assigned problems
    if (user.role === 'user' && problem.createdBy === user.name) {
      return false;
    }
    
    return false;
  };

  // ✅ Handle problem transfer
  const handleTransferProblem = async () => {
    if (!transferTo) {
      toast.error('Please select a user to transfer to');
      return;
    }

    // ✅ Prevent transferring to the problem creator
    if (transferTo === problem.createdBy) {
      toast.error('Cannot transfer problem to the person who created it');
      return;
    }

    setTransferring(true);
    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const users = JSON.parse(localStorage.getItem('system_users') || '[]');
      
      const targetUser = users.find(u => u.id === parseInt(transferTo) || u.name === transferTo);
      if (!targetUser) {
        toast.error('Selected user not found');
        return;
      }

      const updatedProblems = problems.map(p => {
        if (p.id === parseInt(id)) {
          const transferRecord = {
            from: problem.assignedTo || 'Unassigned',
            to: targetUser.name,
            by: user.name,
            date: new Date().toISOString(),
            reason: comment.trim() || 'No reason provided'
          };

          return {
            ...p,
            assignedTo: targetUser.name,
            transferHistory: [...(p.transferHistory || []), transferRecord],
            status: 'pending', // Reset status when transferred
            lastUpdated: new Date().toISOString()
          };
        }
        return p;
      });

      localStorage.setItem('problems', JSON.stringify(updatedProblems));

      // Send notification to the new assigned user
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      const notification = {
        id: Date.now(),
        userId: targetUser.id,
        userName: targetUser.name,
        type: 'problem_assigned',
        title: '🔀 Problem Transferred to You',
        message: `Problem #${problem.id} has been transferred to you by ${user.name}`,
        problemId: problem.id,
        isRead: false,
        createdAt: new Date().toISOString()
      };
      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      toast.success(`Problem transferred to ${targetUser.name} successfully!`);
      setShowTransferModal(false);
      setTransferTo('');
      setComment('');
      fetchProblemDetails();
    } catch (error) {
      toast.error('Failed to transfer problem');
      console.error(error);
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
      return `${days} days ${hours} hours`;
    } else if (hours > 0) {
      return `${hours} hours ${minutes} minutes`;
    } else {
      return `${minutes} minutes`;
    }
  };

  const handleStatusChange = (newStatus) => {
    if ((newStatus === 'done' || newStatus === 'pending_approval') && !comment.trim()) {
      toast.error('Please add a comment explaining the solution before marking as solved');
      setShowSolutionComment(true);
      setPendingStatus(newStatus);
      return;
    }

    if (newStatus === 'done' && !canApprove()) {
      newStatus = 'pending_approval';
    }

    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = problems.map(p => {
        if (p.id === parseInt(id)) {
          const updatedProblem = {
            ...p,
            status: newStatus,
            ...(newStatus === 'pending_approval' && {
              submittedForApprovalBy: user?.name,
              submittedForApprovalAt: new Date().toISOString()
            }),
            ...(newStatus === 'done' && {
              resolvedAt: new Date().toISOString()
            })
          };

          if ((newStatus === 'done' || newStatus === 'pending_approval') && comment.trim()) {
            const newComment = {
              id: Date.now(),
              text: comment.trim(),
              author: user?.name,
              authorRole: user?.role,
              timestamp: new Date().toISOString(),
              date: new Date().toLocaleDateString('en-BD'),
              time: new Date().toLocaleTimeString('en-BD', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: true 
              }),
              type: 'solution'
            };
            updatedProblem.comments = [...(p.comments || []), newComment];

            // 🔥 SEND SOLUTION NOTIFICATION
            if (notifySolutionComment) {
              notifySolutionComment(
                p.id,
                user?.name,
                comment.trim(),
                updatedProblem
              );
            }
          }

          return updatedProblem;
        }
        return p;
      });

      localStorage.setItem('problems', JSON.stringify(updatedProblems));

      if (newStatus === 'pending_approval') {
        const users = JSON.parse(localStorage.getItem('system_users') || '[]');
        users.forEach(u => {
          if (u.role === 'admin' || u.role === 'team_leader') {
            notifyStatusChange(problem.id, 'pending_approval', user?.name, u.name);
          }
        });
      } else if (problem.assignedTo && newStatus !== 'done') {
        notifyStatusChange(problem.id, newStatus, user?.name, problem.assignedTo);
      }

      if (newStatus === 'done' && canApprove()) {
        notifyCompletion(problem.id, user?.name);
      }

      const statusMsg = newStatus === 'pending_approval'
        ? 'Submitted for approval! Admin/Team Leader will review.'
        : 'Status updated successfully!';
      
      toast.success(statusMsg);
      setComment('');
      setShowSolutionComment(false);
      setPendingStatus(null);
      fetchProblemDetails();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleSubmitSolution = () => {
    if (!comment.trim()) {
      toast.error('Please add a comment explaining the solution');
      return;
    }

    handleStatusChange(pendingStatus);
  };

  const handleApproveCompletion = () => {
    if (!window.confirm('Are you sure this problem is resolved?')) {
      return;
    }

    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = problems.map(p =>
        p.id === parseInt(id)
          ? {
              ...p,
              status: 'done',
              approvedBy: user?.name,
              approvedAt: new Date().toISOString()
            }
          : p
      );

      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      notifyCompletion(problem.id, user?.name);

      if (problem.submittedForApprovalBy) {
        notifyStatusChange(problem.id, 'done', user?.name, problem.submittedForApprovalBy);
      }

      toast.success('Problem marked as completed!');
      fetchProblemDetails();
    } catch (error) {
      toast.error('Failed to approve completion');
      console.error(error);
    }
  };

  const handleRejectCompletion = () => {
    const reason = prompt('Reason for rejection (optional):');

    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = problems.map(p =>
        p.id === parseInt(id)
          ? {
              ...p,
              status: 'in_progress',
              rejectionReason: reason || 'Needs more work',
              rejectedBy: user?.name,
              rejectedAt: new Date().toISOString()
            }
          : p
      );

      localStorage.setItem('problems', JSON.stringify(updatedProblems));

      if (problem.submittedForApprovalBy) {
        notifyStatusChange(problem.id, 'in_progress', user?.name, problem.submittedForApprovalBy);
      }

      toast.warning('Completion rejected. Status changed to In Progress.');
      fetchProblemDetails();
    } catch (error) {
      toast.error('Failed to reject completion');
      console.error(error);
    }
  };

  const handleAddComment = (e) => {
    e.preventDefault();
    if (!comment.trim()) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingComment(true);
    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = problems.map(p => {
        if (p.id === parseInt(id)) {
          const newComment = {
            id: Date.now(),
            text: comment.trim(),
            author: user?.name,
            authorRole: user?.role,
            timestamp: new Date().toISOString(),
            date: new Date().toLocaleDateString('en-BD'),
            time: new Date().toLocaleTimeString('en-BD', { 
              hour: '2-digit', 
              minute: '2-digit',
              hour12: true 
            }),
            type: 'general'
          };
          
          const updatedProblem = { 
            ...p, 
            comments: [...(p.comments || []), newComment] 
          };

          // 🔥 SEND DISCUSSION NOTIFICATION
          if (notifyDiscussionComment) {
            notifyDiscussionComment(
              p.id, 
              user?.name, 
              comment.trim(),
              updatedProblem
            );
          }

          return updatedProblem;
        }
        return p;
      });

      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      toast.success('Comment added successfully!');
      setComment('');
      fetchProblemDetails();
    } catch (error) {
      toast.error('Failed to add comment');
      console.error(error);
    } finally {
      setSubmittingComment(false);
    }
  };

const canChangeStatus = () => {
  if (!problem || !user) return false;
  
  console.log('Checking status change permissions:', {
    user: user?.name,
    role: user?.role,
    assignedTo: problem?.assignedTo,
    assignedToName: problem?.assignedToName,
    createdBy: problem?.createdBy,
    status: problem?.status
  });

  // Admin and Team Leaders can always change status
  if (user.role === 'admin' || user.role === 'team_leader') {
    console.log('User is admin/team leader - can change status');
    return true;
  }
  
  // Regular users can change status only if they are assigned to the problem
  // Check both assignedTo (ID) and assignedToName (Name) fields
  if (user.role === 'user') {
    const isAssigned = 
      problem.assignedTo === user.name || 
      problem.assignedToName === user.name ||
      (problem.assignedTo && problem.assignedTo.toString() === user.id?.toString());
    
    console.log('Regular user can change status:', isAssigned);
    return isAssigned;
  }
  
  return false;
};

  const canApprove = () => {
    return user?.role === 'admin' || user?.role === 'team_leader';
  };

  const canDelete = () => {
    return user?.role === 'admin' || problem?.createdBy === user?.name;
  };

  const handleDelete = () => {
    if (!window.confirm('Are you sure you want to delete this problem?')) {
      return;
    }

    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = problems.filter(p => p.id !== parseInt(id));
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      toast.success('Problem deleted successfully!');
      navigate('/problems');
    } catch (error) {
      toast.error('Failed to delete problem');
      console.error(error);
    }
  };

  const toggleLeftSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const toggleRightSidebar = () => {
    setRightSidebarMinimized(!rightSidebarMinimized);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      in_progress: 'bg-info',
      done: 'bg-success',
      pending_approval: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      High: 'bg-danger',
      Medium: 'bg-warning text-dark',
      Low: 'bg-success'
    };
    return badges[priority] || 'bg-secondary';
  };

  const getImageUrl = (img) => {
    if (typeof img === 'string') {
      return img;
    } else if (img && img.url) {
      return img.url;
    } else if (img && img.data) {
      return img.data;
    }
    return '';
  };

  // Calculate resolution duration for display
  const resolutionDuration = problem?.createdAt && problem?.resolvedAt 
    ? calculateDuration(problem.createdAt, problem.resolvedAt)
    : null;

  // Get active users for transfer (excluding problem creator)
  const getAvailableUsersForTransfer = () => {
    const users = JSON.parse(localStorage.getItem('system_users') || '[]');
    return users.filter(u => 
      u.status === 'active' && 
      u.name !== problem?.createdBy && // Exclude problem creator
      u.name !== problem?.assignedTo && // Exclude current assignee
      (u.role === 'user' || u.role === 'team_leader') // Only regular users and team leaders
    );
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '80vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!problem) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <h2 className="text-danger">Problem not found</h2>
          <p className="text-muted">The problem you're looking for doesn't exist or has been deleted.</p>
          <button className="btn btn-primary mt-3" onClick={() => navigate('/problems')}>
            Back to Problems List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="d-flex flex-grow-1">
        {/* Left Sidebar */}
        <div 
          className="bg-dark text-white position-relative"
          style={{ 
            width: sidebarMinimized ? '70px' : '250px',
            minHeight: '100%',
            transition: 'width 0.3s ease'
          }}
        >
          <button
            onClick={toggleLeftSidebar}
            className="position-absolute d-flex align-items-center justify-content-center"
            style={{
              top: '10px',
              right: '-12px',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 1000,
              cursor: 'pointer',
            }}
          >
            {sidebarMinimized ? <FaChevronRight size={14} color="#333" /> : <FaChevronLeft size={14} color="#333" />}
          </button>

          <div className="p-3">
            {!sidebarMinimized && (
              <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>
                Navigation
              </h5>
            )}
            <ul className="nav flex-column">
              {/* Dashboard Link - Conditional */}
              <li className="nav-item mb-2">
                <Link 
                  to={user?.role === 'admin' || user?.role === 'team_leader' ? "/dashboard" : "/employee-dashboard"} 
                  className="nav-link text-white rounded d-flex align-items-center"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Dashboard"
                >
                  <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                </Link>
              </li>
              
              {/* Create Problem Link */}
              <li className="nav-item mb-2">
                <Link 
                  to="/problem/create" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                </Link>
              </li>
              
              {/* All Problems Link - Conditional */}
              <li className="nav-item mb-2">
                <Link 
                  to={user?.role === 'admin' || user?.role === 'team_leader' ? "/problems" : "/employee-dashboard"} 
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  title={user?.role === 'admin' || user?.role === 'team_leader' ? "All Problems" : "Employee Dashboard"}
                >
                  <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && (
                    <span className="ms-2" style={{ fontSize: '0.9rem' }}>
                      {user?.role === 'admin' || user?.role === 'team_leader' ? "All Problems" : "All Problems"}
                    </span>
                  )}
                </Link>
              </li>
              
              {/* Reports Link */}
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>
              
              {/* Admin Panel Link - Only for Admin/Team Leader */}
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/admin" 
                    className="nav-link text-white rounded d-flex align-items-center"
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Admin Panel"
                  >
                    <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Admin Panel</span>}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 position-relative" style={{ overflowY: 'auto' }}>
          <div className="p-4">
            <div className="row">
              {/* Main Problem Details */}
              <div className="col-lg-8">
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header d-flex justify-content-between align-items-center" 
                    style={{ 
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      color: 'white',
                      padding: '1rem 1.5rem'
                    }}
                  >
                    <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                      Problem #{problem.id}
                    </h5>
                    <div className="d-flex gap-2">
                      {/* Transfer Button - Only show if user can transfer */}
                      {canTransferProblem() && problem.status !== 'done' && (
                        <button 
                          className="btn btn-warning btn-sm"
                          onClick={() => setShowTransferModal(true)}
                          title="Transfer Problem"
                        >
                          <FaExchangeAlt className="me-1" />
                          Transfer
                        </button>
                      )}
                      
                      {/* Transfer Restriction Notice for Problem Creator */}
                      {user?.role === 'user' && problem.createdBy === user.name && (
                        <span className="badge bg-secondary" title="You cannot transfer problems you created">
                          <FaBan className="me-1" />
                          No Transfer
                        </span>
                      )}
                      
                      {canDelete() && (
                        <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                          🗑 Delete
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="card-body" style={{ padding: '1.5rem' }}>
                    {/* Pending Approval Alert */}
                    {problem.status === 'pending_approval' && (
                      <div className="alert alert-warning mb-3" style={{ borderRadius: '8px', fontSize: '0.9rem' }}>
                        <h6 className="alert-heading mb-2" style={{ fontSize: '1rem', fontWeight: '600' }}>⏳ Awaiting Approval</h6>
                        <p className="mb-2" style={{ fontSize: '0.85rem' }}>
                          {canApprove() 
                            ? 'This problem has been marked as complete. Please review and approve or reject.'
                            : 'Your completion request is pending Admin/Team Leader approval.'}
                        </p>
                        {problem.submittedForApprovalBy && (
                          <small className="text-muted d-block" style={{ fontSize: '0.75rem' }}>
                            Submitted by <strong>{problem.submittedForApprovalBy}</strong> on {new Date(problem.submittedForApprovalAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                    )}

                    {/* Images Section */}
                    {problem.images && problem.images.length > 0 && (
                      <div className="mb-4">
                        <h6 className="mb-3" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#495057' }}>
                          📎 Attached Screenshots ({problem.images.length})
                        </h6>
                        <div className="row g-3">
                          {problem.images.map((img, index) => {
                            const imageUrl = getImageUrl(img);
                            return imageUrl ? (
                              <div key={index} className="col-md-4 col-6">
                                <div 
                                  className="position-relative overflow-hidden"
                                  style={{
                                    borderRadius: '10px',
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                  }}
                                  onClick={() => setSelectedImage(imageUrl)}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'scale(1)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                  }}
                                >
                                  <img 
                                    src={imageUrl} 
                                    alt={`Screenshot ${index + 1}`}
                                    className="img-fluid"
                                    style={{ 
                                      width: '100%', 
                                      height: '150px', 
                                      objectFit: 'cover',
                                      borderRadius: '10px'
                                    }}
                                    onError={(e) => {
                                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjE1MCIgdmlld0JveD0iMCAwIDIwMCAxNTAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMTUwIiBmaWxsPSIjRjVGNUY1Ii8+CjxwYXRoIGQ9Ik04MCA2MEgxMjBNODAgODBIMTIwTTgwIDEwMEgxMjBNNjAgNjBWNzBNNjAgODBWNzBNNjAgMTAwVjcwTTE0MCA2MFY3ME0xNDAgODBWNzBNMTQwIDEwMFY3MCIgc3Ryb2tlPSIjQ0RDRENEIiBzdHJva2Utd2lkdGg9IjIiLz4KPC9zdmc+';
                                    }}
                                  />
                                  <div 
                                    className="position-absolute bottom-0 start-0 end-0 text-center text-white"
                                    style={{
                                      background: 'linear-gradient(transparent, rgba(0,0,0,0.75))',
                                      padding: '0.5rem',
                                      fontSize: '0.75rem',
                                      fontWeight: '500',
                                      borderBottomLeftRadius: '10px',
                                      borderBottomRightRadius: '10px'
                                    }}
                                  >
                                    Screenshot {index + 1}
                                  </div>
                                </div>
                              </div>
                            ) : null;
                          })}
                        </div>
                        <small className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                          💡 Click on any image to view full size
                        </small>
                      </div>
                    )}

                    {/* Solution Comment Required */}
                    {showSolutionComment && (
                      <div className="alert alert-warning mb-3">
                        <h6 className="mb-2">💬 Solution Comment Required</h6>
                        <p className="mb-2">Please explain how you solved this problem before marking it as completed.</p>
                        <div className="mb-3">
                          <textarea
                            className="form-control"
                            rows="3"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Describe your solution in detail..."
                            style={{ fontSize: '0.9rem' }}
                          ></textarea>
                        </div>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-success"
                            onClick={handleSubmitSolution}
                            disabled={!comment.trim()}
                          >
                            Submit Solution & Mark as {pendingStatus === 'done' ? 'Solved' : 'Pending Approval'}
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
                    )}

                    {/* Rejection Notice */}
                    {problem.rejectionReason && problem.status === 'in_progress' && (
                      <div className="alert alert-danger mb-3" style={{ borderRadius: '8px', fontSize: '0.9rem' }}>
                        <h6 className="mb-2" style={{ fontSize: '0.95rem', fontWeight: '600' }}>❌ Completion Rejected</h6>
                        <p className="mb-1" style={{ fontSize: '0.85rem' }}><strong>Reason:</strong> {problem.rejectionReason}</p>
                        <small style={{ fontSize: '0.75rem' }}>Rejected by {problem.rejectedBy} on {new Date(problem.rejectedAt).toLocaleString()}</small>
                      </div>
                    )}

                    {/* Basic Info */}
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Department</small>
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057' }}>{problem.department}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Priority</small>
                          <span className={`badge ${getPriorityBadge(problem.priority)}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                            {problem.priority}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Status</small>
                          <span className={`badge ${getStatusBadge(problem.status)}`} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
                            {problem.status === 'pending_approval' ? 'PENDING APPROVAL' : problem.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created</small>
                          <div style={{ fontSize: '0.8rem', color: '#6c757d' }}>{new Date(problem.createdAt).toLocaleString()}</div>
                        </div>
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div className="mb-4">
                      <h6 className="mb-2" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#495057' }}>
                        📋 Problem Statement
                      </h6>
                      <div className="p-3 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef', fontSize: '0.9rem', lineHeight: '1.6', color: '#495057' }}>
                        {problem.statement}
                      </div>
                    </div>

                    {/* Created By / Assigned To */}
                    <div className="row g-3 mb-4">
  <div className="col-md-6">
    <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
      <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Created By</small>
      <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057' }}>
        {problem.createdBy}
        {problem.createdBy === user?.name && (
          <span className="badge bg-info ms-1" style={{ fontSize: '0.6rem' }}>YOU</span>
        )}
      </div>
    </div>
  </div>
  <div className="col-md-6">
    <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
      <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned To</small>
      {problem.assignedTo || problem.assignedToName ? (
        <span className="badge bg-info" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
          {problem.assignedToName || getUserName(problem.assignedTo)}
          {(problem.assignedTo === user?.name || problem.assignedToName === user?.name) && (
            <span className="badge bg-light text-dark ms-1" style={{ fontSize: '0.6rem' }}>YOU</span>
          )}
        </span>
      ) : (
        <span className="text-muted" style={{ fontSize: '0.85rem' }}>Not assigned yet</span>
      )}
    </div>
  </div>
</div>

                    {/* Approval/Rejection Section */}
                    {problem.status === 'pending_approval' && canApprove() && (
                      <div className="mb-4">
                        <h6 className="mb-3" style={{ fontSize: '0.95rem', fontWeight: '600' }}>Review Completion</h6>
                        <div className="d-flex gap-2">
                          <button 
                            className="btn btn-success"
                            onClick={handleApproveCompletion}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                          >
                            ✓ Approve
                          </button>
                          <button 
                            className="btn btn-danger"
                            onClick={handleRejectCompletion}
                            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
                          >
                            ✗ Reject
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Completed Status */}
                    {problem.status === 'done' && (
                      <div className="alert alert-success mb-4" style={{ borderRadius: '8px', fontSize: '0.9rem' }}>
                        <h6 className="alert-heading mb-2" style={{ fontSize: '1rem', fontWeight: '600' }}>Problem Completed</h6>
                        <p className="mb-0" style={{ fontSize: '0.85rem' }}>This problem has been successfully resolved and marked as done.</p>
                        {problem.approvedBy && (
                          <small className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                            Approved by <strong>{problem.approvedBy}</strong> on {new Date(problem.approvedAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                    )}

                    {/* Status Change Buttons */}
                    {/* Status Change Buttons */}
                        {canChangeStatus() && problem.status !== 'done' && !showSolutionComment && (
  <div className="mb-4">
    <h6 className="mb-2" style={{ fontSize: '0.95rem', fontWeight: '600' }}>Update Status</h6>
    
    {/* Debug Info - Remove in production */}
    {/* {process.env.NODE_ENV === 'development' && (
      <div className="alert alert-info py-2 mb-2" style={{ fontSize: '0.7rem' }}>
        <strong>Debug:</strong> User: {user?.name}, Role: {user?.role}, 
        Assigned: {problem.assignedTo}, Can Change: {canChangeStatus().toString()}
      </div>
    )}
     */}
    <div className="btn-group btn-group-sm" role="group">
      <button
        className={`btn ${problem.status === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
        onClick={() => handleStatusChange('pending')}
        disabled={problem.status === 'pending' || problem.status === 'pending_approval'}
        style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
      >
        Pending
      </button>
      <button
        className={`btn ${problem.status === 'in_progress' ? 'btn-info' : 'btn-outline-info'}`}
        onClick={() => handleStatusChange('in_progress')}
        disabled={problem.status === 'in_progress' || problem.status === 'pending_approval'}
        style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
      >
        In Progress
      </button>
      <button
        className={`btn ${problem.status === 'pending_approval' ? 'btn-secondary' : 'btn-outline-success'}`}
        onClick={() => handleStatusChange('done')}
        disabled={problem.status === 'pending_approval'}
        style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
      >
        {problem.status === 'pending_approval' ? (
          <>⏳ Waiting Approval</>
        ) : (
          <>✓ {canApprove() ? 'Mark Solved' : 'Submit for Approval'}</>
        )}
      </button>
    </div>
    
    {/* Show waiting message when in pending_approval */}
    {problem.status === 'pending_approval' && (
      <div className="mt-2">
        <small className="text-warning">
          ⏳ This problem is waiting for admin/team leader approval
        </small>
      </div>
    )}
  </div>
)}
                  </div>
                </div>
              </div>

              {/* Right Sidebar - Activity & Comments */}
              {!rightSidebarMinimized ? (
                <div className="col-lg-4">
                  <div className="card shadow-sm border-0 mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center"
                      style={{ 
                        background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
                        color: 'white',
                        padding: '1rem 1.5rem'
                      }}
                    >
                      <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                        <FaComments className="me-2" />
                        Activity & Discussion
                      </h5>
                    </div>
                    <div className="card-body p-0">
                      {/* Resolution Duration */}
                      {resolutionDuration && (
                        <div className="p-3 border-bottom">
                          <div className="d-flex align-items-center mb-2">
                            <FaClock className="text-success me-2" />
                            <h6 className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '600' }}>Resolution Duration</h6>
                          </div>
                          <div className="bg-light rounded p-2">
                            <div className="text-center">
                              <div className="fw-bold text-success" style={{ fontSize: '1.1rem' }}>
                                {resolutionDuration}
                              </div>
                              <small className="text-muted">
                                Created: {new Date(problem.createdAt).toLocaleDateString()}<br/>
                                Resolved: {new Date(problem.resolvedAt).toLocaleDateString()}
                              </small>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Transfer History */}
                      {problem.transferHistory && problem.transferHistory.length > 0 && (
                        <div className="p-3 border-bottom">
                          <div className="d-flex align-items-center mb-2">
                            <FaExchangeAlt className="text-info me-2" />
                            <h6 className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '600' }}>Transfer History</h6>
                          </div>
                          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                            {problem.transferHistory.map((transfer, index) => (
                              <div key={index} className="mb-2 pb-2 border-bottom">
                                <div className="d-flex justify-content-between align-items-start">
                                  <div>
                                    <small className="fw-semibold d-block">{getUserName(transfer.from)}</small>
                                    <small className="text-muted">to {getUserName(transfer.to)}</small>
                                  </div>
                                  <small className="text-muted text-end">
                                    {new Date(transfer.date).toLocaleDateString()}<br/>
                                    {new Date(transfer.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  </small>
                                </div>
                                <small className="text-muted">
                                  By {transfer.by}
                                </small>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Chat-style Comments */}
                      <div className="p-3">
                        <div className="d-flex align-items-center mb-3">
                          <FaComments className="text-primary me-2" />
                          <h6 className="mb-0" style={{ fontSize: '0.95rem', fontWeight: '600' }}>Live Discussion</h6>
                        </div>
                        
                        {/* Comments List - Chat Style */}
                        <div style={{ height: '300px', overflowY: 'auto', border: '1px solid #e9ecef', borderRadius: '8px', padding: '1rem', backgroundColor: '#f8f9fa' }}>
                          {problem.comments && problem.comments.length > 0 ? (
                            <div className="chat-messages">
                              {problem.comments.map(comment => (
                                <div key={comment.id} className="mb-3">
                                  <div className="d-flex gap-2">
                                    <div className="flex-shrink-0">
                                      <div 
                                        className="rounded-circle d-flex align-items-center justify-content-center text-white fw-bold"
                                        style={{ 
                                          width: '32px', 
                                          height: '32px', 
                                          backgroundColor: comment.authorRole === 'admin' ? '#dc3545' : 
                                                        comment.authorRole === 'team_leader' ? '#0d6efd' : '#6c757d',
                                          fontSize: '0.8rem'
                                        }}
                                      >
                                        {comment.author?.charAt(0)?.toUpperCase() || 'U'}
                                      </div>
                                    </div>
                                    <div className="flex-grow-1">
                                      <div className="bg-white rounded p-2 shadow-sm">
                                        <div className="d-flex justify-content-between align-items-start mb-1">
                                          <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                            {comment.author}
                                            {comment.authorRole === 'admin' && (
                                              <span className="badge bg-danger ms-1" style={{ fontSize: '0.6rem' }}>ADMIN</span>
                                            )}
                                            {comment.authorRole === 'team_leader' && (
                                              <span className="badge bg-primary ms-1" style={{ fontSize: '0.6rem' }}>LEADER</span>
                                            )}
                                            {comment.type === 'solution' && (
                                              <span className="badge bg-success ms-1" style={{ fontSize: '0.6rem' }}>SOLUTION</span>
                                            )}
                                          </span>
                                          <small className="text-muted">
                                            {comment.time}
                                          </small>
                                        </div>
                                        <p className="mb-0" style={{ fontSize: '0.8rem', lineHeight: '1.4' }}>
                                          {comment.text || comment.comment}
                                        </p>
                                      </div>
                                      <small className="text-muted ms-2">
                                        {comment.date}
                                      </small>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="text-center text-muted py-4">
                              <FaComments size={32} className="mb-2" />
                              <p className="mb-0" style={{ fontSize: '0.9rem' }}>No comments yet</p>
                              <small>Start the discussion</small>
                            </div>
                          )}
                        </div>

                        {/* Add Comment Form */}
                        <form onSubmit={handleAddComment} className="mt-3">
                          <div className="input-group">
                            <textarea
                              className="form-control form-control-sm"
                              rows="2"
                              placeholder="Type your message..."
                              value={comment}
                              onChange={(e) => setComment(e.target.value)}
                              style={{ fontSize: '0.8rem', resize: 'none' }}
                            ></textarea>
                            <button
                              type="submit"
                              className="btn btn-primary btn-sm"
                              disabled={submittingComment || !comment.trim()}
                              style={{ fontSize: '0.8rem' }}
                            >
                              <FaPaperPlane size={12} />
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Minimized Right Sidebar */
                <div className="col-lg-1">
                  <div className="card shadow-sm border-0">
                    <div className="card-body text-center p-3">
                      <button 
                        className="btn btn-outline-primary btn-sm mb-3"
                        onClick={toggleRightSidebar}
                        title="Expand activity panel"
                      >
                        <FaComments />
                      </button>
                      <div style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
                        <small className="text-muted">Activity</small>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Image Modal */}
      {selectedImage && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ 
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1050,
            cursor: 'pointer'
          }}
          onClick={() => setSelectedImage(null)}
        >
          <div className="position-relative">
            <button
              className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
              onClick={() => setSelectedImage(null)}
              style={{ zIndex: 1051 }}
            >
              <FaTimes />
            </button>
            <img 
              src={selectedImage}
              alt="Full Size"
              style={{ 
                maxWidth: '90%',
                maxHeight: '90%',
                boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
                borderRadius: '10px'
              }}
            />
          </div>
        </div>
      )}

      {/* Transfer Problem Modal */}
      {showTransferModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <FaExchangeAlt className="me-2" />
                  Transfer Problem
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
                  <strong>Transfer Rules:</strong>
                  <ul className="mb-0 small">
                    <li>You cannot transfer problems to the person who created it</li>
                    <li>Only Admin and Team Leaders can transfer problems</li>
                    <li>Problem status will be reset to "Pending" after transfer</li>
                  </ul>
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Transfer To:</label>
                  <select
                    className="form-control"
                    value={transferTo}
                    onChange={(e) => setTransferTo(e.target.value)}
                    disabled={transferring}
                  >
                    <option value="">-- Select User --</option>
                    {getAvailableUsersForTransfer().map(user => (
                      <option key={user.id} value={user.name}>
                        {user.name} ({user.role === 'team_leader' ? 'Team Leader' : 'User'}) - {user.department}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    Available users for transfer (excluding problem creator)
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Transfer Reason (Optional):</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Explain why you are transferring this problem..."
                    disabled={transferring}
                  ></textarea>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button 
                    className="btn btn-warning flex-grow-1"
                    onClick={handleTransferProblem}
                    disabled={!transferTo || transferring}
                  >
                    {transferring ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" role="status">
                          <span className="visually-hidden">Transferring...</span>
                        </div>
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
    </div>
  );
}