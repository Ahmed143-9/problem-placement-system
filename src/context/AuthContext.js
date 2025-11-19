// src/context/AuthContext.js - COMPLETE FIXED VERSION
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const API_BASE_URL = 'http://127.0.0.1:8000/api';

  // Auto login on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('current_user');
        
        if (token && savedUser) {
          try {
            const userData = JSON.parse(savedUser);
            setUser(userData);
            setIsAuthenticated(true);
            console.log('✅ Auto-login successful:', userData.name);
          } catch (error) {
            console.error('❌ Auto-login failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('current_user');
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error);
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);
  
  const login = async (username, password) => {
    try {
      console.log('🔐 Sending login request...');
      
      const response = await fetch(`${API_BASE_URL}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ 
          email: username,
          password 
        }),
      });

      const data = await response.json();
      console.log('🔑 Login response:', data);

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('current_user', JSON.stringify(data.user));
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      console.error('Login network error:', error);
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('current_user');
    setUser(null);
    setIsAuthenticated(false);
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    API_BASE_URL
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};