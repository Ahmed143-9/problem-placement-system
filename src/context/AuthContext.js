import React, { createContext, useState, useContext, useEffect } from 'react';


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const userData = localStorage.getItem('user');
    
    if (userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    // Front-end only login - No backend
    if (username === 'Admin' && password === 'Admin123') {
      const userData = {
        id: 1,
        name: 'Admin User',
        username: 'Admin',
        email: 'admin@example.com',
        role: 'admin',
        department: 'Management',
        status: 'active'
      };
      
      // Save to localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      return { success: true };
    }
    
    return { 
      success: false, 
      error: 'Invalid credentials. Use Admin/Admin123' 
    };
  };

  const logout = () => {
    localStorage.removeItem('user');
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