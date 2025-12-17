// src/pages/EmployeeDashboard.js

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaTasks, FaClipboardList, FaCheckCircle, FaSpinner } from 'react-icons/fa';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

export default function EmployeeDashboard() {
  const { user } = useAuth();

  const [assignedProblems, setAssignedProblems] = useState([]);
  const [myCreatedProblems, setMyCreatedProblems] = useState([]);
  const [loadingAssigned, setLoadingAssigned] = useState(false);
  const [loadingCreated, setLoadingCreated] = useState(false);

  /* ==============================
     Fetch problems assigned to me
     ============================== */
  const loadAssignedProblems = async () => {
    if (!user?.id) return;

    setLoadingAssigned(true);
    try {
      const res = await fetch(
        'https://ticketapi.wineds.com/api/problems/assigned-by-user',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      const data = await res.json();

      if (data.status === 'success') {
        setAssignedProblems(data.data || []);
      } else {
        toast.error(data.messages?.[0] || 'Failed to load assigned problems');
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load assigned problems');
    } finally {
      setLoadingAssigned(false);
    }
  };

  /* ==============================
     Fetch problems created by me
     ============================== */
const loadMyCreatedProblems = async () => {
  if (!user?.id) return;

  setLoadingCreated(true);
  try {
    const res = await fetch(
      'https://ticketapi.wineds.com/api/problems/getAll',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      }
    );

    const data = await res.json();

    if (data.status === 'success') {
      const mine = data.data.filter((p) => p.created_by.id === user.id);
      setMyCreatedProblems(mine);
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoadingCreated(false);
  }
};


  /* ==============================
     Load on mount
     ============================== */
  useEffect(() => {
    loadAssignedProblems();
    loadMyCreatedProblems();
  }, [user?.id]);

  return (
    <div>
      <Navbar />

      <div className="container mt-4">
        <h3 className="mb-3">Welcome, {user?.name}</h3>

        {/* ===================== STATS ===================== */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm text-center">
              <div className="card-body">
                <FaClipboardList size={30} />
                <h4 className="mt-2">{myCreatedProblems.length}</h4>
                <p className="mb-0">My Created Problems</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm text-center">
              <div className="card-body">
                <FaTasks size={30} />
                <h4 className="mt-2">{assignedProblems.length}</h4>
                <p className="mb-0">Assigned To Me</p>
              </div>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card shadow-sm text-center">
              <div className="card-body">
                <FaCheckCircle size={30} />
                <h4 className="mt-2">
                  {assignedProblems.filter(p => p.status === 'resolved').length}
                </h4>
                <p className="mb-0">Resolved</p>
              </div>
            </div>
          </div>
        </div>

        {/* ===================== CONTENT ===================== */}
        <div className="row">
          {/* -------- CREATED BY ME -------- */}
          <div className="col-md-6 mb-4">
            <div className="card shadow">
              <div className="card-header bg-primary text-white">
                My Created Problems
              </div>
              <div className="card-body">
                {loadingCreated ? (
                  <FaSpinner className="fa-spin" />
                ) : myCreatedProblems.length === 0 ? (
                  <p className="text-muted">No problems created yet</p>
                ) : (
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Department</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myCreatedProblems.map((p) => (
                        <tr key={p.id}>
                          <td>#{p.id}</td>
                          <td>{p.department}</td>
                          <td>
                            <span className="badge bg-secondary">
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/problem/${p.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>

          {/* -------- ASSIGNED TO ME -------- */}
          <div className="col-md-6 mb-4">
            <div className="card shadow">
              <div className="card-header bg-warning">
                Problems Assigned To Me
              </div>
              <div className="card-body">
                {loadingAssigned ? (
                  <FaSpinner className="fa-spin" />
                ) : assignedProblems.length === 0 ? (
                  <p className="text-muted">No work assigned</p>
                ) : (
                  <table className="table table-sm table-hover">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Department</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {assignedProblems.map((p) => (
                        <tr key={p.id}>
                          <td>#{p.id}</td>
                          <td>{p.department}</td>
                          <td>
                            <span className={`badge ${
                              p.priority === 'High'
                                ? 'bg-danger'
                                : p.priority === 'Medium'
                                ? 'bg-warning'
                                : 'bg-success'
                            }`}>
                              {p.priority}
                            </span>
                          </td>
                          <td>
                            <span className="badge bg-info">
                              {p.status}
                            </span>
                          </td>
                          <td>
                            <Link
                              to={`/problem/${p.id}`}
                              className="btn btn-sm btn-outline-primary"
                            >
                              View
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===================== QUICK ACTION ===================== */}
        <div className="card shadow">
          <div className="card-body text-center">
            <Link to="/problem/create" className="btn btn-success">
              Create New Problem
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
