import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const SERVICES = [
  'Bulk SMS',
  'Topup',
  'Whatsapp Solution',
  'Email Solution',
  'Push-Pull',
  'Games',
  'DCB',
  'Emergency Balance Service',
  'International SMS',
  'Invoice Solution',
  'Campaign',
  'Web Solution'
];

export default function ProblemForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notifyNewProblem } = useNotifications();
  const [formData, setFormData] = useState({
    department: '',
    service: '',
    priority: '',
    statement: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length + previewImages.length > 5) {
      toast.warning('Maximum 5 images allowed');
      return;
    }

    const newPreviews = [];
    const promises = files.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          newPreviews.push({
            url: reader.result,
            name: file.name,
            type: file.type
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then(() => {
      setPreviewImages([...previewImages, ...newPreviews]);
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newPreviews]
      }));
    });
  };

  const removeImage = (index) => {
    setPreviewImages(previewImages.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      const newProblem = {
        id: problems.length + 1,
        ...formData,
        status: 'pending',
        createdBy: user?.name || 'Admin',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        comments: [],
        actionHistory: [{
          action: 'Problem Created',
          by: user?.name,
          timestamp: new Date().toISOString(),
          comment: 'Problem ticket submitted'
        }]
      };
      
      problems.push(newProblem);
      localStorage.setItem('problems', JSON.stringify(problems));
      
      notifyNewProblem(newProblem.id, newProblem.createdBy, `${formData.department} - ${formData.service}`);
      
      toast.success('Problem submitted successfully! Admin has been notified.');
      setFormData({ department: '', service: '', priority: '', statement: '', images: [] });
      setPreviewImages([]);
      
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
            <small>Please provide detailed information about the issue</small>
          </div>
          <div className="card-body">
            <form onSubmit={handleSubmit}>
              {/* Department */}
              <div className="mb-3">
                <label className="form-label">Department <span className="text-danger">*</span></label>
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

              {/* Service - NEW */}
              <div className="mb-3">
                <label className="form-label">Service <span className="text-danger">*</span></label>
                <select
                  className="form-control"
                  name="service"
                  value={formData.service}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Service</option>
                  {SERVICES.map(service => (
                    <option key={service} value={service}>{service}</option>
                  ))}
                </select>
                <small className="text-muted">Select the service related to this problem</small>
              </div>

              {/* Priority */}
              <div className="mb-3">
                <label className="form-label">Priority <span className="text-danger">*</span></label>
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

              {/* Problem Statement */}
              <div className="mb-3">
                <label className="form-label">Problem Statement <span className="text-danger">*</span></label>
                <textarea
                  className="form-control"
                  name="statement"
                  rows="5"
                  value={formData.statement}
                  onChange={handleChange}
                  placeholder="Describe the problem in detail...&#10;&#10;Example: The Bulk SMS service is not delivering messages to Banglalink numbers."
                  required
                ></textarea>
              </div>

              {/* Image Upload - NEW */}
              <div className="mb-3">
                <label className="form-label">Upload Screenshots (Optional)</label>
                <input
                  type="file"
                  className="form-control"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  disabled={previewImages.length >= 5}
                />
                <small className="text-muted">Upload up to 5 images (screenshots, error messages, etc.)</small>
                
                {previewImages.length > 0 && (
                  <div className="row mt-3">
                    {previewImages.map((img, index) => (
                      <div key={index} className="col-md-4 col-6 mb-3">
                        <div className="position-relative border rounded">
                          <img 
                            src={img.url} 
                            alt={img.name}
                            style={{ width: '100%', height: '150px', objectFit: 'cover' }}
                          />
                          <button
                            type="button"
                            className="btn btn-danger btn-sm position-absolute"
                            style={{ top: '5px', right: '5px' }}
                            onClick={() => removeImage(index)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="d-flex gap-2">
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Submitting...' : '📮 Submit Problem'}
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}