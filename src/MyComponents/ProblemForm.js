import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';


export default function ProblemForm() {
  const navigate = useNavigate();
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
        createdBy: 'Admin',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        comments: []
      };
      
      // Add to problems array
      problems.push(newProblem);
      
      // Save to localStorage
      localStorage.setItem('problems', JSON.stringify(problems));
      
      toast.success('Problem submitted successfully!');
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
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label className="form-label">Department</label>
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
                <label className="form-label">Priority</label>
                <select
                  className="form-control"
                  name="priority"
                  value={formData.priority}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Priority</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label">Problem Statement</label>
                <textarea
                  className="form-control"
                  name="statement"
                  rows="5"
                  value={formData.statement}
                  onChange={handleChange}
                  placeholder="Describe the problem in detail..."
                  required
                ></textarea>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Problem'}
              </button>
              <button 
                type="button" 
                className="btn btn-secondary ms-2"
                onClick={() => navigate('/dashboard')}
              >
                Cancel
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}