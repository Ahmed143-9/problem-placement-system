import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminPanel from "./pages/AdminPanel";
import ProblemForm from "./MyComponents/ProblemForm";
import ProblemList from "./MyComponents/ProblemList";
import MyIssues from "./pages/MyIssues"; // New page for regular users
import ProblemDetails from "./MyComponents/ProblemDetails";
import Reports from "./pages/Reports";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <ToastContainer position="top-right" autoClose={3000} />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard - Admin/Team Leader Only */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />

            {/* Employee Dashboard - Regular Users Only */}
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/problem/create"
              element={
                <ProtectedRoute>
                  <ProblemForm />
                </ProtectedRoute>
              }
            />

            {/* All Problems - Admin/Team Leader Only */}
            <Route
              path="/problems"
              element={
                <AdminRoute>
                  <ProblemList />
                </AdminRoute>
              }
            />

            {/* My Issues - Regular Users Only */}
            <Route
              path="/my-issues"
              element={
                <ProtectedRoute>
                  <MyIssues />
                </ProtectedRoute>
              }
            />

            <Route
              path="/problem/:id"
              element={
                <ProtectedRoute>
                  <ProblemDetails />
                </ProtectedRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <ProtectedRoute>
                  <Reports />
                </ProtectedRoute>
              }
            />
            
            {/* Admin Panel - Admin and Team Leader can access */}
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />

            {/* Default Route - Redirect based on role */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate to="/employee-dashboard" replace />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;