// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';
import { authAPI } from '../utils/api';

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
  const [permissions, setPermissions] = useState([]);
  const [roles, setRoles] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // Auto login on app load
  useEffect(() => {
    const checkAuthStatus = () => {
      try {
        const token = localStorage.getItem('token');
        const savedUser = localStorage.getItem('user');
        const savedPermissions = localStorage.getItem('permissions');
        const savedRoles = localStorage.getItem('roles');

        console.log('🔄 Auto-login check:', { 
          hasToken: !!token, 
          hasUser: !!savedUser
        });

        if (token && savedUser) {
          try {
            let userData = JSON.parse(savedUser);
            let userPermissions = savedPermissions ? JSON.parse(savedPermissions) : [];
            let userRoles = savedRoles ? JSON.parse(savedRoles) : [];
            
            setUser(userData);
            setPermissions(userPermissions);
            setRoles(userRoles);
            setIsAuthenticated(true);
          } catch (error) {
            console.error('❌ Auto-login parsing error:', error);
            clearAuthData();
          }
        } else {
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error('❌ Auth check failed:', error);
        clearAuthData();
      } finally {
        setLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('roles');
  };

  const login = async (username, password) => {
    try {
      console.log('🔐 Login attempt for:', username);

      const response = await authAPI.login({
        email: username,
        password
      });

      console.log('📊 API Login response:', response);

      if (response.status === 'success' && response.data?.user) {
        const { user: userData, permissions, roles } = response.data;
        const { access_token, name, email, userId, force_password } = userData;

        const userObj = {
          id: userId,
          name,
          email,
          username: email.split('@')[0],
          role: roles?.[0] || 'user',
          force_password: force_password || false
        };

        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('permissions', JSON.stringify(permissions || []));
        localStorage.setItem('roles', JSON.stringify(roles || []));

        setUser(userObj);
        setPermissions(permissions || []);
        setRoles(roles || []);
        setIsAuthenticated(true);

        return { success: true, force_password: userObj.force_password, user: userObj };
      }

      return { success: false, error: response.message || 'Login failed' };
    } catch (error) {
      console.error('❌ Login error:', error);
      return { success: false, error: error.message || 'An error occurred during login' };
    }
  };

  const logout = () => {
    clearAuthData();
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setIsAuthenticated(false);
  };

  const hasPermission = (permission) => {
    return permissions.includes(permission) || permissions.includes('all');
  };

  const hasRole = (role) => roles.includes(role);

  const isAdminUser = () => hasRole('admin');

  const canPerformAction = (action, targetUser = null) => {
    switch (action) {
      case 'create_user':
      case 'view_admin_panel':
        return hasRole('admin');
      case 'edit_user':
      case 'toggle_status':
        return hasRole('admin') && targetUser;
      case 'delete_user':
        return hasRole('admin') && targetUser;
      case 'create_problem':
        return hasPermission('create problem');
      case 'update_problem':
        return hasPermission('update problem');
      case 'update_user':
        return hasPermission('update user');
      case 'manage_users':
        return hasPermission('manage users');
      default:
        return false;
    }
  };

  const value = {
    user,
    isAuthenticated,
    permissions,
    roles,
    login,
    logout,
    loading,
    hasPermission,
    hasRole,
    isAdminUser,
    canPerformAction
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};