// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const DEFAULT_ADMIN = {
    id: 1,
    name: 'Admin User',
    username: 'Admin',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    department: 'Management',
    status: 'active',
    createdAt: new Date().toISOString(),
    createdBy: 'System'
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('system_users');
      const systemUsers = Array.isArray(JSON.parse(raw || '[]')) ? JSON.parse(raw || '[]') : [];

      const adminIndex = systemUsers.findIndex(u => u.username === DEFAULT_ADMIN.username);

      if (adminIndex === -1) {
        systemUsers.unshift(DEFAULT_ADMIN);
        localStorage.setItem('system_users', JSON.stringify(systemUsers));
        console.info('Default admin created.');
      } else {
        const admin = systemUsers[adminIndex];
        let changed = false;

        if (admin.password !== DEFAULT_ADMIN.password) {
          admin.password = DEFAULT_ADMIN.password;
          changed = true;
        }
        if (admin.role !== DEFAULT_ADMIN.role) {
          admin.role = DEFAULT_ADMIN.role;
          changed = true;
        }
        if (admin.status !== DEFAULT_ADMIN.status) {
          admin.status = DEFAULT_ADMIN.status;
          changed = true;
        }
        if (changed) {
          systemUsers[adminIndex] = admin;
          localStorage.setItem('system_users', JSON.stringify(systemUsers));
          console.info('Admin updated to default values.');
        }
      }

      // Load current user if exists
      const currentUser = localStorage.getItem('current_user');
      if (currentUser) {
        setUser(JSON.parse(currentUser));
      }
    } catch (err) {
      console.error('Auth init error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const u = (username || '').trim();
      const p = (password || '').trim();

      const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');

      const foundUser = systemUsers.find(
        usr => usr.username === u && usr.password === p
      );

      if (!foundUser) {
        console.warn('Login failed. Users:', systemUsers.map(x => ({ username: x.username, role: x.role })));
        return { success: false, error: 'Invalid username or password' };
      }

      if (foundUser.status !== 'active') {
        return { success: false, error: 'Your account is inactive. Please contact admin.' };
      }

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
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: 'An error occurred during login' };
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
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
