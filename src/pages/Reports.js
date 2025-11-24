// src/pages/Reports.js - Fixed Code

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaChevronLeft, FaChevronRight, FaDownload, FaPrint, FaFilter, FaCalendarAlt, FaEnvelope, FaFilePdf } from 'react-icons/fa';

export default function Reports() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [filteredProblems, setFilteredProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [users, setUsers] = useState([]); // ✅ Users state added

  // Filter states - SMS Log Style
  const [filters, setFilters] = useState({
    department: '',
    priority: '',
    status: '',
    createdBy: '',
    assignedTo: '',
    startDate: '',
    endDate: ''
  });

  // ✅ Load users from localStorage for name resolution
  useEffect(() => {
    const loadUsers = () => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
        setUsers(storedUsers);
        console.log('✅ Users loaded for name resolution:', storedUsers.length);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };

    loadUsers();
  }, []);

  // ✅ Function to get user name by ID
  const getUserNameById = (userId) => {
    if (!userId) return 'Unassigned';
    
    const foundUser = users.find(u => u.id === userId || u.id == userId);
    return foundUser ? foundUser.name : `User#${userId}`;
  };

  // ✅ Function to get user name by username/email (for createdBy field)
  const getUserNameByUsername = (username) => {
    if (!username) return 'Unknown';
    
    const foundUser = users.find(u => u.username === username || u.email === username);
    return foundUser ? foundUser.name : username;
  };

  // Helper functions for the report
  const calculateDuration = (createdAt) => {
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

  const getSolvingTeam = (problem) => {
    // ✅ Use user name instead of ID
    if (problem.assignedTo) {
      const assignedUserName = getUserNameById(problem.assignedTo);
      return `${assignedUserName}'s Team`;
    }
    
    if (problem.department === 'IT & Innovation') {
      return 'IT Support Team';
    } else if (problem.department === 'Business') {
      return 'Business Support Team';
    } else if (problem.department === 'Accounts') {
      return 'Accounts Team';
    }
    
    return 'Technical Support Team';
  };

  const getTeamLeader = (department) => {
    const teamLeaders = {
      'IT & Innovation': 'IT Department Team Leader',
      'Business': 'Business Department Team Leader', 
      'Accounts': 'Accounts Department Team Leader'
    };
    return teamLeaders[department] || 'Department Team Leader';
  };

  const downloadPDFReport = (problem) => {
    // ✅ Use user names in PDF report
    const assignedUserName = getUserNameById(problem.assignedTo);
    const createdByName = getUserNameByUsername(problem.createdBy);
    
    const pdfContent = `
PROBLEM RESOLUTION REPORT
=========================

TICKET INFORMATION:
──────────────────
• Ticket Number: #${String(problem.id).padStart(5, '0')}
• Department: ${problem.department}
• Priority: ${problem.priority}
• Status: ${problem.status === 'pending_approval' ? 'PENDING APPROVAL' : problem.status.replace('_', ' ').toUpperCase()}
• Created Date: ${new Date(problem.createdAt).toLocaleDateString('en-BD')}
• Created Time: ${new Date(problem.createdAt).toLocaleTimeString('en-BD')}

TEAM INFORMATION:
────────────────
• Reported By: ${createdByName}
• Assigned To: ${assignedUserName}
• Solving Team: ${getSolvingTeam(problem)}
• Team Leader: ${getTeamLeader(problem.department)}

PROBLEM DESCRIPTION:
───────────────────
${problem.statement || problem.description || 'No detailed description provided.'}

ADDITIONAL INFORMATION:
──────────────────────
• Problem Type: ${getProblemType(problem)}
• Resolution Duration: ${calculateDuration(problem.createdAt)}
• Report Generated: ${new Date().toLocaleString('en-BD')}
• Generated By: ${user?.name || 'System'}

──────────────────────
Official Problem Management System
This is an automatically generated report.
    `.trim();

    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `problem-report-${String(problem.id).padStart(5, '0')}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Report downloaded! Print it as PDF from your text editor.');
  };

  const getResolutionDate = (problem) => {
    if (problem.status === 'done' && problem.actionHistory) {
      const resolutionAction = problem.actionHistory.find(action => 
        action.action.includes('Resolved') || action.action.includes('Done') || action.action.includes('Completed')
      );
      if (resolutionAction) {
        return new Date(resolutionAction.timestamp).toLocaleDateString();
      }
    }
    return 'In Progress';
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [problems, filters]);

  const fetchProblems = () => {
    try {
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      let filteredProblems;
      if (user?.role === 'admin' || user?.role === 'team_leader') {
        filteredProblems = storedProblems;
      } else {
        filteredProblems = storedProblems.filter(p => 
          p.createdBy === user?.name || p.assignedTo === user?.id
        );
      }
      
      setProblems(filteredProblems);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...problems];

    if (filters.department) {
      filtered = filtered.filter(problem => 
        problem.department?.toLowerCase().includes(filters.department.toLowerCase())
      );
    }

    if (filters.priority) {
      filtered = filtered.filter(problem => problem.priority === filters.priority);
    }

    if (filters.status) {
      filtered = filtered.filter(problem => problem.status === filters.status);
    }

    if (filters.createdBy) {
      filtered = filtered.filter(problem => {
        const createdByName = getUserNameByUsername(problem.createdBy);
        return createdByName.toLowerCase().includes(filters.createdBy.toLowerCase());
      });
    }

    if (filters.assignedTo) {
      filtered = filtered.filter(problem => {
        const assignedUserName = getUserNameById(problem.assignedTo);
        return assignedUserName.toLowerCase().includes(filters.assignedTo.toLowerCase());
      });
    }

    if (filters.startDate) {
      filtered = filtered.filter(problem => 
        new Date(problem.createdAt) >= new Date(filters.startDate)
      );
    }

    if (filters.endDate) {
      filtered = filtered.filter(problem => 
        new Date(problem.createdAt) <= new Date(filters.endDate)
      );
    }

    setFilteredProblems(filtered);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

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

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const generateReport = (problem) => {
    setSelectedProblem(problem);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  // ✅ FIXED: CSV export function - Now shows names instead of IDs
  const exportToCSV = () => {
    if (filteredProblems.length === 0) {
      toast.warning('No data to export');
      return;
    }

    const headers = ['Problem ID', 'Department', 'Priority', 'Status', 'Created By', 'Assigned To', 'Created Date', 'Problem Statement'];
    
    const csvData = filteredProblems.map(problem => [
      String(problem.id).padStart(5, '0'),
      problem.department,
      problem.priority,
      problem.status === 'pending_approval' ? 'PENDING APPROVAL' : problem.status.replace('_', ' ').toUpperCase(),
      getUserNameByUsername(problem.createdBy), // ✅ Show name instead of username
      getUserNameById(problem.assignedTo), // ✅ Show name instead of ID
      new Date(problem.createdAt).toLocaleDateString(),
      problem.statement || problem.description || ''
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(field => `"${field}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `problem-reports-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    toast.success(`CSV exported successfully! (${filteredProblems.length} records)`);
  };

  // ✅ Get unique values for dropdowns - Now using names
  const departments = [...new Set(problems.map(p => p.department))].filter(Boolean);
  const creators = [...new Set(problems.map(p => getUserNameByUsername(p.createdBy)))].filter(Boolean);
  const assignees = [...new Set(problems.map(p => getUserNameById(p.assignedTo)))].filter(Boolean);

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

  const isAdminOrLeader = user?.role === 'admin' || user?.role === 'team_leader';

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
    <>
      <div className="d-flex flex-column min-vh-100 no-print" style={{ backgroundColor: '#f8f9fa' }}>
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
                    to={isAdminOrLeader ? "/dashboard" : "/employee-dashboard"}
                    className="nav-link text-white rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Create Problem"
                  >
                    <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                  </Link>
                </li>
                
                {isAdminOrLeader ? (
                  <li className="nav-item mb-2">
                    <Link 
                      to="/problems" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={sidebarLinkStyle}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="All Problems"
                    >
                      <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                    </Link>
                  </li>
                ) : (
                  <li className="nav-item mb-2">
                    <Link 
                      to="/my-issues" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={sidebarLinkStyle}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="My Issues"
                    >
                      <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>My Issues</span>}
                    </Link>
                  </li>
                )}
                
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
                {isAdminOrLeader && (
                  <li className="nav-item mb-2">
                    <Link 
                      to="/admin" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      style={sidebarLinkStyle}
                      onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                      title="Admin Panel"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Admin Panel</span>}
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
            <div className="card shadow border-0">
              <div className="card-header bg-primary text-white py-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <h4 className="mb-1 fw-semibold">
                      <FaFileAlt className="me-2" />
                      {isAdminOrLeader ? 'All Problem Reports' : 'My Problem Reports'}
                    </h4>
                    <small className="opacity-75">
                      {isAdminOrLeader 
                        ? 'Download printable reports for all problems' 
                        : 'Download reports for problems you created or are assigned to'}
                    </small>
                  </div>
                  <button 
                    className="btn btn-success"
                    onClick={exportToCSV}
                    disabled={filteredProblems.length === 0}
                  >
                    <FaDownload className="me-1" />
                    Export CSV
                  </button>
                </div>
              </div>

              {/* SMS Log Style Filter Section */}
              <div className="card-body border-bottom">
                <h5 className="mb-3">
                  <FaFilter className="me-2" />
                  Filter Problems
                </h5>
                
                <div className="row g-3">
                  {/* Department Filter */}
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Department:</label>
                    <select 
                      className="form-select"
                      value={filters.department}
                      onChange={(e) => handleFilterChange('department', e.target.value)}
                    >
                      <option value="">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Filter */}
                  <div className="col-md-6 col-lg-2">
                    <label className="form-label">Priority:</label>
                    <select 
                      className="form-select"
                      value={filters.priority}
                      onChange={(e) => handleFilterChange('priority', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="High">High</option>
                      <option value="Medium">Medium</option>
                      <option value="Low">Low</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div className="col-md-6 col-lg-2">
                    <label className="form-label">Status:</label>
                    <select 
                      className="form-select"
                      value={filters.status}
                      onChange={(e) => handleFilterChange('status', e.target.value)}
                    >
                      <option value="">All</option>
                      <option value="pending">Pending</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                      <option value="pending_approval">Pending Approval</option>
                    </select>
                  </div>

                  {/* Created By Filter */}
                  <div className="col-md-6 col-lg-2">
                    <label className="form-label">Created By:</label>
                    <select 
                      className="form-select"
                      value={filters.createdBy}
                      onChange={(e) => handleFilterChange('createdBy', e.target.value)}
                    >
                      <option value="">All</option>
                      {creators.map(creator => (
                        <option key={creator} value={creator}>{creator}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assigned To Filter */}
                  <div className="col-md-6 col-lg-3">
                    <label className="form-label">Assigned To:</label>
                    <select 
                      className="form-select"
                      value={filters.assignedTo}
                      onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
                    >
                      <option value="">All</option>
                      {assignees.map(assignee => (
                        <option key={assignee} value={assignee}>{assignee}</option>
                      ))}
                    </select>
                  </div>

                  {/* Start Date and End Date Filter */}
                  <div className="col-md-12 col-lg-4">
                    <label className="form-label">Date Range:</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <input
                          type="date"
                          className="form-control"
                          value={filters.startDate}
                          onChange={(e) => handleFilterChange('startDate', e.target.value)}
                          title="Start Date"
                        />
                        <small className="text-muted">Start</small>
                      </div>
                      <div className="col-6">
                        <input
                          type="date"
                          className="form-control"
                          value={filters.endDate}
                          onChange={(e) => handleFilterChange('endDate', e.target.value)}
                          title="End Date"
                        />
                        <small className="text-muted">End</small>
                      </div>
                    </div>
                  </div>

                  <div className="col-md-12 col-lg-2 d-flex align-items-center mt-4">
                    <button 
                      className="btn btn-outline-secondary w-100"
                      onClick={resetFilters}
                      style={{
                        backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        border: '1px solid rgba(108, 117, 125, 0.3)',
                        color: '#6c757d',
                        backdropFilter: 'blur(10px)',
                        transition: 'all 0.3s ease'
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)';
                        e.target.style.borderColor = 'rgba(108, 117, 125, 0.5)';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                        e.target.style.borderColor = 'rgba(108, 117, 125, 0.3)';
                      }}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              </div>

              {/* Problems Table */}
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Problem ID</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Assigned To</th>
                        <th>Created Date</th>
                        <th style={{ textAlign: 'center', width: '100px' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredProblems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="py-4">
                              <FaFileAlt size={48} className="text-muted mb-3" />
                              <p className="text-muted mb-3">No problems found matching your filters</p>
                              <button className="btn btn-primary me-2" onClick={resetFilters}>
                                Reset Filters
                              </button>
                              <Link to="/problem/create" className="btn btn-outline-primary">
                                <FaPlusCircle className="me-2" />
                                Create New Problem
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        filteredProblems.map(problem => (
                          <tr key={problem.id} className="align-middle">
                            <td className="fw-bold">#{String(problem.id).padStart(5, '0')}</td>
                            <td>
                              <span className="fw-semibold">{problem.department}</span>
                            </td>
                            <td>
                              <span className={`badge ${problem.priority === 'High' ? 'bg-danger' : problem.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-success'}`}>
                                {problem.priority === 'High' ? '🔴 ' : problem.priority === 'Medium' ? '🟡 ' : '🟢 '}
                                {problem.priority}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${problem.status === 'pending' ? 'bg-warning text-dark' : problem.status === 'in_progress' ? 'bg-info' : problem.status === 'done' ? 'bg-success' : 'bg-secondary'}`}>
                                {problem.status === 'pending_approval' ? ' PENDING APPROVAL' : 
                                problem.status === 'pending' ? ' PENDING' :
                                problem.status === 'in_progress' ? 'IN PROGRESS' :
                                'SOLVED'}
                              </span>
                            </td>
                            <td>
                              {/* ✅ Show user name instead of username */}
                              <span className="fw-semibold">{getUserNameByUsername(problem.createdBy)}</span>
                            </td>
                            <td>
                              {/* ✅ Show user name instead of ID */}
                              {problem.assignedTo ? (
                                <span className="badge bg-info text-white">
                                  {getUserNameById(problem.assignedTo)}
                                </span>
                              ) : (
                                <span className="badge bg-secondary">UNASSIGNED</span>
                              )}
                            </td>
                            <td>
                              <span className="text-nowrap">
                                {new Date(problem.createdAt).toLocaleDateString('en-BD')}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              <div className="btn-group btn-group-sm" role="group">
                                <button 
                                  className="btn btn-outline-primary btn-sm"
                                  onClick={() => generateReport(problem)}
                                  title="Print Report"
                                >
                                  <FaPrint />
                                </button>
                                <button 
                                  className="btn btn-outline-success btn-sm"
                                  onClick={() => downloadPDFReport(problem)}
                                  title="Download PDF"
                                >
                                  <FaFilePdf />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Printable Report Section */}
      {selectedProblem && (
        <div className="print-only" style={{ display: 'none' }}>
          <div style={{ 
            maxWidth: '190mm',
            minHeight: '277mm',
            margin: '10mm auto',
            padding: '15mm',
            fontFamily: 'Arial, sans-serif',
            fontSize: '11pt',
            lineHeight: '1.3',
            backgroundColor: 'white',
            border: '1px solid #ccc'
          }}>
            
            {/* Header Section */}
            <div className="text-center mb-3">
              <h1 style={{ color: '#2c5aa0', fontSize: '18pt', fontWeight: 'bold', marginBottom: '2px' }}>
                PROBLEM RESOLUTION REPORT
              </h1>
              <p style={{ color: '#666', fontSize: '10pt', margin: 0 }}>
                Official Problem Management System
              </p>
            </div>

            {/* Ticket Info & Priority */}
            <div className="row mb-3">
              <div className="col-8">
                <div style={{ padding: '8px', backgroundColor: '#f5f5f5', borderRadius: '3px' }}>
                  <strong style={{ color: '#2c5aa0', fontSize: '11pt' }}>Ticket # {String(selectedProblem.id).padStart(5, '0')}</strong>
                  <br />
                  <span style={{ color: '#666', fontSize: '9pt' }}>
                    Created: {new Date(selectedProblem.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="col-4 text-end">
                <div style={{ 
                  backgroundColor: selectedProblem.priority === 'High' ? '#dc3545' : 
                                 selectedProblem.priority === 'Medium' ? '#ffc107' : '#28a745',
                  color: selectedProblem.priority === 'Medium' ? '#000' : '#fff',
                  padding: '6px 10px',
                  borderRadius: '3px',
                  display: 'inline-block',
                  fontSize: '10pt',
                  fontWeight: 'bold'
                }}>
                  {selectedProblem.priority} PRIORITY
                </div>
              </div>
            </div>

            {/* Quick Info Row */}
            <div className="row mb-3">
              <div className="col-12">
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '3px', 
                  padding: '8px',
                  backgroundColor: '#fafafa',
                  fontSize: '10pt'
                }}>
                  <div className="row text-center">
                    <div className="col-3">
                      <div><strong>Department</strong></div>
                      <div style={{ color: '#2c5aa0', fontWeight: 'bold' }}>{selectedProblem.department}</div>
                    </div>
                    <div className="col-3">
                      <div><strong>Service</strong></div>
                      <div>{selectedProblem.service}</div>
                    </div>
                    <div className="col-3">
                      <div><strong>Status</strong></div>
                      <div style={{ 
                        color: selectedProblem.status === 'done' ? '#28a745' : 
                              selectedProblem.status === 'in_progress' ? '#17a2b8' : '#ffc107',
                        fontWeight: 'bold'
                      }}>
                        {selectedProblem.status === 'pending_approval' ? 'PENDING APPROVAL' : 
                         selectedProblem.status.replace('_', ' ').toUpperCase()}
                      </div>
                    </div>
                    <div className="col-3">
                      <div><strong>Duration</strong></div>
                      <div style={{ color: '#2c5aa0', fontWeight: 'bold' }}>
                        {calculateDuration(selectedProblem.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Problem Description - Compact */}
            <div className="row mb-3">
              <div className="col-12">
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '3px', 
                  padding: '10px'
                }}>
                  <h4 style={{ 
                    color: '#2c5aa0', 
                    fontSize: '11pt',
                    marginBottom: '8px',
                    borderBottom: '1px solid #2c5aa0',
                    paddingBottom: '3px'
                  }}>
                    Problem Description
                  </h4>
                  <div style={{ 
                    padding: '8px', 
                    borderRadius: '2px',
                    borderLeft: '2px solid #2c5aa0',
                    fontSize: '10pt',
                    lineHeight: '1.4',
                    minHeight: '60px'
                  }}>
                    {selectedProblem.statement || selectedProblem.description || 'No detailed description provided.'}
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Team & Timeline */}
            <div className="row mb-3">
              <div className="col-6">
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '3px', 
                  padding: '10px',
                  height: '100%'
                }}>
                  <h4 style={{ 
                    color: '#2c5aa0', 
                    fontSize: '11pt',
                    marginBottom: '8px',
                    borderBottom: '1px solid #2c5aa0',
                    paddingBottom: '3px'
                  }}>
                    Resolution Team
                  </h4>
                  <table style={{ width: '100%', fontSize: '9pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '40%', fontWeight: 'bold', padding: '2px 0' }}>Reported By:</td>
                        {/* ✅ Show name in printable report */}
                        <td>{getUserNameByUsername(selectedProblem.createdBy)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', padding: '2px 0' }}>Assigned To:</td>
                        {/* ✅ Show name in printable report */}
                        <td>
                          {getUserNameById(selectedProblem.assignedTo) || 'Unassigned'}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', padding: '2px 0' }}>Solved By Team:</td>
                        <td style={{ color: '#fd7e14', fontWeight: '600' }}>
                          {getSolvingTeam(selectedProblem)}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', padding: '2px 0' }}>Team Leader:</td>
                        <td style={{ color: '#0d6efd' }}>
                          {getTeamLeader(selectedProblem.department)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
              <div className="col-6">
                <div style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '3px', 
                  padding: '10px',
                  height: '100%'
                }}>
                  <h4 style={{ 
                    color: '#2c5aa0', 
                    fontSize: '11pt',
                    marginBottom: '8px',
                    borderBottom: '1px solid #2c5aa0',
                    paddingBottom: '3px'
                  }}>
                    Timeline
                  </h4>
                  <table style={{ width: '100%', fontSize: '9pt' }}>
                    <tbody>
                      <tr>
                        <td style={{ width: '45%', fontWeight: 'bold', padding: '2px 0' }}>Created Date:</td>
                        <td>{new Date(selectedProblem.createdAt).toLocaleDateString()}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', padding: '2px 0' }}>Created Time:</td>
                        <td>{new Date(selectedProblem.createdAt).toLocaleTimeString()}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', padding: '2px 0' }}>Resolution Date:</td>
                        <td>{getResolutionDate(selectedProblem)}</td>
                      </tr>
                      <tr>
                        <td style={{ fontWeight: 'bold', padding: '2px 0' }}>Problem Type:</td>
                        <td style={{ color: '#d63384' }}>
                          {getProblemType(selectedProblem)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Action History - Compact */}
            {selectedProblem.actionHistory && selectedProblem.actionHistory.length > 0 && (
              <div className="row mb-3">
                <div className="col-12">
                  <div style={{ 
                    border: '1px solid #ddd', 
                    borderRadius: '3px', 
                    padding: '10px'
                  }}>
                    <h4 style={{ 
                      color: '#2c5aa0', 
                      fontSize: '11pt',
                      marginBottom: '8px',
                      borderBottom: '1px solid #2c5aa0',
                      paddingBottom: '3px'
                    }}>
                      Recent Actions
                    </h4>
                    <div style={{ fontSize: '8pt', maxHeight: '80px', overflow: 'hidden' }}>
                      {selectedProblem.actionHistory.slice(-3).map((action, index) => (
                        <div key={index} style={{ 
                          padding: '4px 0',
                          borderBottom: index < Math.min(selectedProblem.actionHistory.length - 1, 2) ? '1px dashed #eee' : 'none'
                        }}>
                          <strong>{action.action}</strong> by {action.by} 
                          <span style={{ color: '#666', marginLeft: '8px' }}>
                            {new Date(action.timestamp).toLocaleDateString()}
                          </span>
                          {action.comment && (
                            <div style={{ color: '#666', fontSize: '7pt' }}>
                              {action.comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="row mt-3 pt-2" style={{ borderTop: '1px solid #ddd' }}>
              <div className="col-12 text-center">
                <p style={{ color: '#666', margin: '2px 0', fontSize: '8pt' }}>
                  Generated by {user?.name || 'System'} on {new Date().toLocaleString()}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      <style>
        {`
          @media print {
            .no-print {
              display: none !important;
            }
            .print-only {
              display: block !important;
            }
            body {
              margin: 0 !important;
              padding: 0 !important;
              background: white !important;
              font-size: 11pt;
              font-family: 'Arial', sans-serif;
            }
            .btn {
              display: none !important;
            }
            @page {
              size: A4;
              margin: 0;
            }
          }
          @media screen {
            .print-only {
              display: none !important;
            }
          }
        `}
      </style>
    </>
  );
}