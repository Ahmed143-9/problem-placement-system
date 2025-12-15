import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext'; 
import api from '../services/api';
import Navbar from '../components/Navbar';
import { 
  FaGlobe, 
  FaCheckCircle, 
  FaTimesCircle, 
  FaSyncAlt, 
  FaChevronLeft, 
  FaChevronRight, 
  FaHome,
  FaUsersCog,
  FaExclamationTriangle,
  FaFileAlt,
  FaPlusCircle,
  FaChartLine,
  FaArrowUp,
  FaArrowDown,
  FaBell,
  FaExclamationCircle,
  FaPlus,
  FaTrash
} from 'react-icons/fa';

export default function DomainStatus() {
  const { user } = useAuth();
  const { addNotification, notifyDiscussionComment } = useNotifications(); // Notifications hooks
  const [domains, setDomains] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [previousDomains, setPreviousDomains] = useState({});
  const [domainChanges, setDomainChanges] = useState([]);
  // New state for adding domains
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);

  useEffect(() => {
    fetchDomainStatus();
    
    // Listen for domain status updates from other tabs/windows
    const handleStorageChange = (e) => {
      if (e.key === 'domainStatusData') {
        try {
          const parsedData = JSON.parse(e.newValue);
          setDomains(parsedData.domains);
          setLoading(false);
        } catch (err) {
          console.error('Error parsing domain status data from storage:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // Remove automatic refresh interval as requested
    // Only manual refresh will be used
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      // No need to clear interval since we're not setting any
    };
  }, []);

  const fetchDomainStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Save current domains as previous before fetching new data
      setPreviousDomains(domains);
      
      // Use the same api service as Dashboard.js for consistency
      const response = await api.get('/domains/status');
      
      // Process the API response based on its structure
      const data = response.data;
      
      // Save to localStorage so Dashboard can access it
      const domainData = {
        domains: data,
        lastUpdated: new Date().toISOString(),
        timestamp: Date.now()
      };
      localStorage.setItem('domainStatusData', JSON.stringify(domainData));
      
      // Dispatch a custom event to notify other components
      window.dispatchEvent(new CustomEvent('domainStatusUpdated', { detail: domainData }));
      
      // Check for domain status changes and send notifications
      checkDomainStatusChanges(data);
      
      setDomains(data);
    } catch (err) {
      setError(err.message);
      console.error('Domain status fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 🔥 NEW: Function to add a new domain
  const addNewDomain = async () => {
    if (!newDomain.trim()) {
      addNotification({
        type: 'error',
        title: 'Invalid Domain',
        message: 'Please enter a valid domain name',
        icon: '⚠️',
        color: 'warning',
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      setAddingDomain(true);
      
      // Format domain if needed (ensure it has protocol)
      let formattedDomain = newDomain.trim();
      if (!formattedDomain.startsWith('http')) {
        formattedDomain = `https://${formattedDomain}`;
      }
      
      // Check if domain already exists
      if (domains[formattedDomain]) {
        addNotification({
          type: 'error',
          title: 'Domain Exists',
          message: 'This domain is already being monitored',
          icon: 'ℹ️',
          color: 'info',
          timestamp: new Date().toISOString()
        });
        setAddingDomain(false);
        return;
      }
      
      // Add the domain to our local state (in a real app, this would be an API call)
      const newDomainEntry = {
        [formattedDomain]: {
          is_up: false, // Will be checked shortly
          updated_at: new Date().toISOString()
        }
      };
      
      // Update domains state
      const updatedDomains = { ...domains, ...newDomainEntry };
      setDomains(updatedDomains);
      
      // Clear input
      setNewDomain('');
      
      // Notify user
      addNotification({
        type: 'new_domain_added',
        title: 'Domain Added',
        message: `${formattedDomain.replace('https://', '')} has been added to monitoring`,
        domain: formattedDomain,
        icon: '✅',
        color: 'success',
        timestamp: new Date().toISOString()
      });
      
      // Check the status of the newly added domain
      setTimeout(() => {
        checkSingleDomainStatus(formattedDomain);
      }, 1000);
      
    } catch (err) {
      console.error('Error adding domain:', err);
      addNotification({
        type: 'error',
        title: 'Add Domain Failed',
        message: 'Failed to add domain. Please try again.',
        icon: '❌',
        color: 'danger',
        timestamp: new Date().toISOString()
      });
    } finally {
      setAddingDomain(false);
    }
  };

  // 🔥 NEW: Function to delete a domain
  const deleteDomain = (domainToDelete) => {
    // Create a new object without the domain to delete
    const updatedDomains = { ...domains };
    delete updatedDomains[domainToDelete];
    
    // Update state
    setDomains(updatedDomains);
    
    // Notify user
    addNotification({
      type: 'domain_deleted',
      title: 'Domain Removed',
      message: `${domainToDelete.replace('https://', '')} has been removed from monitoring`,
      domain: domainToDelete,
      icon: '🗑️',
      color: 'info',
      timestamp: new Date().toISOString()
    });
  };

  // 🔥 NEW: Check for domain status changes and send notifications
  const checkDomainStatusChanges = (newDomains) => {
    if (Object.keys(previousDomains).length === 0) return;

    const changes = [];
    
    Object.entries(newDomains).forEach(([domain, newInfo]) => {
      const oldInfo = previousDomains[domain];
      
      if (oldInfo) {
        // Check if status changed
        if (oldInfo.is_up !== newInfo.is_up) {
          const change = {
            domain,
            from: oldInfo.is_up ? 'UP' : 'DOWN',
            to: newInfo.is_up ? 'UP' : 'DOWN',
            timestamp: new Date().toLocaleString()
          };
          changes.push(change);
          
          // Send notification for status change
          sendDomainStatusNotification(change);
        }
      }
    });

    // Check for new domains
    Object.entries(newDomains).forEach(([domain, newInfo]) => {
      if (!previousDomains[domain]) {
        const change = {
          domain,
          from: 'NEW',
          to: newInfo.is_up ? 'UP' : 'DOWN',
          timestamp: new Date().toLocaleString()
        };
        changes.push(change);
        
        // Send notification for new domain
        sendNewDomainNotification(domain, newInfo.is_up);
      }
    });

    if (changes.length > 0) {
      setDomainChanges(prev => [...changes, ...prev].slice(0, 10)); // Keep last 10 changes
    }
  };

  // 🔥 NEW: Send notification when domain status changes
  const sendDomainStatusNotification = (change) => {
    const statusEmoji = change.to === 'UP' ? '🟢' : '🔴';
    const priority = change.to === 'DOWN' ? 'HIGH' : 'INFO';
    
    addNotification({
      type: 'domain_status_change',
      title: `${statusEmoji} Domain Status Changed`,
      message: `${change.domain} changed from ${change.from} to ${change.to}`,
      domain: change.domain,
      fromStatus: change.from,
      toStatus: change.to,
      priority: priority,
      forAdminOrLeader: true, // Only admins and team leaders get domain notifications
      icon: change.to === 'UP' ? '🟢' : '🔴',
      color: change.to === 'UP' ? 'success' : 'danger',
      timestamp: new Date().toISOString()
    });

    // Also log to console for debugging
    console.log(`🔔 Domain Status Change: ${change.domain} - ${change.from} → ${change.to}`);
  };

  // 🔥 NEW: Send notification for new domain
  const sendNewDomainNotification = (domain, isUp) => {
    const statusEmoji = isUp ? '🟢' : '🔴';
    
    addNotification({
      type: 'new_domain',
      title: '🌐 New Domain Added',
      message: `${domain} is now being monitored (Status: ${isUp ? 'UP' : 'DOWN'})`,
      domain: domain,
      isUp: isUp,
      forAdminOrLeader: true,
      icon: '🌐',
      color: 'info',
      timestamp: new Date().toISOString()
    });
  };

  // 🔥 NEW: Manual domain status check and notification
  const checkSingleDomainStatus = async (domain) => {
    try {
      const response = await fetch(domain, { 
        method: 'HEAD',
        mode: 'no-cors'
      }).catch(() => ({ ok: false }));
      
      const isUp = response.ok;
      
      // Update the domain status in our local state
      setDomains(prev => ({
        ...prev,
        [domain]: {
          ...prev[domain],
          is_up: isUp,
          updated_at: new Date().toISOString()
        }
      }));
      
      addNotification({
        type: 'manual_domain_check',
        title: 'Manual Domain Check',
        message: `${domain} is currently ${isUp ? 'UP' : 'DOWN'}`,
        domain: domain,
        isUp: isUp,
        forAdminOrLeader: true,
        icon: '🔍',
        color: isUp ? 'success' : 'warning',
        timestamp: new Date().toISOString()
      });
      
      return isUp;
    } catch (error) {
      console.error(`Manual check failed for ${domain}:`, error);
      return false;
    }
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

  // ডোমেইন স্ট্যাটাস ক্যালকুলেশন
  const totalDomains = Object.keys(domains).length;
  const upDomains = Object.values(domains).filter(domain => domain.is_up).length;
  const downDomains = totalDomains - upDomains;
  const uptimePercentage = totalDomains > 0 ? ((upDomains / totalDomains) * 100).toFixed(1) : 0;

  // Critical domains (important domains that are down)
  const criticalDomains = Object.entries(domains)
    .filter(([domain, info]) => !info.is_up)
    .map(([domain]) => domain);

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
              <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500', color: 'white' }}>
                Navigation
              </h5>
            )}
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <Link 
                  to="/dashboard" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Dashboard"
                >
                  <FaHome style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>Dashboard</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problem/create" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>Create Problem</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problems" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="All Problems"
                >
                  <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>All Problems</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/domain-status" 
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  title="Domain Status"
                >
                  <FaGlobe style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>Domain Status</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>Reports</span>}
                </Link>
              </li>
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/admin" 
                    className="nav-link text-white rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Admin Panel"
                  >
                    <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>Admin Panel</span>}
                  </Link>
                </li>
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
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h1 className="h3 mb-0" style={{ color: '#333' }}>Domain Status Monitor</h1>
            </div>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-primary d-flex align-items-center"
                onClick={fetchDomainStatus}
                disabled={loading}
              >
                <FaSyncAlt className={loading ? 'spinning' : ''} style={{ marginRight: '8px' }} />
                Refresh Status
              </button>
            </div>
          </div>

          {error && (
            <div className="alert alert-danger d-flex justify-content-between align-items-center">
              <span>Error: {error}</span>
              <button className="btn btn-sm btn-danger" onClick={fetchDomainStatus}>
                Retry
              </button>
            </div>
          )}

          {/* Add New Domain Section */}
          <div className="card border-0 shadow-sm mb-4">
            <div className="card-header bg-white">
              <h5 className="mb-0" style={{ color: '#333' }}>
                <FaPlus className="me-2" />
                Add New Domain
              </h5>
            </div>
            <div className="card-body">
              <div className="input-group">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Enter domain (e.g., example.com or https://example.com)"
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  disabled={addingDomain}
                />
                <button
                  className="btn btn-primary"
                  type="button"
                  onClick={addNewDomain}
                  disabled={addingDomain || !newDomain.trim()}
                >
                  {addingDomain ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <FaPlus className="me-1" />
                      Add Domain
                    </>
                  )}
                </button>
              </div>
              <div className="form-text mt-2">
                Enter a domain name with or without "https://" - the system will automatically format it correctly.
              </div>
            </div>
          </div>

          {/* Recent Changes */}
          {domainChanges.length > 0 && (
            <div className="alert alert-info mb-4">
              <h6 className="mb-2">
                <FaBell className="me-2" />
                Recent Domain Changes
              </h6>
              <div className="small">
                {domainChanges.slice(0, 3).map((change, index) => (
                  <div key={index} className="d-flex justify-content-between">
                    <span>
                      <strong>{change.domain.replace('https://', '')}</strong>: 
                      <span className={change.to === 'DOWN' ? 'text-danger' : 'text-success'}>
                        {change.from} → {change.to}
                      </span>
                    </span>
                    <small className="text-muted">{change.timestamp}</small>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="row g-3 mb-4">
            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaGlobe style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem', color: 'white' }} />
                  <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'white' }}>
                    {totalDomains}
                  </h2>
                  <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95, color: 'white' }}>
                    Total Domains
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                background: 'linear-gradient(135deg, #1cc88a 0%, #13855c 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaCheckCircle style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem', color: 'white' }} />
                  <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'white' }}>
                    {upDomains}
                  </h2>
                  <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95, color: 'white' }}>
                    Domains Up
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                background: 'linear-gradient(135deg, #e74a3b 0%, #be2617 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaTimesCircle style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem', color: 'white' }} />
                  <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'white' }}>
                    {downDomains}
                  </h2>
                  <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95, color: 'white' }}>
                    Domains Down
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-3">
              <div className="card border-0 shadow-sm h-100" style={{ 
                background: 'linear-gradient(135deg, #f6c23e 0%, #dda20a 100%)'
              }}>
                <div className="card-body text-white text-center">
                  <FaChartLine style={{ fontSize: '2.5rem', opacity: 0.9, marginBottom: '0.75rem', color: 'white' }} />
                  <h2 className="mb-2" style={{ fontSize: '2.5rem', fontWeight: '600', color: 'white' }}>
                    {uptimePercentage}%
                  </h2>
                  <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '400', opacity: 0.95, color: 'white' }}>
                    Uptime Rate
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Domains Table */}
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0" style={{ color: '#333' }}>Domain Status Details</h5>
              <small className="text-muted">
                Last updated: {Object.values(domains)[0]?.updated_at || 'N/A'}
              </small>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="thead-light" style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th className="text-center align-middle border-0" style={{ width: '35%', color: '#333' }}>Domain</th>
                      <th className="text-center align-middle border-0" style={{ width: '20%', color: '#333' }}>Status</th>
                      <th className="text-center align-middle border-0" style={{ width: '30%', color: '#333' }}>Last Checked</th>
                      <th className="text-center align-middle border-0" style={{ width: '15%', color: '#333' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(domains).map(([domain, info]) => (
                      <tr key={domain} className="align-middle">
                        <td className="text-center">
                          <a 
                            href={domain} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-decoration-none fw-bold"
                            onClick={(e) => {
                              e.preventDefault();
                              checkSingleDomainStatus(domain);
                            }}
                            style={{ cursor: 'pointer', color: '#333' }}
                            title="Click to check domain status manually"
                          >
                            {domain.replace('https://', '')}
                          </a>
                        </td>
                        <td className="text-center">
                          <div className="d-flex justify-content-center align-items-center">
                            <span 
                              className={`badge ${
                                info.is_up 
                                  ? 'bg-success' 
                                  : 'bg-danger'
                              } d-flex align-items-center justify-content-center py-2 px-3`}
                              style={{ 
                                minWidth: '120px',
                                fontSize: '0.9rem',
                                fontWeight: '600'
                              }}
                            >
                              {info.is_up 
                                ? (
                                  <>
                                    <FaArrowUp className="me-2" style={{ fontSize: '0.8rem' }} />
                                    <span>UP</span>
                                  </>
                                )
                                : (
                                  <>
                                    <FaArrowDown className="me-2" style={{ fontSize: '0.8rem' }} />
                                    <span>DOWN</span>
                                  </>
                                )
                              }
                            </span>
                          </div>
                        </td>
                        <td className="text-center text-muted">
                          {info.updated_at ? new Date(info.updated_at).toLocaleString() : 'N/A'}
                        </td>
                        <td className="text-center">
                          <button
                            className="btn btn-outline-danger btn-sm"
                            onClick={() => deleteDomain(domain)}
                            title="Remove domain from monitoring"
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .spinning {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .table td, .table th {
          vertical-align: middle !important;
        }
        
        .table-hover tbody tr:hover {
          background-color: rgba(0, 123, 255, 0.05) !important;
        }
        
        .badge {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }
        
        .badge:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
}