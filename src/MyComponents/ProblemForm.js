import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaHome, FaPlusCircle, FaFileAlt, FaChevronLeft, FaChevronRight, FaExclamationTriangle } from 'react-icons/fa';

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

  // ✅ FIXED: Auto Assignment to First Face
  const getAutoAssignedUser = (department) => {
    try {
      console.log('🔄 Checking First Face assignments for department:', department);
      
      // First, check localStorage for First Face assignments
      const firstFaceAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      console.log('📋 First Face assignments from localStorage:', firstFaceAssignments);
      
      // Also check system_users for active First Face assignments
      const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      console.log('👥 System users:', systemUsers);

      // Check for department-specific first face
      const deptFirstFace = firstFaceAssignments.find(ff => 
        ff.department === department && ff.isActive === true
      );
      
      // Check for global first face (all departments)
      const globalFirstFace = firstFaceAssignments.find(ff => 
        ff.department === 'all' && ff.isActive === true
      );

      console.log('🔍 Department First Face:', deptFirstFace);
      console.log('🌍 Global First Face:', globalFirstFace);

      let assignedUser = null;

      if (deptFirstFace) {
        // Find user details from system_users
        const userDetails = systemUsers.find(u => u.id === deptFirstFace.userId || u.name === deptFirstFace.userName);
        assignedUser = {
          userId: deptFirstFace.userId,
          userName: userDetails ? userDetails.name : deptFirstFace.userName,
          type: 'FIRST_FACE_DEPARTMENT'
        };
      } else if (globalFirstFace) {
        // Find user details from system_users
        const userDetails = systemUsers.find(u => u.id === globalFirstFace.userId || u.name === globalFirstFace.userName);
        assignedUser = {
          userId: globalFirstFace.userId,
          userName: userDetails ? userDetails.name : globalFirstFace.userName,
          type: 'FIRST_FACE_GLOBAL'
        };
      }

      console.log('✅ Auto assigned user:', assignedUser);
      return assignedUser;
      
    } catch (error) {
      console.error('❌ Error in auto assignment:', error);
      return null;
    }
  };

  // ✅ FIXED: handleSubmit function with proper auto-assignment
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.department || !formData.service || !formData.priority || !formData.statement.trim()) {
        toast.error('Please fill all required fields');
        setLoading(false);
        return;
      }

      console.log('🔄 Starting problem creation...');

      // Auto assignment logic
      const autoAssignedUser = getAutoAssignedUser(formData.department);
      
      // Extract only image URLs
      const imageUrls = formData.images && formData.images.length > 0 
        ? formData.images.map(img => img.url) 
        : [];

      // Create new problem object
      const newProblem = {
        id: Date.now(),
        ...formData,
        images: imageUrls,
        status: autoAssignedUser ? 'assigned' : 'pending',
        createdBy: user?.name || 'Unknown User',
        assignedTo: autoAssignedUser ? autoAssignedUser.userId : null,
        assignedToName: autoAssignedUser ? autoAssignedUser.userName : null,
        assignmentType: autoAssignedUser ? autoAssignedUser.type : 'NOT_ASSIGNED',
        createdAt: new Date().toISOString(),
        comments: [],
        transferHistory: [],
        actionHistory: [{
          action: 'Problem Created',
          by: user?.name || 'Unknown User',
          timestamp: new Date().toISOString(),
          comment: 'Problem ticket submitted'
        }],
        ...(autoAssignedUser && {
          assignmentHistory: [{
            assignedTo: autoAssignedUser.userId,
            assignedToName: autoAssignedUser.userName,
            assignedBy: 'System (First Face)',
            assignedAt: new Date().toISOString(),
            type: autoAssignedUser.type
          }]
        })
      };

      console.log('📝 New problem data:', newProblem);

      // Save to localStorage
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      problems.push(newProblem);
      localStorage.setItem('problems', JSON.stringify(problems));

      console.log('💾 Problem saved to localStorage');

      // Show success message with assignment info
      if (autoAssignedUser) {
        toast.success(`Problem submitted successfully! Auto-assigned to ${autoAssignedUser.userName} (First Face)`);
      } else {
        toast.success('Problem submitted successfully! Will be assigned manually.');
      }
      
      // Reset form
      setFormData({ department: '', service: '', priority: '', statement: '', client: '', images: [] });
      setPreviewImages([]);
      
      // Redirect
      setTimeout(() => {
        if (user?.role === 'admin' || user?.role === 'team_leader') {
          navigate('/problems');
        } else {
          navigate('/employee-dashboard');
        }
      }, 1000);
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      toast.error(error.message || 'Failed to submit problem');
    } finally {
      setLoading(false);
    }
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const getDashboardPath = () => {
    if (user?.role === 'admin' || user?.role === 'team_leader') {
      return '/dashboard';
    } else {
      return '/employee-dashboard';
    }
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
                  to={getDashboardPath()}
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  title="Dashboard"
                >
                  <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                </Link>
              </li>
              <li className="nav-item mb-2">
                <Link 
                  to="/problem/create" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Create Problem"
                >
                  <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                </Link>
              </li>
              
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/problems" 
                    className="nav-link text-white rounded d-flex align-items-center"
                    style={{ transition: 'all 0.2s ease' }}
                    onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                    onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                    title="All Problems"
                  >
                    <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                </Link>
                </li>
              )}
              
              <li className="nav-item mb-2">
                <Link 
                  to="/reports" 
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>
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
                        Submit Problem Ticket
                      </h4>
                      <small className="opacity-75">Please provide detailed information about the issue</small>
                    </div>
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
                            Submit Problem
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary px-4"
                        onClick={() => navigate(-1)}
                      >
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