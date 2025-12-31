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

  const { login, user, isAuthenticated, roles } = useAuth();
  const navigate = useNavigate();

  /* 🔍 Debug (optional – keep for now) */
  useEffect(() => {
    console.log('Login state:', { isAuthenticated, user, roles });
  }, [isAuthenticated, user, roles]);

  /* Auto-redirect on page load only (no racing with login toast) */
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    // If user already authenticated on page load, navigate immediately
    if (user.force_password) {
      navigate('/change-password');
      return;
    }

    const isAdmin =
      user.role === 'admin' ||
      user.role === 'team_leader' ||
      roles?.includes('admin');

    navigate(isAdmin ? '/dashboard' : '/employee-dashboard');
  }, []); // run once on mount

  /* 🧠 Error handler */
  const displayErrors = (error) => {
    if (Array.isArray(error)) {
      error.forEach(e => toast.error(e, { autoClose: 3000 }));
    } else if (typeof error === 'object' && error !== null) {
      Object.values(error).forEach(err => {
        if (Array.isArray(err)) {
          err.forEach(e => toast.error(e, { autoClose: 3000 }));
        } else {
          toast.error(err, { autoClose: 3000 });
        }
      });
    } else if (typeof error === 'string') {
      toast.error(error, { autoClose: 3000 });
    } else {
      toast.error('Login failed. Please try again.', { autoClose: 3000 });
    }
  };

  /* 🚀 Submit */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error('Please fill in all fields', { autoClose: 3000 });
      return;
    }

    setLoading(true);

    try {
      const result = await login(username, password);

      if (result?.success) {
        const resultUserRole = result.user?.role || roles?.[0];
        const isAdmin = resultUserRole === 'admin' || resultUserRole === 'team_leader' || roles?.includes('admin');

        if (result.force_password) {
          // If password change is required, navigate after showing info toast
          toast.info('Please change your password', {
            autoClose: 3000,
            onClose: () => navigate('/change-password')
          });
        } else {
          // Show success toast and navigate immediately; ensure the toast is dismissed after 3s
          const toastId = toast.success('You have successfully logged in', { autoClose: 3000 });
          navigate(isAdmin ? '/dashboard' : '/employee-dashboard');
          // Explicitly dismiss the toast after autoClose duration to avoid it persisting
          setTimeout(() => {
            try { toast.dismiss(toastId); } catch (e) { /* ignore */ }
          }, 3100);
        }
      } else {
        displayErrors(result?.error);
      }
    } catch (error) {
      if (error?.response?.data?.errors) {
        displayErrors(error.response.data.errors);
      } else {
        toast.error('Something went wrong during login', { autoClose: 3000 });
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
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Glass overlay */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(255,255,255,0.12)',
          zIndex: 1,
        }}
      />

      <div
        className="row justify-content-center align-items-center"
        style={{ minHeight: '100vh', position: 'relative', zIndex: 2 }}
      >
        <div className="col-md-4 col-lg-3">
          <div
            className="card"
            style={{
              background: 'rgba(255,255,255,0.15)',
              backdropFilter: 'blur(9px)',
              border: '1px solid rgba(255,255,255,0.4)',
              borderRadius: '20px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }}
          >
            <div className="card-body p-4">
              <div className="text-center mb-4">
                <h2
                  className="fw-bold"
                  style={{
                    color: '#000',
                    fontSize: '1.8rem',
                  }}
                >
                  Issue Management System
                </h2>
              </div>

              <form onSubmit={handleSubmit}>
                {/* Username */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">Username</label>
                  <input
                    type="text"
                    className="form-control form-control-lg"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={loading}
                    autoComplete="username"
                    required
                    style={{
                      background: 'transparent',
                      border: '2px solid #000',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                  />
                </div>

                {/* Password */}
                <div className="mb-4 position-relative">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control form-control-lg"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    autoComplete="current-password"
                    required
                    style={{
                      background: 'transparent',
                      border: '2px solid #000',
                      borderRadius: '10px',
                      fontWeight: 600,
                    }}
                  />

                  <span
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: 'absolute',
                      right: 15,
                      top: '55%',
                      cursor: 'pointer',
                      color: '#000',
                    }}
                  >
                    {showPassword ? <FaEye /> : <FaEyeSlash />}
                  </span>
                </div>

                {/* Super Admin hint */}
                {username === 'superadmin@system.com' && (
                  <div className="alert alert-info py-2">
                    <small>Super Admin emergency access</small>
                  </div>
                )}

                <button
                  type="submit"
                  className="btn btn-dark btn-lg w-100"
                  disabled={loading}
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
              </form>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
