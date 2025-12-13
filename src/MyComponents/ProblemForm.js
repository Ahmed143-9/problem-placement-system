// src/pages/ProblemForm.js - COMPLETE WORKING VERSION WITH BACKEND IMAGE UPLOAD
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  FaHome, FaPlusCircle, FaFileAlt, FaChevronLeft, FaChevronRight, 
  FaExclamationTriangle, FaUserPlus, FaBan, FaSpinner, FaUserTie,
  FaBuilding, FaTag, FaClock, FaUsersCog, FaArrowLeft, FaImage,
  FaTimes, FaUpload, FaCheckCircle, FaInfoCircle
} from 'react-icons/fa';

const SERVICES = [
  'Bulk SMS -> WinText',
  'Topup -> Winfin',
  'Whatsapp Solution -> Infobip <-> Omnichannel channel',
  'Email Solution -> Infobip <-> Omnichannel channel',
  'Push-Pull -> VAS',
  'Games -> VAS',
  'DCB -> VAS',
  'Emergency Balance Service -> platform(Win vantage)',
  'International SMS -> infoBip <--> international channel',
  'Invoice Solution -> Win Vantage (platform)',
  'Campaign -> Customized development',
  'Web Solution -> Customized development',
];

const DEPARTMENTS = [
  'Enterprise Business Solutions',
  'Board Management',
  'Support Stuff',
  'Administration and Human Resources',
  'Finance and Accounts',
  'Business Dev and Operations',
  'Implementation and Support',
  'Technical and Networking Department'
];

