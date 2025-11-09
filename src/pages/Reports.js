import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner, FaPlusCircle, FaUsersCog, FaHome, FaExclamationTriangle, FaFileAlt, FaChartLine, FaChevronLeft, FaChevronRight, FaDownload, FaPrint } from 'react-icons/fa';

export default function Reports() {
  const { user } = useAuth();
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

  useEffect(() => {
    fetchProblems();
  }, []);

  const fetchProblems = () => {
    try {
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // Filter problems based on user role
      let filteredProblems;
      if (user?.role === 'admin' || user?.role === 'team_leader') {
        // Admin and Team Leader see all problems
        filteredProblems = storedProblems;
      } else {
        // Regular users only see their own created problems or assigned problems
        filteredProblems = storedProblems.filter(p => 
          p.createdBy === user?.name || p.assignedTo === user?.name
        );
      }
      
      setProblems(filteredProblems);
    } catch (error) {
      console.error('Failed to fetch problems:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const generateReport = (problem) => {
    setSelectedProblem(problem);
    setTimeout(() => {
      window.print();
      setSelectedProblem(null);
    }, 100);
  };

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

  // Check if admin or team leader
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
          {/* Sidebar - Same as Dashboard */}
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
                
                {/* Show different menu for admin/leader vs regular user */}
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
              <div className="card-body p-4">
                <div className="table-responsive">
                  <table className="table table-hover table-striped">
                    <thead className="table-dark">
                      <tr>
                        <th>Problem ID</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Created By</th>
                        <th>Assigned To</th>
                        <th>Created Date</th>
                        <th style={{ textAlign: 'center' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.length === 0 ? (
                        <tr>
                          <td colSpan="8" className="text-center py-5">
                            <div className="py-4">
                              <FaFileAlt size={48} className="text-muted mb-3" />
                              <p className="text-muted mb-3">No problems found to generate reports</p>
                              <Link to="/problem/create" className="btn btn-primary">
                                <FaPlusCircle className="me-2" />
                                Create First Problem
                              </Link>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        problems.map(problem => (
                          <tr key={problem.id} className="align-middle">
                            <td className="fw-bold">#{problem.id}</td>
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
                                problem.status === 'done' ? 'bg-success' :
                                'bg-secondary'
                              }`}>
                                {problem.status === 'pending_approval' ? 'PENDING APPROVAL' : 
                                 problem.status.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>{problem.createdBy}</td>
                            <td>
                              {problem.assignedTo ? (
                                <span className="badge bg-info text-white">{problem.assignedTo}</span>
                              ) : (
                                <span className="badge bg-secondary">Unassigned</span>
                              )}
                            </td>
                            <td>{new Date(problem.createdAt).toLocaleDateString()}</td>
                            <td style={{ textAlign: 'center' }}>
                              <button 
                                className="btn btn-sm btn-primary"
                                onClick={() => generateReport(problem)}
                                title="Generate Report"
                              >
                                <FaPrint className="me-1" />
                                Print Report
                              </button>
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

      {/* Printable Report */}
      {selectedProblem && (
        <div className="print-only" style={{ display: 'none' }}>
          <div style={{ 
            width: '210mm', 
            minHeight: '297mm', 
            padding: '20mm',
            margin: '0 auto',
            backgroundColor: 'white',
            fontFamily: 'Arial, sans-serif'
          }}>
            {/* Header/Letterhead */}
            <div style={{ 
              borderBottom: '3px solid #0d6efd', 
              paddingBottom: '15px',
              marginBottom: '30px'
            }}>
              <h1 style={{ 
                color: '#0d6efd', 
                fontSize: '28px',
                marginBottom: '5px',
                fontWeight: 'bold'
              }}>
                Problem Management System
              </h1>
              <p style={{ 
                color: '#6c757d', 
                fontSize: '14px',
                margin: '0'
              }}>
                Official Problem Report Document
              </p>
            </div>

            {/* Report Info */}
            <div style={{ marginBottom: '30px' }}>
              <table style={{ width: '100%', fontSize: '12px' }}>
                <tr>
                  <td style={{ width: '50%', paddingBottom: '10px' }}>
                    <strong>Report Date:</strong> {new Date().toLocaleDateString()}
                  </td>
                  <td style={{ width: '50%', textAlign: 'right', paddingBottom: '10px' }}>
                    <strong>Problem ID:</strong> #{selectedProblem.id}
                  </td>
                </tr>
              </table>
            </div>

            {/* Problem Details Section */}
            <div style={{ 
              backgroundColor: '#f8f9fa', 
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '25px'
            }}>
              <h2 style={{ 
                fontSize: '18px',
                color: '#212529',
                marginBottom: '15px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '10px'
              }}>
                Problem Details
              </h2>
              
              <table style={{ width: '100%', fontSize: '13px' }}>
                <tr>
                  <td style={{ padding: '8px 0', width: '30%' }}>
                    <strong>Department:</strong>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    {selectedProblem.department}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <strong>Priority Level:</strong>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      backgroundColor: selectedProblem.priority === 'High' ? '#dc3545' :
                                     selectedProblem.priority === 'Medium' ? '#ffc107' : '#28a745',
                      color: selectedProblem.priority === 'Medium' ? '#000' : '#fff',
                      fontWeight: 'bold'
                    }}>
                      {selectedProblem.priority}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <strong>Current Status:</strong>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '4px',
                      backgroundColor: selectedProblem.status === 'pending' ? '#ffc107' :
                                     selectedProblem.status === 'in_progress' ? '#17a2b8' : 
                                     selectedProblem.status === 'done' ? '#28a745' : '#6c757d',
                      color: selectedProblem.status === 'pending' ? '#000' : '#fff',
                      fontWeight: 'bold'
                    }}>
                      {selectedProblem.status === 'pending_approval' ? 'PENDING APPROVAL' : 
                       selectedProblem.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <strong>Created By:</strong>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    {selectedProblem.createdBy}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <strong>Assigned To:</strong>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    {selectedProblem.assignedTo || 'Not Assigned Yet'}
                  </td>
                </tr>
                <tr>
                  <td style={{ padding: '8px 0' }}>
                    <strong>Created Date:</strong>
                  </td>
                  <td style={{ padding: '8px 0' }}>
                    {new Date(selectedProblem.createdAt).toLocaleString()}
                  </td>
                </tr>
              </table>
            </div>

            {/* Description Section */}
            <div style={{ marginBottom: '25px' }}>
              <h2 style={{ 
                fontSize: '18px',
                color: '#212529',
                marginBottom: '15px',
                borderBottom: '2px solid #dee2e6',
                paddingBottom: '10px'
              }}>
                Problem Description
              </h2>
              <p style={{ 
                fontSize: '13px',
                lineHeight: '1.6',
                color: '#495057',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderLeft: '4px solid #0d6efd',
                borderRadius: '4px'
              }}>
                {selectedProblem.statement || selectedProblem.description || 'No description provided'}
              </p>
            </div>

            {/* Signature Section */}
            <div style={{ marginTop: '50px' }}>
              <table style={{ width: '100%', fontSize: '12px' }}>
                <tr>
                  <td style={{ width: '50%', paddingTop: '50px', borderTop: '1px solid #000' }}>
                    <strong>Reported By</strong><br />
                    <small>{selectedProblem.createdBy}</small><br />
                    <small>{new Date(selectedProblem.createdAt).toLocaleDateString()}</small>
                  </td>
                  <td style={{ width: '50%', paddingTop: '50px', borderTop: '1px solid #000', textAlign: 'right' }}>
                    <strong>Acknowledged By</strong><br />
                    <small>{selectedProblem.assignedTo || '_______________'}</small><br />
                    <small>Date: _______________</small>
                  </td>
                </tr>
              </table>
            </div>

            {/* Footer */}
            <div style={{ 
              marginTop: '50px',
              paddingTop: '20px',
              borderTop: '2px solid #0d6efd',
              textAlign: 'center',
              fontSize: '11px',
              color: '#6c757d'
            }}>
              <p style={{ margin: '0' }}>
                This is a system-generated report from Problem Management System
              </p>
              <p style={{ margin: '5px 0 0 0' }}>
                Generated on {new Date().toLocaleString()} | Report ID: RPT-{selectedProblem.id}-{Date.now()}
              </p>
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
              margin: 0;
              padding: 0;
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