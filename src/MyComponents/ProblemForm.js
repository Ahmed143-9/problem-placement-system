import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa';

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

export default function ProblemFormFixed() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    department: '',
    service: '',
    priority: '',
    statement: '',
    client: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);

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
        createdBy: 'Current User',
        assignedTo: null,
        createdAt: new Date().toISOString(),
        comments: [],
        actionHistory: [{
          action: 'Problem Created',
          by: 'Current User',
          timestamp: new Date().toISOString(),
          comment: 'Problem ticket submitted'
        }]
      };
      
      problems.push(newProblem);
      localStorage.setItem('problems', JSON.stringify(problems));
      
      toast.success('Problem submitted successfully!');
      setFormData({ department: '', service: '', priority: '', statement: '', client: '', images: [] });
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

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

  return (
    <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
      <Navbar />
      
      <div className="d-flex flex-grow-1">
        {/* Sidebar */}
        <div 
          className="bg-dark text-white position-relative"
          style={{ 
            width: sidebarMinimized ? '70px' : '250px',
            minHeight: '100%',
            transition: 'width 0.3s ease'
          }}
        >
          {/* Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="position-absolute d-flex align-items-center justify-content-center"
            style={{
              top: '10px',
              right: '-12px',
              borderRadius: '50%',
              width: '28px',
              height: '28px',
              backgroundColor: '#fff',
              border: '1px solid #ccc',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
              zIndex: 1000,
              cursor: 'pointer',
            }}
          >
            {sidebarMinimized 
              ? <FaChevronRight size={14} color="#333" /> 
              : <FaChevronLeft size={14} color="#333" />
            }
          </button>

          <div className="p-3">
            {!sidebarMinimized && (
              <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500' }}>
                Navigation
              </h5>
            )}
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <Link 
                  to="/dashboard" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Dashboard"
                >
                  <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problem/create" 
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problems" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="All Problems"
                >
                  <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/admin" 
                    className="nav-link text-white rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="Admin Panel"
                  >
                    <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Admin Panel</span>}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-grow-1 p-4" 
          style={{ 
            overflowY: 'auto',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="row">
            <div className="col-12">
              <div className="card shadow border-0">
                <div className="card-header bg-primary text-white py-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h4 className="mb-1 fw-semibold">
                        <i className="bi bi-ticket-perforated me-2"></i>
                        Submit Problem Ticket
                      </h4>
                      <small className="opacity-75">Please provide detailed information about the issue</small>
                    </div>
                    {/* <button 
                      type="button" 
                      className="btn btn-light btn-sm"
                      onClick={() => navigate(-1)}
                    >
                      <i className="bi bi-arrow-left me-1"></i>
                      Back
                    </button> */}
                  </div>
                </div>
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {/* Department & Service - Side by Side */}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Department <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          name="department"
                          value={formData.department}
                          onChange={handleChange}
                          required
                        >
                          <option value="">Select Department</option>
                          <option value="IT & Innovation">IT & Innovation</option>
                          <option value="Business">Business</option>
                          <option value="Accounts">Accounts</option>
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Service <span className="text-danger">*</span>
                        </label>
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
                      </div>
                    </div>

                    {/* Priority & Client - Side by Side */}
                    <div className="row g-3 mt-2">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Priority <span className="text-danger">*</span>
                        </label>
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

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Client <span className="text-muted">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          placeholder="Enter client name..."
                        />
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div className="mt-3">
                      <label className="form-label fw-semibold">
                        Problem Statement <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="statement"
                        rows="4"
                        value={formData.statement}
                        onChange={handleChange}
                        placeholder="Describe the problem in detail..."
                        required
                        style={{ resize: 'vertical' }}
                      ></textarea>
                    </div>

                    {/* Image Upload */}
                    <div className="mt-3">
                      <label className="form-label fw-semibold">
                        Upload Screenshots <span className="text-muted">(Optional)</span>
                      </label>
                      <input
                        type="file"
                        className="form-control"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        disabled={previewImages.length >= 5}
                      />
                      <small className="text-muted">Maximum 5 images allowed</small>
                      
                      {previewImages.length > 0 && (
                        <div className="row g-2 mt-2">
                          {previewImages.map((img, index) => (
                            <div key={index} className="col-md-3 col-sm-4 col-6">
                              <div className="position-relative border rounded p-1">
                                <img 
                                  src={img.url} 
                                  alt={img.name}
                                  className="img-fluid rounded"
                                  style={{ height: '100px', width: '100%', objectFit: 'cover' }}
                                />
                                <button
                                  type="button"
                                  className="btn btn-danger btn-sm position-absolute"
                                  style={{ top: '5px', right: '5px', width: '24px', height: '24px', padding: 0 }}
                                  onClick={() => removeImage(index)}
                                >
                                  ×
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="d-flex gap-2 mt-4 pt-3 border-top">
                      <button 
                        type="submit" 
                        className="btn btn-primary px-4"
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                            Submitting...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-check me-2"></i>
                            Submit Problem
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary px-4"
                        onClick={() => navigate(-1)}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}