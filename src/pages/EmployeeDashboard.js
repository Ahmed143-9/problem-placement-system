import React, { useState, useEffect, useCallback } from 'react'; // useCallback import করুন
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner, FaExchangeAlt } from 'react-icons/fa';
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

  // useCallback দিয়ে functions গুলো wrap করুন
  const fetchUserProblems = useCallback(() => {
    try {
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // Problems created by user (Self Issues)
      const createdByMe = allProblems.filter(p => p.createdBy === user?.name);
      
      // Problems assigned to user (for work)
      const assignedToMe = allProblems.filter(p => p.assignedTo === user?.name);
      
      setMyCreatedProblems(createdByMe);
      setAssignedProblems(assignedToMe);
      
      const statsData = {
        my_problems: createdByMe.length,
        assigned_to_me: assignedToMe.length,
        in_progress: assignedToMe.filter(p => p.status === 'in_progress').length,
        completed: assignedToMe.filter(p => p.status === 'done').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    }
  }, [user?.name]); // dependencies যোগ করুন

  const fetchTeamMembers = useCallback(() => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      // Filter out current user and inactive users
      const members = storedUsers.filter(u => 
        u.username !== user?.name && u.status === 'active'
      );
      setTeamMembers(members);
    } catch (error) {
      console.error('Failed to fetch team members:', error);
    }
  }, [user?.name]); // dependencies যোগ করুন

  useEffect(() => {
    fetchUserProblems();
    fetchTeamMembers();
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, [fetchUserProblems, fetchTeamMembers]); // dependencies যোগ করুন

  const handleTransferClick = (problem) => {
    setSelectedProblem(problem);
    setTransferTo('');
    setShowTransferModal(true);
  };

  const handleTransferSubmit = () => {
    if (!transferTo.trim()) {
      toast.error('Please select a team member to transfer to');
      return;
    }

    try {
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      const updatedProblems = allProblems.map(p => {
        if (p.id === selectedProblem.id) {
          return {
            ...p,
            assignedTo: transferTo,
            transferHistory: [
              ...(p.transferHistory || []),
              {
                from: user?.name,
                to: transferTo,
                date: new Date().toISOString(),
                by: user?.name
              }
            ]
          };
        }
        return p;
      });

      localStorage.setItem('problems', JSON.stringify(updatedProblems));
      setShowTransferModal(false);
      setTransferTo('');
      setSelectedProblem(null);
      fetchUserProblems();
      toast.success('Work transferred successfully!');
    } catch (error) {
      console.error('Failed to transfer work:', error);
      toast.error('Failed to transfer work. Please try again.');
    }
  };

  return (
    <div>
      <Navbar />
      {/* REMOVED: Sidebar completely */}
      <div className="container mt-4">
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
                                {problem.assignedTo ? (
                                  <span className="badge bg-info">{problem.assignedTo}</span>
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
                <h4 className="mb-0">Work Assigned to Me</h4>
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
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedProblems.slice(0, 10).reverse().map(problem => (
                          <tr key={problem.id}>
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
                        <option key={member.id} value={member.name}>
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