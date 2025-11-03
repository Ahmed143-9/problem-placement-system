import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function ProblemForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyNewProblem } = useNotifications();
  const [formData, setFormData] = useState({
    department: '',
    priority: '',
    statement: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get existing problems from localStorage
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      // Create new problem
      const newProblem = {
        id: problems.length + 1,
        ...formData,
        status: 'pending',
        createdBy: user?.name || 'Admin',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        comments: []
      };
      
      // Add to problems array
      problems.push(newProblem);
      
      // Save to localStorage
      localStorage.setItem('problems', JSON.stringify(problems));
      
      // Send notification to admin
      notifyNewProblem(newProblem.id, newProblem.createdBy, newProblem.department);
      
      toast.success('Problem submitted successfully! Admin has been notified.');
      setFormData({ department: '', priority: '', statement: '' });
      
      // Navigate to problems list
      setTimeout(() => {
        navigate('/problems');
      }, 1000);
    } catch (error) {
      toast.error('Failed to submit problem');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div className="container mt-4">
        <div className="card shadow">
          <div className="card-header bg-primary text-white">
            <h3 className="mb-0">Submit a Problem Ticket</h3>
          </div>
          <div className="card-body">
            <div className="alert alert-info">
              <strong>Note:</strong> When you submit this problem, the admin will be notified immediately. 🔔
            </div>
            
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Department *</label>
                <select
                  className="form-control"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Department</option>
                  <option value="Tech">Tech</option>
                  <option value="Business">Business</option>
                  <option value="Accounts">Accounts</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Priority *</label>
                <select
                  className="form-control"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low - Can wait</option>
                  <option value="Medium">Medium - Important</option>
                  <option value="High">High - Urgent</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Problem Statement *</label>
                <textarea
                  className="form-control"
                  name="statement"
                  rows="5"
                  value={formData.statement}
                  onChange={handleChange}
                  placeholder="Describe the problem in detail...&#10;&#10;Example: The printer on the 2nd floor is not working. It shows 'Paper Jam' error but there's no paper stuck inside."
                  required
                ></textarea>
                <small className="text-muted">
                  Be as detailed as possible to help us understand and solve the problem quickly.
                </small>
              </div>

              <div className="d-flex gap-2">
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2"></span>
                      Submitting...
                    </>
                  ) : (
                    <>
                      📨 Submit Problem
                    </>
                  )}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => navigate(-1)}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Help Section */}
        <div className="card mt-4">
          <div className="card-header bg-light">
            <h5 className="mb-0">💡 Tips for submitting a good problem report</h5>
          </div>
          <div className="card-body">
            <ul>
              <li><strong>Be specific:</strong> Include details like location, device, error messages</li>
              <li><strong>Choose correct priority:</strong> High for urgent issues affecting work</li>
              <li><strong>Include steps:</strong> What you were doing when the problem occurred</li>
              <li><strong>Expected vs Actual:</strong> What should happen vs what's happening</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}