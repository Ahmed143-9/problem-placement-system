import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaKey, FaEye, FaEyeSlash, FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaChevronLeft, FaChevronRight, FaRobot, FaTasks, FaArrowRight, FaUserCheck, FaLayerGroup, FaUserTie } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function AdminPanelUserManagement() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [showFirstFaceModal, setShowFirstFaceModal] = useState(false);
  const [selectedFirstFace, setSelectedFirstFace] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [firstFaceStats, setFirstFaceStats] = useState({ assigned: 0, total: 0 });
  const [firstFaceAssignments, setFirstFaceAssignments] = useState([]);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false); // ✅ এই লাইন যোগ করুন

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    status: 'active'
  });

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadUsers();
    loadProblems();
    loadFirstFaceAssignments();
  }, []);

  const loadUsers = () => {
    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      const filteredUsers = storedUsers.filter(u => u.username !== 'Admin');
      setUsers(filteredUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadProblems = () => {
    try {
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      setProblems(storedProblems);
    } catch (error) {
      console.error('Failed to load problems:', error);
    }
  };

  const loadFirstFaceAssignments = () => {
    try {
      const storedAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      setFirstFaceAssignments(storedAssignments);
    } catch (error) {
      console.error('Failed to load first face assignments:', error);
    }
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const validatePassword = (password) => {
    const re = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return re.test(password);
  };

  // 🔥 NEW: First Face Assignment System
  const handleFirstFaceAssignment = () => {
    if (!selectedFirstFace) {
      toast.error('Please select a First Face');
      return;
    }

    try {
      // Check if already assigned for this department
      const existingAssignment = firstFaceAssignments.find(ff => 
        ff.department === selectedDepartment
      );

      if (existingAssignment && selectedDepartment !== 'all') {
        if (!window.confirm(`${existingAssignment.userName} is already First Face for ${selectedDepartment}. Replace?`)) {
          return;
        }
      }

      const selectedUser = users.find(u => u.name === selectedFirstFace);
      
      const newAssignment = {
        id: Date.now(),
        userName: selectedFirstFace,
        userId: selectedUser?.id,
        department: selectedDepartment,
        type: selectedDepartment === 'all' ? 'all' : 'specific',
        assignedBy: user?.name || 'Admin',
        assignedAt: new Date().toISOString()
      };

      // Remove existing assignment for this department
      const updatedAssignments = firstFaceAssignments.filter(ff => 
        ff.department !== selectedDepartment
      );

      updatedAssignments.push(newAssignment);
      
      localStorage.setItem('firstFace_assignments', JSON.stringify(updatedAssignments));
      setFirstFaceAssignments(updatedAssignments);
      
      toast.success(`✅ ${selectedFirstFace} set as First Face for ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`);
      
      setShowFirstFaceModal(false);
      setSelectedFirstFace('');
      setSelectedDepartment('all');
    } catch (error) {
      toast.error('Failed to assign First Face');
      console.error(error);
    }
  };

  // Remove First Face Assignment
  const handleRemoveFirstFace = (assignmentId) => {
    try {
      const updatedAssignments = firstFaceAssignments.filter(ff => ff.id !== assignmentId);
      localStorage.setItem('firstFace_assignments', JSON.stringify(updatedAssignments));
      setFirstFaceAssignments(updatedAssignments);
      toast.success('First Face assignment removed!');
    } catch (error) {
      toast.error('Failed to remove First Face');
      console.error(error);
    }
  };

  // Get unassigned problems count by department
  const getUnassignedProblemsByDepartment = () => {
    const unassigned = problems.filter(p => !p.assignedTo && p.status === 'pending');
    
    const byDepartment = {
      all: unassigned.length,
      'IT & Innovation': unassigned.filter(p => p.department === 'IT & Innovation').length,
      'Business': unassigned.filter(p => p.department === 'Business').length,
      'Accounts': unassigned.filter(p => p.department === 'Accounts').length
    };
    
    return byDepartment;
  };

  const handleSaveUser = () => {
    if (!isAdmin) return toast.error('Only Admin can add or edit users!');
    if (!formData.name || !formData.username || !formData.email) return toast.error('Fill all required fields');

    if (!editingUser) {
      if (!formData.password) return toast.error('Password is required');
      if (!validatePassword(formData.password)) return toast.error('Password must be 8+ chars, include 1 uppercase, 1 number & 1 special char');
    }

    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');

      if (editingUser) {
        const updatedUsers = storedUsers.map(u => {
          if (u.id === editingUser.id) {
            return {
              ...u,
              name: formData.name,
              username: formData.username,
              email: formData.email,
              ...(formData.password && { password: formData.password }),
              role: formData.role,
              department: formData.department,
              status: formData.status
            };
          }
          return u;
        });
        localStorage.setItem('system_users', JSON.stringify(updatedUsers));
        toast.success('User updated successfully!');
      } else {
        if (storedUsers.some(u => u.username === formData.username)) return toast.error('Username already exists!');

        const newUser = {
          id: Date.now(),
          ...formData,
          createdAt: new Date().toISOString(),
          createdBy: user?.name || 'Admin'
        };
        storedUsers.push(newUser);
        localStorage.setItem('system_users', JSON.stringify(storedUsers));
        toast.success(`${formData.role === 'team_leader' ? 'Team Leader' : 'User'} added successfully!`);
      }

      setFormData({
        name: '',
        username: '',
        email: '',
        password: '',
        role: 'user',
        department: '',
        status: 'active'
      });
      setShowAddModal(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      toast.error('Failed to save user');
      console.error(error);
    }
  };

  const handleEditUser = userId => {
    if (!isAdmin) return toast.error('Only Admin can edit users!');
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        username: userToEdit.username,
        email: userToEdit.email,
        password: userToEdit.password,
        role: userToEdit.role,
        department: userToEdit.department,
        status: userToEdit.status
      });
      setShowAddModal(true);
    }
  };

  const handleDeleteUser = userId => {
    if (!isAdmin) return toast.error('Only Admin can delete users!');
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      const updatedUsers = storedUsers.filter(u => u.id !== userId);
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleToggleStatus = userId => {
    if (!isAdmin) return toast.error('Only Admin can change user status!');
    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      const updatedUsers = storedUsers.map(u => {
        if (u.id === userId) return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
        return u;
      });
      localStorage.setItem('system_users', JSON.stringify(updatedUsers));
      toast.success('User status updated!');
      loadUsers();
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  const getRoleBadge = role => {
    const badges = { admin: 'bg-danger', team_leader: 'bg-primary', user: 'bg-info' };
    return badges[role] || 'bg-secondary';
  };

  const getStatusBadge = status => (status === 'active' ? 'bg-success' : 'bg-secondary');

  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

  // Get ALL ACTIVE USERS for First Face
  const activeUsers = users.filter(u => u.status === 'active');

  // Get unassigned problems count by department
  const unassignedProblemsByDept = getUnassignedProblemsByDepartment();

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
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/admin" 
                    className="nav-link text-white bg-primary rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
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
          className="flex-grow-1 p-3" 
          style={{ 
            overflowY: 'auto',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="card shadow-sm border-0">
            {/* Mobile-Friendly Header */}
            <div className="card-header bg-danger text-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-semibold text-truncate">
                    <FaUsers className="me-2" /> 
                    User Management Panel
                  </h4>
                  <small className="opacity-75">
                    {isAdmin ? 'Add and manage Team Leaders and Users' : 'View team members (Read-only access)'}
                  </small>
                </div>
                {isAdmin && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => setShowFirstFaceModal(true)}
                    >
                      <FaUserCheck className="me-1" />
                      First Face
                    </button>
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: '', status: 'active' });
                        setShowAddModal(true);
                      }}
                    >
                      <FaUserPlus className="me-1" />
                      <span>Add New User</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card-body">
              {!isAdmin && (
                <div className="alert alert-info mb-4">
                  <strong>Note:</strong> As a Team Leader, you can view all users but cannot add, edit, or delete them.
                </div>
              )}

              {/* First Face Assignments Section */}
              {isAdmin && firstFaceAssignments.length > 0 && (
                <div className="card border-warning mb-4">
                  <div className="card-header bg-warning text-dark">
                    <h6 className="mb-0">
                      <FaUserCheck className="me-2" />
                      Active First Face Assignments
                    </h6>
                  </div>
                  <div className="card-body p-3">
                    <div className="row g-2">
                      {firstFaceAssignments.map(assignment => (
                        <div key={assignment.id} className="col-md-6">
                          <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                            <div>
                              <strong>{assignment.userName}</strong>
                              <small className="text-muted d-block">
                                {assignment.department === 'all' ? 'All Departments' : assignment.department}
                              </small>
                            </div>
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleRemoveFirstFace(assignment.id)}
                              title="Remove First Face"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Enhanced Stats Cards */}
              <div className="row g-3 mb-4">
                <div className="col-md-3">
                  <div className="card border-primary text-center h-100">
                    <div className="card-body">
                      <h3 className="text-primary mb-0">{users.filter(u => u.role === 'team_leader').length}</h3>
                      <small className="text-muted">Team Leaders</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-info text-center h-100">
                    <div className="card-body">
                      <h3 className="text-info mb-0">{users.filter(u => u.role === 'user').length}</h3>
                      <small className="text-muted">Users</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-success text-center h-100">
                    <div className="card-body">
                      <h3 className="text-success mb-0">{users.filter(u => u.status === 'active').length}</h3>
                      <small className="text-muted">Active Users</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="card border-warning text-center h-100">
                    <div className="card-body">
                      <h3 className="text-warning mb-0">{firstFaceAssignments.length}</h3>
                      <small className="text-muted">First Face Assignments</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Users Table */}
              <div className="table-responsive">
                <table className="table table-hover table-striped">
                  <thead className="table-dark">
                    <tr>
                      <th>Name</th>
                      <th>Username</th>
                      <th style={{ textAlign: 'center' }}>Email</th>
                      <th>Role</th>
                      <th>Department</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'center' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-5">
                          <FaUsers className="fs-1 text-muted mb-3 d-block mx-auto" />
                          <p className="text-muted mb-3">No users found.</p>
                          {isAdmin && (
                            <button 
                              className="btn btn-primary" 
                              onClick={() => {
                                setEditingUser(null);
                                setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: '', status: 'active' });
                                setShowAddModal(true);
                              }}
                            >
                              <FaUserPlus className="me-2" /> 
                              Add User
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      users.map(u => (
                        <tr key={u.id} className="align-middle">
                          <td className="fw-semibold">
                            {u.name}
                            {firstFaceAssignments.some(ff => ff.userName === u.name) && (
                              <span className="badge bg-warning text-dark ms-1" title="First Face">FF</span>
                            )}
                          </td>
                          <td>
                            <code className="bg-light px-2 py-1 rounded d-inline-block">
                              {u.username}
                            </code>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              className="btn btn-sm btn-outline-info"
                              onClick={() => handleViewEmail(u.email)}
                              title="View Email"
                              style={{ padding: '6px 10px' }}
                            >
                              <FaEye />
                            </button>
                          </td>
                          <td>
                            <span className={`badge ${getRoleBadge(u.role)}`}>
                              {u.role === 'team_leader' ? 'Team Leader' : 'User'}
                            </span>
                          </td>
                          <td>{u.department}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(u.status)}`}>
                              {u.status}
                            </span>
                          </td>
                          <td>
                            {isAdmin ? (
                              <div className="d-flex gap-1 justify-content-center">
                                <button 
                                  className="btn btn-sm btn-outline-primary" 
                                  onClick={() => handleEditUser(u.id)} 
                                  title="Edit"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <FaEdit />
                                </button>
                                <button 
                                  className={`btn btn-sm btn-outline-${u.status === 'active' ? 'warning' : 'success'}`} 
                                  onClick={() => handleToggleStatus(u.id)} 
                                  title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                                  style={{ padding: '6px 10px' }}
                                >
                                  {u.status === 'active' ? '⏸' : '▶'}
                                </button>
                                <button 
                                  className="btn btn-sm btn-outline-danger" 
                                  onClick={() => handleDeleteUser(u.id)} 
                                  title="Delete"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <FaTrash />
                                </button>
                              </div>
                            ) : (
                              <span className="badge bg-secondary">View Only</span>
                            )}
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

      {/* Email View Modal */}
      {showEmailModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white py-2">
                <h6 className="modal-title mb-0 fw-semibold">
                  <FaEye className="me-2" />
                  Email Address
                </h6>
                <button 
                  type="button" 
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => setShowEmailModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="p-3 bg-light rounded text-center">
                  <p className="mb-0 fs-5 fw-semibold text-primary">
                    {selectedEmail}
                  </p>
                </div>
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-info btn-sm"
                    onClick={() => setShowEmailModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First Face Assignment Modal */}
      {showFirstFaceModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <FaUserCheck className="me-2" />
                  First Face Assignment
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => setShowFirstFaceModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="alert alert-info">
                  <strong>First Face System:</strong> New problems will be automatically assigned to First Face users based on department.
                </div>
                
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select First Face:</label>
                  <select
                    className="form-control"
                    value={selectedFirstFace}
                    onChange={(e) => setSelectedFirstFace(e.target.value)}
                  >
                    <option value="">-- Select First Face --</option>
                    {activeUsers.map(user => (
                      <option key={user.id} value={user.name}>
                        {user.name} 
                        {user.role === 'team_leader' && ' 👑'} 
                        {user.role === 'user' && ' 👨‍💼'} 
                        - {user.department}
                      </option>
                    ))}
                  </select>
                  <small className="text-muted">
                    You can select any active user (Team Leader or Regular User)
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Assign For Department:</label>
                  <select
                    className="form-control"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                  >
                    <option value="all">🎯 All Departments</option>
                    <option value="IT & Innovation">💻 IT & Innovation Department</option>
                    <option value="Business">📊 Business Department</option>
                    <option value="Accounts">💰 Accounts Department</option>
                  </select>
                  <small className="text-muted">
                    {selectedDepartment === 'all' 
                      ? 'Will receive ALL new problems from any department' 
                      : `Will receive only ${selectedDepartment} department problems`
                    }
                  </small>
                </div>

                <div className="p-3 bg-light rounded">
                  <div className="row text-center">
                    <div className="col-12">
                      <h5 className="text-warning mb-2">Assignment Summary</h5>
                      <p className="mb-1">
                        <strong>{selectedFirstFace || 'Selected User'}</strong> will receive:
                      </p>
                      <p className="mb-0 text-success">
                        {selectedDepartment === 'all' 
                          ? 'ALL new problems from ANY department'
                          : `NEW problems only from ${selectedDepartment} department`
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button 
                    className="btn btn-warning flex-grow-1"
                    onClick={handleFirstFaceAssignment}
                    disabled={!selectedFirstFace}
                  >
                    <FaUserCheck className="me-2" />
                    Set as First Face
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setShowFirstFaceModal(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {/* Add/Edit Modal */}
{showAddModal && isAdmin && (
  <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
    <div className="modal-dialog modal-dialog-centered modal-lg">
      <div className="modal-content">
        <div className="modal-header bg-primary text-white">
          <h5 className="modal-title">
            <FaUserPlus className="me-2" /> 
            {editingUser ? 'Edit User' : 'Add New User'}
          </h5>
          <button 
            type="button" 
            className="btn-close btn-close-white" 
            onClick={() => { setShowAddModal(false); setEditingUser(null); }}
          ></button>
        </div>
        <div className="modal-body">
          <div className="row g-3">
            <div className="col-md-6">
              <label className="form-label fw-semibold">Full Name *</label>
              <input 
                type="text" 
                className="form-control" 
                name="name" 
                value={formData.name} 
                onChange={handleInputChange} 
                placeholder="John Doe" 
              />
            </div>
            
            {/* Email Field - Now comes first */}
            <div className="col-md-6">
                <label className="form-label fw-semibold">Email *</label>
                <input 
                  type="email" 
                  className="form-control" 
                  name="email" 
                  value={formData.email} 
                  onChange={(e) => {
                    handleInputChange(e);
                    // Auto-generate username from email (part before @) - FIRST LETTER CAPITAL
                    if (!editingUser && e.target.value.includes('@')) {
                      const emailPart = e.target.value.split('@')[0];
                       const capitalizedUsername = emailPart.charAt(0).toUpperCase() + emailPart.slice(1);
                      
                      setFormData(prev => ({
                        ...prev,
                        username: capitalizedUsername
                      }));
                    }
                  }} 
                  placeholder="john@example.com" 
                />
                <small className="text-muted">Username will be auto-generated from email</small>
              </div>

            {/* Username Field - Now comes after email */}
            <div className="col-md-6">
              <label className="form-label fw-semibold">Username *</label>
              <input 
                type="text" 
                className="form-control" 
                name="username" 
                value={formData.username} 
                onChange={handleInputChange} 
                placeholder="johndoe" 
              />
              <small className="text-muted">Auto-generated from email, can be modified</small>
            </div>

            <div className="col-md-6 position-relative">
                  <label className="form-label fw-semibold">
                    <FaKey className="me-1" /> 
                    Password * 
                    {editingUser && <small className="text-muted"> (Leave blank to keep current)</small>}
                  </label>
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    className="form-control" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleInputChange}
                    onFocus={() => setShowPasswordRequirements(true)}
                    onBlur={() => setShowPasswordRequirements(false)}
                    placeholder="8+ chars, 1 uppercase, 1 number, 1 special char" 
                  />
                  <span 
                    className="position-absolute top-50 end-0 translate-middle-y me-3" 
                    style={{cursor:'pointer', marginTop: '12px'}} 
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                  
  
              </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Role *</label>
              <select 
                className="form-control" 
                name="role" 
                value={formData.role} 
                onChange={handleInputChange}
              >
                <option value="user">User (Employee)</option>
                <option value="team_leader">Team Leader</option>
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label fw-semibold">Department *</label>
              <select 
                className="form-control" 
                name="department" 
                value={formData.department} 
                onChange={handleInputChange}
              >
                <option value="">Select Department</option>
                <option value="IT & Innovation">IT & Innovation</option>
                <option value="Business">Business</option>
                <option value="Accounts">Accounts</option>
              </select>
            </div>

            <div className="col-md-6">
              <label className="form-label fw-semibold">Status</label>
              <select 
                className="form-control" 
                name="status" 
                value={formData.status} 
                onChange={handleInputChange}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="d-flex gap-2 mt-4 pt-3 border-top">
            <button 
              className="btn btn-primary flex-grow-1" 
              onClick={handleSaveUser}
            >
              {editingUser ? 'Update User' : 'Add User'}
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => { setShowAddModal(false); setEditingUser(null); }}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
)}
    </div>
  );
}