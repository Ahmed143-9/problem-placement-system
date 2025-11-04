import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ProblemList() {
  const { user } = useAuth();
  const { notifyAssignment, notifyTransfer } = useNotifications();
  const navigate = useNavigate();
  const [problems, setProblems] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [isTransfer, setIsTransfer] = useState(false);

  useEffect(() => {
    fetchProblems();
    fetchTeamMembers();
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

  const fetchTeamMembers = () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      // Filter out admin and get only active users
      const members = storedUsers.filter(u => 
        u.username !== 'Admin' && u.status === 'active'
      );
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  };

  const handleStatusChange = (problemId, newStatus) => {
    try {
      const updatedProblems = problems.map(p => 
        p.id === problemId ? { ...p, status: newStatus } : p
      );
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      setProblems(updatedProblems);
      toast.success(`Problem #${problemId} status updated!`);
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const openAssignModal = (problem, transfer = false) => {
    setSelectedProblem(problem);
    setIsTransfer(transfer);
    setSelectedMember('');
    setShowAssignModal(true);
  };

  const handleAssignSubmit = () => {
    if (!selectedMember) {
      toast.error('Please select a team member');
      return;
    }

    try {
      const updatedProblems = problems.map(p => {
        if (p.id === selectedProblem.id) {
          const updatedProblem = { ...p, assignedTo: selectedMember };
          
          // If it's a transfer, add to transfer history
          if (isTransfer && p.assignedTo) {
            updatedProblem.transferHistory = [
              ...(p.transferHistory || []),
              {
                from: p.assignedTo,
                to: selectedMember,
                date: new Date().toISOString(),
                by: user?.name || 'Admin'
              }
            ];
            
            // Send transfer notification
            notifyTransfer(p.id, p.assignedTo, selectedMember, user?.name);
          } else {
            // Send assignment notification
            notifyAssignment(p.id, selectedMember, user?.name);
          }
          
          return updatedProblem;
        }
        return p;
      });
      
      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      setProblems(updatedProblems);
      
      toast.success(
        isTransfer 
          ? `Problem #${selectedProblem.id} transferred to ${selectedMember}!`
          : `Problem #${selectedProblem.id} assigned to ${selectedMember}!`
      );
      
      setShowAssignModal(false);
      setSelectedProblem(null);
      setSelectedMember('');
    } catch (error) {
      toast.error('Failed to assign problem');
      console.error(error);
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

  const canModify = (problem) => {
    return user?.role === 'admin' || 
           user?.role === 'team_leader' ||
           user?.name === problem.assignedTo ||
           user?.name === problem.createdBy;
  };

  const canAssign = () => {
    return user?.role === 'admin' || user?.role === 'team_leader';
  };

  const canTransfer = (problem) => {
    // Can transfer only if problem is not done and user is assigned to it or is admin/leader
    return problem.status !== 'done' && 
           problem.status !== 'pending_approval' &&
           (user?.role === 'admin' || 
            user?.role === 'team_leader' || 
            user?.name === problem.assignedTo);
  };

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
                  <option value="pending_approval">Pending Approval</option>
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
                        <td><strong>#{problem.id}</strong></td>
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
                            {problem.status === 'pending_approval' ? 'Pending Approval' : problem.status.replace('_', ' ').toUpperCase()}
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
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => navigate(`/problem/${problem.id}`)}
                              title="View Details"
                            >
                              <i className="bi bi-eye"></i> View
                            </button>

                            {/* Admin/Leader Actions - Hide if problem is done */}
                            {canAssign() && problem.status !== 'done' && (
                              <div className="btn-group" role="group">
                                <button
                                  className="btn btn-sm btn-outline-success dropdown-toggle"
                                  data-bs-toggle="dropdown"
                                  title="Assign/Transfer"
                                >
                                  Assign
                                </button>
                                <ul className="dropdown-menu">
                                  <li>
                                    <button
                                      className="dropdown-item"
                                      onClick={() => openAssignModal(problem, false)}
                                    >
                                      {problem.assignedTo ? '↻ Reassign' : '→ Assign to Member'}
                                    </button>
                                  </li>
                                  {problem.assignedTo && canTransfer(problem) && (
                                    <li>
                                      <button
                                        className="dropdown-item"
                                        onClick={() => openAssignModal(problem, true)}
                                      >
                                        ⇄ Transfer to Another
                                      </button>
                                    </li>
                                  )}
                                  {user?.role === 'admin' && (
                                    <>
                                      <li><hr className="dropdown-divider" /></li>
                                      <li>
                                        <button
                                          className="dropdown-item text-danger"
                                          onClick={() => handleDelete(problem.id)}
                                        >
                                          🗑 Delete Problem
                                        </button>
                                      </li>
                                    </>
                                  )}
                                </ul>
                              </div>
                            )}

                            {/* Transfer for Assigned User - Only if not done */}
                            {!canAssign() && canTransfer(problem) && user?.name === problem.assignedTo && (
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() => openAssignModal(problem, true)}
                                title="Transfer to someone else"
                              >
                                Transfer
                              </button>
                            )}

                            {/* Show "Completed" badge instead of actions if done */}
                            {problem.status === 'done' && (
                              <span className="badge bg-success ms-2">
                                ✓ Completed
                              </span>
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
          </div>
        </div>
      </div>

      {/* Assign/Transfer Modal */}
      {showAssignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white">
                <h5 className="modal-title">
                  {isTransfer ? '⇄ Transfer Problem' : '→ Assign Problem'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <p className="text-muted">
                    Problem #{selectedProblem?.id} - {selectedProblem?.department}
                  </p>
                  {isTransfer && selectedProblem?.assignedTo && (
                    <p className="text-info">
                      <strong>Currently assigned to:</strong> {selectedProblem.assignedTo}
                    </p>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    {isTransfer ? 'Transfer to:' : 'Assign to:'} *
                  </label>
                  <select
                    className="form-control"
                    value={selectedMember}
                    onChange={(e) => setSelectedMember(e.target.value)}
                  >
                    <option value="">-- Select Team Member --</option>
                    {teamMembers.map(member => (
                      <option 
                        key={member.id} 
                        value={member.name}
                        disabled={member.name === selectedProblem?.assignedTo}
                      >
                        {member.name} ({member.role === 'team_leader' ? 'Team Leader' : 'User'}) - {member.department}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    {teamMembers.length === 0 
                      ? 'No team members available. Please add members in Admin Panel.'
                      : `${teamMembers.length} team member(s) available`}
                  </small>
                </div>

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-success flex-grow-1"
                    onClick={handleAssignSubmit}
                    disabled={!selectedMember}
                  >
                    {isTransfer ? 'Transfer' : 'Assign'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowAssignModal(false)}
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