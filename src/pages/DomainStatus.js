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
  FaPlus,
  FaTrash,
  FaEdit,
  FaSave,
  FaBan
} from 'react-icons/fa';

export default function DomainStatus() {
  const { user } = useAuth();
  const { addNotification } = useNotifications();
  const [domains, setDomains] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  // Add/Edit States
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [editingDomain, setEditingDomain] = useState(null); // The domain object being edited
  const [editForm, setEditForm] = useState({ domain: '', is_active: true });
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchDomainStatus();
  }, []);

  const fetchDomainStatus = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await api.get('/domains/status');
      setDomains(response.data);
    } catch (err) {
      setError(err.message);
      console.error('Domain status fetch error:', err);
      addNotification({
        type: 'error',
        title: 'Fetch Error',
        message: 'Failed to fetch domain statuses',
        icon: '❌',
        color: 'danger'
      });
    } finally {
      setLoading(false);
    }
  };

  const addNewDomain = async () => {
    if (!newDomain.trim()) {
      addNotification({
        type: 'error',
        title: 'Invalid Domain',
        message: 'Please enter a valid domain name',
        icon: '⚠️',
        color: 'warning'
      });
      return;
    }

    try {
      setAddingDomain(true);

      // Ensure protocol
      let formattedDomain = newDomain.trim();
      if (!formattedDomain.startsWith('http')) {
        formattedDomain = `https://${formattedDomain}`;
      }

      const response = await api.post('/domains/store', {
        domain: formattedDomain,
        is_active: true
      });

      addNotification({
        type: 'success',
        title: 'Domain Added',
        message: 'Domain added successfully',
        icon: '✅',
        color: 'success'
      });

      setNewDomain('');
      fetchDomainStatus(); // Refresh list

    } catch (err) {
      console.error('Error adding domain:', err);
      addNotification({
        type: 'error',
        title: 'Add Failed',
        message: err.response?.data?.message || 'Failed to add domain',
        icon: '❌',
        color: 'danger'
      });
    } finally {
      setAddingDomain(false);
    }
  };

  const deleteDomain = async (id, domainName) => {
    if (!window.confirm(`Are you sure you want to delete ${domainName}?`)) return;

    try {
      await api.delete(`/domains/${id}`);

      addNotification({
        type: 'success',
        title: 'Domain Deleted',
        message: 'Domain removed successfully',
        icon: '🗑️',
        color: 'info'
      });

      fetchDomainStatus(); // Refresh list
    } catch (err) {
      console.error('Error deleting domain:', err);
      addNotification({
        type: 'error',
        title: 'Delete Failed',
        message: 'Failed to delete domain',
        icon: '❌',
        color: 'danger'
      });
    }
  };

  const startEdit = (domain) => {
    setEditingDomain(domain);
    setEditForm({
      domain: domain.domain || Object.keys(domains).find(key => domains[key].id === domain.id), // Fallback if domain name isn't in value
      is_active: domain.is_active
    });
  };

  const cancelEdit = () => {
    setEditingDomain(null);
    setEditForm({ domain: '', is_active: true });
  };

  const updateDomain = async () => {
    if (!editingDomain) return;

    try {
      setUpdating(true);

      await api.put(`/domains/${editingDomain.id}`, {
        domain: editForm.domain,
        is_active: editForm.is_active
      });

      addNotification({
        type: 'success',
        title: 'Domain Updated',
        message: 'Domain updated successfully',
        icon: '✅',
        color: 'success'
      });

      setEditingDomain(null);
      fetchDomainStatus(); // Refresh list
    } catch (err) {
      console.error('Error updating domain:', err);
      addNotification({
        type: 'error',
        title: 'Update Failed',
        message: err.response?.data?.message || 'Failed to update domain',
        icon: '❌',
        color: 'danger'
      });
    } finally {
      setUpdating(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

  // Stats Calculation
  // domains is an object: { "url": { id, is_up, ... }, ... }
  const domainEntries = Object.entries(domains || {});
  const totalDomains = domainEntries.length;
  const upDomains = domainEntries.filter(([_, info]) => info.is_up).length;
  const downDomains = totalDomains - upDomains;
  const uptimePercentage = totalDomains > 0 ? ((upDomains / totalDomains) * 100).toFixed(1) : 0;

  if (loading && totalDomains === 0) {
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
                <>
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
                  <li className="nav-item mb-2">
                    <Link
                      to="/roles"
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={sidebarLinkStyle}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Role Management"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px', color: 'white' }} />
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem', color: 'white' }}>Role Management</span>}
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
          {/* <div className="d-flex justify-content-between align-items-center mb-4">
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
          </div> */}

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
                  placeholder="Enter domain (e.g., https://example.com)"
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
            </div>
          </div>

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
              <h5 className="mb-0" style={{ color: '#333' }}>Domain Status details</h5>
              <div className="small text-muted">
                {domainEntries.length > 0 && `Last updated: ${domainEntries[0][1].updated_at || 'Just now'}`}
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table mb-0">
                  <thead className="thead-light" style={{ backgroundColor: '#f8f9fa' }}>
                    <tr>
                      <th className="text-center align-middle border-0" style={{ width: '30%', color: '#333' }}>Domain</th>
                      <th className="text-center align-middle border-0" style={{ width: '15%', color: '#333' }}>Status</th>
                      <th className="text-center align-middle border-0" style={{ width: '15%', color: '#333' }}>Monitoring</th>
                      <th className="text-center align-middle border-0" style={{ width: '25%', color: '#333' }}>Last Checked</th>
                      <th className="text-center align-middle border-0" style={{ width: '15%', color: '#333' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {domainEntries.map(([domainUrl, info]) => {
                      // Note: API returns domain as key, but sometimes key might mismatch if updated. 
                      // We'll use the key as the display url unless info has a domain field.
                      const displayDomain = info.domain || domainUrl;

                      return (
                        <tr key={info.id || domainUrl} className="align-middle">
                          <td className="text-center">
                            <a
                              href={displayDomain}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-decoration-none fw-bold"
                              style={{ color: '#333' }}
                            >
                              {displayDomain.replace('https://', '').replace('http://', '')}
                            </a>
                          </td>
                          <td className="text-center">
                            <span
                              className={`badge ${info.is_up ? 'bg-success' : 'bg-danger'} d-inline-flex align-items-center justify-content-center py-2 px-3`}
                              style={{ minWidth: '100px' }}
                            >
                              {info.is_up ? <><FaArrowUp className="me-2" />UP</> : <><FaArrowDown className="me-2" />DOWN</>}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${info.is_active ? 'bg-info text-dark' : 'bg-secondary'} rounded-pill`}>
                              {info.is_active ? 'Active' : 'Paused'}
                            </span>
                          </td>
                          <td className="text-center text-muted small">
                            {info.last_checked_at ? new Date(info.last_checked_at).toLocaleString() : 'Pending...'}
                            <br />
                            <span style={{ fontSize: '0.75rem' }}>Updated: {new Date(info.updated_at).toLocaleString()}</span>
                          </td>
                          <td className="text-center">
                            <div className="btn-group">
                              <button
                                className="btn btn-outline-primary btn-sm"
                                onClick={() => startEdit({ ...info, domain: displayDomain })}
                                title="Edit Domain"
                              >
                                <FaEdit />
                              </button>
                              <button
                                className="btn btn-outline-danger btn-sm"
                                onClick={() => deleteDomain(info.id, displayDomain)}
                                title="Remove Domain"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {domainEntries.length === 0 && (
                      <tr>
                        <td colSpan="5" className="text-center py-4 text-muted">
                          No domains monitored. Add one to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal (Simple Overlay) */}
      {editingDomain && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 2000
        }}>
          <div className="card shadow-lg" style={{ width: '400px' }}>
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Edit Domain</h5>
              <button type="button" className="btn-close" aria-label="Close" onClick={cancelEdit}></button>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label className="form-label">Domain URL</label>
                <input
                  type="text"
                  className="form-control"
                  value={editForm.domain}
                  onChange={(e) => setEditForm({ ...editForm, domain: e.target.value })}
                />
              </div>
              <div className="mb-3 form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="activeSwitch"
                  checked={editForm.is_active}
                  onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                />
                <label className="form-check-label" htmlFor="activeSwitch">
                  Monitoring Active
                </label>
              </div>
            </div>
            <div className="card-footer bg-white text-end">
              <button className="btn btn-secondary me-2" onClick={cancelEdit}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={updateDomain}
                disabled={updating}
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
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
        .badge {
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}