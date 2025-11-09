// src/components/ProtectedRoute.js
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();

  if (loading) {
    // Auth state still loading, don't redirect yet
    return <div>Loading...</div>;
  }

  if (!user) {
    // Not logged in
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Logged in but role not allowed
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
