import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully!');
    navigate('/login');
  };

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-12">
          <div className="card shadow">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h3 className="mb-0">Dashboard</h3>
              <button className="btn btn-danger btn-sm" onClick={handleLogout}>
                Logout
              </button>
            </div>
            <div className="card-body">
              <div className="alert alert-success">
                <h4>Welcome, {user?.name}!</h4>
                <p className="mb-0">Email: {user?.email}</p>
              </div>

              <div className="row mt-4">
                <div className="col-md-12">
                  <div className="card border-primary">
                    <div className="card-body text-center">
                      <h5>Submit a Problem Ticket</h5>
                      <p>Raise a new problem for your department</p>
                      <Link to="/" className="btn btn-primary">
                        Go to Problem Form
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h5>User Information</h5>
                <table className="table table-bordered">
                  <tbody>
                    <tr>
                      <th width="30%">Name</th>
                      <td>{user?.name}</td>
                    </tr>
                    <tr>
                      <th>Email</th>
                      <td>{user?.email}</td>
                    </tr>
                    <tr>
                      <th>Account Status</th>
                      <td><span className="badge bg-success">Active</span></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}