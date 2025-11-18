// src/components/PreAssignmentManager.js
import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUsersCog, FaSave, FaUndo, FaUserCheck, FaUserTimes } from 'react-icons/fa';

export default function PreAssignmentManager() {
  const [preAssignments, setPreAssignments] = useState({
    'IT & Innovation': '',
    'Business': '',
    'Accounts': ''
  });
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPreAssignments();
    loadTeamMembers();
  }, []);

  const loadPreAssignments = () => {
    try {
      const stored = localStorage.getItem('pre_assignments');
      if (stored) {
        setPreAssignments(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load pre-assignments:', error);
    }
  };

  const loadTeamMembers = () => {
    try {
      const users = JSON.parse(localStorage.getItem('system_users') || '[]');
      const activeMembers = users.filter(u => 
        u.status === 'active' && u.username !== 'Admin'
      );
      setTeamMembers(activeMembers);
    } catch (error) {
      console.error('Failed to load team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignmentChange = (department, memberId) => {
    setPreAssignments(prev => ({
      ...prev,
      [department]: memberId
    }));
  };

  const handleSave = () => {
    try {
      localStorage.setItem('pre_assignments', JSON.stringify(preAssignments));
      
      // Show assignment summary
      const assignedCount = Object.values(preAssignments).filter(id => id !== '').length;
      toast.success(`Pre-assignments saved! ${assignedCount} department(s) configured.`);
    } catch (error) {
      toast.error('Failed to save pre-assignments');
      console.error(error);
    }
  };

  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset all pre-assignments?')) {
      const resetAssignments = {
        'IT & Innovation': '',
        'Business': '',
        'Accounts': ''
      };
      setPreAssignments(resetAssignments);
      localStorage.setItem('pre_assignments', JSON.stringify(resetAssignments));
      toast.info('All pre-assignments have been reset.');
    }
  };

  const handleResetDepartment = (department) => {
    setPreAssignments(prev => ({
      ...prev,
      [department]: ''
    }));
  };

  const getMemberById = (memberId) => {
    return teamMembers.find(m => m.id === parseInt(memberId));
  };

  const getDepartmentMembers = (department) => {
    return teamMembers.filter(m => m.department === department);
  };

  if (loading) {
    return (
      <div className="text-center py-5">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="card shadow-sm border-0 mb-4">
      <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
        <div>
          <h4 className="mb-0">
            <FaUsersCog className="me-2" />
            Department Pre-Assignment
          </h4>
          <small>Auto-assign new problems to specific members by department</small>
        </div>
        <div className="d-flex gap-2">
          <button className="btn btn-light btn-sm" onClick={handleSave}>
            <FaSave className="me-1" />
            Save All
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={handleReset}>
            <FaUndo className="me-1" />
            Reset All
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="alert alert-info mb-4">
          <strong>ℹ️ Priority System:</strong> 
          <ul className="mb-0 mt-2">
            <li><strong>Pre-Assignment (High Priority):</strong> Auto-assigns to specific member, status "In Progress"</li>
            <li><strong>First Face Assignment (Medium Priority):</strong> Auto-assigns to user by name, status "Assigned"</li>
            <li><strong>No Assignment:</strong> Status "Pending", manual assignment required</li>
          </ul>
        </div>

        <div className="row g-4">
          {Object.keys(preAssignments).map(department => {
            const departmentMembers = getDepartmentMembers(department);
            const assignedMember = getMemberById(preAssignments[department]);
            
            return (
              <div key={department} className="col-md-4">
                <div className={`card h-100 ${assignedMember ? 'border-success' : 'border-secondary'}`}>
                  <div className="card-header bg-light d-flex justify-content-between align-items-center">
                    <h6 className="mb-0 text-primary">{department}</h6>
                    {assignedMember && (
                      <button 
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => handleResetDepartment(department)}
                        title="Clear assignment"
                      >
                        <FaUserTimes />
                      </button>
                    )}
                  </div>
                  
                  <div className="card-body">
                    <div className="mb-3">
                      <label className="form-label fw-semibold">Assign to Team Member:</label>
                      <select
                        className="form-select"
                        value={preAssignments[department]}
                        onChange={(e) => handleAssignmentChange(department, e.target.value)}
                      >
                        <option value="">-- Not Pre-assigned --</option>
                        {departmentMembers.map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role === 'team_leader' ? 'Team Leader' : 'User'})
                          </option>
                        ))}
                      </select>
                      
                      {departmentMembers.length === 0 && (
                        <small className="text-danger d-block mt-2">
                          No active team members in this department
                        </small>
                      )}
                    </div>

                    {assignedMember ? (
                      <div className="alert alert-success mb-0">
                        <div className="d-flex align-items-center">
                          <FaUserCheck className="me-2 text-success" />
                          <div>
                            <strong className="d-block">✓ Pre-assigned to:</strong>
                            <small>
                              {assignedMember.name} 
                              ({assignedMember.role === 'team_leader' ? 'Team Leader' : 'User'})
                            </small>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="alert alert-warning mb-0">
                        <div className="d-flex align-items-center">
                          <FaUserTimes className="me-2 text-warning" />
                          <div>
                            <strong className="d-block">⚠ Not pre-assigned</strong>
                            <small>Will use First Face assignment or remain pending</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Current Status Table */}
        <div className="mt-4 pt-4 border-top">
          <h6 className="mb-3">
            <FaUsersCog className="me-2" />
            Current Pre-Assignment Status
          </h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered table-hover">
              <thead className="table-light">
                <tr>
                  <th>Department</th>
                  <th>Pre-assigned Member</th>
                  <th>Member Role</th>
                  <th>Auto-Assign Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(preAssignments).map(([dept, memberId]) => {
                  const member = getMemberById(memberId);
                  return (
                    <tr key={dept}>
                      <td className="fw-semibold">{dept}</td>
                      <td>
                        {member ? (
                          <span className="badge bg-success">
                            {member.name}
                          </span>
                        ) : (
                          <span className="badge bg-secondary">Not Pre-assigned</span>
                        )}
                      </td>
                      <td>
                        {member ? (
                          <span className={`badge ${member.role === 'team_leader' ? 'bg-primary' : 'bg-info'}`}>
                            {member.role === 'team_leader' ? 'Team Leader' : 'User'}
                          </span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        {member ? (
                          <span className="text-success">
                            <FaUserCheck className="me-1" />
                            ✓ Auto-assign to member (In Progress)
                          </span>
                        ) : (
                          <span className="text-warning">
                            <FaUserTimes className="me-1" />
                            ⚠ Will check First Face assignment
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}