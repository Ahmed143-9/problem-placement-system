import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaKey } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';



export default function AdminPanelUserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    status: 'active'
  });

  // Check if current user is Admin
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadUsers();
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = () => {
    if (!isAdmin) {
      toast.error('Only Admin can add or edit users!');
      return;
    }

    if (!formData.name || !formData.username || !formData.email) {
      toast.error('Please fill all required fields');
      return;
    }

    if (!editingUser && !formData.password) {
      toast.error('Password is required');
      return;
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
        if (storedUsers.some(u => u.username === formData.username)) {
          toast.error('Username already exists!');
          return;
        }

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

  const handleEditUser = (userId) => {
    if (!isAdmin) {
      toast.error('Only Admin can edit users!');
      return;
    }

    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        username: userToEdit.username,
        email: userToEdit.email,
        password: '',
        role: userToEdit.role,
        department: userToEdit.department,
        status: userToEdit.status
      });
      setShowAddModal(true);
    }
  };

  const handleDeleteUser = (userId) => {
    if (!isAdmin) {
      toast.error('Only Admin can delete users!');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

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

  const handleToggleStatus = (userId) => {
    if (!isAdmin) {
      toast.error('Only Admin can change user status!');
      return;
    }

    try {
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      const updatedUsers = storedUsers.map(u => {
        if (u.id === userId) {
          return { ...u, status: u.status === 'active' ? 'inactive' : 'active' };
        }
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

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-danger',
      team_leader: 'bg-primary',
      user: 'bg-info'
    };
    return badges[role] || 'bg-secondary';
  };

  const getStatusBadge = (status) => {
    return status === 'active' ? 'bg-success' : 'bg-secondary';
  };

  return (
    <div className="container-fluid p-4">
      <div className="card shadow-sm border-0">
        <div className="card-header bg-danger text-white d-flex justify-content-between align-items-center">
          <div>
            <h4 className="mb-0">
              <FaUsers className="me-2" />
              User Management Panel
            </h4>
            <small>
              {isAdmin 
                ? 'Add and manage Team Leaders and Users' 
                : 'View team members (Read-only access)'}
            </small>
          </div>
          {isAdmin && (
            <button 
              className="btn btn-light"
              onClick={() => {
                setEditingUser(null);
                setFormData({
                  name: '',
                  username: '',
                  email: '',
                  password: '',
                  role: 'user',
                  department: '',
                  status: 'active'
                });
                setShowAddModal(true);
              }}
            >
              <FaUserPlus className="me-2" />
              Add New User
            </button>
          )}
        </div>

        <div className="card-body">
          {!isAdmin && (
            <div className="alert alert-info mb-4">
              <strong>Note:</strong> As a Team Leader, you can view all users but cannot add, edit, or delete them. 
              Only Admin has full user management permissions.
            </div>
          )}

          <div className="row mb-4">
            <div className="col-md-4">
              <div className="card border-primary">
                <div className="card-body text-center">
                  <h3 className="text-primary mb-0">
                    {users.filter(u => u.role === 'team_leader').length}
                  </h3>
                  <small className="text-muted">Team Leaders</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-info">
                <div className="card-body text-center">
                  <h3 className="text-info mb-0">
                    {users.filter(u => u.role === 'user').length}
                  </h3>
                  <small className="text-muted">Users</small>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="card border-success">
                <div className="card-body text-center">
                  <h3 className="text-success mb-0">
                    {users.filter(u => u.status === 'active').length}
                  </h3>
                  <small className="text-muted">Active Users</small>
                </div>
              </div>
            </div>
          </div>

          <div className="table-responsive">
            <table className="table table-hover">
              <thead className="table-light">
                <tr>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Status</th>
                  <th>Created By</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-5">
                      <FaUsers className="fs-1 text-muted mb-3 d-block mx-auto" />
                      <p className="text-muted mb-3">No users found.</p>
                      {isAdmin && (
                        <button 
                          className="btn btn-primary"
                          onClick={() => setShowAddModal(true)}
                        >
                          <FaUserPlus className="me-2" />
                          Add User
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  users.map(u => (
                    <tr key={u.id}>
                      <td className="fw-semibold">{u.name}</td>
                      <td>
                        <code className="bg-light px-2 py-1 rounded">{u.username}</code>
                      </td>
                      <td>{u.email}</td>
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
                        <small className="text-muted">{u.createdBy}</small>
                      </td>
                      <td>
                        {isAdmin ? (
                          <div className="btn-group btn-group-sm">
                            <button
                              className="btn btn-outline-primary"
                              onClick={() => handleEditUser(u.id)}
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              className={`btn btn-outline-${u.status === 'active' ? 'warning' : 'success'}`}
                              onClick={() => handleToggleStatus(u.id)}
                              title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                            >
                              {u.status === 'active' ? '⏸' : '▶'}
                            </button>
                            <button
                              className="btn btn-outline-danger"
                              onClick={() => handleDeleteUser(u.id)}
                              title="Delete"
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

      {/* Add/Edit Modal - Only for Admin */}
      {showAddModal && isAdmin && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaUserPlus className="me-2" />
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingUser(null);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="John Doe"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Username *</label>
                  <input
                    type="text"
                    className="form-control"
                    name="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="johndoe"
                  />
                  <small className="text-muted">User will use this to login</small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Email *</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="john@example.com"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    <FaKey className="me-2" />
                    Password * {editingUser && <small className="text-muted">(Leave blank to keep current)</small>}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter password"
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Role *</label>
                  <select
                    className="form-control"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                  >
                    <option value="user">User (Employee)</option>
                    <option value="team_leader">Team Leader</option>
                  </select>
                  <small className="text-muted">
                    {formData.role === 'team_leader' 
                      ? 'Can monitor team and approve problems (cannot add/delete users)' 
                      : 'Can raise and solve problems'}
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label">Department *</label>
                  <select
                    className="form-control"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                  >
                    <option value="">Select Department</option>
                    <option value="Tech">Tech</option>
                    <option value="Business">Business</option>
                    <option value="Accounts">Accounts</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Status</label>
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

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-primary flex-grow-1"
                    onClick={handleSaveUser}
                  >
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowAddModal(false);
                      setEditingUser(null);
                    }}
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