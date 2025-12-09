import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { 
  FaTasks, 
  FaClipboardList, 
  FaCheckCircle, 
  FaSpinner, 
  FaPlusCircle, 
  FaUsersCog, 
  FaHome, 
  FaExclamationTriangle, 
  FaFileAlt, 
  FaChartLine, 
  FaChevronLeft, 
  FaChevronRight,
  FaGlobe,
  FaTimesCircle,
  FaSyncAlt,
  FaExclamationCircle,
  FaArrowRight,
  FaEye
} from 'react-icons/fa';

export default function EmployeeDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [problems, setProblems] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  
  // Domain status state
  const [domains, setDomains] = useState({});
  const [domainLoading, setDomainLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  // High priority issues state
  const [highPriorityIssues, setHighPriorityIssues] = useState([]);

  // Modal states
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedProblemStatement, setSelectedProblemStatement] = useState('');

  useEffect(() => {
    fetchDashboardStats();
    fetchAnalytics();
    fetchDomainStatus();
    
    // Auto-refresh domain status every 2 minutes
    const domainInterval = setInterval(fetchDomainStatus, 2 * 60 * 1000);
    
    // Auto-refresh problems every 30 seconds for real-time updates
    const problemsInterval = setInterval(() => {
      fetchAnalytics();
    }, 30 * 1000);
    
    return () => {
      clearInterval(domainInterval);
      clearInterval(problemsInterval);
    };
  }, []);

  // Update high priority issues when analytics change
  useEffect(() => {
    if (problems.length > 0) {
      const highPriority = problems
        .filter(problem => 
          problem.priority === 'High' && 
          problem.status !== 'done' &&
          problem.status !== 'pending_approval'
        )
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5); // Show latest 5 high priority issues
      
      setHighPriorityIssues(highPriority);
    }
  }, [problems]);

  const fetchDashboardStats = async () => {
    try {
      // Since there's no backend endpoint for dashboard stats yet,
      // we'll use localStorage as a fallback
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      const currentUser = JSON.parse(localStorage.getItem('current_user') || '{}');
      
      // Calculate stats from localStorage data
      const userProblems = storedProblems.filter(p => p.createdBy === currentUser.name);
      const assignedProblems = storedProblems.filter(p => p.assignedTo === currentUser.id);
      const inProgressProblems = storedProblems.filter(p => p.status === 'in_progress');
      const completedProblems = storedProblems.filter(p => p.status === 'done');
      
      const calculatedStats = {
        my_problems: userProblems.length,
        assigned_to_me: assignedProblems.length,
        in_progress: inProgressProblems.length,
        completed: completedProblems.length
      };
      
      setStats(calculatedStats);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set default stats if there's an error
      setStats({
        my_problems: 0,
        assigned_to_me: 0,
        in_progress: 0,
        completed: 0
      });
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
          Engineering: storedProblems.filter(p => p.department === 'IT & Innovation').length,
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

  // Domain status fetch function with error handling
  const fetchDomainStatus = async () => {
    try {
      setDomainLoading(true);
      const response = await fetch('https://ticketapi.wineds.com/api/domains/status', {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setDomains(data);
      setLastUpdated(new Date());
      
      // Log for debugging
      console.log('Domain status fetched:', {
        total: Object.keys(data).length,
        up: Object.values(data).filter(d => d.is_up).length,
        down: Object.values(data).filter(d => !d.is_up).length,
        timestamp: new Date().toISOString()
      });
      
    } catch (err) {
      console.error('Domain status fetch error:', err);
      toast.error('Failed to fetch domain status');
    } finally {
      setDomainLoading(false);
    }
  };

  // Domain status calculations
  const totalDomains = Object.keys(domains).length;
  const upDomains = Object.values(domains).filter(domain => domain.is_up).length;
  const downDomains = totalDomains - upDomains;
  const uptimePercentage = totalDomains > 0 ? ((upDomains / totalDomains) * 100).toFixed(1) : 0;

  // Get status badge class
  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      in_progress: 'bg-info text-white',
      done: 'bg-success text-white',
      pending_approval: 'bg-secondary text-white'
    };
    return badges[status] || 'bg-secondary text-white';
  };

  // Format status text
  const formatStatus = (status) => {
    if (status === 'done') return 'SOLVED';
    if (status === 'pending_approval') return 'PENDING APPROVAL';
    return status.replace('_', ' ').toUpperCase();
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
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
            {sidebarMinimized 
              ? <FaChevronRight size={14} color="#333" /> 
              : <FaChevronLeft size={14} color="#333" />
            }
          </button>

          <div className="p-3">
            {!sidebarMinimized && (
              <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>
                Navigation
              </h5>
            )}
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <Link 
                  to="/dashboard" 
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  title="Dashboard"
                >
                  <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problem/create" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problems" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  title="All Problems"
                >
                  <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <>
                  <li className="nav-item mb-2">
                    <Link 
                      to="/admin" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={{ transition: 'all 0.2s ease' }}
                      title="Admin Panel"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>User Management</span>}
                    </Link>
                  </li>
                  <li className="nav-item mb-2">
                    <Link 
                      to="/domain-status" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={{ transition: 'all 0.2s ease' }}
                      title="Domain Status"
                    >
                      <FaGlobe style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Domain Status</span>}
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-grow-1 p-4" 
          style={{ 
            overflowY: 'auto',
            transition: 'margin-left 0.3s ease'
          }}
        >
          {/* Header Section - Compact */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h1 className="h4 mb-1" style={{ color: '#2c3e50', fontWeight: '600' }}>Dashboard Overview</h1>
              <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                Real-time monitoring and analytics
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              {lastUpdated && (
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  Updated: {lastUpdated.toLocaleTimeString()}
                </small>
              )}
              <button 
                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                onClick={fetchDomainStatus}
                disabled={domainLoading}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
              >
                <FaSyncAlt className={domainLoading ? 'spinning' : ''} style={{ marginRight: '4px' }} />
                Refresh
              </button>
            </div>
          </div>

          {/* Domain Status Cards - Compact */}
          <div className="row g-2 mb-3">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaGlobe size={20} color="white" />
                    </div>
                  </div>
                  <h2 className="mb-1" style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    color: '#2c3e50'
                  }}>
                    {domainLoading ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      totalDomains
                    )}
                  </h2>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Total Domains
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaCheckCircle size={20} color="white" />
                    </div>
                  </div>
                  <h2 className="mb-1" style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    color: '#2c3e50'
                  }}>
                    {domainLoading ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      upDomains
                    )}
                  </h2>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Domains Up
                  </p>
                  {!domainLoading && upDomains > 0 && (
                    <small className="text-success" style={{ fontSize: '0.7rem' }}>
                      {uptimePercentage}% uptime
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #e74a3b 0%, #be2617 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaTimesCircle size={20} color="white" />
                    </div>
                  </div>
                  <h2 className="mb-1" style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    color: '#2c3e50'
                  }}>
                    {domainLoading ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      downDomains
                    )}
                  </h2>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Domains Down
                  </p>
                  {!domainLoading && downDomains > 0 && (
                    <small className="text-danger" style={{ fontSize: '0.7rem' }}>
                      Needs attention
                    </small>
                  )}
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100">
                <div className="card-body text-center p-3">
                  <div className="d-flex justify-content-center align-items-center mb-2">
                    <div style={{
                      width: '50px',
                      height: '50px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #f6c23e 0%, #dda20a 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <FaChartLine size={20} color="white" />
                    </div>
                  </div>
                  <h2 className="mb-1" style={{ 
                    fontSize: '2rem', 
                    fontWeight: '700', 
                    color: '#2c3e50'
                  }}>
                    {domainLoading ? (
                      <div className="spinner-border spinner-border-sm text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                      </div>
                    ) : (
                      `${uptimePercentage}%`
                    )}
                  </h2>
                  <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                    Uptime Rate
                  </p>
                  {!domainLoading && (
                    <small className="text-warning" style={{ fontSize: '0.7rem' }}>
                      Overall performance
                    </small>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Problem Management Stats - Compact */}
          {stats && (
            <div className="row g-2 mb-3">
              <div className="col-12">
                <h4 className="h5 mb-2" style={{ color: '#2c3e50', fontWeight: '600' }}>
                  Problem Management
                </h4>
              </div>
              
              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <FaClipboardList size={24} className="text-primary mb-2" />
                    <h3 className="mb-1" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
                      {stats.my_problems || 0}
                    </h3>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                      My Problems
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <FaTasks size={24} className="text-warning mb-2" />
                    <h3 className="mb-1" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
                      {stats.assigned_to_me || 0}
                    </h3>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                      Assigned to Me
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <FaSpinner size={24} className="text-info mb-2" />
                    <h3 className="mb-1" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
                      {stats.in_progress || 0}
                    </h3>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                      In Progress
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-6 col-lg-3">
                <div className="card border-0 shadow-sm h-100">
                  <div className="card-body text-center p-3">
                    <FaCheckCircle size={24} className="text-success mb-2" />
                    <h3 className="mb-1" style={{ fontSize: '1.5rem', fontWeight: '700', color: '#2c3e50' }}>
                      {stats.completed || 0}
                    </h3>
                    <p className="mb-0 text-muted" style={{ fontSize: '0.85rem', fontWeight: '500' }}>
                      Completed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* High Priority Issues Section - No Background Color */}
          {highPriorityIssues.length > 0 && (
            <div className="row mb-4">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-header border-bottom py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <h5 className="mb-0 fw-semibold text-dark">
                        {/* <FaExclamationCircle className="me-2 text-danger" /> */}
                        High Priority Issues - Needs Immediate Attention
                      </h5>
                      <span className="badge bg-danger text-white">
                        {highPriorityIssues.length} Active
                      </span>
                    </div>
                  </div>
                  <div className="card-body p-0">
                    <div className="table-responsive">
                      <table className="table table-hover mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: '10%', fontSize: '0.85rem' }}>ID</th>
                            <th style={{ width: '20%', fontSize: '0.85rem' }}>Department</th>
                            <th style={{ width: '25%', fontSize: '0.85rem' }}>Created By</th>
                            <th style={{ width: '15%', fontSize: '0.85rem' }}>Status</th>
                            <th style={{ width: '20%', fontSize: '0.85rem' }}>Assigned To</th>
                            <th style={{ width: '10%', fontSize: '0.85rem' }}>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {highPriorityIssues.map((issue) => (
                            <tr key={issue.id} className="align-middle">
                              <td>
                                <strong className="text-danger" style={{ fontSize: '0.85rem' }}>#{issue.id}</strong>
                              </td>
                              <td>
                                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>{issue.department}</span>
                              </td>
                              <td>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>{issue.createdBy}</span>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadge(issue.status)}`} style={{ fontSize: '0.75rem' }}>
                                  {formatStatus(issue.status)}
                                </span>
                              </td>
                              <td>
                                {issue.assignedToName ? (
                                  <span className="badge bg-info text-white" style={{ fontSize: '0.75rem' }}>
                                    {issue.assignedToName}
                                  </span>
                                ) : (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => {
                                    setSelectedProblemStatement(issue.statement);
                                    setShowProblemModal(true);
                                  }}
                                  title="View Problem Statement"
                                  style={{ 
                                    padding: '4px 8px', 
                                    fontSize: '0.75rem',
                                    borderWidth: '1px'
                                  }}
                                >
                                  <FaEye size={12} />
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="card-footer py-2">
                    <div className="d-flex justify-content-between align-items-center">
                      <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                        Last updated: {new Date().toLocaleTimeString()}
                      </small>
                      <Link to="/problems" className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.8rem' }}>
                        View All Issues <FaArrowRight className="ms-1" size={10} />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Analytics Section - Compact */}
          {analytics && analytics.total > 0 && (
            <div className="row">
              <div className="col-12">
                <div className="card border-0 shadow-sm">
                  <div className="card-body">
                    <h5 className="card-title mb-3" style={{ color: '#2c3e50', fontWeight: '600', fontSize: '1rem' }}>
                      Analytics Overview
                    </h5>
                    
                    <div className="row">
                      {/* Progress Chart */}
                      <div className="col-md-6">
                        <h6 className="mb-2" style={{ color: '#495057', fontWeight: '500', fontSize: '0.9rem' }}>
                          Status Distribution
                        </h6>
                        <div className="progress mb-3" style={{ height: '25px', borderRadius: '6px' }}>
                          <div
                            className="progress-bar"
                            style={{ 
                              width: `${(analytics.pending / analytics.total) * 100}%`,
                              backgroundColor: '#f6c23e',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}
                          >
                            {analytics.pending > 0 && `Pending: ${analytics.pending}`}
                          </div>
                          <div
                            className="progress-bar"
                            style={{ 
                              width: `${(analytics.in_progress / analytics.total) * 100}%`,
                              backgroundColor: '#36b9cc',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}
                          >
                            {analytics.in_progress > 0 && `In Progress: ${analytics.in_progress}`}
                          </div>
                          <div
                            className="progress-bar"
                            style={{ 
                              width: `${(analytics.done / analytics.total) * 100}%`,
                              backgroundColor: '#1cc88a',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}
                          >
                            {analytics.done > 0 && `Solved: ${analytics.done}`}
                          </div>
                        </div>
                      </div>

                      {/* Priority Stats */}
                      <div className="col-md-6">
                        <h6 className="mb-2" style={{ color: '#495057', fontWeight: '500', fontSize: '0.9rem' }}>
                          Priority Breakdown
                        </h6>
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="border rounded p-2 bg-danger bg-opacity-10">
                              <div className="text-danger fw-bold" style={{ fontSize: '1.2rem' }}>
                                {analytics.by_priority.High || 0}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>High</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="border rounded p-2 bg-warning bg-opacity-10">
                              <div className="text-warning fw-bold" style={{ fontSize: '1.2rem' }}>
                                {analytics.by_priority.Medium || 0}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Medium</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="border rounded p-2 bg-success bg-opacity-10">
                              <div className="text-success fw-bold" style={{ fontSize: '1.2rem' }}>
                                {analytics.by_priority.Low || 0}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Low</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Problem Statement Modal */}
      {showProblemModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h6 className="modal-title mb-0 fw-semibold">
                  <i className="bi bi-card-text me-2"></i>
                  Problem Statement
                </h6>
                <button 
                  type="button" 
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => setShowProblemModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="p-3 bg-light rounded">
                  <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                    {selectedProblemStatement}
                  </p>
                </div>
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowProblemModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .card {
          transition: transform 0.2s ease-in-out;
        }
        
        .card:hover {
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}