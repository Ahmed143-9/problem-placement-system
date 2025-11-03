// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Initialize system with admin user if not exists
    const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
    if (systemUsers.length === 0) {
      const adminUser = {
        id: 1,
        name: 'Admin User',
        username: 'Admin',
        email: 'admin@example.com',
        password: 'Admin123',
        role: 'admin',
        department: 'Management',
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: 'System'
      };
      localStorage.setItem('system_users', JSON.stringify([adminUser]));
    }

    // Check if user is logged in
    const userData = localStorage.getItem('current_user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      // Get all system users
      const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      
      // Find user by username and password
      const foundUser = systemUsers.find(
        u => u.username === username && u.password === password
      );

      if (!foundUser) {
        return { 
          success: false, 
          error: 'Invalid username or password' 
        };
      }

      // Check if user is active
      if (foundUser.status !== 'active') {
        return {
          success: false,
          error: 'Your account is inactive. Please contact admin.'
        };
      }

      // Set current user
      const userData = {
        id: foundUser.id,
        name: foundUser.name,
        username: foundUser.username,
        email: foundUser.email,
        role: foundUser.role,
        department: foundUser.department,
        status: foundUser.status
      };

      localStorage.setItem('current_user', JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'An error occurred during login'
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('current_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};