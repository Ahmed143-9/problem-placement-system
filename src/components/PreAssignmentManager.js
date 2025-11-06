import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { FaUsersCog, FaSave, FaUndo } from 'react-icons/fa';

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
      toast.success('Pre-assignments saved successfully!');
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
      toast.success('Pre-assignments reset!');
    }
  };

  const getMemberById = (memberId) => {
    return teamMembers.find(m => m.id === parseInt(memberId));
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
            Save
          </button>
          <button className="btn btn-outline-light btn-sm" onClick={handleReset}>
            <FaUndo className="me-1" />
            Reset
          </button>
        </div>
      </div>

      <div className="card-body">
        <div className="alert alert-info mb-4">
          <strong>ℹ️ How it works:</strong> When a new problem is created in a department, 
          it will automatically be assigned to the selected member with status "In Progress" 
          instead of "Pending".
        </div>

        <div className="row g-4">
          {Object.keys(preAssignments).map(department => (
            <div key={department} className="col-md-4">
              <div className="card border-primary">
                <div className="card-body">
                  <h5 className="card-title text-primary mb-3">{department}</h5>
                  
                  <div className="mb-3">
                    <label className="form-label fw-semibold">Assign to:</label>
                    <select
                      className="form-control"
                      value={preAssignments[department]}
                      onChange={(e) => handleAssignmentChange(department, e.target.value)}
                    >
                      <option value="">-- Not Pre-assigned --</option>
                      {teamMembers
                        .filter(m => m.department === department)
                        .map(member => (
                          <option key={member.id} value={member.id}>
                            {member.name} ({member.role === 'team_leader' ? 'Team Leader' : 'User'})
                          </option>
                        ))}
                    </select>
                    
                    {teamMembers.filter(m => m.department === department).length === 0 && (
                      <small className="text-danger d-block mt-2">
                        No team members available in this department
                      </small>
                    )}
                  </div>

                  {preAssignments[department] && getMemberById(preAssignments[department]) && (
                    <div className="alert alert-success mb-0">
                      <small>
                        <strong>✓ Pre-assigned to:</strong><br />
                        {getMemberById(preAssignments[department])?.name}
                      </small>
                    </div>
                  )}

                  {!preAssignments[department] && (
                    <div className="alert alert-warning mb-0">
                      <small>
                        <strong>⚠ Not pre-assigned</strong><br />
                        New problems will be "Pending"
                      </small>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <h6 className="mb-3">Current Status:</h6>
          <div className="table-responsive">
            <table className="table table-sm table-bordered">
              <thead className="table-light">
                <tr>
                  <th>Department</th>
                  <th>Pre-assigned Member</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(preAssignments).map(([dept, memberId]) => (
                  <tr key={dept}>
                    <td className="fw-semibold">{dept}</td>
                    <td>
                      {memberId && getMemberById(memberId) ? (
                        <span className="badge bg-success">
                          {getMemberById(memberId)?.name}
                        </span>
                      ) : (
                        <span className="badge bg-secondary">Not Assigned</span>
                      )}
                    </td>
                    <td>
                      {memberId ? (
                        <span className="text-success">
                          ✓ Auto-assign enabled (In Progress)
                        </span>
                      ) : (
                        <span className="text-warning">
                          ⚠ Manual assignment (Pending)
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}