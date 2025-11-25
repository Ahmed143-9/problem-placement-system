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

  // 🔥 SUPER ADMIN CREDENTIALS
  const SUPER_ADMIN = {
    id: 999999,
    name: 'System Super Admin',
    email: 'superadmin@system.com', 
    username: 'superadmin',
    role: 'super_admin', // 🔥 Correct role
    department: 'System Administration',
    status: 'active',
    designation: 'Super Administrator',
    isHidden: true
  };

  // Auto login on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('current_user');
        const isSuperAdmin = localStorage.getItem('is_super_admin') === 'true';
        
        if (token && savedUser) {
          try {
            let userData = JSON.parse(savedUser);
            
            // 🔥 If it's super admin, use the SUPER_ADMIN object
            if (isSuperAdmin) {
              userData = {
                ...SUPER_ADMIN,
                loginTime: userData.loginTime || new Date().toISOString()
              };
            }
            
            setUser(userData);
            setIsAuthenticated(true);
            console.log('✅ Auto-login successful:', userData.name, 'Role:', userData.role);
          } catch (error) {
            console.error('❌ Auto-login failed:', error);
            localStorage.removeItem('token');
            localStorage.removeItem('current_user');
            localStorage.removeItem('is_super_admin');
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

  // 🔥 FIXED LOGIN FUNCTION
  const login = async (username, password) => {
    try {
      // 🔥 SUPER ADMIN EMERGENCY LOGIN - FIXED
      if (username === 'superadmin@system.com' && password === 'SuperAdmin123!@#') {
        console.log('🔥 SUPER ADMIN LOGIN DETECTED');
        
        const superAdminUser = {
          ...SUPER_ADMIN,
          loginTime: new Date().toISOString(),
          isSuperAdmin: true
        };
        
        // 🔥 Save proper data to localStorage
        localStorage.setItem('token', 'super_admin_emergency_token_' + Date.now());
        localStorage.setItem('current_user', JSON.stringify(superAdminUser));
        localStorage.setItem('is_super_admin', 'true');
        
        setUser(superAdminUser);
        setIsAuthenticated(true);
        
        return { 
          success: true, 
          isSuperAdmin: true,
          message: 'Super Admin login successful!'
        };
      }

      console.log('🔐 Sending normal login request...');
      
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
        localStorage.removeItem('is_super_admin'); // Remove super admin flag for normal users
        
        setUser(data.user);
        setIsAuthenticated(true);
        return { success: true, isSuperAdmin: false };
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
    localStorage.removeItem('is_super_admin');
    setUser(null);
    setIsAuthenticated(false);
  };

  // Check if current user is Super Admin
  const isSuperAdmin = () => {
    return user?.role === 'super_admin' || localStorage.getItem('is_super_admin') === 'true';
  };

  // Check if user has admin privileges (either admin or super_admin)
  const isAdminUser = () => {
    return user?.role === 'admin' || isSuperAdmin();
  };

  // Check if user should be hidden from user lists
  const isHiddenUser = (user) => {
    return user?.isHidden === true || user?.role === 'super_admin';
  };

  // Super admin can perform any action
  const canPerformAction = (action, targetUser = null) => {
    if (isSuperAdmin()) return true;
    
    switch (action) {
      case 'create_user':
      case 'view_admin_panel':
        return user?.role === 'admin';
      
      case 'edit_user':
        return user?.role === 'admin' && targetUser?.role !== 'super_admin';
      
      case 'delete_user':
        return user?.role === 'admin' && 
               targetUser?.role !== 'super_admin' && 
               targetUser?.role !== 'admin';
      
      case 'toggle_status':
        return user?.role === 'admin' && targetUser?.role !== 'super_admin';
      
      default:
        return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    login,
    logout,
    loading,
    API_BASE_URL,
    isSuperAdmin: isSuperAdmin(),
    isAdminUser: isAdminUser(),
    canPerformAction,
    isHiddenUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};