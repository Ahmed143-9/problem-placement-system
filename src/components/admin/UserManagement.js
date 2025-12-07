import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaEdit, FaTrash, FaKey, FaEye, FaEyeSlash } from 'react-icons/fa';
import { userAPI } from '../../utils/api';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    status: 'active'
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const result = await userAPI.getUsers();
      setUsers(result.users);
    } catch (error) {
      toast.error('Failed to load users');
    }
  };

  const handleSaveUser = async () => {
    if (!formData.name || !formData.username || !formData.email) {
      return toast.error('Please fill all required fields');
    }

    if (!editingUser && !formData.password) {
      return toast.error('Password is required for new users');
    }

    setLoading(true);
    try {
      if (editingUser) {
        await userAPI.updateUser(editingUser.id, formData);
        toast.success('User updated successfully!');
      } else {
        await userAPI.createUser(formData);
        toast.success('User created successfully!');
      }

      setShowModal(false);
      resetForm();
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to save user');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      await userAPI.deleteUser(userId);
      toast.success('User deleted successfully!');
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to delete user');
    }
  };

  const handleToggleStatus = async (userId) => {
    try {
      await userAPI.toggleUserStatus(userId);
      toast.success('User status updated!');
      loadUsers();
    } catch (error) {
      toast.error(error.message || 'Failed to update status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      username: '',
      email: '',
      password: '',
      role: 'user',
      department: '',
      status: 'active'
    });
    setEditingUser(null);
  };

  const openEditModal = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      username: user.username,
      email: user.email,
      password: '',
      role: user.role,
      department: user.department,
      status: user.status
    });
    setShowModal(true);
  };

  const openAddModal = () => {
    resetForm();
    setShowModal(true);
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-danger',
      team_leader: 'bg-warning',
      user: 'bg-info'
    };
    return badges[role] || 'bg-secondary';
  };

  return (
    <div>
      {/* Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h5>User Management</h5>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          <FaUserPlus className="me-1" />
          Add User
        </button>
      </div>

      {/* Users Table */}
      <div className="table-responsive">
        <table className="table table-striped table-hover">
          <thead className="table-dark">
            <tr>
              <th>Name</th>
              <th>Username</th>
              <th>Email</th>
              <th>Role</th>
              <th>Department</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td className="fw-semibold">{user.name}</td>
                <td><code>{user.username}</code></td>
                <td>{user.email}</td>
                <td>
                  <span className={`badge ${getRoleBadge(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td>{user.department}</td>
                <td>
                  <span className={`badge ${user.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>
                    {user.status}
                  </span>
                </td>
                <td>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-primary"
                      onClick={() => openEditModal(user)}
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn btn-outline-warning"
                      onClick={() => handleToggleStatus(user.id)}
                    >
                      {user.status === 'active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      className="btn btn-outline-danger"
                      onClick={() => handleDeleteUser(user.id)}
                    >
                      <FaTrash />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      value={formData.email}
                      onChange={(e) => {
                        const email = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          email: email,
                          username: editingUser ? prev.username : email
                        }));
                      }}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">Username *</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.username}
                      onChange={(e) => setFormData({...formData, username: e.target.value})}
                    />
                  </div>

                  <div className="col-12">
                    <label className="form-label">
                      Password {!editingUser && '*'}
                      {editingUser && <small className="text-muted"> (Leave blank to keep current)</small>}
                    </label>
                    <div className="input-group">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        className="form-control"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                      />
                      <button
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Role</label>
                    <select
                      className="form-select"
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <option value="user">User</option>
                      <option value="team_leader">Team Leader</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label">Department</label>
                    <select
                      className="form-select"
                      value={formData.department}
                      onChange={(e) => setFormData({...formData, department: e.target.value})}
                    >
                      <option value="">Select Department</option>
                      <option value="Enterprise Business Solutions">Enterprise Business Solutions</option>
                      <option value="Board Management">Board Management</option>
                      <option value="Support Stuff">Support Stuff</option>
                      <option value="Administration and Human Resources">Administration and Human Resources</option>
                      <option value="Finance and Accounts">Finance and Accounts</option>
                      <option value="Business Dev and Operations">Business Dev and Operations</option>
                      <option value="Implementation and Support">Implementation and Support</option>
                      <option value="Technical and Networking Department">Technical and Networking Department</option>
                    </select>
                  </div>

                  <div className="col-12">
                    <label className="form-label">Status</label>
                    <select
                      className="form-select"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handleSaveUser}
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (editingUser ? 'Update' : 'Create')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}