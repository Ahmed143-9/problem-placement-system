import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import api from '../services/api';
import Navbar from '../components/Navbar';


export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5 text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="row">
          <div className="col-12">
            <div className="card shadow mb-4">
              <div className="card-header bg-primary text-white">
                <h3 className="mb-0">Dashboard</h3>
              </div>
              <div className="card-body">
                <div className="alert alert-success">
                  <h4>Welcome, {user?.name}!</h4>
                  <p className="mb-0">
                    <strong>Role:</strong> {user?.role?.replace('_', ' ').toUpperCase()} | 
                    <strong> Department:</strong> {user?.department} | 
                    <strong> Email:</strong> {user?.email}
                  </p>
                </div>

                {/* Quick Stats */}
                {stats && (
                  <div className="row mt-4">
                    <div className="col-md-3 mb-3">
                      <div className="card border-primary">
                        <div className="card-body text-center">
                          <h2 className="text-primary mb-0">{stats.my_problems || 0}</h2>
                          <p className="text-muted mb-0">My Problems</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card border-warning">
                        <div className="card-body text-center">
                          <h2 className="text-warning mb-0">{stats.assigned_to_me || 0}</h2>
                          <p className="text-muted mb-0">Assigned to Me</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card border-info">
                        <div className="card-body text-center">
                          <h2 className="text-info mb-0">{stats.in_progress || 0}</h2>
                          <p className="text-muted mb-0">In Progress</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3 mb-3">
                      <div className="card border-success">
                        <div className="card-body text-center">
                          <h2 className="text-success mb-0">{stats.completed || 0}</h2>
                          <p className="text-muted mb-0">Completed</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="row mt-4">
                  <div className="col-md-4 mb-3">
                    <div className="card border-primary h-100">
                      <div className="card-body text-center">
                        <h5>Submit a Problem</h5>
                        <p className="text-muted">Raise a new problem ticket for your department</p>
                        <Link to="/problem/create" className="btn btn-primary">
                          Create Problem
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card border-info h-100">
                      <div className="card-body text-center">
                        <h5>View All Problems</h5>
                        <p className="text-muted">Browse and manage all problem tickets</p>
                        <Link to="/problems" className="btn btn-info">
                          View Problems
                        </Link>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="card border-success h-100">
                      <div className="card-body text-center">
                        <h5>View Reports</h5>
                        <p className="text-muted">Check live progress and analytics</p>
                        <Link to="/reports" className="btn btn-success">
                          View Reports
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Admin/Team Leader Section */}
                {(user?.role === 'admin' || user?.role === 'team_leader') && (
                  <div className="row mt-4">
                    <div className="col-12">
                      <div className="card border-danger">
                        <div className="card-body text-center">
                          <h5>Admin/Team Leader Panel</h5>
                          <p className="text-muted">Manage users, approve registrations, and assign problems</p>
                          <Link to="/admin" className="btn btn-danger">
                            Go to Admin Panel
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}