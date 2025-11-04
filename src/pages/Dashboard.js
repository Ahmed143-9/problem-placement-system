import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner, FaChartBar, FaPlusCircle, FaUsersCog, FaHome, FaExclamationTriangle, FaFileAlt } from 'react-icons/fa';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
    fetchAnalytics();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = () => {
    try {
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      setProblems(storedProblems);
      
      // Calculate analytics
      const analyticsData = {
        total: storedProblems.length,
        pending: storedProblems.filter(p => p.status === 'pending').length,
        in_progress: storedProblems.filter(p => p.status === 'in_progress').length,
        done: storedProblems.filter(p => p.status === 'done').length,
        by_department: {
          Tech: storedProblems.filter(p => p.department === 'Tech').length,
          Business: storedProblems.filter(p => p.department === 'Business').length,
          Accounts: storedProblems.filter(p => p.department === 'Accounts').length
        },
        by_priority: {
          High: storedProblems.filter(p => p.priority === 'High').length,
          Medium: storedProblems.filter(p => p.priority === 'Medium').length,
          Low: storedProblems.filter(p => p.priority === 'Low').length
        }
      };
      
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    }
  };

  const sidebarLinkStyle = {
    transition: 'background-color 0.2s'
  };

  const hoverCardStyle = {
    transition: 'transform 0.2s'
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column min-vh-100">
      {/* Top Navbar */}
      <Navbar />
      
      <div className="d-flex flex-grow-1">
        {/* Left Sidebar */}
        <div className="bg-dark text-white" style={{ width: '250px', minHeight: '100%' }}>
          <div className="p-3">
            <h5 className="text-center mb-4 pb-3 border-bottom border-secondary">Navigation</h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <Link 
                  to="/dashboard" 
                  className="nav-link text-white bg-primary rounded"
                  style={sidebarLinkStyle}
                >
                  <FaHome className="me-2" /> Dashboard
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problem/create" 
                  className="nav-link text-white rounded"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaPlusCircle className="me-2" /> Create Problem
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problems" 
                  className="nav-link text-white rounded"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaExclamationTriangle className="me-2" /> All Problems
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                >
                  <FaFileAlt className="me-2" /> Download Reports
                </Link>
              </li>
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/admin" 
                    className="nav-link text-white rounded"
                    style={sidebarLinkStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  >
                    <FaUsersCog className="me-2" /> Add Member
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-grow-1 bg-light p-4" style={{ overflowY: 'auto' }}>
          {/* Welcome Section */}
          {/* <div className="card shadow-sm border-0 mb-4">
            <div className="card-body">
              <h3 className="mb-2 fw-bold text-primary">Welcome, {user?.name} 👋</h3>
              <p className="text-muted mb-0">
                <strong>Role:</strong> {user?.role?.replace('_', ' ').toUpperCase()} |{' '}
                <strong>Department:</strong> {user?.department} |{' '}
                <strong>Email:</strong> {user?.email}
              </p>
            </div>
          </div> */}

          {/* Stats Cards */}
          {stats && (
            <>
              <h5 className="mb-3 fw-bold text-secondary">Overview Statistics</h5>
              <div className="row g-3 mb-4">
                <div className="col-md-6 col-lg-3">
                  <div className="card stat-card border-0 shadow-sm text-center bg-primary text-white h-100">
                    <div className="card-body">
                      <FaClipboardList className="fs-2 mb-2" />
                      <h2 className="mb-0">{stats.my_problems || 0}</h2>
                      <p className="mb-0 fw-semibold">My Problems</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="card stat-card border-0 shadow-sm text-center bg-warning text-white h-100">
                    <div className="card-body">
                      <FaTasks className="fs-2 mb-2" />
                      <h2 className="mb-0">{stats.assigned_to_me || 0}</h2>
                      <p className="mb-0 fw-semibold">Assigned to Me</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="card stat-card border-0 shadow-sm text-center bg-info text-white h-100">
                    <div className="card-body">
                      <FaSpinner className="fs-2 mb-2" />
                      <h2 className="mb-0">{stats.in_progress || 0}</h2>
                      <p className="mb-0 fw-semibold">In Progress</p>
                    </div>
                  </div>
                </div>

                <div className="col-md-6 col-lg-3">
                  <div className="card stat-card border-0 shadow-sm text-center bg-success text-white h-100">
                    <div className="card-body">
                      <FaCheckCircle className="fs-2 mb-2" />
                      <h2 className="mb-0">{stats.completed || 0}</h2>
                      <p className="mb-0 fw-semibold">Completed</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Live Progress Analytics */}
          {analytics && (
            <>
              <h5 className="mb-3 fw-bold text-secondary">Live Progress Analytics</h5>
              
              {/* Overall Progress */}
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Overall Progress Status</h6>
                  {analytics.total > 0 ? (
                    <>
                      <div className="progress" style={{ height: '35px' }}>
                        <div
                          className="progress-bar bg-warning"
                          style={{ width: `${(analytics.pending / analytics.total) * 100}%` }}
                        >
                          {analytics.pending > 0 && <span className="fw-semibold">{analytics.pending}</span>}
                        </div>
                        <div
                          className="progress-bar bg-info"
                          style={{ width: `${(analytics.in_progress / analytics.total) * 100}%` }}
                        >
                          {analytics.in_progress > 0 && <span className="fw-semibold">{analytics.in_progress}</span>}
                        </div>
                        <div
                          className="progress-bar bg-success"
                          style={{ width: `${(analytics.done / analytics.total) * 100}%` }}
                        >
                          {analytics.done > 0 && <span className="fw-semibold">{analytics.done}</span>}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between mt-3">
                        <small className="text-muted">
                          <span className="badge bg-warning text-dark">Pending</span> {((analytics.pending / analytics.total) * 100).toFixed(1)}%
                        </small>
                        <small className="text-muted">
                          <span className="badge bg-info">In Progress</span> {((analytics.in_progress / analytics.total) * 100).toFixed(1)}%
                        </small>
                        <small className="text-muted">
                          <span className="badge bg-success">Completed</span> {((analytics.done / analytics.total) * 100).toFixed(1)}%
                        </small>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted text-center mb-0">No problems to track yet</p>
                  )}
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Problems by Department</h6>
                  <div className="row g-3">
                    {Object.entries(analytics.by_department).map(([dept, count]) => (
                      <div key={dept} className="col-md-4">
                        <div className="card border-0 bg-light">
                          <div className="card-body text-center">
                            <h4 className="text-primary mb-1">{count}</h4>
                            <p className="mb-1 fw-semibold">{dept}</p>
                            <small className="text-muted">
                              {analytics.total > 0 ? ((count / analytics.total) * 100).toFixed(1) : 0}% of total
                            </small>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Problems by Priority</h6>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="card border-danger">
                        <div className="card-body text-center">
                          <h3 className="text-danger mb-1">{analytics.by_priority.High || 0}</h3>
                          <p className="mb-0 fw-semibold">High Priority</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card border-warning">
                        <div className="card-body text-center">
                          <h3 className="text-warning mb-1">{analytics.by_priority.Medium || 0}</h3>
                          <p className="mb-0 fw-semibold">Medium Priority</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="card border-success">
                        <div className="card-body text-center">
                          <h3 className="text-success mb-1">{analytics.by_priority.Low || 0}</h3>
                          <p className="mb-0 fw-semibold">Low Priority</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Problems Summary */}
              {/* <div className="card shadow-sm border-0 mb-4">
                <div className="card-body">
                  <h6 className="fw-bold mb-3">Recent Problems (Last 5)</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover">
                      <thead className="table-light">
                        <tr>
                          <th>ID</th>
                          <th>Department</th>
                          <th>Priority</th>
                          <th>Status</th>
                          <th>Created</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problems.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-3">
                              <p className="text-muted mb-0">No problems found</p>
                            </td>
                          </tr>
                        ) : (
                          problems.slice().reverse().slice(0, 5).map(problem => (
                            <tr key={problem.id}>
                              <td>#{problem.id}</td>
                              <td>{problem.department}</td>
                              <td>
                                <span className={`badge ${
                                  problem.priority === 'High' ? 'bg-danger' :
                                  problem.priority === 'Medium' ? 'bg-warning text-dark' :
                                  'bg-success'
                                }`}>
                                  {problem.priority}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${
                                  problem.status === 'pending' ? 'bg-warning text-dark' :
                                  problem.status === 'in_progress' ? 'bg-info' :
                                  'bg-success'
                                }`}>
                                  {problem.status.replace('_', ' ').toUpperCase()}
                                </span>
                              </td>
                              <td>{new Date(problem.createdAt).toLocaleDateString()}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div> */}
            </>
          )}

          {/* Quick Actions */}
          {/* <h5 className="mb-3 fw-bold text-secondary">Quick Actions</h5>
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div 
                className="card h-100 border-0 shadow-sm"
                style={hoverCardStyle}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="card-body text-center">
                  <FaPlusCircle className="fs-2 text-primary mb-3" />
                  <h5 className="fw-bold">Submit a Problem</h5>
                  <p className="text-muted small">Raise a new problem ticket for your department</p>
                  <Link to="/problem/create" className="btn btn-primary w-75">
                    Create Problem
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div 
                className="card h-100 border-0 shadow-sm"
                style={hoverCardStyle}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="card-body text-center">
                  <FaChartBar className="fs-2 text-info mb-3" />
                  <h5 className="fw-bold">View All Problems</h5>
                  <p className="text-muted small">Browse and manage all problem tickets</p>
                  <Link to="/problems" className="btn btn-info w-75 text-white">
                    View Problems
                  </Link>
                </div>
              </div>
            </div>

            <div className="col-md-4">
              <div 
                className="card h-100 border-0 shadow-sm"
                style={hoverCardStyle}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div className="card-body text-center">
                  <FaFileAlt className="fs-2 text-success mb-3" />
                  <h5 className="fw-bold">Download Reports</h5>
                  <p className="text-muted small">Get individual problem reports</p>
                  <Link to="/reports" className="btn btn-success w-75">
                    View Reports
                  </Link>
                </div>
              </div>
            </div>
          </div> */}

          {/* Admin Panel Access - Only for Admin */}
{/* {user?.role === 'admin' && (
  <div className="mt-4">
    <div className="card shadow-sm border-0 bg-gradient-danger text-white">
      <div className="card-body text-center py-4">
        <FaUsersCog className="fs-1 mb-3" />
        <h4 className="fw-bold mb-2">Admin Panel</h4>
        <p className="mb-3">Manage users, add Team Leaders, and control system access</p>
        <Link to="/admin" className="btn btn-light btn-lg px-5">
          <FaUsersCog className="me-2" />
          Go to Admin Panel
        </Link>
      </div>
    </div>
  </div>
)} */}

          {/* Admin/Team Leader Section */}
          {/* {(user?.role === 'admin' || user?.role === 'team_leader') && (
            <>
              <h5 className="mb-3 fw-bold text-secondary">Admin / Team Leader Tools</h5>
              <div className="card border-0 shadow-sm bg-danger text-white">
                <div className="card-body text-center">
                  <FaUsersCog className="fs-2 mb-2" />
                  <h5 className="fw-bold">Admin / Team Leader Panel</h5>
                  <p className="text-light small">
                    Manage users, approve registrations, and assign problems
                  </p>
                  <Link to="/admin" className="btn btn-light w-50 fw-semibold">
                    Go to Admin Panel
                  </Link>
                </div>
              </div>
            </>
          )} */}
        </div>
      </div>
    </div>
  );
}