export default function ProblemForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    department: '',
    service: '',
    priority: 'Medium',
    statement: '',
    description: '',
    client: '',
    assigned_to: '',
    images: [] // Will store uploaded image URLs from backend
  });

  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showManualAssignment, setShowManualAssignment] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [firstFaceUsers, setFirstFaceUsers] = useState([]);

  useEffect(() => {
    loadTeamMembers();
    // Auto-select user's department if available
    if (user?.department && !formData.department) {
      setFormData(prev => ({ ...prev, department: user.department }));
    }
  }, [user]);

  // Load team members from backend API (EXCLUDING CURRENT USER)
  const loadTeamMembers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/getAllUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'success') {
          // Filter active users (excluding current user)
          const activeUsers = data.data.filter(u => 
            u.status === 'active' && u.id !== user?.id
          );
          setTeamMembers(activeUsers);
          console.log('👥 Team members loaded (excluding self):', activeUsers.length);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load team members:', error);
      toast.error('Failed to load team members');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  // ✅ WORKING: Upload images to backend API immediately when selected
 // ✅ ENHANCED: handleImageUpload with prefix and better error handling
// ✅ FIXED: handleImageUpload with proper state updates
const handleImageUpload = async (e) => {
  const files = Array.from(e.target.files);
  
  if (files.length === 0) return;
  
  // Check total images limit
  if (files.length + previewImages.length > 5) {
    toast.warning('Maximum 5 images allowed');
    e.target.value = '';
    return;
  }
  
  setUploadingImages(true);
  const token = localStorage.getItem('token');
  
  // Process files sequentially to avoid state conflicts
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.warning(`${file.name} is not an image file`);
      continue;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.warning(`${file.name} exceeds 5MB limit`);
      continue;
    }

    // Create temporary preview
    const previewUrl = URL.createObjectURL(file);
    const tempPreview = {
      url: previewUrl,
      name: file.name,
      uploading: true,
      originalName: file.name,
      index: i
    };
    
    // Add temporary preview
    setPreviewImages(prev => [...prev, tempPreview]);

    // Prepare FormData
    const uploadData = new FormData();
    uploadData.append('file', file);
    
    // Extract filename
    const originalFileName = file.name;
    const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
    const fileExtension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1);
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const uniqueFileName = `${fileNameWithoutExt}_${timestamp}_${randomString}.${fileExtension}`;
    
    uploadData.append('file_path', 'uploads/modules/general');
    uploadData.append('file_name', uniqueFileName);

    try {
      console.log('📤 Uploading image:', file.name);
      
      const response = await fetch('http://localhost:8000/api/v1/general/file/file-upload', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: uploadData
      });

      const data = await response.json();
      console.log('📥 Upload response:', data);
      
      if (data.status === 'success') {
        // ✅ FIXED: Construct proper URL from file_path
        let imageUrl = '';
        
        if (data.data?.file_path) {
          // Clean up the file_path string
          const filePath = data.data.file_path
            .replace(/\\/g, '') // Remove backslashes
            .replace(/^\/+/, ''); // Remove leading slashes
          
          // Construct full URL
          imageUrl = `http://localhost:8000/${filePath}`;
          
          // Test if URL is accessible
          console.log('🔗 Testing image URL:', imageUrl);
          
          // Quick test of the URL
          const imgTest = new Image();
          imgTest.onload = () => console.log('✅ Image URL is accessible');
          imgTest.onerror = () => console.log('⚠️ Image URL might not be accessible');
          imgTest.src = imageUrl;
        }
        
        console.log('✅ Final image URL:', imageUrl);
        
        if (!imageUrl) {
          throw new Error('Could not construct valid image URL');
        }

        // ✅ FIXED: Update preview with actual URL
        setPreviewImages(prev => 
          prev.map(img => 
            img.originalName === file.name 
              ? { 
                  ...img, 
                  url: imageUrl, 
                  uploading: false,
                  backendUrl: imageUrl
                } 
              : img
          )
        );

        // ✅ FIXED: Update formData.images using functional update
        setFormData(prev => {
          const newImages = [...prev.images, imageUrl];
          console.log('🔄 Updated formData.images:', newImages);
          console.log('📊 Previous images:', prev.images);
          console.log('➕ Added image URL:', imageUrl);
          return {
            ...prev,
            images: newImages
          };
        });

        toast.success(`${file.name} uploaded successfully`);
        
      } else {
        throw new Error(data.message?.[0] || 'Upload failed');
      }
    } catch (error) {
      console.error('❌ Upload error:', error);
      toast.error(`Failed to upload ${file.name}`);
      
      // Remove failed upload
      setPreviewImages(prev => prev.filter(img => img.originalName !== file.name));
      URL.revokeObjectURL(previewUrl);
    }
  }
  
  // Give state time to update
  setTimeout(() => {
    setUploadingImages(false);
    console.log('🔄 Final formData.images after upload:', formData.images);
  }, 500);
  
  e.target.value = '';
};

  // ✅ WORKING: Remove image with cleanup
  const removeImage = (index) => {
    const imageToRemove = previewImages[index];
    
    // Clean up object URL if it's a temporary blob URL
    if (imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    // Remove from preview
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    
    // Remove from form data (find by index)
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    
    toast.info('Image removed');
  };

  // ✅ WORKING: Auto-assignment logic
  const getAutoAssignedUser = (department) => {
    try {
      console.log('🔄 Checking First Face assignments for department:', department);
      console.log('👤 Current user (problem creator):', user?.name);
      
      let assignedUser = null;

      // Check for users in the same department (excluding creator)
      const deptUsers = teamMembers.filter(member => 
        member.department === department && member.id !== user?.id
      );

      if (deptUsers.length > 0) {
        // Assign to first available user in department
        assignedUser = {
          id: deptUsers[0].id,
          name: deptUsers[0].name,
          type: 'FIRST_FACE_DEPARTMENT'
        };
        console.log('✅ Assigned to Department First Face:', assignedUser);
      } else {
        // Check for global first face (users not in same department)
        const otherUsers = teamMembers.filter(member => member.id !== user?.id);
        if (otherUsers.length > 0) {
          assignedUser = {
            id: otherUsers[0].id,
            name: otherUsers[0].name,
            type: 'FIRST_FACE_GLOBAL'
          };
          console.log('✅ Assigned to Global First Face:', assignedUser);
        } else {
          console.log('❌ No suitable users found for assignment');
        }
      }

      return assignedUser;
      
    } catch (error) {
      console.error('❌ Error in auto assignment:', error);
      return null;
    }
  };

  // ✅ WORKING: Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Check if images are still uploading
    if (uploadingImages) {
      toast.warning('Please wait for images to finish uploading');
      return;
    }
    
    // Check for any still uploading images
    const stillUploading = previewImages.some(img => img.uploading);
    if (stillUploading) {
      toast.warning('Some images are still uploading. Please wait.');
      return;
    }

    setLoading(true);

    try {
      // Validate required fields
      if (!formData.department || !formData.priority || !formData.statement.trim()) {
        toast.error('Please fill all required fields (Department, Priority, Problem Statement)');
        setLoading(false);
        return;
      }

      console.log('🔄 Starting problem creation...');
      console.log('👤 Problem creator:', user?.name);

      // 🔥 ASSIGNMENT LOGIC: Manual > Auto (WITH CREATOR PROTECTION)
      let assignedTo = null;
      let assignmentType = 'NOT_ASSIGNED';

      // 1. Check for manual assignment first
      if (formData.assigned_to) {
        const selectedUser = teamMembers.find(member => member.id == formData.assigned_to);
        
        // 🔥 DOUBLE CHECK: Ensure we're not assigning to problem creator
        if (selectedUser && selectedUser.id !== user?.id) {
          assignedTo = selectedUser.id;
          assignmentType = 'MANUAL_ASSIGNMENT';
          console.log('🔧 Manual assignment:', selectedUser.name);
        } else {
          console.warn('⚠️ Manual assignment failed - possibly assigning to creator');
          toast.warning('Cannot assign problem to yourself. Please select another team member.');
          setLoading(false);
          return;
        }
      }

      // 2. If no manual assignment, check for auto assignment
      if (!assignedTo) {
        const autoUser = getAutoAssignedUser(formData.department);
        if (autoUser) {
          assignedTo = autoUser.id;
          assignmentType = autoUser.type;
          console.log('🤖 Auto assignment:', autoUser.name);
        }
      }

      // 🔥 FINAL CHECK: Ensure we're not assigning to problem creator
      if (assignedTo === user?.id) {
        console.error('🚨 CRITICAL: Attempted to assign problem to creator - BLOCKED');
        assignedTo = null;
        assignmentType = 'NOT_ASSIGNED';
        toast.warning('Problem cannot be assigned to the creator. Please select another team member.');
      }

      // ✅ CORRECT: Prepare payload for backend
      const problemData = {
        statement: formData.statement,
        department: formData.department,
        priority: formData.priority,
        description: formData.description || '',
        created_by: user?.userId || user?.id,
        assigned_to: assignedTo || null,
        images: formData.images // ✅ Contains uploaded URLs from backend
      };

      console.log('📝 Problem data for backend:', problemData);
      console.log('🖼️ Images to send:', formData.images);

      // Send to backend API
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/problems/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: JSON.stringify(problemData),
      });

      const data = await response.json();
      console.log('📤 Backend response:', data);

      if (data.status === 'success') {
        const problem = data.data;
        
        // Show success message with assignment info
        if (assignedTo) {
          const assignedUser = teamMembers.find(u => u.id === assignedTo);
          if (assignmentType === 'MANUAL_ASSIGNMENT') {
            toast.success(`✅ Problem #${problem.id} submitted and manually assigned to ${assignedUser?.name || 'user'}`);
          } else {
            toast.success(`✅ Problem #${problem.id} submitted and auto-assigned to ${assignedUser?.name || 'user'}`);
          }
        } else {
          toast.success(`✅ Problem #${problem.id} submitted successfully! Will be assigned manually.`);
        }
        
        // Clean up all object URLs
        previewImages.forEach(img => {
          if (img.url.startsWith('blob:')) {
            URL.revokeObjectURL(img.url);
          }
        });
        
        // Reset form
        setFormData({ 
          department: '', 
          service: '', 
          priority: 'Medium',
          statement: '', 
          description: '',
          client: '', 
          assigned_to: '',
          images: [] 
        });
        setPreviewImages([]);
        setShowManualAssignment(false);
        
        // Redirect based on role
        setTimeout(() => {
          if (user?.role === 'admin' || user?.role === 'team_leader') {
            navigate('/problems');
          } else {
            navigate('/employee-dashboard');
          }
        }, 1500);
        
      } else {
        throw new Error(data.messages?.[0] || 'Failed to submit problem');
      }
      
    } catch (error) {
      console.error('❌ Submission error:', error);
      toast.error(error.message || 'Failed to submit problem. Please try again.');
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
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={{ transition: 'all 0.2s ease' }}
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
                  style={{ transition: 'all 0.2s ease' }}
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
                  style={{ transition: 'all 0.2s ease' }}
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
                    style={{ transition: 'all 0.2s ease' }}
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
                        <FaExclamationTriangle className="me-2" />
                        Submit Problem Ticket
                      </h4>
                      <small className="opacity-75">Please provide detailed information about the issue</small>
                    </div>
                    <div>
                      <button 
                        className="btn btn-outline-light btn-sm"
                        onClick={() => navigate(-1)}
                      >
                        <FaArrowLeft className="me-1" />
                        Back
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="card-body p-4">
                  <form onSubmit={handleSubmit}>
                    {/* Department & Service - Side by Side */}
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaBuilding className="me-2" />
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
                          {DEPARTMENTS.map(dept => (
                            <option key={dept} value={dept}>{dept}</option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaTag className="me-2" />
                          Service <span className="text-muted">(Optional)</span>
                        </label>
                        <select
                          className="form-control"
                          name="service"
                          value={formData.service}
                          onChange={handleChange}
                        >
                          <option value="">Select Service (Optional)</option>
                          {SERVICES.map(service => (
                            <option key={service} value={service}>{service}</option>
                          ))}
                        </select>
                        <small className="text-muted">Helps categorize the problem</small>
                      </div>
                    </div>

                    {/* Priority & Client - Side by Side */}
                    <div className="row g-3 mt-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaClock className="me-2" />
                          Priority <span className="text-danger">*</span>
                        </label>
                        <select
                          className="form-control"
                          name="priority"
                          value={formData.priority}
                          onChange={handleChange}
                          required
                        >
                          <option value="Low">Low - Can wait</option>
                          <option value="Medium">Medium - Important</option>
                          <option value="High">High - Urgent</option>
                        </select>
                        <small className="text-muted">
                          {formData.priority === 'High' && '🚨 Will be prioritized immediately'}
                          {formData.priority === 'Medium' && '⚠️ Important but not urgent'}
                          {formData.priority === 'Low' && '📅 Can be addressed when available'}
                        </small>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          <FaUserTie className="me-2" />
                          Client <span className="text-muted">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          placeholder="Enter client name or company..."
                        />
                        <small className="text-muted">Helpful for tracking client-related issues</small>
                      </div>
                    </div>

                    {/* 🔥 MANUAL ASSIGNMENT SECTION */}
                    <div className="mt-4">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-semibold mb-0">
                          <FaUserPlus className="me-2" />
                          Assign To <span className="text-muted">(Optional)</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setShowManualAssignment(!showManualAssignment)}
                          disabled={uploadingImages}
                        >
                          {showManualAssignment ? 'Hide Assignment' : 'Assign Manually'}
                        </button>
                      </div>
                      
                      {showManualAssignment && (
                        <div>
                          {loadingUsers ? (
                            <div className="text-center py-3">
                              <FaSpinner className="fa-spin text-primary me-2" />
                              Loading team members...
                            </div>
                          ) : (
                            <>
                              <select
                                className="form-control"
                                name="assigned_to"
                                value={formData.assigned_to}
                                onChange={handleChange}
                                disabled={uploadingImages}
                              >
                                <option value="">-- Select Team Member --</option>
                                {teamMembers.map(member => (
                                  <option key={member.id} value={member.id}>
                                    {member.name} 
                                    {member.department && ` (${member.department})`}
                                    {member.role && ` - ${member.role}`}
                                  </option>
                                ))}
                              </select>
                              <div className="alert alert-info mt-2 py-2">
                                <small>
                                  <FaBan className="me-1" />
                                  <strong>Note:</strong> You cannot assign problems to yourself. 
                                  The system will automatically exclude you from assignment.
                                </small>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <small className="text-muted">
                        {showManualAssignment 
                          ? 'Manual assignment will override First Face auto-assignment' 
                          : 'Leave empty for First Face auto-assignment (excluding yourself)'
                        }
                      </small>
                    </div>

                    {/* Problem Statement */}
                    <div className="mt-4">
                      <label className="form-label fw-semibold">
                        <FaExclamationTriangle className="me-2" />
                        Problem Statement <span className="text-danger">*</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="statement"
                        rows="3"
                        value={formData.statement}
                        onChange={handleChange}
                        placeholder="Describe the problem in detail..."
                        required
                        style={{ resize: 'vertical' }}
                        disabled={uploadingImages}
                      ></textarea>
                      <small className="text-muted">Be clear and concise about the issue</small>
                    </div>

                    {/* Additional Description */}
                    <div className="mt-3">
                      <label className="form-label fw-semibold">
                        <FaInfoCircle className="me-2" />
                        Additional Description <span className="text-muted">(Optional)</span>
                      </label>
                      <textarea
                        className="form-control"
                        name="description"
                        rows="2"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Add any additional details, error messages, or context..."
                        style={{ resize: 'vertical' }}
                        disabled={uploadingImages}
                      ></textarea>
                    </div>

                    {/* ✅ WORKING: Image Upload Section */}
                    <div className="mt-4">
                      <label className="form-label fw-semibold">
                        <FaImage className="me-2" />
                        Attach Screenshots <span className="text-muted">(Optional)</span>
                      </label>
                      
                      {/* Upload Status */}
                      {uploadingImages && (
                        <div className="alert alert-info d-flex align-items-center mb-2 py-2">
                          <FaSpinner className="fa-spin me-2" />
                          <span>Uploading images... Please wait.</span>
                        </div>
                      )}
                      
                      <div className="input-group">
                        <input
                          type="file"
                          className="form-control"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          disabled={previewImages.length >= 5 || uploadingImages}
                          id="imageUpload"
                        />
                        <label 
                          className="btn btn-outline-primary" 
                          htmlFor="imageUpload"
                          style={{ cursor: previewImages.length >= 5 || uploadingImages ? 'not-allowed' : 'pointer' }}
                        >
                          <FaUpload className="me-1" />
                          Browse
                        </label>
                      </div>
                      <small className="text-muted">
                        Maximum 5 images allowed (PNG, JPG, JPEG). Each image max 5MB.
                        {previewImages.length > 0 && ` (${previewImages.length}/5 uploaded)`}
                      </small>
                      
                      {/* Image Previews */}
                      {previewImages.length > 0 && (
                        <div className="mt-3">
                          <h6 className="mb-2">Uploaded Images:</h6>
                          <div className="row g-2">
                            {previewImages.map((img, index) => (
                              <div key={index} className="col-md-3 col-sm-4 col-6">
                                <div className="position-relative border rounded p-1 shadow-sm">
                                  <img 
                                    src={img.url} 
                                    alt={`Preview ${index + 1}`}
                                    className="img-fluid rounded"
                                    style={{ 
                                      height: '120px', 
                                      width: '100%', 
                                      objectFit: 'cover',
                                      opacity: img.uploading ? 0.5 : 1 
                                    }}
                                  />
                                  
                                  {/* Uploading Spinner */}
                                  {img.uploading && (
                                    <div className="position-absolute top-50 start-50 translate-middle">
                                      <FaSpinner className="fa-spin text-primary" size={20} />
                                    </div>
                                  )}
                                  
                                  {/* Remove Button */}
                                  <button
                                    type="button"
                                    className="btn btn-danger btn-sm position-absolute"
                                    style={{ 
                                      top: '5px', 
                                      right: '5px', 
                                      width: '28px', 
                                      height: '28px', 
                                      padding: 0,
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center'
                                    }}
                                    onClick={() => removeImage(index)}
                                    disabled={img.uploading}
                                    title="Remove image"
                                  >
                                    <FaTimes />
                                  </button>
                                  
                                  {/* Image Status */}
                                  <small className="d-block text-center text-truncate mt-1" style={{ fontSize: '0.7rem' }}>
                                    {img.uploading ? 'Uploading...' : 
                                     img.name.length > 15 ? `${img.name.substring(0, 12)}...` : img.name}
                                  </small>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Submission Summary */}
                    <div className="alert alert-light border mt-4">
                      <h6 className="mb-2">
                        <FaCheckCircle className="me-2 text-success" />
                        Submission Summary
                      </h6>
                      <div className="row small">
                        <div className="col-md-4">
                          <strong>Department:</strong> {formData.department || 'Not selected'}
                        </div>
                        <div className="col-md-4">
                          <strong>Priority:</strong> 
                          <span className={`ms-1 badge ${
                            formData.priority === 'High' ? 'bg-danger' :
                            formData.priority === 'Medium' ? 'bg-warning text-dark' : 'bg-success'
                          }`}>
                            {formData.priority || 'Not selected'}
                          </span>
                        </div>
                        <div className="col-md-4">
                          <strong>Assignment:</strong> 
                          {formData.assigned_to 
                            ? `Manual (${teamMembers.find(m => m.id == formData.assigned_to)?.name || 'User'})`
                            : showManualAssignment ? 'None selected' : 'Auto (First Face)'
                          }
                        </div>
                        <div className="col-md-12 mt-2">
                          <strong>Images:</strong> {previewImages.length} uploaded
                          {uploadingImages && ' (Uploading...)'}
                        </div>
                      </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="d-flex gap-2 mt-4 pt-3 border-top">
                      <button 
                        type="submit" 
                        className="btn btn-primary px-4 py-2"
                        disabled={loading || uploadingImages}
                      >
                        {loading ? (
                          <>
                            <FaSpinner className="fa-spin me-2" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <FaPlusCircle className="me-2" />
                            Submit Problem Ticket
                          </>
                        )}
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-secondary px-4 py-2"
                        onClick={() => navigate(-1)}
                        disabled={loading || uploadingImages}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        className="btn btn-outline-info px-3"
                        onClick={() => {
                          // Clean up object URLs
                          previewImages.forEach(img => {
                            if (img.url.startsWith('blob:')) {
                              URL.revokeObjectURL(img.url);
                            }
                          });
                          
                          setFormData({ 
                            department: '', 
                            service: '', 
                            priority: 'Medium',
                            statement: '', 
                            description: '',
                            client: '', 
                            assigned_to: '',
                            images: [] 
                          });
                          setPreviewImages([]);
                          toast.info('Form cleared');
                        }}
                        disabled={loading || uploadingImages}
                      >
                        Clear Form
                      </button>
                    </div>
                  </form>
                </div>
              </div>
              
              {/* Help Card */}
              <div className="card shadow-sm border-0 mt-4">
                <div className="card-header bg-white">
                  <h6 className="mb-0">
                    <FaInfoCircle className="me-2" />
                    Tips for Better Problem Submission
                  </h6>
                </div>
                <div className="card-body">
                  <ul className="mb-0 small">
                    <li>✅ Images are uploaded to server immediately when selected</li>
                    <li>✅ Maximum 5 images allowed (5MB each)</li>
                    <li>✅ You can remove images before submission</li>
                    <li>✅ Wait for all images to finish uploading before submitting</li>
                    <li>✅ Problem statement is required for submission</li>
                    <li>✅ First Face assignment excludes you automatically</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}