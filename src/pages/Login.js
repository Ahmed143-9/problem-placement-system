import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, user, isAuthenticated, permissions, roles } = useAuth();
  const { addNotification } = useNotifications();
  const navigate = useNavigate();

  // Debug logs
  useEffect(() => {
    console.log('🔍 Login Component State:', { 
      isAuthenticated, 
      user,
      permissions,
      roles
    });
  }, [isAuthenticated, user, permissions, roles]);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('🔀 Redirecting authenticated user:', user);
      
      // Check if password needs to be changed
      if (user.force_password) {
        toast.info('Please change your password');
        navigate('/change-password');
        return;
      }

      // Redirect based on role
      const userRole = user.role;
      console.log('🎭 User role for redirect:', userRole);
      
      if (userRole === 'admin' || userRole === 'team_leader' || roles.includes('admin')) {
        navigate('/dashboard');
      } else {
        navigate('/employee-dashboard');
      }
    }
  }, [isAuthenticated, user, roles, navigate]);

  // Helper function to display errors
  const displayErrors = (error) => {
    if (Array.isArray(error)) {
      // If error is an array, show each error
      error.forEach(err => {
        toast.error(err);
      });
    } else if (typeof error === 'object' && error !== null) {
      // If error is an object with nested errors
      Object.values(error).forEach(err => {
        if (Array.isArray(err)) {
          err.forEach(e => toast.error(e));
        } else {
          toast.error(err);
        }
      });
    } else if (typeof error === 'string') {
      // If error is a simple string
      toast.error(error);
    } else {
      // Fallback for any other type
      toast.error('Login failed. Please check your credentials.');
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  console.log('📤 Login form submitted');

  if (!username || !password) {
    toast.error('Please fill in all fields');
    setLoading(false);
    return;
  }

  try {
    const result = await login(username, password);
    console.log('📊 Login result:', result);

    if (result.success) {
      // Show toast notification for login success
      toast.success('You have successfully logged in');
      
      // Check if password needs to be changed
      if (result.force_password) {
        toast.info('Please change your password');
        navigate('/change-password');
        return;
      }

      // Show user info
      console.log('👤 User logged in:', result.user);
      console.log('🔑 Permissions:', permissions);
      console.log('👥 Roles:', roles);

      // The useEffect above will handle redirection based on authentication state
    } else {
      // Handle login failure with proper error display
      console.error('❌ Login failed:', result.error);
      displayErrors(result.error || 'Login failed. Please try again.');
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    
    // Handle different error formats
    if (error.response?.data?.error) {
      displayErrors(error.response.data.error);
    } else if (error.response?.data?.errors) {
      displayErrors(error.response.data.errors);
    } else if (error.message) {
      toast.error(error.message);
    } else {
      toast.error('An error occurred during login. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div 
      className="container-fluid p-0"
      style={{
        backgroundImage: 'url("/Checkinglog.PNG")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        height: '100vh',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Glass overlay effect */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(255, 255, 255, 0.12)',
          backdropFilter: 'blur(0px)',
          zIndex: 1
        }}
      ></div>
      
      <div className="row justify-content-center align-items-center" style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}>
        <div className="col-md-4 col-lg-3">
          <div 
            className="card"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(9px)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              overflow: 'hidden'
            }}
          >
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2 
                  className="fw-bold mb-2"
                  style={{ 
                    color: '#000000',
                    fontSize: '1.8rem',
                    textShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  Issue Management System
                </h2>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label" style={{ 
                    color: '#000000', 
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Username
                  </label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    style={{
                      background: 'transparent',
                      border: '2px solid #000000',
                      color: '#000000',
                      fontWeight: '600',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      padding: '12px 15px'
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username or email"
                    autoComplete="username"
                    disabled={loading}
                    required
                  />
                </div>

                <div className="mb-4 position-relative">
                  <label className="form-label" style={{ 
                    color: '#000000', 
                    fontWeight: '600',
                    fontSize: '0.9rem'
                  }}>
                    Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-lg"
                    style={{
                      background: 'transparent',
                      border: '2px solid #000000',
                      color: '#000000',
                      fontWeight: '600',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      padding: '12px 15px'
                    }}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <span
                    className="position-absolute top-50 end-0 translate-middle-y me-3"
                    style={{ 
                      cursor: 'pointer', 
                      color: '#000000',
                      fontSize: '1.1rem',
                      marginTop: '8px'
                    }}
                    onClick={() => setShowPassword(prev => !prev)}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>

                {/* Super Admin Hint */}
                {username === 'superadmin@system.com' && (
                  <div className="alert alert-info mb-3 py-2">
                    <small>Super Admin emergency access</small>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-lg w-100"
                  disabled={loading}
                  style={{
                    background: 'rgba(0, 0, 0, 0.7)',
                    backdropFilter: 'blur(15px)',
                    border: '2px solid #000000',
                    color: '#ffffff',
                    fontWeight: '600',
                    borderRadius: '10px',
                    padding: '12px',
                    fontSize: '1rem',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.9)';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = 'rgba(0, 0, 0, 0.7)';
                    e.target.style.transform = 'translateY(0)';
                  }}
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}