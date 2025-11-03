import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ProblemList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = () => {
    try {
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      setProblems(storedProblems);
    } catch (error) {
      toast.error('Failed to fetch problems');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (problemId, newStatus) => {
    try {
      const updatedProblems = problems.map(p => 
        p.id === problemId ? { ...p, status: newStatus } : p
      );
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      setProblems(updatedProblems);
      toast.success(`Problem #${problemId} status updated to ${newStatus.replace('_', ' ').toUpperCase()}!`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const handleAssign = (problemId) => {
    const problem = problems.find(p => p.id === problemId);
    const assignTo = prompt(`Assign Problem #${problemId} to:\n\nEnter username:`);
    
    if (assignTo && assignTo.trim()) {
      try {
        const updatedProblems = problems.map(p => 
          p.id === problemId ? { ...p, assignedTo: assignTo.trim() } : p
        );
        localStorage.setItem('problems', JSON.stringify(updatedProblems));
        setProblems(updatedProblems);
        toast.success(`Problem #${problemId} assigned to ${assignTo.trim()}!`);
      } catch (error) {
        toast.error('Failed to assign problem');
        console.error(error);
      }
    }
  };

  const handleTransfer = (problemId, currentAssignee) => {
    const transferTo = prompt(
      `Transfer Problem #${problemId} from ${currentAssignee}\n\nTransfer to (username):`
    );
    
    if (transferTo && transferTo.trim()) {
      try {
        const updatedProblems = problems.map(p => 
          p.id === problemId ? { 
            ...p, 
            assignedTo: transferTo.trim(),
            transferHistory: [
              ...(p.transferHistory || []),
              {
                from: currentAssignee,
                to: transferTo.trim(),
                date: new Date().toISOString(),
                by: user?.name || 'Admin'
              }
            ]
          } : p
        );
        localStorage.setItem('problems', JSON.stringify(updatedProblems));
        setProblems(updatedProblems);
        toast.success(`Problem #${problemId} transferred to ${transferTo.trim()}!`);
      } catch (error) {
        toast.error('Failed to transfer problem');
        console.error(error);
      }
    }
  };

  const handleDelete = (problemId) => {
    if (window.confirm(`Are you sure you want to delete Problem #${problemId}?`)) {
      try {
        const updatedProblems = problems.filter(p => p.id !== problemId);
        localStorage.setItem('problems', JSON.stringify(updatedProblems));
        setProblems(updatedProblems);
        toast.success(`Problem #${problemId} deleted!`);
      } catch (error) {
        toast.error('Failed to delete problem');
        console.error(error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      in_progress: 'bg-info',
      done: 'bg-success'
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

  // Check if user can modify problem
  const canModify = (problem) => {
    return user?.role === 'admin' || 
           user?.name === problem.assignedTo ||
           user?.name === problem.createdBy;
  };

  // Filter problems
  const filteredProblems = problems.filter(problem => {
    const matchesStatus = filterStatus === 'all' || problem.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || problem.department === filterDepartment;
    const matchesPriority = filterPriority === 'all' || problem.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      problem.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.id.toString().includes(searchTerm);
    
    return matchesStatus && matchesDepartment && matchesPriority && matchesSearch;
  });

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

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <h3 className="mb-0">All Problems</h3>
            <button 
              className="btn btn-light btn-sm"
              onClick={() => navigate('/problem/create')}
            >
              + Create New Problem
            </button>
          </div>
          <div className="card-body">
            {/* Filters */}
            <div className="row mb-4">
              <div className="col-md-3 mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ID or statement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-3 mb-2">
                <select
                  className="form-control"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                </select>
              </div>
              <div className="col-md-3 mb-2">
                <select
                  className="form-control"
                  value={filterDepartment}
                  onChange={(e) => setFilterDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  <option value="Tech">Tech</option>
                  <option value="Business">Business</option>
                  <option value="Accounts">Accounts</option>
                </select>
              </div>
              <div className="col-md-3 mb-2">
                <select
                  className="form-control"
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                >
                  <option value="all">All Priorities</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>
            </div>

            {/* Results Count */}
            <div className="mb-3">
              <small className="text-muted">
                Showing {filteredProblems.length} of {problems.length} problems
              </small>
            </div>

            {/* Problems Table */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Priority</th>
                    <th>Problem Statement</th>
                    <th>Status</th>
                    <th>Created By</th>
                    <th>Assigned To</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="text-center py-4">
                        <p className="text-muted mb-0">
                          {problems.length === 0 
                            ? 'No problems found. Create your first problem!' 
                            : 'No problems match your filters.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.slice().reverse().map((problem) => (
                      <tr key={problem.id}>
                        <td>
                          <strong>#{problem.id}</strong>
                        </td>
                        <td>{problem.department}</td>
                        <td>
                          <span className={`badge ${getPriorityBadge(problem.priority)}`}>
                            {problem.priority}
                          </span>
                        </td>
                        <td>
                          <div 
                            style={{ 
                              maxWidth: '200px', 
                              overflow: 'hidden', 
                              textOverflow: 'ellipsis', 
                              whiteSpace: 'nowrap' 
                            }}
                            title={problem.statement}
                          >
                            {problem.statement}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${getStatusBadge(problem.status)}`}>
                            {problem.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>{problem.createdBy}</td>
                        <td>
                          {problem.assignedTo ? (
                            <span className="badge bg-info">{problem.assignedTo}</span>
                          ) : (
                            <span className="badge bg-secondary">Unassigned</span>
                          )}
                        </td>
                        <td>
                          <div className="btn-group" role="group">
                            {/* View Details */}
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/problem/${problem.id}`)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i> Details
                            </button>

                            {/* Status Switch Dropdown */}
                            {canModify(problem) && (
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-secondary dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  title="Change Status"
                                >
                                  Status
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleStatusChange(problem.id, 'pending')}
                                      disabled={problem.status === 'pending'}
                                    >
                                      <span className="badge bg-warning text-dark me-2">●</span>
                                      Pending
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleStatusChange(problem.id, 'in_progress')}
                                      disabled={problem.status === 'in_progress'}
                                    >
                                      <span className="badge bg-info me-2">●</span>
                                      In Progress
                                    </button>
                                  </li>
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleStatusChange(problem.id, 'done')}
                                      disabled={problem.status === 'done'}
                                    >
                                      <span className="badge bg-success me-2">●</span>
                                      Done
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            )}

                            {/* Admin Actions Dropdown */}
                            {user?.role === 'admin' && (
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-danger dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  title="Admin Actions"
                                >
                                  Assign
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => handleAssign(problem.id)}
                                    >
                                      {problem.assignedTo ? '↻ Reassign' : '→ Assign'}
                                    </button>
                                  </li>
                                  {problem.assignedTo && (
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => handleTransfer(problem.id, problem.assignedTo)}
                                      >
                                        ⇄ Transfer
                                      </button>
                                    </li>
                                  )}
                                  <li><hr className="dropdown-divider" /></li>
                                  <li>
                                    <button
                                      className="dropdown-item text-danger"
                                      onClick={() => handleDelete(problem.id)}
                                    >
                                      🗑 Delete
                                    </button>
                                  </li>
                                </ul>
                              </div>
                            )}

                            {/* Transfer for Assigned User */}
                            {user?.role !== 'admin' && user?.name === problem.assignedTo && (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => handleTransfer(problem.id, problem.assignedTo)}
                                title="Transfer to someone else"
                              >
                                Transfer
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {problems.length > 0 && (
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card border-warning">
                    <div className="card-body text-center">
                      <h4 className="text-warning mb-0">
                        {problems.filter(p => p.status === 'pending').length}
                      </h4>
                      <small className="text-muted">Pending</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-info">
                    <div className="card-body text-center">
                      <h4 className="text-info mb-0">
                        {problems.filter(p => p.status === 'in_progress').length}
                      </h4>
                      <small className="text-muted">In Progress</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <h4 className="text-success mb-0">
                        {problems.filter(p => p.status === 'done').length}
                      </h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-secondary">
                    <div className="card-body text-center">
                      <h4 className="text-secondary mb-0">
                        {problems.filter(p => !p.assignedTo).length}
                      </h4>
                      <small className="text-muted">Unassigned</small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Legend */}
            <div className="alert alert-info mt-4 mb-0">
              <strong>Actions Guide:</strong>
              <ul className="mb-0 mt-2">
                <li><strong>View:</strong> See full problem details</li>
                <li><strong>Switch:</strong> Change problem status (Pending/In Progress/Done)</li>
                <li><strong>Admin:</strong> Assign, Transfer, or Delete (Admin only)</li>
                <li><strong>Transfer:</strong> Transfer work to another person (if assigned to you)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}