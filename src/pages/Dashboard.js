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
  const [selectedProblem, setSelectedProblem] = useState(null);

  useEffect(() => {
    fetchAllProblems();
    fetchDomainStatus();

    // Listen for domain status updates from DomainStatus.js
    const handleDomainStatusUpdate = (e) => {
      try {
        const domainData = e.detail;
        setDomains(domainData.domains);
        setLastUpdated(new Date(domainData.lastUpdated));
        setDomainLoading(false);
      } catch (err) {
        console.error('Error handling domain status update:', err);
      }
    };

    // Also listen for storage changes (fallback)
    const handleStorageChange = (e) => {
      if (e.key === 'domainStatusData') {
        try {
          const parsedData = JSON.parse(e.newValue);
          setDomains(parsedData.domains);
          setLastUpdated(new Date(parsedData.lastUpdated));
          setDomainLoading(false);
        } catch (err) {
          console.error('Error parsing domain status data from storage:', err);
        }
      }
    };

    window.addEventListener('domainStatusUpdated', handleDomainStatusUpdate);
    window.addEventListener('storage', handleStorageChange);

    // Remove automatic refresh intervals as requested
    // Only manual refresh will be used

    return () => {
      window.removeEventListener('domainStatusUpdated', handleDomainStatusUpdate);
      window.removeEventListener('storage', handleStorageChange);
      // No need to clear intervals since we're not setting any
    };
  }, []);

  // Fetch all problems from API
  const fetchAllProblems = async () => {
    try {
      setLoading(true);
      console.log('📡 Fetching problems from API...');

      const response = await api.post('/problems/getAll');
      console.log('✅ API Response:', response.data);

      if (response.data.status === 'success' || response.data.success) {
        const allProblems = response.data.data || [];
        console.log(`📊 Total problems fetched: ${allProblems.length}`);

        setProblems(allProblems);

        // Calculate stats based on current user
        calculateStats(allProblems);
        calculateAnalytics(allProblems);

        // Calculate high priority issues
        const highPriority = allProblems
          .filter(problem => {
            // Check if priority is High (case-insensitive)
            const isHighPriority = problem.priority &&
              problem.priority.toString().toLowerCase() === 'high';

            // Check if status is not done or pending_approval
            const isNotResolved = problem.status &&
              !['done', 'pending_approval', 'resolved'].includes(problem.status.toLowerCase());

            return isHighPriority && isNotResolved;
          })
          .sort((a, b) => {
            // Sort by creation date (newest first)
            const dateA = a.created_at ? new Date(a.created_at) : new Date(0);
            const dateB = b.created_at ? new Date(b.created_at) : new Date(0);
            return dateB - dateA;
          })
          .slice(0, 5); // Show latest 5 high priority issues

        console.log(`⚠️ High priority issues found: ${highPriority.length}`);
        setHighPriorityIssues(highPriority);

        if (allProblems.length > 0) {
          // toast.success(`Loaded ${allProblems.length} problems`, {
          //   position: "top-right",
          //   autoClose: 3000,
          // });
        }
      } else {
        // console.error('❌ API returned error:', response.data);
        // toast.error('Failed to fetch problems data');
      }
    } catch (error) {
      // console.error('❌ Failed to fetch problems:', error);
      // toast.error('Error loading dashboard data. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats for current user
  const calculateStats = (allProblems) => {
    if (!user || !allProblems.length) {
      setStats({
        my_problems: 0,
        assigned_to_me: 0,
        in_progress: 0,
        completed: 0
      });
      return;
    }

    console.log('👤 Current user for stats:', user);

    // Adjust field names based on your API response structure
    const userProblems = allProblems.filter(p =>
      p.created_by === user.id ||
      p.createdBy === user.id ||
      p.created_by_id === user.id ||
      p.user_id === user.id
    );

    const assignedProblems = allProblems.filter(p =>
      p.assigned_to === user.id ||
      p.assignedTo === user.id ||
      p.assigned_to_id === user.id
    );

    const inProgressProblems = allProblems.filter(p => {
      const status = (p.status || '').toLowerCase();
      return status.includes('progress') || status === 'in_progress';
    });

    const completedProblems = allProblems.filter(p => {
      const status = (p.status || '').toLowerCase();
      return status === 'done' || status === 'completed' || status === 'resolved';
    });

    const calculatedStats = {
      my_problems: userProblems.length,
      assigned_to_me: assignedProblems.length,
      in_progress: inProgressProblems.length,
      completed: completedProblems.length
    };

    console.log('📈 Calculated stats:', calculatedStats);
    setStats(calculatedStats);
  };

  // Calculate analytics from all problems
  const calculateAnalytics = (allProblems) => {
    if (!allProblems.length) {
      setAnalytics({
        total: 0,
        pending: 0,
        in_progress: 0,
        done: 0,
        by_department: { Engineering: 0, Business: 0, Accounts: 0 },
        by_priority: { High: 0, Medium: 0, Low: 0 }
      });
      return;
    }

    const analyticsData = {
      total: allProblems.length,
      pending: allProblems.filter(p => {
        const status = (p.status || '').toLowerCase();
        return status === 'pending' || status === 'open';
      }).length,
      in_progress: allProblems.filter(p => {
        const status = (p.status || '').toLowerCase();
        return status.includes('progress') || status === 'in_progress';
      }).length,
      done: allProblems.filter(p => {
        const status = (p.status || '').toLowerCase();
        return status === 'done' || status === 'completed' || status === 'resolved';
      }).length,
      by_department: {
        Engineering: allProblems.filter(p =>
          p.department === 'IT & Innovation' ||
          p.department === 'Engineering' ||
          p.department === 'IT'
        ).length,
        Business: allProblems.filter(p =>
          p.department === 'Business' ||
          p.department === 'Sales' ||
          p.department === 'Marketing'
        ).length,
        Accounts: allProblems.filter(p =>
          p.department === 'Accounts' ||
          p.department === 'Finance' ||
          p.department === 'Accounting'
        ).length
      },
      by_priority: {
        High: allProblems.filter(p => {
          const priority = (p.priority || '').toString().toLowerCase();
          return priority === 'high' || priority === 'urgent' || priority === 'critical';
        }).length,
        Medium: allProblems.filter(p => {
          const priority = (p.priority || '').toString().toLowerCase();
          return priority === 'medium' || priority === 'normal';
        }).length,
        Low: allProblems.filter(p => {
          const priority = (p.priority || '').toString().toLowerCase();
          return priority === 'low' || priority === 'minor';
        }).length
      }
    };

    console.log('📊 Analytics data:', analyticsData);
    setAnalytics(analyticsData);
  };

  // Domain status fetch function with error handling
  const fetchDomainStatus = async () => {
    try {
      setDomainLoading(true);
      console.log('🌐 Fetching domain status...');

      // Try to get data from localStorage first (shared with DomainStatus.js)
      const storedDomainData = localStorage.getItem('domainStatusData');
      if (storedDomainData) {
        const parsedData = JSON.parse(storedDomainData);
        // Check if data is recent (less than 5 minutes old)
        if (Date.now() - parsedData.timestamp < 5 * 60 * 1000) {
          setDomains(parsedData.domains);
          setLastUpdated(new Date(parsedData.lastUpdated));
          setDomainLoading(false);
          return;
        }
      }

      // If no recent data in localStorage, fetch from API
      const response = await api.get('/domains/status');

      // Process the API response based on its structure
      const data = response.data;

      // Save to localStorage for sharing
      const domainData = {
        domains: data,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      };
      localStorage.setItem('domainStatusData', JSON.stringify(domainData));

      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('domainStatusUpdated', { detail: domainData }));

      setDomains(data);
      setLastUpdated(new Date());

      console.log('✅ Domain status updated:', {
        total: Object.keys(data).length,
        up: Object.values(data).filter(d => d.is_up).length,
        timestamp: new Date().toISOString()
      });

    } catch (err) {
      console.error('❌ Domain status fetch error:', err);
      // Set fallback domain data
      setDomains({
        'example.com': { is_up: true, response_time: 150 },
        'test.com': { is_up: false, response_time: 0 }
      });
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
    if (!status) return 'bg-secondary text-white';

    const statusLower = status.toLowerCase();
    const badges = {
      pending: 'bg-warning text-dark',
      open: 'bg-warning text-dark',
      in_progress: 'bg-info text-white',
      'in progress': 'bg-info text-white',
      progress: 'bg-info text-white',
      done: 'bg-success text-white',
      completed: 'bg-success text-white',
      resolved: 'bg-success text-white',
      pending_approval: 'bg-secondary text-white',
      closed: 'bg-dark text-white'
    };

    return badges[statusLower] || 'bg-secondary text-white';
  };

  // Format status text
  const formatStatus = (status) => {
    if (!status) return 'UNKNOWN';
    if (status.toLowerCase() === 'done') return 'SOLVED';
    if (status.toLowerCase() === 'pending_approval') return 'PENDING APPROVAL';
    return status.replace('_', ' ').toUpperCase();
  };

  // Format department name
  const formatDepartment = (dept) => {
    if (!dept) return 'Unknown';
    if (dept === 'IT & Innovation') return 'Engineering';
    return dept;
  };

  // Get assigned user name
  const getAssignedToName = (problem) => {
    // Check multiple possible structures
    if (problem.assigned_to && problem.assigned_to.name) {
      return problem.assigned_to.name;
    }
    if (problem.assigned_to_name) {
      return problem.assigned_to_name;
    }
    if (problem.assignedTo) {
      return problem.assignedTo;
    }
    if (problem.assigned_user_name) {
      return problem.assigned_user_name;
    }
    return 'Unassigned';
  };

  // Get created by name
  const getCreatedByName = (problem) => {
    // Check multiple possible structures
    if (problem.created_by && problem.created_by.name) {
      return problem.created_by.name;
    }
    if (problem.created_by_name) {
      return problem.created_by_name;
    }
    if (problem.createdBy) {
      return problem.createdBy;
    }
    if (problem.user_name) {
      return problem.user_name;
    }
    if (problem.created_by) {
      return problem.created_by; // In case it's just an ID or string
    }
    return 'Unknown';
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const viewProblemDetails = (problem) => {
    setSelectedProblem(problem);
    setSelectedProblemStatement(problem.statement || problem.description || problem.problem_statement || 'No description available');
    setShowProblemModal(true);
  };

  // Manual refresh function for domain status only
  const refreshDomainStatus = () => {
    fetchDomainStatus();
  };

  // Manual refresh function for all data
  const refreshAllData = () => {
    fetchAllProblems();
    fetchDomainStatus();
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <span className="ms-2">Loading dashboard data...</span>
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
                  className="nav-link text-white  rounded d-flex align-items-center"
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
                  <li className="nav-item mb-2">
                    <Link
                      to="/roles"
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={{ transition: 'all 0.2s ease' }}
                      title="Role Management"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Role Management</span>}
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
                Real-time monitoring and analytics • {problems.length} total problems
              </p>
            </div>
            <div className="d-flex align-items-center gap-2">
              {lastUpdated && (
                <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                  
                </small>
              )}
              {/* <button 
                className="btn btn-outline-primary btn-sm d-flex align-items-center"
                onClick={refreshDomainStatus}
                disabled={domainLoading}
                style={{ fontSize: '0.8rem', padding: '4px 8px' }}
                title="Refresh domain status data only"
              >
                <FaSyncAlt className={domainLoading ? 'spinning' : ''} style={{ marginRight: '4px' }} />
                {domainLoading ? 'Refreshing...' : 'Refresh Domains'}
              </button> */}
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
          {/* {stats && (
            <div className="row g-2 mb-3">
              <div className="col-12">
                <h4 className="h5 mb-2" style={{ color: '#2c3e50', fontWeight: '600' }}>
                  Problem Management
                  <span className="badge bg-primary ms-2" style={{ fontSize: '0.7rem' }}>
                    User: {user?.name || user?.username || 'Unknown'}
                  </span>
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
                    <small className="text-primary" style={{ fontSize: '0.7rem' }}>
                      Created by me
                    </small>
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
                    <small className="text-warning" style={{ fontSize: '0.7rem' }}>
                      My assignments
                    </small>
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
                    <small className="text-info" style={{ fontSize: '0.7rem' }}>
                      All active issues
                    </small>
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
                    <small className="text-success" style={{ fontSize: '0.7rem' }}>
                      All resolved issues
                    </small>
                  </div>
                </div>
              </div>
            </div>
          )} */}

          {/* High Priority Issues Section */}
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
                  {analytics?.by_priority?.High > 0 && (
                    <small className="text-muted" style={{ fontSize: '0.75rem' }}>
                      {analytics.by_priority.High} total High priority issues • Showing latest 5
                    </small>
                  )}
                </div>
                <div className="card-body p-0">
                  {highPriorityIssues.length > 0 ? (
                    <div className="table-responsive">
                      <table className="table mb-0">
                        <thead>
                          <tr>
                            <th style={{ width: '10%', fontSize: '0.85rem' }}>ID</th>
                            <th style={{ width: '20%', fontSize: '0.85rem' }}>Department</th>
                            <th style={{ width: '20%', fontSize: '0.85rem' }}>Created By</th>
                            <th style={{ width: '15%', fontSize: '0.85rem' }}>Status</th>
                            <th style={{ width: '20%', fontSize: '0.85rem' }}>Assigned To</th>
                            <th style={{ width: '15%', fontSize: '0.85rem' }}>Priority</th>
                            <th style={{ width: '10%', fontSize: '0.85rem' }}>View</th>
                          </tr>
                        </thead>
                        <tbody>
                          {highPriorityIssues.map((issue, index) => (
                            <tr key={issue.id || index} className="align-middle">
                              <td>
                                <strong className="text-danger" style={{ fontSize: '0.85rem' }}>
                                  #{issue.id || issue.problem_id || 'N/A'}
                                </strong>
                              </td>
                              <td>
                                <span className="fw-semibold" style={{ fontSize: '0.85rem' }}>
                                  {formatDepartment(issue.department)}
                                </span>
                              </td>
                              <td>
                                <span className="text-muted" style={{ fontSize: '0.85rem' }}>
                                  {getCreatedByName(issue)}
                                </span>
                              </td>
                              <td>
                                <span className={`badge ${getStatusBadge(issue.status)}`} style={{ fontSize: '0.75rem' }}>
                                  {formatStatus(issue.status)}
                                </span>
                              </td>
                              <td>
                                {issue.assigned_to ? (
                                  <span className="badge bg-info text-white" style={{ fontSize: '0.75rem' }}>
                                    {getAssignedToName(issue)}
                                  </span>
                                ) : (
                                  <span className="badge bg-warning text-dark" style={{ fontSize: '0.75rem' }}>
                                    Unassigned
                                  </span>
                                )}
                              </td>
                              <td>
                                <span className="badge bg-danger text-white" style={{ fontSize: '0.75rem' }}>
                                  {issue.priority || 'High'}
                                </span>
                              </td>
                              <td>
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => viewProblemDetails(issue)}
                                  title="View Problem Details"
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
                  ) : (
                    <div className="text-center py-5">
                      <FaCheckCircle size={48} className="text-success mb-3" />
                      <h5 className="text-muted">No High Priority Issues</h5>
                      <p className="text-muted small">All high priority issues are resolved or in progress</p>
                    </div>
                  )}
                </div>
                <div className="card-footer py-2">
                  <div className="d-flex justify-content-between align-items-center">
                    <small className="text-muted" style={{ fontSize: '0.8rem' }}>
                      Last updated: {new Date().toLocaleTimeString()} • Total problems: {problems.length}
                    </small>
                    <Link to="/problems" className="btn btn-sm btn-outline-primary" style={{ fontSize: '0.8rem' }}>
                      View All Issues <FaArrowRight className="ms-1" size={10} />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Analytics Section - Compact */}
          {analytics && (
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
                          Status Distribution ({analytics.total} total)
                        </h6>
                        <div className="progress mb-3" style={{ height: '25px', borderRadius: '6px' }}>
                          <div
                            className="progress-bar"
                            style={{
                              width: analytics.total > 0 ? `${(analytics.pending / analytics.total) * 100}%` : '0%',
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
                              width: analytics.total > 0 ? `${(analytics.in_progress / analytics.total) * 100}%` : '0%',
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
                              width: analytics.total > 0 ? `${(analytics.done / analytics.total) * 100}%` : '0%',
                              backgroundColor: '#1cc88a',
                              fontSize: '0.7rem',
                              fontWeight: '500'
                            }}
                          >
                            {analytics.done > 0 && `Solved: ${analytics.done}`}
                          </div>
                        </div>

                        {/* Status counts */}
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="p-1">
                              <div className="fw-bold" style={{ fontSize: '1rem', color: '#f6c23e' }}>
                                {analytics.pending}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Pending</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-1">
                              <div className="fw-bold" style={{ fontSize: '1rem', color: '#36b9cc' }}>
                                {analytics.in_progress}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>In Progress</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-1">
                              <div className="fw-bold" style={{ fontSize: '1rem', color: '#1cc88a' }}>
                                {analytics.done}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.75rem' }}>Solved</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Priority Stats */}
                      <div className="col-md-6">
                        <h6 className="mb-2" style={{ color: '#495057', fontWeight: '500', fontSize: '0.9rem' }}>
                          Priority Breakdown
                        </h6>
                        <div className="row text-center mb-3">
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

                        {/* Department Stats */}
                        {/* <h6 className="mb-2" style={{ color: '#495057', fontWeight: '500', fontSize: '0.9rem' }}>
                          Department Distribution
                        </h6>
                        <div className="row text-center">
                          <div className="col-4">
                            <div className="p-1">
                              <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#667eea' }}>
                                {analytics.by_department.Engineering}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Engineering</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-1">
                              <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#f6c23e' }}>
                                {analytics.by_department.Business}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Business</small>
                            </div>
                          </div>
                          <div className="col-4">
                            <div className="p-1">
                              <div className="fw-bold" style={{ fontSize: '0.9rem', color: '#1cc88a' }}>
                                {analytics.by_department.Accounts}
                              </div>
                              <small className="text-muted" style={{ fontSize: '0.7rem' }}>Accounts</small>
                            </div>
                          </div>
                        </div> */}
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
      {showProblemModal && selectedProblem && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h6 className="modal-title mb-0 fw-semibold">
                  <FaExclamationTriangle className="me-2" />
                  Problem Details - ID:{selectedProblem.id || selectedProblem.problem_id || 'N/A'}
                </h6>
                <button
                  type="button"
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => {
                    setShowProblemModal(false);
                    setSelectedProblem(null);
                  }}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="mb-2">
                      <small className="text-muted">Department:</small>
                      <p className="mb-0 fw-semibold">{formatDepartment(selectedProblem.department)}</p>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Priority:</small>
                      <span className={`badge ${selectedProblem.priority === 'High' ? 'bg-danger' : selectedProblem.priority === 'Medium' ? 'bg-warning' : 'bg-success'} ms-2`}>
                        {selectedProblem.priority || 'Not specified'}
                      </span>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Status:</small>
                      <span className={`badge ${getStatusBadge(selectedProblem.status)} ms-2`}>
                        {formatStatus(selectedProblem.status)}
                      </span>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-2">
                      <small className="text-muted">Created By:</small>
                      <p className="mb-0">{getCreatedByName(selectedProblem)}</p>
                    </div>
                    <div className="mb-2">
                      <small className="text-muted">Assigned To:</small>
                      <p className="mb-0">{getAssignedToName(selectedProblem)}</p>
                    </div>
                    {selectedProblem.created_at && (
                      <div className="mb-2">
                        <small className="text-muted">Created:</small>
                        <p className="mb-0">{new Date(selectedProblem.created_at).toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-light rounded">
                  <h6 className="mb-2">Problem Statement:</h6>
                  <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                    {selectedProblemStatement}
                  </p>
                </div>

                <div className="text-center mt-3">
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => {
                      setShowProblemModal(false);
                      setSelectedProblem(null);
                    }}
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
        // .spinning {
        //   animation: spin 1s linear infinite;
        // }
        // @keyframes spin {
        //   from { transform: rotate(0deg); }
        //   to { transform: rotate(360deg); }
        // }
        
        // .card {
        //   transition: transform 0.2s ease-in-out;
        // }
        
        // .card:hover {
        //   transform: translateY(-2px);
        // }
        
        // .progress-bar {
        //   white-space: nowrap;
        //   overflow: hidden;
        //   text-overflow: ellipsis;
        //   padding: 0 5px;
        // }
      `}</style>
    </div>
  );
}