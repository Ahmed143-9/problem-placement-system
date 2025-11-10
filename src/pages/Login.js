import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in based on role
  useEffect(() => {
    if (user) {
      if (user.role === 'admin' || user.role === 'team_leader') {
        navigate('/dashboard');
      } 
      // else {
      //   navigate('/employee-dashboard');
      // }
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    if (!username || !password) {
      toast.error('Please fill in all fields');
      setLoading(false);
      return;
    }

    // Password validation regex
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_\-+=\[\]{};:'",.<>?/\\|`~]).{8,}$/;

    if (!passwordRegex.test(password)) {
      toast.error('Password must be at least 8 characters, include 1 uppercase letter, 1 number, and 1 special character');
      setLoading(false);
      return;
    }

    try {
      const result = await login(username, password);

      if (result.success) {
        toast.success('Login successful!');
        const userData = JSON.parse(localStorage.getItem('current_user'));
        if (userData.role === 'admin' || userData.role === 'team_leader') {
          navigate('/dashboard');
        } 
        else {
          navigate('/employee-dashboard');
        }
      } else {
        toast.error(result.error || 'Login failed');
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error('An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="row justify-content-center align-items-center" style={{ minHeight: '100vh' }}>
        <div className="col-md-5">
          <div className="card shadow-lg">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="fw-bold">Issue Management System</h2>
                <p className="text-muted">Login to your account</p>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="mb-4 position-relative">
                  <label className="form-label">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <span
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ cursor: 'pointer' }}
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-100"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Logging in...
                    </>
                  ) : (
                    'Login'
                  )}
                </button>
              </form>

              <div className="alert alert-info mt-4 mb-0">
                <small>
                  <strong>Admin Credentials:</strong><br />
                  Username: <code>Admin</code> | Password: <code>Admin@123</code>
                </small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
