// src/components/FirstFaceAssignment.js - Updated with new API
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from './Navbar';
import { FaTrash, FaPlus, FaInfoCircle, FaExclamationTriangle, FaSync, FaUsers } from 'react-icons/fa';
import { firstFaceAPI, userAPI } from '../utils/api';

export default function FirstFaceAssignment() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    department: '',
    user_id: '',
    type: 'specific'
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Load existing assignments and team members
  useEffect(() => {
    loadAssignments();
    loadTeamMembers();
  }, []);

  const loadAssignments = async () => {
    setLoading(true);
    try {
      const result = await firstFaceAPI.getAssignments();
      setAssignments(result.data);
      // Also save to localStorage for auto-assignment logic
      localStorage.setItem('firstFace_assignments', JSON.stringify(result.data));
      console.log('Assignments loaded:', result.data);
    } catch (error) {
      console.error('❌ Error loading assignments:', error);
      // Fallback to localStorage
      try {
        const savedAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
        setAssignments(savedAssignments);
        toast.info('Using local assignments data');
      } catch (localError) {
        console.error('❌ Local storage error:', localError);
        toast.error('Failed to load assignments');
      }
    } finally {
      setLoading(false);
    }
  };

  const loadTeamMembers = async () => {
    try {
      const result = await userAPI.getActiveUsers();
      setTeamMembers(result.activeUsers);
      localStorage.setItem('system_users', JSON.stringify(result.activeUsers));
    } catch (error) {
      console.error('❌ Error loading team members:', error);
      // Fallback to localStorage
      try {
        const users = JSON.parse(localStorage.getItem('system_users') || '[]');
        const activeMembers = users.filter(u => u.status === 'active');
        setTeamMembers(activeMembers);
      } catch (localError) {
        console.error('❌ Local storage error:', localError);
        toast.error('Failed to load team members');
      }
    }
  };

  const handleAddAssignment = async () => {
    if (!newAssignment.department || !newAssignment.user_id) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const result = await firstFaceAPI.createAssignment(newAssignment);
      toast.success(`First Face assignment added for ${newAssignment.department}!`);
      await loadAssignments(); // Refresh the list
      setNewAssignment({ department: '', user_id: '', type: 'specific' });
    } catch (error) {
      console.error('❌ Error creating assignment:', error);
      // Fallback to localStorage
      try {
        // Find the selected user
        const users = JSON.parse(localStorage.getItem('system_users') || '[]');
        const userToAssign = users.find(u => u.id == newAssignment.user_id);
        
        if (!userToAssign) {
          throw new Error('Selected user not found');
        }

        // Create assignment object
        const assignment = {
          id: Date.now(), // Simple ID generation
          userId: newAssignment.user_id,
          userName: userToAssign.name,
          department: newAssignment.department,
          type: newAssignment.type,
          assignedAt: new Date().toISOString(),
          assignedBy: 'System (Local)',
          isActive: true
        };

        // Get existing assignments from localStorage
        const existingAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
        
        // Add new assignment
        const updatedAssignments = [...existingAssignments, assignment];
        
        // Save to localStorage
        localStorage.setItem('firstFace_assignments', JSON.stringify(updatedAssignments));
        
        // Update state
        setAssignments(updatedAssignments);
        
        // Reset form
        setNewAssignment({ department: '', user_id: '', type: 'specific' });
        
        toast.success(`First Face assignment added for ${newAssignment.department}!`);
      } catch (localError) {
        console.error('❌ Local storage error:', localError);
        toast.error(localError.message || 'Failed to create assignment');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    if (!window.confirm('Are you sure you want to remove this assignment?')) {
      return;
    }

    try {
      await firstFaceAPI.deleteAssignment(assignmentId);
      toast.success('First Face assignment removed!');
      await loadAssignments(); // Refresh the list
    } catch (error) {
      console.error('❌ Error removing assignment:', error);
      // Fallback to localStorage
      try {
        // Get existing assignments from localStorage
        const existingAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
        
        // Filter out the assignment to remove
        const updatedAssignments = existingAssignments.filter(assignment => assignment.id !== assignmentId);
        
        // Save to localStorage
        localStorage.setItem('firstFace_assignments', JSON.stringify(updatedAssignments));
        
        // Update state
        setAssignments(updatedAssignments);
        
        toast.success('First Face assignment removed!');
      } catch (localError) {
        console.error('❌ Local storage error:', localError);
        toast.error(localError.message || 'Failed to remove assignment');
      }
    }
  };

  const syncWithLaravel = async () => {
    setSyncing(true);
    try {
      await loadAssignments();
      toast.success('Assignments synced with server!');
    } catch (error) {
      // Even if API fails, we still have localStorage data
      toast.info('Using local data. API sync failed.');
    } finally {
      setSyncing(false);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <div>
        <Navbar />
        <div className="container mt-4">
          <div className="alert alert-danger">
            <h4>Access Denied</h4>
            <p>You do not have permission to access this page. Admin access required.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="card shadow-sm">
          <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
            <div>
              <h4 className="mb-1">
                <FaUsers className="me-2" />
                First Face Assignments
              </h4>
              <small>Assign users who will automatically get problems from specific departments</small>
            </div>
            <button 
              className="btn btn-light btn-sm"
              onClick={syncWithLaravel}
              disabled={syncing}
            >
              <FaSync className={syncing ? 'fa-spin me-1' : 'me-1'} />
              {syncing ? 'Syncing...' : 'Sync'}
            </button>
          </div>

          <div className="card-body">
            {/* Add New Assignment */}
            <div className="card mb-4">
              <div className="card-header bg-light">
                <h6 className="mb-0">Add New First Face Assignment</h6>
              </div>
              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-4">
                    <label className="form-label">Department</label>
                    <select 
                        className="form-select"
                        value={newAssignment.department}
                        onChange={(e) => setNewAssignment({...newAssignment, department: e.target.value})}
                      >
                        <option value="">Select Department</option>
                        <option value="Enterprise Business Solutions">Enterprise Business Solutions</option>
                        <option value="Board Management">Board Management</option>
                        <option value="Support Stuff">Support Stuff</option>
                        <option value="Administration and Human Resources">Administration and Human Resources</option>
                        <option value="Finance and Accounts">Finance and Accounts</option>
                        <option value="Business Dev and Operations">Business Dev and Operations</option>
                        <option value="Implementation and Support">Implementation and Support</option>
                        <option value="Technical and Networking Department">Technical and Networking Department</option>
                        <option value="all">All Departments</option>
                      </select>
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">Assign to User</label>
                    <select
                      className="form-select"
                      value={newAssignment.user_id}
                      onChange={(e) => setNewAssignment({...newAssignment, user_id: e.target.value})}
                    >
                      <option value="">Select User</option>
                      {teamMembers.map(member => (
                        <option key={member.id} value={member.id}>
                          {member.name} ({member.department}) - {member.role}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="col-md-4">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={newAssignment.type}
                      onChange={(e) => setNewAssignment({...newAssignment, type: e.target.value})}
                    >
                      <option value="specific">Department Specific</option>
                      <option value="all">All Departments</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-3">
                  <button 
                    className="btn btn-success"
                    onClick={handleAddAssignment}
                    disabled={loading || !newAssignment.department || !newAssignment.user_id}
                  >
                    <FaPlus className="me-1" />
                    {loading ? 'Adding...' : 'Add Assignment'}
                  </button>
                </div>
              </div>
            </div>

            {/* Current Assignments */}
            <div className="card">
              <div className="card-header bg-light d-flex justify-content-between align-items-center">
                <h6 className="mb-0">Current First Face Assignments</h6>
                <span className="badge bg-primary">{assignments.length} active</span>
              </div>
              
              <div className="card-body">
                {loading ? (
                  <div className="text-center py-4">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : assignments.length === 0 ? (
                  <div className="alert alert-info text-center">
                    <FaInfoCircle className="me-2" />
                    No First Face assignments configured.
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-striped table-hover">
                      <thead className="table-dark">
                        <tr>
                          <th>Department</th>
                          <th>Assigned User</th>
                          <th>Type</th>
                          <th>Assigned By</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {assignments.map((assignment) => (
                          <tr key={assignment.id}>
                            <td>
                                <strong>
                                  {assignment.department === 'all' 
                                    ? 'All Departments' 
                                    : assignment.department
                                  }
                                </strong>
                                {assignment.department === 'all' && (
                                  <div>
                                    <small className="text-warning">(Fallback for all departments)</small>
                                  </div>
                                )}
                              </td>
                            <td>
                              <span className="badge bg-info fs-6">
                                {assignment.userName}
                              </span>
                            </td>
                            <td>
                              {assignment.type === 'all' ? (
                                <span className="badge bg-warning">All Departments</span>
                              ) : (
                                <span className="badge bg-primary">Specific</span>
                              )}
                            </td>
                            <td>
                              <small>{assignment.assigned_by}</small>
                              <br />
                              <small className="text-muted">
                                {new Date(assignment.assignedAt).toLocaleDateString()}
                              </small>
                            </td>
                            <td>
                              <button
                                className="btn btn-danger btn-sm"
                                onClick={() => handleRemoveAssignment(assignment.id)}
                                title="Remove assignment"
                              >
                                <FaTrash className="me-1" />
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Information */}
            <div className="alert alert-warning mt-4">
              <FaExclamationTriangle className="me-2" />
              <strong>How it works:</strong> When a problem is submitted, system will automatically 
              assign it to the First Face user based on department. "All Departments" assignment 
              works as a fallback when no specific department assignment exists.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

  