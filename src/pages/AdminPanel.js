import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';


export default function AdminPanel() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [assignUser, setAssignUser] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'users') {
        const response = await api.get('/admin/users');
        setUsers(response.data);
      } else if (activeTab === 'problems') {
        const response = await api.get('/problems');
        setProblems(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch data');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/approve`);
      toast.success('User approved successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to approve user');
      console.error(error);
    }
  };

  const handleToggleUserStatus = async (userId, currentStatus) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      await api.put(`/admin/users/${userId}/status`, { status: newStatus });
      toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
      fetchData();
    } catch (error) {
      toast.error('Failed to update user status');
      console.error(error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }
    try {
      await api.delete(`/admin/users/${userId}`);
      toast.success('User deleted successfully!');
      fetchData();
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const handleAssignProblem = async () => {
    if (!assignUser || !selectedProblem) {
      toast.error('Please select a user to assign');
      return;
    }

    try {
      await api.put(`/problems/${selectedProblem.id}/assign`, { user_id: assignUser });
      toast.success('Problem assigned successfully!');
      setSelectedProblem(null);
      setAssignUser('');
      fetchData();
    } catch (error) {
      toast.error('Failed to assign problem');
      console.error(error);
    }
  };

  const getUserStatusBadge = (status) => {
    const badges = {
      active: 'bg-success',
      pending: 'bg-warning text-dark',
      inactive: 'bg-secondary'
    };
    return badges[status] || 'bg-secondary';
  };

  const getRoleBadge = (role) => {
    const badges = {
      admin: 'bg-danger',
      team_leader: 'bg-primary',
      employee: 'bg-info'
    };
    return badges[role] || 'bg-secondary';
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-danger text-white">
            <h3 className="mb-0">Admin Panel</h3>
          </div>
          <div className="card-body">
            {/* Tabs */}
            <ul className="nav nav-tabs mb-4">
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'users' ? 'active' : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  User Management
                </button>
              </li>
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === 'problems' ? 'active' : ''}`}
                  onClick={() => setActiveTab('problems')}
                >
                  Problem Assignment
                </button>
              </li>
            </ul>

            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : (
              <>
                {/* User Management Tab */}
                {activeTab === 'users' && (
                  <div>
                    <h5 className="mb-3">All Users</h5>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
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
                          {users.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="text-center py-4">
                                <p className="text-muted mb-0">No users found</p>
                              </td>
                            </tr>
                          ) : (
                            users.map((u) => (
                              <tr key={u.id}>
                                <td>{u.id}</td>
                                <td>{u.name}</td>
                                <td>{u.username}</td>
                                <td>{u.email}</td>
                                <td>
                                  <span className={`badge ${getRoleBadge(u.role)}`}>
                                    {u.role.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td>{u.department}</td>
                                <td>
                                  <span className={`badge ${getUserStatusBadge(u.status)}`}>
                                    {u.status.toUpperCase()}
                                  </span>
                                </td>
                                <td>
                                  {u.status === 'pending' && (
                                    <button
                                      className="btn btn-success btn-sm me-1"
                                      onClick={() => handleApproveUser(u.id)}
                                    >
                                      Approve
                                    </button>
                                  )}
                                  {u.status !== 'pending' && u.id !== user?.id && (
                                    <>
                                      <button
                                        className={`btn btn-sm me-1 ${
                                          u.status === 'active' ? 'btn-warning' : 'btn-success'
                                        }`}
                                        onClick={() => handleToggleUserStatus(u.id, u.status)}
                                      >
                                        {u.status === 'active' ? 'Deactivate' : 'Activate'}
                                      </button>
                                      <button
                                        className="btn btn-danger btn-sm"
                                        onClick={() => handleDeleteUser(u.id)}
                                      >
                                        Delete
                                      </button>
                                    </>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Problem Assignment Tab */}
                {activeTab === 'problems' && (
                  <div>
                    <h5 className="mb-3">Assign Problems</h5>
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead className="table-light">
                          <tr>
                            <th>ID</th>
                            <th>Department</th>
                            <th>Priority</th>
                            <th>Statement</th>
                            <th>Status</th>
                            <th>Created By</th>
                            <th>Assigned To</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {problems.length === 0 ? (
                            <tr>
                              <td colSpan="8" className="text-center py-4">
                                <p className="text-muted mb-0">No problems found</p>
                              </td>
                            </tr>
                          ) : (
                            problems.map((p) => (
                              <tr key={p.id}>
                                <td>#{p.id}</td>
                                <td>{p.department}</td>
                                <td>
                                  <span className={`badge ${
                                    p.priority === 'High' ? 'bg-danger' :
                                    p.priority === 'Medium' ? 'bg-warning text-dark' :
                                    'bg-success'
                                  }`}>
                                    {p.priority}
                                  </span>
                                </td>
                                <td>
                                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {p.statement}
                                  </div>
                                </td>
                                <td>
                                  <span className={`badge ${
                                    p.status === 'pending' ? 'bg-warning text-dark' :
                                    p.status === 'in_progress' ? 'bg-info' :
                                    'bg-success'
                                  }`}>
                                    {p.status.replace('_', ' ').toUpperCase()}
                                  </span>
                                </td>
                                <td>{p.created_by?.name}</td>
                                <td>
                                  {p.assigned_to ? (
                                    <span className="badge bg-info">{p.assigned_to.name}</span>
                                  ) : (
                                    <span className="badge bg-secondary">Unassigned</span>
                                  )}
                                </td>
                                <td>
                                  <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => {
                                      setSelectedProblem(p);
                                      setAssignUser(p.assigned_to?.id || '');
                                    }}
                                    data-bs-toggle="modal"
                                    data-bs-target="#assignModal"
                                  >
                                    {p.assigned_to ? 'Reassign' : 'Assign'}
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Assign Problem Modal */}
      <div className="modal fade" id="assignModal" tabIndex="-1">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                Assign Problem #{selectedProblem?.id}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label className="form-label">Select User</label>
                <select
                  className="form-control"
                  value={assignUser}
                  onChange={(e) => setAssignUser(e.target.value)}
                >
                  <option value="">-- Select User --</option>
                  {users
                    .filter((u) => u.status === 'active' && u.role !== 'admin')
                    .map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} - {u.department} ({u.role})
                      </option>
                    ))}
                </select>
              </div>
              {selectedProblem && (
                <div className="alert alert-info">
                  <strong>Problem:</strong> {selectedProblem.statement}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleAssignProblem}
                data-bs-dismiss="modal"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}