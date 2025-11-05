import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner, FaPlusCircle, FaUsersCog, FaHome, FaExclamationTriangle, FaFileAlt, FaChartLine } from 'react-icons/fa';

export default function EmployeeDashboard() {
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
    transition: 'all 0.2s ease'
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
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div className="bg-dark text-white" style={{ width: '250px', minHeight: '100%' }}>
          <div className="p-3">
            <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>
              Navigation
            </h5>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <Link 
                  to="/employee-dashboard" 
                  className="nav-link text-white bg-primary rounded"
                  style={sidebarLinkStyle}
                >
                  <FaHome className="me-2" style={{ fontSize: '0.9rem' }} /> 
                  <span style={{ fontSize: '0.9rem' }}>Dashboard</span>
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
                  <FaPlusCircle className="me-2" style={{ fontSize: '0.9rem' }} /> 
                  <span style={{ fontSize: '0.9rem' }}>Create Problem</span>
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
                  <FaExclamationTriangle className="me-2" style={{ fontSize: '0.9rem' }} /> 
                  <span style={{ fontSize: '0.9rem' }}>All Problems</span>
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
                  <FaFileAlt className="me-2" style={{ fontSize: '0.9rem' }} /> 
                  <span style={{ fontSize: '0.9rem' }}>Reports</span>
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
                    <FaUsersCog className="me-2" style={{ fontSize: '0.9rem' }} /> 
                    <span style={{ fontSize: '0.9rem' }}>Admin Panel</span>
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-4" style={{ overflowY: 'auto' }}>
          
          {/* Stats Cards - Clean & Consistent */}
          {stats && (
            <div className="row g-3 mb-4">
              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ 
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  transition: 'transform 0.2s'
                }}>
                  <div className="card-body text-white text-center" style={{ padding: '1.5rem' }}>
                    <FaClipboardList style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem' }} />
                    <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600' }}>
                      {stats.my_problems || 0}
                    </h2>
                    <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95 }}>
                      My Problems
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ 
                  background: 'linear-gradient(135deg, #f6c23e 0%, #dda20a 100%)',
                  transition: 'transform 0.2s'
                }}>
                  <div className="card-body text-white text-center" style={{ padding: '1.5rem' }}>
                    <FaTasks style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem' }} />
                    <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600' }}>
                      {stats.assigned_to_me || 0}
                    </h2>
                    <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95 }}>
                      Assigned to Me
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ 
                  background: 'linear-gradient(135deg, #36b9cc 0%, #258fa4 100%)',
                  transition: 'transform 0.2s'
                }}>
                  <div className="card-body text-white text-center" style={{ padding: '1.5rem' }}>
                    <FaSpinner style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem' }} />
                    <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600' }}>
                      {stats.in_progress || 0}
                    </h2>
                    <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95 }}>
                      In Progress
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100" style={{ 
                  background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)',
                  transition: 'transform 0.2s'
                }}>
                  <div className="card-body text-white text-center" style={{ padding: '1.5rem' }}>
                    <FaCheckCircle style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem' }} />
                    <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600' }}>
                      {stats.completed || 0}
                    </h2>
                    <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95 }}>
                      Completed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section */}
          {analytics && (
            <>
              {/* Overall Progress */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body" style={{ padding: '1.5rem' }}>
                  <h5 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: '500', color: '#495057' }}>
                    <FaChartLine className="me-2" style={{ color: '#667eea' }} />
                    Overall Progress
                  </h5>
                  {analytics.total > 0 ? (
                    <>
                      <div className="progress mb-3" style={{ height: '35px', borderRadius: '8px' }}>
                        <div
                          className="progress-bar"
                          style={{ 
                            width: `${(analytics.pending / analytics.total) * 100}%`,
                            backgroundColor: '#f6c23e'
                          }}
                        >
                          {analytics.pending > 0 && (
                            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                              {analytics.pending}
                            </span>
                          )}
                        </div>
                        <div
                          className="progress-bar"
                          style={{ 
                            width: `${(analytics.in_progress / analytics.total) * 100}%`,
                            backgroundColor: '#36b9cc'
                          }}
                        >
                          {analytics.in_progress > 0 && (
                            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                              {analytics.in_progress}
                            </span>
                          )}
                        </div>
                        <div
                          className="progress-bar"
                          style={{ 
                            width: `${(analytics.done / analytics.total) * 100}%`,
                            backgroundColor: '#1cc88a'
                          }}
                        >
                          {analytics.done > 0 && (
                            <span style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                              {analytics.done}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="d-flex justify-content-between" style={{ fontSize: '0.85rem' }}>
                        <div className="text-muted">
                          <span className="badge" style={{ backgroundColor: '#f6c23e', color: '#000' }}>
                            Pending
                          </span>
                          <span className="ms-1">{((analytics.pending / analytics.total) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-muted">
                          <span className="badge" style={{ backgroundColor: '#36b9cc' }}>
                            In Progress
                          </span>
                          <span className="ms-1">{((analytics.in_progress / analytics.total) * 100).toFixed(0)}%</span>
                        </div>
                        <div className="text-muted">
                          <span className="badge" style={{ backgroundColor: '#1cc88a' }}>
                            Completed
                          </span>
                          <span className="ms-1">{((analytics.done / analytics.total) * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-muted text-center mb-0" style={{ fontSize: '0.9rem' }}>
                      No problems to track yet
                    </p>
                  )}
                </div>
              </div>

              {/* Department Breakdown */}
              <div className="card border-0 shadow-sm mb-3">
                <div className="card-body" style={{ padding: '1.5rem' }}>
                  <h5 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: '500', color: '#495057' }}>
                    By Department
                  </h5>
                  <div className="row g-3">
                    {Object.entries(analytics.by_department).map(([dept, count]) => (
                      <div key={dept} className="col-md-4">
                        <div className="text-center p-3" style={{ 
                          backgroundColor: '#f8f9fa',
                          borderRadius: '8px',
                          border: '1px solid #e9ecef'
                        }}>
                          <h4 className="mb-1" style={{ 
                            fontSize: '1.75rem',
                            fontWeight: '600',
                            color: '#667eea'
                          }}>
                            {count}
                          </h4>
                          <p className="mb-1" style={{ fontSize: '0.85rem', fontWeight: '500', color: '#495057' }}>
                            {dept}
                          </p>
                          <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                            {analytics.total > 0 ? ((count / analytics.total) * 100).toFixed(0) : 0}% of total
                          </small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Priority Breakdown */}
              <div className="card border-0 shadow-sm mb-4">
                <div className="card-body" style={{ padding: '1.5rem' }}>
                  <h5 className="mb-3" style={{ fontSize: '1.1rem', fontWeight: '500', color: '#495057' }}>
                    By Priority
                  </h5>
                  <div className="row g-3">
                    <div className="col-md-4">
                      <div className="text-center p-3" style={{ 
                        backgroundColor: '#fff5f5',
                        borderRadius: '8px',
                        border: '1px solid #fee'
                      }}>
                        <h4 className="mb-1" style={{ 
                          fontSize: '1.75rem',
                          fontWeight: '600',
                          color: '#dc3545'
                        }}>
                          {analytics.by_priority.High || 0}
                        </h4>
                        <p className="mb-0" style={{ fontSize: '0.85rem', fontWeight: '500', color: '#495057' }}>
                          High
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3" style={{ 
                        backgroundColor: '#fffbf0',
                        borderRadius: '8px',
                        border: '1px solid #fff3cd'
                      }}>
                        <h4 className="mb-1" style={{ 
                          fontSize: '1.75rem',
                          fontWeight: '600',
                          color: '#f6c23e'
                        }}>
                          {analytics.by_priority.Medium || 0}
                        </h4>
                        <p className="mb-0" style={{ fontSize: '0.85rem', fontWeight: '500', color: '#495057' }}>
                          Medium
                        </p>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="text-center p-3" style={{ 
                        backgroundColor: '#f0fdf4',
                        borderRadius: '8px',
                        border: '1px solid #d1fae5'
                      }}>
                        <h4 className="mb-1" style={{ 
                          fontSize: '1.75rem',
                          fontWeight: '600',
                          color: '#1cc88a'
                        }}>
                          {analytics.by_priority.Low || 0}
                        </h4>
                        <p className="mb-0" style={{ fontSize: '0.85rem', fontWeight: '500', color: '#495057' }}>
                          Low
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}