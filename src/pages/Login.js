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
      } else {
    navigate('/employee-dashboard'); // Normal user এখানে যাবে
  }
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
      // toast.error('An error occurred during login');
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
                <p style={{ 
                  color: '#333333', 
                  fontWeight: '500',
                  fontSize: '0.9rem'
                }}>
                  {/* Login to your account */}
                </p>
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
                      background: 'transparent', // Changed to transparent
                      border: '2px solid #000000', // Black border
                      color: '#000000',
                      fontWeight: '600',
                      borderRadius: '10px',
                      fontSize: '0.95rem',
                      padding: '12px 15px'
                    }}
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
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
                      background: 'transparent', // Changed to transparent
                      border: '2px solid #000000', // Black border
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