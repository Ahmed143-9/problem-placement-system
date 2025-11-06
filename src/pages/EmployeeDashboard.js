import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner } from 'react-icons/fa';

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

  useEffect(() => {
    fetchUserProblems();
    setRandomQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, []);

  const fetchUserProblems = () => {
    try {
      const allProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // Problems created by user (Self Issues)
      const createdByMe = allProblems.filter(p => p.createdBy === user?.name);
      
      // Problems assigned to user (for work)
      const assignedToMe = allProblems.filter(p => p.assignedTo === user?.name);
      
      setMyCreatedProblems(createdByMe);
      setAssignedProblems(assignedToMe);
      
      const statsData = {
        my_problems: createdByMe.length, // Only count self-created problems
        assigned_to_me: assignedToMe.length,
        in_progress: assignedToMe.filter(p => p.status === 'in_progress').length,
        completed: assignedToMe.filter(p => p.status === 'done').length
      };
      
      setStats(statsData);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    }
  };

  return (
    <div>
      <Navbar />
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
                              <td><strong>#{problem.id}</strong></td>
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
                        <Link to="/my-issues" className="btn btn-sm btn-primary">
                          View All My Issues ({myCreatedProblems.length})
                        </Link>
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
                          <th>ID</th>
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignedProblems.slice(0, 10).reverse().map(problem => (
                          <tr key={problem.id}>
                            <td><strong>#{problem.id}</strong></td>
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
                              <Link to={`/problem/${problem.id}`} className="btn btn-sm btn-outline-primary">
                                View
                              </Link>
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
              <div className="col-md-4 mb-3">
                <Link to="/problem/create" className="btn btn-primary w-100 py-3">
                  <FaClipboardList className="me-2" style={{ fontSize: '1.5rem' }} />
                  <div>Create New Problem</div>
                </Link>
              </div>
              <div className="col-md-4 mb-3">
                <Link to="/my-issues" className="btn btn-success w-100 py-3">
                  <FaTasks className="me-2" style={{ fontSize: '1.5rem' }} />
                  <div>View My Issues</div>
                </Link>
              </div>
              <div className="col-md-4 mb-3">
                <Link to="/reports" className="btn btn-secondary w-100 py-3">
                  <FaCheckCircle className="me-2" style={{ fontSize: '1.5rem' }} />
                  <div>Download Reports</div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}