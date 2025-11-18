// src/context/AuthContext.js - Fix token handling
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const API_BASE_URL = 'http://localhost:8000/api';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const userInfo = localStorage.getItem('user');

    if (storedToken && userInfo) {
      setToken(storedToken);
      setUser(JSON.parse(userInfo));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      console.log('🔐 Attempting login for:', username);

      // Try Laravel API Login
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          username: username, 
          password: password 
        }),
      });

      console.log('📨 Login response status:', response.status);

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      console.log('📦 Login response data:', data);

      if (data.success && data.user && data.token) {
        // ✅ Store token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          error: data.error || 'Invalid username or password' 
        };
      }

    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: 'Cannot connect to server. Make sure Laravel is running on localhost:8000.' 
      };
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('token');
    
    if (currentToken) {
      try {
        await fetch(`${API_BASE_URL}/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentToken}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }

    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
  };

  const getAuthHeaders = () => {
    const currentToken = token || localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': `Bearer ${currentToken}`,
    };
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
    API_BASE_URL,
    getAuthHeaders // ✅ Add this function
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;