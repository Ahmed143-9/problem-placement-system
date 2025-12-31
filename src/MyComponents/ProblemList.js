// src/pages/ProblemList.js - UPDATED VERSION
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  FaEye, FaEdit, FaTrash, FaExclamationTriangle, FaSpinner, 
  FaFilter, FaPlus, FaSearch, FaUser, FaClock, FaHome, FaPlusCircle,
  FaFileAlt, FaUsersCog, FaChevronLeft, FaChevronRight, FaArrowRight,
  FaCheckCircle, FaTimesCircle, FaSync, FaEllipsisH, FaSort, FaSortUp,
  FaSortDown, FaDownload, FaPrint, FaEnvelope, FaBell, FaCalendar,
  FaChartBar, FaUserCheck, FaUserTimes, FaBuilding, FaTag,
  FaGlobe
} from 'react-icons/fa';

export default function ProblemList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [selectedProblems, setSelectedProblems] = useState([]);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const [loadingExport, setLoadingExport] = useState(false);
  const [totalProblems, setTotalProblems] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    in_progress: 0,
    resolved: 0,
    escalated: 0
  });

  const itemsPerPage = 15;

  // Load problems from backend API
  const loadProblems = useCallback(async () => {
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
        let filteredProblems = data.data;
        
        // Debug: Log problems to see their status values
        console.log('Problems loaded:', data.data);
        console.log('Status counts:', {
          total: data.data.length,
          pending: data.data.filter(p => p.status === 'pending').length,
          in_progress: data.data.filter(p => p.status === 'in_progress').length,
          done: data.data.filter(p => p.status === 'done').length,
          resolved: data.data.filter(p => p.status === 'resolved').length,
          escalated: data.data.filter(p => p.status === 'escalated').length
        });
        
        // Apply filters
        if (filter !== 'all') {
          filteredProblems = filteredProblems.filter(p => p.status === filter);
        }
        
        // Apply search
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredProblems = filteredProblems.filter(p => 
            p.statement.toLowerCase().includes(term) ||
            p.department.toLowerCase().includes(term) ||
            p.service?.toLowerCase().includes(term) ||
            p.client?.toLowerCase().includes(term) ||
            (p.assigned_to?.name && p.assigned_to.name.toLowerCase().includes(term)) ||
            (p.created_by?.name && p.created_by.name.toLowerCase().includes(term))
          );
        }
        
        // Apply sorting
        filteredProblems.sort((a, b) => {
          let aValue = a[sortField];
          let bValue = b[sortField];
          
          if (sortField === 'assigned_to') {
            aValue = a.assigned_to?.name || '';
            bValue = b.assigned_to?.name || '';
          } else if (sortField === 'created_by') {
            aValue = a.created_by?.name || '';
            bValue = b.created_by?.name || '';
          } else if (sortField === 'priority') {
            const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
            aValue = priorityOrder[a.priority] || 0;
            bValue = priorityOrder[b.priority] || 0;
          }
          
          if (sortOrder === 'asc') {
            return aValue > bValue ? 1 : -1;
          } else {
            return aValue < bValue ? 1 : -1;
          }
        });
        
        // Calculate pagination
        const totalItems = filteredProblems.length;
        setTotalProblems(totalItems);
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
        
        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const paginatedProblems = filteredProblems.slice(startIndex, startIndex + itemsPerPage);
        
        setProblems(paginatedProblems);
      } else {
        toast.error(data.messages?.[0] || 'Failed to load problems', { autoClose: 3000 });
      }
    } catch (error) {
      console.error('❌ Failed to load problems:', error);
      toast.error('Network error while loading problems', { autoClose: 3000 });
    } finally {
      setLoading(false);
    }
  }, [filter, searchTerm, sortField, sortOrder, currentPage]);

  // Load statistics - UPDATED VERSION
  const loadStats = useCallback(async () => {
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

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          const allProblems = data.data;
          
          // Debug log
          console.log('All problems for stats:', allProblems);
          console.log('Counting resolved:', allProblems.filter(p => p.status === 'done' || p.status === 'resolved'));
          
          // Try different status values
          const resolvedCount = allProblems.filter(p => 
            p.status === 'done' || 
            p.status === 'resolved' ||
            p.status === 'completed' ||
            p.status === 'closed'
          ).length;
          
          console.log('Resolved count:', resolvedCount);
          
          setStats({
            total: allProblems.length,
            pending: allProblems.filter(p => p.status === 'pending').length,
            in_progress: allProblems.filter(p => p.status === 'in_progress').length,
            resolved: resolvedCount,
            escalated: allProblems.filter(p => p.status === 'escalated').length
          });
        }
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }, []);

  useEffect(() => {
    loadProblems();
    loadStats();
  }, [filter, currentPage, sortField, sortOrder, loadProblems, loadStats]);

  // Handle delete problem
  const handleDeleteProblem = async (id) => {
    if (!window.confirm('Are you sure you want to delete this problem? This action cannot be undone.')) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ticketapi.wineds.com/api/problems/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify({ id }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success('🗑️ Problem deleted successfully!', { autoClose: 3000 });
        loadProblems();
        loadStats();
      } else {
        toast.error(data.messages?.[0] || 'Failed to delete problem', { autoClose: 3000 });
      }
    } catch (error) {
      toast.error('Failed to delete problem', { autoClose: 3000 });
      console.error(error);
    }
  };

  // Handle sort
  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Handle select all problems
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedProblems(problems.map(p => p.id));
    } else {
      setSelectedProblems([]);
    }
  };

  // Handle select single problem
  const handleSelectProblem = (id) => {
    if (selectedProblems.includes(id)) {
      setSelectedProblems(selectedProblems.filter(pid => pid !== id));
    } else {
      setSelectedProblems([...selectedProblems, id]);
    }
  };

  // Export selected problems
  const handleExportProblems = async () => {
    if (selectedProblems.length === 0) {
      toast.error('Please select at least one problem to export', { autoClose: 3000 });
      return;
    }

    setLoadingExport(true);
    try {
      // Here you would call your export API
      // For now, we'll just simulate it
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const csvContent = [
        ['ID', 'Statement', 'Department', 'Priority', 'Status', 'Assigned To', 'Created At', 'Created By'],
        ...problems.filter(p => selectedProblems.includes(p.id)).map(p => [
          p.id,
          p.statement,
          p.department,
          p.priority,
          p.status,
          p.assigned_to?.name || 'Unassigned',
          new Date(p.created_at).toLocaleDateString(),
          p.created_by?.name || 'Unknown'
        ])
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `problems_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success(`✅ Exported ${selectedProblems.length} problem(s) successfully!`, { autoClose: 3000 });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export problems', { autoClose: 3000 });
    } finally {
      setLoadingExport(false);
    }
  };

  // Get status badge - UPDATED
  const getStatusBadge = (status) => {
    switch (status) {
      case 'pending': return 'bg-warning text-dark';
      case 'in_progress': return 'bg-info text-white';
      case 'done': return 'bg-success text-white';
      case 'resolved': return 'bg-success text-white';
      case 'escalated': return 'bg-danger text-white';
      default: return 'bg-secondary text-white';
    }
  };

  // Get priority badge
  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'High': return 'bg-danger text-white';
      case 'Medium': return 'bg-warning text-dark';
      case 'Low': return 'bg-success text-white';
      default: return 'bg-secondary text-white';
    }
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  // Get dashboard path based on role
  const getDashboardPath = () => {
    if (user?.role === 'admin' || user?.role === 'team_leader') {
      return '/dashboard';
    } else {
      return '/employee-dashboard';
    }
  };

  // Refresh data
  const refreshData = () => {
    loadProblems();
    loadStats();
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="d-flex flex-grow-1">
        {/* Sidebar - Same as before */}
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
              : <FaChevronLeft size={14} color="#333" />}
          </button>

          <div className="p-3">
            {!sidebarMinimized && (
              <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>
                Navigation
              </h5>
            )}
            <ul className="nav flex-column">
              {/* Navigation items - same as before */}
              <li className="nav-item mb-2">
                <Link 
                  to={getDashboardPath()}
                  className="nav-link text-white rounded d-flex align-items-center"
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
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                </Link>
              </li>
              
              <li className="nav-item mb-2">
                <Link 
                  to="/problems" 
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
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
                      title="User Management"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>User Management</span>}
                    </Link>
                  </li>
                  
                  <li className="nav-item mb-2">
                    <Link 
                      to="/domain-status" 
                      className="nav-link text-white rounded d-flex align-items-center"
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
        <div className="flex-grow-1 p-4">
          <div className="card shadow border-0">
            {/* Header */}
            <div className="card-header bg-primary text-white py-3">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h4 className="mb-1 fw-semibold">
                    <FaExclamationTriangle className="me-2" />
                    All Problems
                  </h4>
                  <small className="opacity-75">Manage and track all reported problems</small>
                </div>
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-light btn-sm"
                    onClick={() => navigate('/problem/create')}
                  >
                    <FaPlus className="me-1" />
                    New Problem
                  </button>
                  <button 
                    className="btn btn-outline-light btn-sm"
                    onClick={refreshData}
                    disabled={loading}
                  >
                    <FaSync className={loading ? 'fa-spin me-1' : 'me-1'} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            
            {/* Stats Cards - UPDATED: Removed Pending Approval, Fixed Resolved */}
            <div className="p-3 bg-light border-bottom">
              <div className="row g-3">
                <div className="col-md-2 col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-2">
                      <h3 className="mb-0 text-primary">{stats.total}</h3>
                      <small className="text-muted">Total</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-2">
                      <h3 className="mb-0 text-warning">{stats.pending}</h3>
                      <small className="text-muted">Pending</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-2">
                      <h3 className="mb-0 text-info">{stats.in_progress}</h3>
                      <small className="text-muted">In Progress</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-2">
                      <h3 className="mb-0 text-success">{stats.resolved}</h3>
                      <small className="text-muted">Resolved</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-2">
                      <h3 className="mb-0 text-danger">{stats.escalated}</h3>
                      <small className="text-muted">Escalated</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-2 col-6">
                  <div className="card border-0 shadow-sm">
                    <div className="card-body text-center py-2">
                      <h3 className="mb-0 text-dark">{totalProblems}</h3>
                      <small className="text-muted">Showing</small>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Filters and Actions */}
            <div className="p-3 border-bottom">
              <div className="row g-3">
                <div className="col-md-4">
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    setCurrentPage(1);
                    loadProblems();
                  }} className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search problems..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button 
                      className="btn btn-outline-primary"
                      type="submit"
                    >
                      <FaSearch />
                    </button>
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                          loadProblems();
                        }}
                      >
                        Clear
                      </button>
                    )}
                  </form>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={filter}
                    onChange={(e) => {
                      setFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Resolved</option>
                    <option value="escalated">Escalated</option>
                  </select>
                </div>
                <div className="col-md-3">
                  <select
                    className="form-select"
                    value={sortField}
                    onChange={(e) => {
                      setSortField(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    <option value="created_at">Sort by: Date Created</option>
                    <option value="priority">Sort by: Priority</option>
                    <option value="status">Sort by: Status</option>
                    <option value="department">Sort by: Department</option>
                    <option value="assigned_to">Sort by: Assigned To</option>
                  </select>
                </div>
                <div className="col-md-2">
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                      title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
                    >
                      {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                    </button>
                    {selectedProblems.length > 0 && (
                      <button 
                        className="btn btn-outline-success btn-sm"
                        onClick={handleExportProblems}
                        disabled={loadingExport}
                      >
                        {loadingExport ? (
                          <FaSpinner className="fa-spin" />
                        ) : (
                          <>
                            <FaDownload className="me-1" />
                            Export ({selectedProblems.length})
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Problems Table - Same as before */}
            <div className="card-body p-0">
              {loading ? (
                <div className="text-center py-5">
                  <FaSpinner className="fa-spin fs-1 text-primary mb-3" />
                  <p className="text-muted">Loading problems...</p>
                </div>
              ) : problems.length === 0 ? (
                <div className="text-center py-5">
                  <FaExclamationTriangle className="fs-1 text-muted mb-3" />
                  <h5 className="text-muted mb-3">No problems found</h5>
                  <p className="text-muted mb-4">
                    {searchTerm 
                      ? `No problems match your search for "${searchTerm}"`
                      : filter !== 'all'
                        ? `No problems with status "${filter}"`
                        : 'No problems have been created yet.'}
                  </p>
                  <div className="d-flex justify-content-center gap-3">
                    {searchTerm && (
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setSearchTerm('');
                          setCurrentPage(1);
                          loadProblems();
                        }}
                      >
                        Clear Search
                      </button>
                    )}
                    {filter !== 'all' && (
                      <button 
                        className="btn btn-outline-secondary"
                        onClick={() => {
                          setFilter('all');
                          setCurrentPage(1);
                          loadProblems();
                        }}
                      >
                        Show All Status
                      </button>
                    )}
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate('/problem/create')}
                    >
                      <FaPlusCircle className="me-2" />
                      Create Your First Problem
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="">
                    <table className="table mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: '40px' }}>
                            <div className="form-check">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={selectedProblems.length === problems.length && problems.length > 0}
                                onChange={handleSelectAll}
                              />
                            </div>
                          </th>
                          <th style={{ width: '80px' }}>ID</th>
                          <th style={{ width: '150px' }}>
                            <button 
                              className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                              onClick={() => handleSort('department')}
                            >
                              Department
                              {sortField === 'department' && (
                                <span className="ms-1">
                                  {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                                </span>
                              )}
                            </button>
                          </th>
                          <th style={{ width: '120px' }}>
                            <button 
                              className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                              onClick={() => handleSort('priority')}
                            >
                              Priority
                              {sortField === 'priority' && (
                                <span className="ms-1">
                                  {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                                </span>
                              )}
                            </button>
                          </th>
                          <th style={{ width: '150px' }}>
                            <button 
                              className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                              onClick={() => handleSort('assigned_to')}
                            >
                              Assigned To
                              {sortField === 'assigned_to' && (
                                <span className="ms-1">
                                  {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                                </span>
                              )}
                            </button>
                          </th>
                          <th style={{ width: '120px' }}>
                            <button 
                              className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                              onClick={() => handleSort('status')}
                            >
                              Status
                              {sortField === 'status' && (
                                <span className="ms-1">
                                  {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                                </span>
                              )}
                            </button>
                          </th>
                          <th style={{ width: '150px' }}>
                            <button 
                              className="btn btn-link p-0 text-decoration-none text-dark fw-semibold"
                              onClick={() => handleSort('created_at')}
                            >
                              Created
                              {sortField === 'created_at' && (
                                <span className="ms-1">
                                  {sortOrder === 'asc' ? <FaSortUp /> : <FaSortDown />}
                                </span>
                              )}
                            </button>
                          </th>
                          <th style={{ width: '100px' }} className="text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {problems.map(problem => (
                          <tr key={problem.id} className={selectedProblems.includes(problem.id) ? 'table-active' : ''}>
                            <td>
                              <div className="form-check">
                                <input
                                  className="form-check-input"
                                  type="checkbox"
                                  checked={selectedProblems.includes(problem.id)}
                                  onChange={() => handleSelectProblem(problem.id)}
                                />
                              </div>
                            </td>
                            <td>
                              <span className="badge bg-secondary">{problem.id}</span>
                            </td>
                            <td>
                              <div className="text-truncate" title={problem.department}>
                                {problem.department}
                              </div>
                            </td>
                            <td>
                              <span className={`badge ${getPriorityBadge(problem.priority)}`}>
                                {problem.priority}
                              </span>
                            </td>
                            <td>
                              {problem.assigned_to ? (
                                <div className="d-flex align-items-center">
                                  <div className="rounded-circle bg-info text-white d-flex align-items-center justify-content-center me-2"
                                    style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}>
                                    {problem.assigned_to.name?.charAt(0) || 'U'}
                                  </div>
                                  <div className="text-truncate" title={problem.assigned_to.name}>
                                    {problem.assigned_to.name}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-muted">
                                  <FaUserTimes className="me-1" />
                                  Unassigned
                                </span>
                              )}
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadge(problem.status)}`}>
                                {problem.status === 'done' ? 'Resolved' : 
                                 problem.status === 'in_progress' ? 'In Progress' : 
                                 problem.status.charAt(0).toUpperCase() + problem.status.slice(1)}
                              </span>
                            </td>
                            <td>
                              <div>
                                <div>{formatDate(problem.created_at)}</div>
                                <small className="text-muted">
                                  by {problem.created_by?.name || 'Unknown'}
                                </small>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-1 justify-content-center">
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => navigate(`/problem/${problem.id}`)}
                                  title="View Details"
                                >
                                  <FaEye />
                                </button>
                                {(user?.role === 'admin' || problem.created_by?.id === user?.id) && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleDeleteProblem(problem.id)}
                                    title="Delete"
                                  >
                                    <FaTrash />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination - Same as before */}
                  {totalPages > 1 && (
                    <div className="p-3 border-top">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">
                            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
                            {Math.min(currentPage * itemsPerPage, totalProblems)} of {totalProblems} problems
                          </small>
                        </div>
                        <nav>
                          <ul className="pagination pagination-sm mb-0">
                            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(prev => prev - 1)}
                                disabled={currentPage === 1}
                              >
                                <FaChevronLeft size={12} />
                              </button>
                            </li>
                            
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                              let pageNum;
                              if (totalPages <= 5) {
                                pageNum = i + 1;
                              } else if (currentPage <= 3) {
                                pageNum = i + 1;
                              } else if (currentPage >= totalPages - 2) {
                                pageNum = totalPages - 4 + i;
                              } else {
                                pageNum = currentPage - 2 + i;
                              }
                              
                              return (
                                <li key={pageNum} className={`page-item ${currentPage === pageNum ? 'active' : ''}`}>
                                  <button 
                                    className="page-link" 
                                    onClick={() => setCurrentPage(pageNum)}
                                  >
                                    {pageNum}
                                  </button>
                                </li>
                              );
                            })}
                            
                            <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                              <button 
                                className="page-link" 
                                onClick={() => setCurrentPage(prev => prev + 1)}
                                disabled={currentPage === totalPages}
                              >
                                <FaChevronRight size={12} />
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Bulk Actions Footer - Same as before */}
            {selectedProblems.length > 0 && (
              <div className="card-footer bg-light">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <span className="text-muted">
                      {selectedProblems.length} problem{selectedProblems.length !== 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <button 
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => setSelectedProblems([])}
                    >
                      Clear Selection
                    </button>
                    <button 
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => {
                        // Implement bulk status change
                        toast.info('Bulk status change feature coming soon', { autoClose: 3000 });
                      }}
                    >
                      Change Status
                    </button>
                    <button 
                      className="btn btn-outline-success btn-sm"
                      onClick={handleExportProblems}
                      disabled={loadingExport}
                    >
                      {loadingExport ? (
                        <>
                          <FaSpinner className="fa-spin me-1" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <FaDownload className="me-1" />
                          Export Selected
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Tips - Same as before */}
          <div className="card shadow-sm border-0 mt-4">
            <div className="card-header bg-white">
              <h6 className="mb-0">
                <FaExclamationTriangle className="me-2" />
                Quick Tips
              </h6>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-4">
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-primary bg-opacity-10 rounded-circle p-2 me-3">
                      <FaSearch className="text-primary" />
                    </div>
                    <div>
                      <h6 className="mb-1">Search & Filter</h6>
                      <small className="text-muted">
                        Use the search bar and filters to quickly find specific problems
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-success bg-opacity-10 rounded-circle p-2 me-3">
                      <FaSort className="text-success" />
                    </div>
                    <div>
                      <h6 className="mb-1">Sorting</h6>
                      <small className="text-muted">
                        Click on column headers to sort problems by different criteria
                      </small>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="d-flex align-items-start mb-3">
                    <div className="bg-warning bg-opacity-10 rounded-circle p-2 me-3">
                      <FaDownload className="text-warning" />
                    </div>
                    <div>
                      <h6 className="mb-1">Bulk Actions</h6>
                      <small className="text-muted">
                        Select multiple problems to perform bulk actions like export
                      </small>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}