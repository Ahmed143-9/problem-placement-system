import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';

export default function MyIssues() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myProblems, setMyProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMyProblems();
  }, []);

  const fetchMyProblems = () => {
    try {
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      // Only show problems created by the current user
      const userProblems = allProblems.filter(p => p.createdBy === user?.name);
      setMyProblems(userProblems);
    } catch (error) {
      toast.error('Failed to fetch your problems');
      console.error(error);
    } finally {
      setLoading(false);
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

  const filteredProblems = myProblems.filter(problem => {
    const matchesStatus = filterStatus === 'all' || problem.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || problem.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      problem.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.id.toString().includes(searchTerm);
    
    return matchesStatus && matchesPriority && matchesSearch;
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
            <div>
              <h3 className="mb-0">My Issues</h3>
              <small>Problems I have raised - Track who is solving them</small>
            </div>
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
              <div className="col-md-4 mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Search by ID or statement..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="col-md-4 mb-2">
                <select
                  className="form-control"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="done">Done</option>
                  <option value="pending_approval">Pending Approval</option>
                </select>
              </div>
              <div className="col-md-4 mb-2">
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

            <div className="mb-3">
              <small className="text-muted">
                Showing {filteredProblems.length} of {myProblems.length} problems
              </small>
            </div>

            {/* Problems Table */}
            <div className="table-responsive">
              <table className="table table-hover">
                <thead className="table-light">
                  <tr>
                    <th>ID</th>
                    <th>Department</th>
                    <th>Service</th>
                    <th>Priority</th>
                    <th>Problem Statement</th>
                    <th>Status</th>
                    <th>Assigned To</th>
                    <th>Created Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProblems.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-4">
                        <p className="text-muted mb-0">
                          {myProblems.length === 0 
                            ? 'You haven\'t raised any problems yet. Create your first issue!' 
                            : 'No problems match your filters.'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredProblems.slice().reverse().map((problem) => (
                      <tr key={problem.id}>
                        <td><strong>#{problem.id}</strong></td>
                        <td>{problem.department}</td>
                        <td>{problem.service}</td>
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
                            {problem.status === 'pending_approval' ? 'Pending Approval' : problem.status.replace('_', ' ').toUpperCase()}
                          </span>
                        </td>
                        <td>
                          {problem.assignedTo ? (
                            <div>
                              <span className="badge bg-info">{problem.assignedTo}</span>
                              {problem.transferHistory && problem.transferHistory.length > 0 && (
                                <small className="d-block text-muted mt-1">
                                  Transferred {problem.transferHistory.length} time(s)
                                </small>
                              )}
                            </div>
                          ) : (
                            <span className="badge bg-secondary">Not Assigned Yet</span>
                          )}
                        </td>
                        <td>
                          <small>{new Date(problem.createdAt).toLocaleDateString()}</small>
                        </td>
                        <td>
                          <button
                            className="btn btn-sm btn-outline-primary"
                            onClick={() => navigate(`/problem/${problem.id}`)}
                            title="View Details"
                          >
                            <i className="bi bi-eye"></i> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Summary Stats */}
            {myProblems.length > 0 && (
              <div className="row mt-4">
                <div className="col-md-3">
                  <div className="card border-warning">
                    <div className="card-body text-center">
                      <h4 className="text-warning mb-0">
                        {myProblems.filter(p => p.status === 'pending').length}
                      </h4>
                      <small className="text-muted">Pending</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-info">
                    <div className="card-body text-center">
                      <h4 className="text-info mb-0">
                        {myProblems.filter(p => p.status === 'in_progress').length}
                      </h4>
                      <small className="text-muted">In Progress</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-success">
                    <div className="card-body text-center">
                      <h4 className="text-success mb-0">
                        {myProblems.filter(p => p.status === 'done').length}
                      </h4>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-secondary">
                    <div className="card-body text-center">
                      <h4 className="text-secondary mb-0">
                        {myProblems.filter(p => !p.assignedTo).length}
                      </h4>
                      <small className="text-muted">Unassigned</small>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}