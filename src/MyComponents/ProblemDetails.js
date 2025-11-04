import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ProblemDetails() {
  const { id } = useParams();
  const { user } = useAuth();
  const { notifyStatusChange, notifyCompletion } = useNotifications();
  const navigate = useNavigate();
  const [problem, setProblem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

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
    // Check if user is trying to mark as done
    if (newStatus === 'done' && !canApprove()) {
      // Assigned user marks as pending_approval instead of done
      handleStatusChange('pending_approval');
      return;
    }

    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = problems.map(p =>
        p.id === parseInt(id) ? { ...p, status: newStatus } : p
      );
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      
      // Send notification
      if (problem.assignedTo) {
        notifyStatusChange(problem.id, newStatus, user?.name, problem.assignedTo);
      }
      
      // If approved as done by admin/leader, notify completion
      if (newStatus === 'done' && canApprove()) {
        notifyCompletion(problem.id, user?.name);
      }
      
      const statusMsg = newStatus === 'pending_approval' 
        ? 'Submitted for approval! Admin/Team Leader will review.'
        : 'Status updated successfully!';
      
      toast.success(statusMsg);
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
        p.id === parseInt(id) ? { 
          ...p, 
          status: 'done',
          approvedBy: user?.name,
          approvedAt: new Date().toISOString()
        } : p
      );
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      
      notifyCompletion(problem.id, user?.name);
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
        p.id === parseInt(id) ? { 
          ...p, 
          status: 'in_progress',
          rejectionReason: reason || 'Needs more work',
          rejectedBy: user?.name,
          rejectedAt: new Date().toISOString()
        } : p
      );
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      
      if (problem.assignedTo) {
        notifyStatusChange(problem.id, 'in_progress', user?.name, problem.assignedTo);
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
            user: {
              name: user?.name,
              email: user?.email
            },
            created_at: new Date().toISOString()
          };
          return {
            ...p,
            comments: [...(p.comments || []), newComment]
          };
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
        <div className="container mt-5 text-center">
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
          <div className="alert alert-danger">
            <h4>Problem not found</h4>
            <p>The problem you're looking for doesn't exist or has been deleted.</p>
            <button className="btn btn-primary" onClick={() => navigate('/problems')}>
              Back to Problems List
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="row">
          <div className="col-12 mb-3">
            <button className="btn btn-secondary" onClick={() => navigate('/problems')}>
              ← Back to Problems
            </button>
          </div>

          {/* Problem Details Card */}
          <div className="col-lg-8">
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Problem #{problem.id}</h4>
                {canDelete() && (
                  <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                    🗑 Delete
                  </button>
                )}
              </div>
              <div className="card-body">
                {/* Pending Approval Alert */}
                {problem.status === 'pending_approval' && (
                  <div className="alert alert-warning mb-4">
                    <h5 className="alert-heading">⏳ Waiting for Approval</h5>
                    <p className="mb-0">
                      {canApprove() 
                        ? 'This problem has been marked as complete. Please review and approve or reject.'
                        : 'Your completion request is pending Admin/Team Leader approval.'}
                    </p>
                  </div>
                )}

                {/* Rejection Notice */}
                {problem.rejectionReason && problem.status === 'in_progress' && (
                  <div className="alert alert-danger mb-4">
                    <h6>❌ Completion Rejected</h6>
                    <p className="mb-1"><strong>Reason:</strong> {problem.rejectionReason}</p>
                    <small>Rejected by {problem.rejectedBy} on {new Date(problem.rejectedAt).toLocaleString()}</small>
                  </div>
                )}

                {/* Basic Info */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Department:</strong> {problem.department}</p>
                    <p><strong>Priority:</strong> 
                      <span className={`badge ms-2 ${getPriorityBadge(problem.priority)}`}>
                        {problem.priority}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Status:</strong> 
                      <span className={`badge ms-2 ${getStatusBadge(problem.status)}`}>
                        {problem.status === 'pending_approval' ? 'PENDING APPROVAL' : problem.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </p>
                    <p><strong>Created:</strong> {new Date(problem.createdAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Problem Statement */}
                <div className="mb-3">
                  <h5>Problem Statement</h5>
                  <p className="border p-3 rounded bg-light">{problem.statement}</p>
                </div>

                {/* Created By / Assigned To */}
                <div className="row mb-3">
                  <div className="col-md-6">
                    <p><strong>Created By:</strong> {problem.createdBy}</p>
                  </div>
                  <div className="col-md-6">
                    <p><strong>Currently Assigned To:</strong> 
                      {problem.assignedTo ? (
                        <span className="badge bg-info ms-2">{problem.assignedTo}</span>
                      ) : (
                        <span className="text-muted ms-2">Not assigned yet</span>
                      )}
                    </p>
                  </div>
                </div>

                {/* Approval/Rejection Section for Admin/Team Leader */}
                {problem.status === 'pending_approval' && canApprove() && (
                  <div className="mb-4">
                    <h5>Review Completion</h5>
                    <div className="d-flex gap-2">
                      <button 
                        className="btn btn-success"
                        onClick={handleApproveCompletion}
                      >
                        ✓ Approve Completion
                      </button>
                      <button 
                        className="btn btn-danger"
                        onClick={handleRejectCompletion}
                      >
                        ✗ Reject & Send Back
                      </button>
                    </div>
                  </div>
                )}

                {/* Status Change Buttons for Assigned User */}
                {canChangeStatus() && problem.status !== 'pending_approval' && (
                  <div className="mb-3">
                    <h5>Update Status</h5>
                    <div className="btn-group" role="group">
                      <button
                        className={`btn ${problem.status === 'pending' ? 'btn-warning' : 'btn-outline-warning'}`}
                        onClick={() => handleStatusChange('pending')}
                        disabled={problem.status === 'pending'}
                      >
                        Pending
                      </button>
                      <button
                        className={`btn ${problem.status === 'in_progress' ? 'btn-info' : 'btn-outline-info'}`}
                        onClick={() => handleStatusChange('in_progress')}
                        disabled={problem.status === 'in_progress'}
                      >
                        In Progress
                      </button>
                      {canApprove() ? (
                        <button
                          className={`btn ${problem.status === 'done' ? 'btn-success' : 'btn-outline-success'}`}
                          onClick={() => handleStatusChange('done')}
                          disabled={problem.status === 'done'}
                        >
                          ✓ Mark as Done
                        </button>
                      ) : (
                        <button
                          className="btn btn-outline-success"
                          onClick={() => handleStatusChange('done')}
                          title="Submit for approval"
                        >
                          ✓ Submit for Approval
                        </button>
                      )}
                    </div>
                    {!canApprove() && (
                      <small className="text-muted d-block mt-2">
                        Note: When you mark as "Done", it will be sent to Admin/Team Leader for approval.
                      </small>
                    )}
                  </div>
                )}

                {/* Assignment History */}
                {problem.transferHistory && problem.transferHistory.length > 0 && (
                  <div className="mb-3">
                    <h5>Assignment History</h5>
                    <div className="alert alert-warning">
                      <strong>Total persons involved:</strong> {problem.transferHistory.length + 1}
                    </div>
                    <div className="list-group">
                      {problem.transferHistory.map((transfer, index) => (
                        <div key={index} className="list-group-item">
                          <div className="d-flex align-items-center justify-content-between mb-2">
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                              <span className="badge bg-danger px-3 py-2 fs-6">
                                {transfer.from}
                              </span>
                              <span className="text-primary fs-4 fw-bold">→</span>
                              <span className="badge bg-success px-3 py-2 fs-6">
                                {transfer.to}
                              </span>
                            </div>
                            <small className="text-muted">
                              {new Date(transfer.date).toLocaleString()}
                            </small>
                          </div>
                          <small className="text-muted d-block">
                            <strong>Transferred by:</strong> {transfer.by}
                          </small>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comments Section */}
                <div className="mt-4">
                  <h5>Comments ({problem.comments?.length || 0})</h5>
                  
                  <form onSubmit={handleAddComment} className="mb-3">
                    <div className="mb-2">
                      <textarea
                        className="form-control"
                        rows="3"
                        placeholder="Add a comment..."
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                      ></textarea>
                    </div>
                    <button 
                      type="submit" 
                      className="btn btn-primary"
                      disabled={submittingComment}
                    >
                      {submittingComment ? 'Adding...' : '💬 Add Comment'}
                    </button>
                  </form>

                  <div>
                    {problem.comments && problem.comments.length > 0 ? (
                      problem.comments.map((c) => (
                        <div key={c.id} className="card mb-2">
                          <div className="card-body">
                            <div className="d-flex justify-content-between">
                              <h6 className="mb-1">{c.user?.name}</h6>
                              <small className="text-muted">
                                {new Date(c.created_at).toLocaleString()}
                              </small>
                            </div>
                            <p className="mb-0">{c.comment}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-muted">No comments yet. Be the first to comment!</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-lg-4">
            <div className="card shadow mb-4">
              <div className="card-header bg-info text-white">
                <h5 className="mb-0">Quick Info</h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <strong>Problem ID:</strong> #{problem.id}
                  </li>
                  <li className="mb-2">
                    <strong>Department:</strong> {problem.department}
                  </li>
                  <li className="mb-2">
                    <strong>Priority:</strong> 
                    <span className={`badge ms-2 ${getPriorityBadge(problem.priority)}`}>
                      {problem.priority}
                    </span>
                  </li>
                  <li className="mb-2">
                    <strong>Current Status:</strong> 
                    <span className={`badge ms-2 ${getStatusBadge(problem.status)}`}>
                      {problem.status === 'pending_approval' ? 'PENDING APPROVAL' : problem.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </li>
                  <li className="mb-2">
                    <strong>Created:</strong><br />
                    <small>{new Date(problem.createdAt).toLocaleString()}</small>
                  </li>
                  {problem.approvedBy && (
                    <li className="mb-2">
                      <strong>Approved By:</strong> {problem.approvedBy}<br />
                      <small>{new Date(problem.approvedAt).toLocaleString()}</small>
                    </li>
                  )}
                </ul>
              </div>
            </div>

            <div className="card shadow">
              <div className="card-header bg-secondary text-white">
                <h5 className="mb-0">Activity</h5>
              </div>
              <div className="card-body">
                <ul className="list-unstyled mb-0">
                  <li className="mb-2">
                    <small className="text-muted">
                      📝 Problem created by <strong>{problem.createdBy}</strong>
                    </small>
                  </li>
                  {problem.assignedTo && (
                    <li className="mb-2">
                      <small className="text-muted">
                        👤 Currently assigned to <strong>{problem.assignedTo}</strong>
                      </small>
                    </li>
                  )}
                  {problem.transferHistory && problem.transferHistory.length > 0 && (
                    <li className="mb-2">
                      <small className="text-muted">
                        ⇄ Transferred {problem.transferHistory.length} time(s)
                      </small>
                    </li>
                  )}
                  <li className="mb-2">
                    <small className="text-muted">
                      💬 {problem.comments?.length || 0} comment(s)
                    </small>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}