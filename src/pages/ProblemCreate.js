import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function ProblemCreate() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    statement: '',
    department: '',
    priority: 'Medium',
    description: ''
  });

  const handleInputChange = e => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // 🔥 AUTO FIRST FACE ASSIGNMENT FUNCTION
  const handleSaveProblem = () => {
    if (!formData.statement || !formData.department || !formData.priority) {
      toast.error('Please fill all required fields');
      return;
    }

    try {
      // AUTO FIRST FACE ASSIGNMENT
      const firstFaceAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      let autoAssignedTo = '';
      
      // Check for specific department first face
      const deptFirstFace = firstFaceAssignments.find(ff => 
        ff.department === formData.department
      );
      
      // Check for all department first face (if no specific found)
      const allDeptFirstFace = firstFaceAssignments.find(ff => ff.department === 'all');
      
      if (deptFirstFace) {
        autoAssignedTo = deptFirstFace.userName;
      } else if (allDeptFirstFace) {
        autoAssignedTo = allDeptFirstFace.userName;
      }

      const newProblem = {
        id: Date.now(),
        ...formData,
        assignedTo: autoAssignedTo, // Auto assigned if first face exists
        status: autoAssignedTo ? 'in_progress' : 'pending',
        createdAt: new Date().toISOString(),
        createdBy: user?.name || 'User',
        assignmentHistory: autoAssignedTo ? [{
          assignedTo: autoAssignedTo,
          assignedBy: 'System (First Face)',
          assignedAt: new Date().toISOString(),
          type: 'auto_first_face'
        }] : []
      };

      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      storedProblems.push(newProblem);
      localStorage.setItem('problems', JSON.stringify(storedProblems));

      // Show assignment message
      if (autoAssignedTo) {
        toast.success(`Problem created and automatically assigned to ${autoAssignedTo} (First Face)!`);
      } else {
        toast.success('Problem created! Will be assigned manually.');
      }

      navigate('/problems');
    } catch (error) {
      toast.error('Failed to create problem');
      console.error(error);
    }
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="flex-grow-1 p-4">
        <div className="card shadow border-0 mx-auto" style={{ maxWidth: '600px' }}>
          <div className="card-header bg-primary text-white py-3">
            <h4 className="mb-1 fw-semibold text-center">
              Create New Problem
            </h4>
            <small className="opacity-75 text-center d-block">
              Fill in the problem details below
            </small>
          </div>
          
          <div className="card-body p-4">
            <div className="mb-3">
              <label className="form-label fw-semibold">Problem Statement *</label>
              <textarea
                className="form-control"
                name="statement"
                value={formData.statement}
                onChange={handleInputChange}
                placeholder="Describe the problem..."
                rows="4"
                required
              />
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Department *</label>
              <select
                className="form-control"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                required
              >
                <option value="">Select Department</option>
                <option value="IT & Innovation">IT & Innovation</option>
                <option value="Business">Business</option>
                <option value="Accounts">Accounts</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label fw-semibold">Priority *</label>
              <select
                className="form-control"
                name="priority"
                value={formData.priority}
                onChange={handleInputChange}
                required
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>

            <div className="mb-4">
              <label className="form-label fw-semibold">Additional Description</label>
              <textarea
                className="form-control"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Any additional details..."
                rows="3"
              />
            </div>

            <div className="d-flex gap-2">
              <button
                className="btn btn-primary flex-grow-1"
                onClick={handleSaveProblem}
              >
                Create Problem
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => navigate('/problems')}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}