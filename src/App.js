import React, { useEffect } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { AuthProvider } from "./context/AuthContext";
import { NotificationProvider } from "./context/NotificationContext";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import AdminPanel from "./pages/AdminPanel";
import ProblemForm from "./MyComponents/ProblemForm";
import ProblemList from "./MyComponents/ProblemList";
import MyIssues from "./pages/MyIssues";
import ProblemDetails from "./MyComponents/ProblemDetails";
import Reports from "./pages/Reports";
import RoleManagement from "./pages/RoleManagement";
import ProblemCreate from "./pages/ProblemCreate";
import FirstFaceAssignment from "./components/FirstFaceAssignment";
import DomainStatus from "./pages/DomainStatus";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import { migrateExistingProblems } from './utils/migration';

function App() {

  // Run migration on app load
  useEffect(() => {
    const migrationResult = migrateExistingProblems();
    console.log('Migration result:', migrationResult);
  }, []);

  return (
    <AuthProvider>
      <NotificationProvider>

        {/* ✅ ToastContainer OUTSIDE Router to avoid stuck toast */}
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss={false}
          pauseOnHover={false}
          draggable
          limit={5}
          theme="light"
          style={{ zIndex: 9999 }}
        />

        <Router>
          <Routes>
            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Admin-only Routes */}
            <Route
              path="/dashboard"
              element={
                <AdminRoute>
                  <Dashboard />
                </AdminRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <AdminRoute>
                  <AdminPanel />
                </AdminRoute>
              }
            />
            <Route
              path="/problems"
              element={
                <AdminRoute>
                  <ProblemList />
                </AdminRoute>
              }
            />
            <Route
              path="/first-face-assignments"
              element={
                <AdminRoute>
                  <FirstFaceAssignment />
                </AdminRoute>
              }
            />
            <Route
              path="/roles"
              element={
                <AdminRoute>
                  <RoleManagement />
                </AdminRoute>
              }
            />

            {/* User-only Routes */}
            <Route
              path="/employee-dashboard"
              element={
                <ProtectedRoute>
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/my-issues"
              element={
                <ProtectedRoute>
                  <MyIssues />
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
            <Route
              path="/domain-status"
              element={
                <ProtectedRoute>
                  <DomainStatus />
                </ProtectedRoute>
              }
            />

            {/* Default redirect based on role */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Navigate
                    to={
                      JSON.parse(localStorage.getItem("current_user"))?.role === "admin"
                        ? "/dashboard"
                        : "/employee-dashboard"
                    }
                    replace
                  />
                </ProtectedRoute>
              }
            />

            {/* Catch-all route */}
            <Route
              path="*"
              element={
                <ProtectedRoute>
                  <Navigate
                    to={
                      JSON.parse(localStorage.getItem("current_user"))?.role === "admin"
                        ? "/dashboard"
                        : "/employee-dashboard"
                    }
                    replace
                  />
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
