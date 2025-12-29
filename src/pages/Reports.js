// src/pages/Reports.js - Fixed with corrected API endpoints and filters

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import {
  FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt,
  FaUsersCog, FaChevronLeft, FaChevronRight, FaDownload,
  FaPrint, FaFilter, FaCalendarAlt, FaFilePdf, FaSpinner, FaGlobe
} from 'react-icons/fa';

export default function Reports() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [users, setUsers] = useState([]);

  // Add the getDashboardPath function
  const getDashboardPath = () => {
    return user?.role === 'admin' || user?.role === 'team_leader'
      ? '/dashboard'
      : '/employee-dashboard';
  };

  // Filter states
  const [filters, setFilters] = useState({
    department: '',
    priority: '',
    status: '',
    createdBy: '',
    assignedTo: '',
    startDate: '',
    endDate: ''
  });

  // Load problems from backend API
  const fetchProblems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ticketapi.wineds.com/api/problems/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'success') {
        let filteredData = data.data;

        // Filter based on user role
        if (!(user?.role === 'admin' || user?.role === 'team_leader')) {
          filteredData = filteredData.filter(p =>
            p.created_by?.id === user?.id || p.assigned_to?.id === user?.id
          );
        }

        setProblems(filteredData);
        setFilteredProblems(filteredData);
      } else {
        toast.error(data.messages?.[0] || 'Failed to load problems');
      }
    } catch (error) {
      console.error('Failed to fetch problems:', error);
      toast.error('Network error while loading problems');
    } finally {
      setLoading(false);
    }
  };

  // Load users from backend - FIXED ENDPOINT
  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ticketapi.wineds.com/api/users/getAll', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({}) // Empty body for POST request
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          setUsers(data.data || []);
        }
      } else {
        console.warn('Users API returned non-ok status:', response.status);
        // Fallback to extracting users from problems data
        extractUsersFromProblems();
      }
    } catch (error) {
      console.error('Failed to load users from API:', error);
      // Fallback to extracting users from problems data
      extractUsersFromProblems();
    }
  };

  // Fallback: Extract users from problems data
  const extractUsersFromProblems = () => {
    const userSet = new Set();
    const userList = [];

    problems.forEach(problem => {
      // Add created_by user
      if (problem.created_by?.id && problem.created_by?.name) {
        const userKey = `creator_${problem.created_by.id}`;
        if (!userSet.has(userKey)) {
          userSet.add(userKey);
          userList.push({
            id: problem.created_by.id,
            name: problem.created_by.name,
            username: problem.created_by.username || problem.created_by.email || ''
          });
        }
      }

      // Add assigned_to user
      if (problem.assigned_to?.id && problem.assigned_to?.name) {
        const userKey = `assignee_${problem.assigned_to.id}`;
        if (!userSet.has(userKey)) {
          userSet.add(userKey);
          userList.push({
            id: problem.assigned_to.id,
            name: problem.assigned_to.name,
            username: problem.assigned_to.username || problem.assigned_to.email || ''
          });
        }
      }
    });

    setUsers(userList);
    console.log('Extracted users from problems data:', userList.length);
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    if (problems.length > 0) {
      loadUsers();
    }
  }, [problems]);

  useEffect(() => {
    applyFilters();
  }, [problems, filters]);

  // Get user name from created_by object
  const getUserNameFromCreatedBy = (createdByObj) => {
    if (!createdByObj) return 'Unknown';
    return createdByObj.name || createdByObj.username || createdByObj.email || 'Unknown';
  };

  // Get user name from assigned_to object
  const getUserNameFromAssignedTo = (assignedToObj) => {
    if (!assignedToObj) return 'Unassigned';
    return assignedToObj.name || assignedToObj.username || assignedToObj.email || 'Unassigned';
  };

  // Helper functions for the report
  const calculateDuration = (createdAt) => {
    if (!createdAt) return 'N/A';
    const created = new Date(createdAt);
    const now = new Date();
    const diffTime = Math.abs(now - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return '1 day';
    if (diffDays < 30) return `${diffDays} days`;

    const diffMonths = Math.floor(diffDays / 30);
    const remainingDays = diffDays % 30;

    if (remainingDays === 0) return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`;
    return `${diffMonths} month${diffMonths > 1 ? 's' : ''} ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
  };

  const getProblemType = (problem) => {
    if (problem.statement) {
      const statement = problem.statement.toLowerCase();
      if (statement.includes('sms') || statement.includes('message')) return 'SMS Service Issue';
      if (statement.includes('email') || statement.includes('mail')) return 'Email Service Issue';
      if (statement.includes('topup') || statement.includes('top-up')) return 'Topup Service Issue';
      if (statement.includes('whatsapp') || statement.includes('wa')) return 'WhatsApp Service Issue';
      if (statement.includes('web') || statement.includes('website')) return 'Web Solution Issue';
      if (statement.includes('game') || statement.includes('games')) return 'Games Service Issue';
      if (statement.includes('dcb')) return 'DCB Service Issue';
      if (statement.includes('balance')) return 'Balance Service Issue';
      if (statement.includes('international')) return 'International SMS Issue';
      if (statement.includes('invoice')) return 'Invoice Solution Issue';
      if (statement.includes('campaign')) return 'Campaign Service Issue';
      if (statement.includes('push') || statement.includes('pull')) return 'Push-Pull Service Issue';
    }
    return 'Technical Service Issue';
  };

  // Apply filters to problems
  const applyFilters = () => {
    let result = [...problems];

    // Apply department filter
    if (filters.department) {
      result = result.filter(p => p.department === filters.department);
    }

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(p => p.priority === filters.priority);
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(p => p.status === filters.status);
    }

    // Apply created by filter
    if (filters.createdBy) {
      result = result.filter(p => p.created_by?.id?.toString() === filters.createdBy);
    }

    // Apply assigned to filter
    if (filters.assignedTo) {
      result = result.filter(p => p.assigned_to?.id?.toString() === filters.assignedTo);
    }

    // Apply date range filters
    if (filters.startDate) {
      const startDate = new Date(filters.startDate);
      result = result.filter(p => new Date(p.created_at) >= startDate);
    }

    if (filters.endDate) {
      const endDate = new Date(filters.endDate);
      // Set end time to end of day
      endDate.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.created_at) <= endDate);
    }

    setFilteredProblems(result);
  };

  // Export to CSV
  const exportToCSV = () => {
    const csvContent = [
      ['Problem ID', 'Title', 'Department', 'Priority', 'Status', 'Created By', 'Assigned To', 'Created At', 'Resolved At'],
      ...filteredProblems.map(p => [
        p.id,
        p.title,
        p.department,
        p.priority,
        p.status,
        getUserNameFromCreatedBy(p.created_by),
        getUserNameFromAssignedTo(p.assigned_to),
        p.created_at,
        p.resolved_at || 'N/A'
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'problems_report.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Print report
  const printReport = () => {
    window.print();
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      department: '',
      priority: '',
      status: '',
      createdBy: '',
      assignedTo: '',
      startDate: '',
      endDate: ''
    });
  };

  // Get unique values for filter dropdowns
  const getUniqueDepartments = () => {
    const departments = problems.map(p => p.department).filter(Boolean);
    return [...new Set(departments)];
  };

  const getUniquePriorities = () => {
    const priorities = problems.map(p => p.priority).filter(Boolean);
    return [...new Set(priorities)];
  };

  const getUniqueStatuses = () => {
    const statuses = problems.map(p => p.status).filter(Boolean);
    return [...new Set(statuses)];
  };

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

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
          {/* Toggle Button */}
          <button
            onClick={() => setSidebarMinimized(!sidebarMinimized)}
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
                  to={getDashboardPath()}
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  style={sidebarLinkStyle}
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
                  style={sidebarLinkStyle}
                  style={sidebarLinkStyle}
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
                  style={sidebarLinkStyle}
                  style={sidebarLinkStyle}
                  title="All Problems"
                >
                  <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link
                  to="/reports"
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>

              {/* Add Domain Status option for Admin and Team Leader */}
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link
                    to="/domain-status"
                    className="nav-link text-white rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
                    title="Domain Status"
                  >
                    <FaGlobe style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Domain Status</span>}
                  </Link>
                </li>
              )}

              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link
                    to="/roles"
                    className="nav-link text-white rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
                    title="Role Management"
                  >
                    <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Role Management</span>}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-grow-1 p-3">
          <div className="card shadow-sm border-0">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h4 className="mb-0">
                <FaFileAlt className="me-2" />
                Problems Report
              </h4>
              <div className="d-flex gap-2">
                <button className="btn btn-light btn-sm" onClick={exportToCSV}>
                  <FaDownload className="me-1" /> Export CSV
                </button>
                <button className="btn btn-light btn-sm" onClick={printReport}>
                  <FaPrint className="me-1" /> Print
                </button>
              </div>
            </div>

            <div className="card-body">
              {/* Filters Section */}
              <div className="card mb-4">
                <div className="card-header bg-light">
                  <h6 className="mb-0 d-flex justify-content-between align-items-center">
                    <span>
                      <FaFilter className="me-2" />
                      Filter Options
                    </span>
                    <button className="btn btn-sm btn-outline-secondary" onClick={resetFilters}>
                      Reset Filters
                    </button>
                  </h6>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-3">
                      <label className="form-label">Department</label>
                      <select
                        className="form-control"
                        value={filters.department}
                        onChange={(e) => setFilters({ ...filters, department: e.target.value })}
                      >
                        <option value="">All Departments</option>
                        {getUniqueDepartments().map(dept => (
                          <option key={dept} value={dept}>{dept}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Priority</label>
                      <select
                        className="form-control"
                        value={filters.priority}
                        onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
                      >
                        <option value="">All Priorities</option>
                        {getUniquePriorities().map(priority => (
                          <option key={priority} value={priority}>{priority}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Status</label>
                      <select
                        className="form-control"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                      >
                        <option value="">All Statuses</option>
                        {getUniqueStatuses().map(status => (
                          <option key={status} value={status}>{status}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Created By</label>
                      <select
                        className="form-control"
                        value={filters.createdBy}
                        onChange={(e) => setFilters({ ...filters, createdBy: e.target.value })}
                      >
                        <option value="">All Users</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Assigned To</label>
                      <select
                        className="form-control"
                        value={filters.assignedTo}
                        onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
                      >
                        <option value="">All Users</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>{user.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">Start Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filters.startDate}
                        onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                      />
                    </div>

                    <div className="col-md-3">
                      <label className="form-label">End Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={filters.endDate}
                        onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Report Summary */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card border-primary text-center">
                    <div className="card-body">
                      <h3 className="text-primary mb-0">{filteredProblems.length}</h3>
                      <small className="text-muted">Total Problems</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-warning text-center">
                    <div className="card-body">
                      <h3 className="text-warning mb-0">
                        {filteredProblems.filter(p => p.status === 'pending').length}
                      </h3>
                      <small className="text-muted">Pending</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-success text-center">
                    <div className="card-body">
                      <h3 className="text-success mb-0">
                        {filteredProblems.filter(p => p.status === 'resolved').length}
                      </h3>
                      <small className="text-muted">Resolved</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-info text-center">
                    <div className="card-body">
                      <h3 className="text-info mb-0">
                        {filteredProblems.filter(p => p.status === 'in_progress').length}
                      </h3>
                      <small className="text-muted">In Progress</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Problems Table */}
              {loading ? (
                <div className="text-center py-5">
                  <FaSpinner className="fa-spin fs-1 text-primary mb-3" />
                  <p className="text-muted">Loading problems...</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>ID</th>
                        <th>Title</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Assigned To</th>
                        <th>Created At</th>
                        <th>Resolved At</th>
                        <th>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.length === 0 ? (
                        <tr>
                          <td colSpan="10" className="text-center py-5">
                            <FaFileAlt className="fs-1 text-muted mb-3 d-block mx-auto" />
                            <p className="text-muted mb-0">No problems found matching your filters.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredProblems.map(problem => (
                          <tr key={problem.id} className="align-middle">
                            <td>#{problem.id}</td>
                            <td>
                              <div className="fw-semibold">{problem.title}</div>
                              <small className="text-muted">{getProblemType(problem)}</small>
                            </td>
                            <td>{problem.department}</td>
                            <td>
                              <span className={`badge ${problem.priority === 'high' ? 'bg-danger' :
                                problem.priority === 'medium' ? 'bg-warning' :
                                  'bg-info'
                                }`}>
                                {problem.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${problem.status === 'pending' ? 'bg-warning' :
                                problem.status === 'in_progress' ? 'bg-primary' :
                                  'bg-success'
                                }`}>
                                {problem.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td>{getUserNameFromCreatedBy(problem.created_by)}</td>
                            <td>{getUserNameFromAssignedTo(problem.assigned_to)}</td>
                            <td>{new Date(problem.created_at).toLocaleDateString()}</td>
                            <td>
                              {problem.resolved_at
                                ? new Date(problem.resolved_at).toLocaleDateString()
                                : 'N/A'
                              }
                            </td>
                            <td>{calculateDuration(problem.created_at)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}