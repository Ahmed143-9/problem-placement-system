import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaChevronLeft, FaChevronRight, FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaArrowLeft, FaTimes } from 'react-icons/fa';

export default function ProblemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notifyStatusChange, notifyCompletion } = useNotifications();
  const navigate = useNavigate();

  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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

  const handleStatusChange = (newStatus) => {
    // Check if marking as done and require comment
    if (newStatus === 'done' || newStatus === 'pending_approval') {
      if (!comment.trim()) {
        toast.error('Please add a comment before marking as solved');
        return;
      }
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
            })
          };

          // Add the comment when marking as solved
          if ((newStatus === 'done' || newStatus === 'pending_approval') && comment.trim()) {
            const newComment = {
              id: (p.comments?.length || 0) + 1,
              comment: comment.trim(),
              user: { name: user?.name, email: user?.email },
              created_at: new Date().toISOString()
            };
            updatedProblem.comments = [...(p.comments || []), newComment];
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
      setComment(''); // Clear comment after submission
      fetchProblemDetails();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
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
            id: (p.comments?.length || 0) + 1,
            comment: comment.trim(),
            user: { name: user?.name, email: user?.email },
            created_at: new Date().toISOString()
          };
          return { ...p, comments: [...(p.comments || []), newComment] };
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
    return (
      user?.role === 'admin' ||
      user?.role === 'team_leader' ||
      problem?.assignedTo === user?.name
    );
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

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
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
        {/* Sidebar */}
        <div 
          className="bg-dark text-white position-relative"
          style={{ 
            width: sidebarMinimized ? '70px' : '250px',
            minHeight: '100%',
            transition: 'width 0.3s ease'
          }}
        >
          <button
            onClick={toggleSidebar}
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
              <li className="nav-item mb-2">
                <a 
                  href="/dashboard" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Dashboard"
                >
                  <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                </a>
              </li>
              <li className="nav-item mb-2">
                <a 
                  href="/problem/create" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                </a>
              </li>
              <li className="nav-item mb-2">
                <a 
                  href="/problems" 
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  title="All Problems"
                >
                  <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                </a>
              </li>
              <li className="nav-item mb-2">
                <a 
                  href="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </a>
              </li>
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <a 
                    href="/admin" 
                    className="nav-link text-white rounded d-flex align-items-center"
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Admin Panel"
                  >
                    <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Admin Panel</span>}
                  </a>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 position-relative" style={{ overflowY: 'auto' }}>
          {/* Floating Back Button - Middle of page vertically */}
          {/* <button 
            onClick={() => navigate(-1)}
            className="position-fixed shadow"
            style={{
              top: '50%',
              left: sidebarMinimized ? '90px' : '270px',
              transform: 'translateY(-50%)',
              backdropFilter: 'blur(10px)',
              backgroundColor: 'rgba(255, 255, 255, 0.85)',
              border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '50px',
              padding: '10px 24px',
              fontSize: '0.9rem',
              fontWeight: '500',
              transition: 'all 0.3s',
              color: '#495057',
              zIndex: 100,
              cursor: 'pointer'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-50%) translateX(5px)';
              e.target.style.boxShadow = '0 6px 20px rgba(0,0,0,0.2)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(-50%)';
              e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';
              e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.85)';
            }}
          >
            <FaArrowLeft className="me-2" /> Back
          </button> */}

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
                    {canDelete() && (
                      <button className="btn btn-danger btn-sm" onClick={handleDelete} style={{ fontSize: '0.85rem' }}>
                        🗑 Delete
                      </button>
                    )}
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

                    {/* Images Section with Modal */}
                    {problem.images && problem.images.length > 0 && (
                      <div className="mb-4">
                        <h6 className="mb-3" style={{ fontSize: '0.95rem', fontWeight: '600', color: '#495057' }}>
                          📎 Attached Screenshots
                        </h6>
                        <div className="row g-3">
                          {problem.images.map((img, index) => (
                            <div key={index} className="col-md-4 col-6">
                              <div 
                                className="position-relative overflow-hidden"
                                style={{
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  transition: 'transform 0.2s, box-shadow 0.2s',
                                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                                }}
                                onClick={() => setSelectedImage(img.url)}
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
                                  src={img.url} 
                                  alt={`Screenshot ${index + 1}`}
                                  className="img-fluid"
                                  style={{ 
                                    width: '100%', 
                                    height: '150px', 
                                    objectFit: 'cover',
                                    borderRadius: '10px'
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
                          ))}
                        </div>
                        <small className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                          💡 Click on any image to view full size
                        </small>
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

                    {/* Basic Info - Professional Grid */}
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
                          <div style={{ fontSize: '0.9rem', fontWeight: '500', color: '#495057' }}>{problem.createdBy}</div>
                        </div>
                      </div>
                      <div className="col-md-6">
                        <div className="p-3 bg-light rounded-3" style={{ border: '1px solid #e9ecef' }}>
                          <small className="text-muted d-block mb-1" style={{ fontSize: '0.75rem', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Assigned To</small>
                          {problem.assignedTo ? (
                            <span className="badge bg-info" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>{problem.assignedTo}</span>
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
                        <h6 className="alert-heading mb-2" style={{ fontSize: '1rem', fontWeight: '600' }}>✅ Problem Completed</h6>
                        <p className="mb-0" style={{ fontSize: '0.85rem' }}>This problem has been successfully resolved and marked as done.</p>
                        {problem.approvedBy && (
                          <small className="text-muted d-block mt-2" style={{ fontSize: '0.75rem' }}>
                            Approved by <strong>{problem.approvedBy}</strong> on {new Date(problem.approvedAt).toLocaleString()}
                          </small>
                        )}
                      </div>
                    )}

                    {/* Status Change Buttons */}
                    {canChangeStatus() && problem.status !== 'pending_approval' && problem.status !== 'done' && (
                      <div className="mb-4">
                        <h6 className="mb-2" style={{ fontSize: '0.95rem', fontWeight: '600' }}>Update Status</h6>
                        <div className="btn-group btn-group-sm" role="group">
                          <button
                            className={`btn ${problem.status === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                            onClick={() => handleStatusChange('pending')}
                            disabled={problem.status === 'pending'}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                          >
                            Pending
                          </button>
                          <button
                            className={`btn ${problem.status === 'in_progress' ? 'btn-info' : 'btn-outline-info'}`}
                            onClick={() => handleStatusChange('in_progress')}
                            disabled={problem.status === 'in_progress'}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                          >
                            In Progress
                          </button>
                          <button
                            className="btn btn-outline-success"
                            onClick={() => handleStatusChange('done')}
                            style={{ fontSize: '0.8rem', padding: '0.4rem 0.9rem' }}
                          >
                            ✓ {canApprove() ? 'Mark Solved' : 'Submit'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                {/* Comments Section */}
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header"
                    style={{ 
                      background: 'linear-gradient(135deg, #43cea2 0%, #185a9d 100%)',
                      color: 'white',
                      padding: '1rem 1.5rem'
                    }}
                  >
                    <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                      💬 Comments
                    </h5>
                  </div>
                  <div className="card-body" style={{ padding: '1.5rem' }}>
                    {/* Comment Form */}
                    <form onSubmit={handleAddComment} className="mb-4">
                      <div className="mb-3">
                        <label htmlFor="comment" className="form-label" style={{ fontSize: '0.9rem', fontWeight: '600' }}>
                          Add a Comment
                        </label>
                        <textarea
                          id="comment"
                          className="form-control"
                          rows="3"
                          value={comment}
                          onChange={(e) => setComment(e.target.value)}
                          style={{ fontSize: '0.9rem' }}
                        ></textarea>
                      </div>
                      <button 
                        type="submit"
                        className="btn btn-primary"
                        disabled={submittingComment}
                        style={{ fontSize: '0.9rem', padding: '0.5rem 1.2rem' }}
                      >
                        {submittingComment ? 'Submitting...' : 'Submit Comment'}
                      </button>
                    </form>
                    {/* Comments List */}
                    {problem.comments && problem.comments.length > 0 ? (
                      <div>
                        {problem.comments.map(c => (
                          <div key={c.id} className="mb-3 pb-3 border-bottom" style={{ fontSize: '0.9rem' }}>
                            <div className="d-flex justify-content-between align-items-center mb-1">
                              <strong style={{ fontSize: '0.95rem' }}>{c.user.name}</strong>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                                {new Date(c.created_at).toLocaleString()}
                              </small>
                            </div>
                            <div style={{ color: '#495057', lineHeight: '1.5' }}>
                              {c.comment}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-muted" style={{ fontSize: '0.9rem' }}>No comments yet. Be the first to comment!</p>
                    )}
                  </div>
                </div>
              </div>
              {/* Sidebar - Problem Metadata */}
              <div className="col-lg-4">
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header"
                    style={{ 
                      background: 'linear-gradient(135deg, #ff9966 0%, #ff5e62 100%)',
                      color: 'white',
                      padding: '1rem 1.5rem'
                    }}
                  >
                    <h5 className="mb-0" style={{ fontSize: '1.1rem', fontWeight: '500' }}>
                      🗂 Problem Details
                    </h5>
                  </div>
                  <div className="card-body" style={{ padding: '1.5rem' }}>
                    <ul className="list-group list-group-flush">
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Problem ID:</strong></span>
                        <span>{problem.id}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Department:</strong></span>
                        <span>{problem.department}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Priority:</strong></span>
                        <span>{problem.priority}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Status:</strong></span>
                        <span className={getStatusBadge(problem.status)} style={{ fontSize: '0.8rem', padding: '0.25rem 0.6rem' }}>
                          {problem.status === 'pending_approval' ? 'PENDING APPROVAL' : problem.status.replace('_', ' ').toUpperCase()}
                        </span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Created At:</strong></span>
                        <span>{new Date(problem.createdAt).toLocaleString()}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Created By:</strong></span>
                        <span>{problem.createdBy}</span>
                      </li>
                      <li className="list-group-item d-flex justify-content-between align-items-center" style={{ fontSize: '0.9rem' }}>
                        <span><strong>Assigned To:</strong></span>
                        <span>{problem.assignedTo || 'Unassigned'}</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
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
      )}
    </div>
  );
}