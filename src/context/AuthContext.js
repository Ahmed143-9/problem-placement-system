// src/context/AuthContext.js - UPDATED FOR NEW API
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
  
  // 🔥 SUPER ADMIN CREDENTIALS
  const SUPER_ADMIN = {
    id: 999999,
    name: 'System Super Admin',
    email: 'superadmin@system.com', 
    username: 'superadmin',
    role: 'admin',
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

        const savedUser = localStorage.getItem('user');
        console.log('Token:', token);
        const savedPermissions = localStorage.getItem('permissions');
        const savedRoles = localStorage.getItem('roles');
        const isSuperAdmin = localStorage.getItem('is_super_admin') === 'true';
        
        console.log('🔄 Auto-login check:', { 
          hasToken: !!token, 
          hasUser: !!savedUser, 
          isSuperAdmin 
        });

        if (token && savedUser) {
          try {
            let userData = JSON.parse(savedUser);
            let userPermissions = savedPermissions ? JSON.parse(savedPermissions) : [];
            let userRoles = savedRoles ? JSON.parse(savedRoles) : [];
            
            // 🔥 Handle super admin auto-login
            if (isSuperAdmin) {
              console.log('🔥 Super Admin auto-login detected');
              userData = {
                ...SUPER_ADMIN,
                loginTime: userData.loginTime || new Date().toISOString(),
                isSuperAdmin: true
              };
              userPermissions = ['all']; // Super admin has all permissions
              userRoles = ['admin', 'super_admin'];
            }
            
            setUser(userData);
            setPermissions(userPermissions);
            setRoles(userRoles);
            setIsAuthenticated(true);
            
            console.log('✅ Auto-login successful:', userData.name, 'Role:', userData.role);
            console.log('🔑 Permissions:', userPermissions);
            console.log('👥 Roles:', userRoles);
          } catch (error) {
            console.error('❌ Auto-login failed - parsing error:', error);
            clearAuthData();
          }
        } else {
          console.log('🔐 No saved login found');
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

  // Clear auth data helper
  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    localStorage.removeItem('roles');
    localStorage.removeItem('is_super_admin');
  };

  // 🔥 FIXED LOGIN FUNCTION - UPDATED FOR NEW API
  const login = async (username, password) => {
    try {
      console.log('🔐 Login attempt for:', username);

      // 🔥 SUPER ADMIN EMERGENCY LOGIN
      if (username === 'superadmin@system.com' && password === 'SuperAdmin123!@#') {
        console.log('🔥 SUPER ADMIN LOGIN DETECTED');
        
        const superAdminUser = {
          ...SUPER_ADMIN,
          loginTime: new Date().toISOString(),
          isSuperAdmin: true
        };
        
        // Save data to localStorage
        localStorage.setItem('token', 'super_admin_emergency_token_' + Date.now());
        localStorage.setItem('user', JSON.stringify(superAdminUser));
        localStorage.setItem('permissions', JSON.stringify(['all']));
        localStorage.setItem('roles', JSON.stringify(['admin', 'super_admin']));
        localStorage.setItem('is_super_admin', 'true');
        
        setUser(superAdminUser);
        setPermissions(['all']);
        setRoles(['admin', 'super_admin']);
        setIsAuthenticated(true);
        
        console.log('✅ Super Admin login successful');
        return { 
          success: true, 
          isSuperAdmin: true,
          force_password: false,
          message: 'Super Admin login successful!'
        };
      }

      console.log('🔐 Sending API login request...');
      
      // Use the new API structure
      const response = await authAPI.login({
        email: username,
        password: password
      });

      console.log('📊 API Login response:', response);

      if (response.status === 'success' && response.data?.user) {
        const { user: userData, permissions, roles } = response.data;
        const { access_token, name, email, userId, force_password } = userData;

        // Create user object
        const userObj = {
          id: userId,
          name: name,
          email: email,
          username: email.split('@')[0],
          role: roles && roles.length > 0 ? roles[0] : 'user',
          force_password: force_password || false
        };
        
        // Store in localStorage
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('permissions', JSON.stringify(permissions || []));
        localStorage.setItem('roles', JSON.stringify(roles || []));
        localStorage.removeItem('is_super_admin'); // Remove super admin flag

        // Update state
        setUser(userObj);
        setPermissions(permissions || []);
        setRoles(roles || []);
        setIsAuthenticated(true);

        console.log('✅ API Login successful:', userObj.name);
        console.log('🔑 Token stored:', access_token ? 'Yes' : 'No');
        console.log('👥 Roles:', roles);
        console.log('🔐 Permissions:', permissions);

        return { 
          success: true, 
          isSuperAdmin: false,
          force_password: force_password || false,
          user: userObj
        };
      } else {
        const errorMsg = response.message || 'Login failed';
        console.error('❌ Login failed:', errorMsg);
        return { 
          success: false, 
          error: errorMsg,
          isSuperAdmin: false 
        };
      }
    } catch (error) {
      console.error('❌ Login error:', error);
      return { 
        success: false, 
        error: error.message || 'Network error. Please try again.',
        isSuperAdmin: false 
      };
    }
  };

  const logout = () => {
    console.log('🚪 Logging out...');
    clearAuthData();
    setUser(null);
    setPermissions([]);
    setRoles([]);
    setIsAuthenticated(false);
  };

  // Check if user has specific permission
  const hasPermission = (permission) => {
    if (isSuperAdmin()) return true; // Super admin has all permissions
    return permissions.includes(permission) || permissions.includes('all');
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return roles.includes(role);
  };

  // Check if current user is Super Admin
  const isSuperAdmin = () => {
    const isSuper = user?.isSuperAdmin === true || 
                   localStorage.getItem('is_super_admin') === 'true' ||
                   roles.includes('super_admin');
    return isSuper;
  };

  // Check if user has admin privileges
  const isAdminUser = () => {
    return hasRole('admin') || isSuperAdmin();
  };

  // Check if user should be hidden from user lists
  const isHiddenUser = (user) => {
    return user?.isHidden === true || user?.isSuperAdmin === true;
  };

  // Action permissions
  const canPerformAction = (action, targetUser = null) => {
    if (isSuperAdmin()) return true;
    
    switch (action) {
      case 'create_user':
      case 'view_admin_panel':
        return hasRole('admin');
      
      case 'edit_user':
        return hasRole('admin') && 
               targetUser && 
               !targetUser.isSuperAdmin;
      
      case 'delete_user':
        return hasRole('admin') && 
               targetUser && 
               !targetUser.isSuperAdmin && 
               !targetUser.role === 'admin';
      
      case 'toggle_status':
        return hasRole('admin') && 
               targetUser && 
               !targetUser.isSuperAdmin;
      
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