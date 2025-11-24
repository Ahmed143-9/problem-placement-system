// ProblemForm.js - COMPLETE FIXED CODE WITH CREATOR PROTECTION
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { FaHome, FaPlusCircle, FaFileAlt, FaChevronLeft, FaChevronRight, FaExclamationTriangle, FaUserPlus, FaBan } from 'react-icons/fa';

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

export default function ProblemForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    department: '',
    service: '',
    priority: '',
    statement: '',
    client: '',
    assignedTo: '', // 🔥 MANUAL ASSIGNMENT FIELD ADDED
    images: []
  });

  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showManualAssignment, setShowManualAssignment] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  // Load team members for manual assignment (EXCLUDING CURRENT USER)
  const loadTeamMembers = () => {
    try {
      const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      // 🔥 CURRENT USER কে বাদ দিয়ে শুধুমাত্র অন্যান্য active users
      const activeUsers = systemUsers.filter(u => 
        u.status === 'active' && u.id !== user?.id
      );
      setTeamMembers(activeUsers);
      console.log('👥 Team members loaded (excluding self):', activeUsers.length);
    } catch (error) {
      console.error('Failed to load team members:', error);
    }
  };

  // Generate 5-digit auto-increment ID
  const generateProblemId = () => {
    try {
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      
      if (problems.length === 0) {
        return 10001;
      }
      
      const maxId = problems.reduce((max, problem) => {
        return problem.id > max ? problem.id : max;
      }, 10000);
      
      console.log('📊 Current max ID:', maxId);
      return maxId + 1;
      
    } catch (error) {
      console.error('❌ Error generating problem ID:', error);
      return 10001;
    }
  };

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

  // 🔥 FIXED: Auto Assignment to First Face with CREATOR PROTECTION
  const getAutoAssignedUser = (department) => {
    try {
      console.log('🔄 Checking First Face assignments for department:', department);
      console.log('👤 Current user (problem creator):', user?.name);
      
      const firstFaceAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');

      console.log('First Face assignments:', firstFaceAssignments);
      console.log('System users:', systemUsers);

      // Filter active assignments only
      const activeAssignments = firstFaceAssignments.filter(ff => ff.isActive === true);
      console.log('Active assignments:', activeAssignments);

      let assignedUser = null;

      // 1. Check for department-specific first face (EXCLUDING PROBLEM CREATOR)
      const deptFirstFace = activeAssignments.find(ff => 
        ff.department === department && ff.userId != user?.id // 🔥 Creator কে বাদ
      );
      console.log('Department First Face (excluding creator):', deptFirstFace);

      // 2. Check for global first face (EXCLUDING PROBLEM CREATOR)
      const globalFirstFace = activeAssignments.find(ff => 
        ff.department === 'all' && ff.userId != user?.id // 🔥 Creator কে বাদ
      );
      console.log('Global First Face (excluding creator):', globalFirstFace);

      // Priority: Department > Global
      if (deptFirstFace) {
        const userDetails = systemUsers.find(u => u.id == deptFirstFace.userId);
        if (userDetails && userDetails.id !== user?.id) { // 🔥 Double check
          assignedUser = {
            userId: deptFirstFace.userId,
            userName: userDetails ? userDetails.name : deptFirstFace.userName,
            userEmail: userDetails ? userDetails.email : '',
            type: 'FIRST_FACE_DEPARTMENT'
          };
          console.log('✅ Assigned to Department First Face:', assignedUser);
        }
      } else if (globalFirstFace) {
        const userDetails = systemUsers.find(u => u.id == globalFirstFace.userId);
        if (userDetails && userDetails.id !== user?.id) { // 🔥 Double check
          assignedUser = {
            userId: globalFirstFace.userId,
            userName: userDetails ? userDetails.name : globalFirstFace.userName,
            userEmail: userDetails ? userDetails.email : '',
            type: 'FIRST_FACE_GLOBAL'
          };
          console.log('✅ Assigned to Global First Face:', assignedUser);
        }
      } else {
        console.log('❌ No First Face found for assignment (excluding problem creator)');
      }

      return assignedUser;
      
    } catch (error) {
      console.error('❌ Error in auto assignment:', error);
      return null;
    }
  };

  // 🔥 FIXED: Manual Assignment Logic with CREATOR PROTECTION
  const getManualAssignedUser = () => {
    if (!formData.assignedTo) return null;

    try {
      const selectedUser = teamMembers.find(user => user.id == formData.assignedTo);
      
      // 🔥 DOUBLE CHECK: Ensure we're not assigning to problem creator
      if (selectedUser && selectedUser.id !== user?.id) {
        return {
          userId: selectedUser.id,
          userName: selectedUser.name,
          userEmail: selectedUser.email,
          type: 'MANUAL_ASSIGNMENT'
        };
      }
      
      console.warn('⚠️ Attempted to assign problem to creator - prevented');
      return null;
    } catch (error) {
      console.error('Error in manual assignment:', error);
      return null;
    }
  };

  // Send Problem Assignment Notification
  const sendProblemAssignmentNotification = (problem, assignedUser, assignmentType) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: assignedUser.userId,
        userName: assignedUser.userName,
        type: 'problem_assigned',
        title: '🎯 New Problem Assigned',
        message: `You have been assigned a new problem (#${problem.id}): ${problem.statement.substring(0, 50)}...`,
        isRead: false,
        createdAt: new Date().toISOString(),
        problemId: problem.id,
        problem: problem,
        assignedBy: assignmentType === 'MANUAL_ASSIGNMENT' ? user?.name : 'System (First Face)',
        assignmentType: assignmentType
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('🔔 Problem assignment notification sent:', notification);
      
      // Show toast notification
      toast.info(`📨 Problem assigned to ${assignedUser.userName}`);
    } catch (error) {
      console.error('❌ Failed to send problem assignment notification:', error);
    }
  };

  // 🔥 FIXED: Handle Submit with CREATOR PROTECTION
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
      console.log('👤 Problem creator:', user?.name);

      // 🔥 ASSIGNMENT LOGIC: Manual > Auto (WITH CREATOR PROTECTION)
      let assignedUser = null;
      let assignmentType = 'NOT_ASSIGNED';

      // 1. Check for manual assignment first
      if (formData.assignedTo) {
        assignedUser = getManualAssignedUser();
        if (assignedUser) {
          assignmentType = 'MANUAL_ASSIGNMENT';
          console.log('🔧 Manual assignment:', assignedUser);
        } else {
          console.warn('⚠️ Manual assignment failed - possibly assigning to creator');
          toast.warning('Cannot assign problem to yourself. Please select another team member.');
          setLoading(false);
          return;
        }
      }

      // 2. If no manual assignment, check for First Face auto assignment
      if (!assignedUser) {
        assignedUser = getAutoAssignedUser(formData.department);
        assignmentType = assignedUser ? assignedUser.type : 'NOT_ASSIGNED';
        console.log('🤖 Auto assignment:', assignedUser);
      }

      // 🔥 FINAL CHECK: Ensure we're not assigning to problem creator
      if (assignedUser && assignedUser.userId === user?.id) {
        console.error('🚨 CRITICAL: Attempted to assign problem to creator - BLOCKED');
        assignedUser = null;
        assignmentType = 'NOT_ASSIGNED';
        toast.warning('Problem cannot be assigned to the creator. Please select another team member.');
      }

      // Extract only image URLs
      const imageUrls = formData.images && formData.images.length > 0 
        ? formData.images.map(img => img.url) 
        : [];

      // Generate 5-digit auto-increment ID
      const newProblemId = generateProblemId();

      // 🔥 FIXED: Create new problem object with PROPER assignment
      const newProblem = {
        id: newProblemId,
        department: formData.department,
        service: formData.service,
        priority: formData.priority,
        statement: formData.statement,
        client: formData.client || '',
        images: imageUrls,
        status: assignedUser ? 'assigned' : 'pending',
        createdBy: user?.name || 'Unknown User',
        createdById: user?.id,
        
        // 🔥 CRITICAL: Assignment fields - MUST BE SET (WITH CREATOR PROTECTION)
        assignedTo: assignedUser ? assignedUser.userId : null,
        assignedToName: assignedUser ? assignedUser.userName : null,
        assignedToEmail: assignedUser ? assignedUser.userEmail : null,
        assignmentType: assignmentType,
        
        createdAt: new Date().toISOString(),
        comments: [],
        transferHistory: [],
        actionHistory: [{
          action: 'Problem Created',
          by: user?.name || 'Unknown User',
          timestamp: new Date().toISOString(),
          comment: 'Problem ticket submitted'
        }],
        ...(assignedUser && {
          assignmentHistory: [{
            assignedTo: assignedUser.userId,
            assignedToName: assignedUser.userName,
            assignedBy: assignmentType === 'MANUAL_ASSIGNMENT' ? user?.name : 'System (First Face)',
            assignedAt: new Date().toISOString(),
            type: assignmentType
          }]
        })
      };

      console.log('📝 New problem data:', newProblem);

      // Save to localStorage
      const problems = JSON.parse(localStorage.getItem('problems') || '[]');
      problems.push(newProblem);
      localStorage.setItem('problems', JSON.stringify(problems));

      console.log('💾 Problem saved to localStorage');
      console.log('Total problems now:', problems.length);

      // Send notification if assigned (AND NOT TO CREATOR)
      if (assignedUser && assignedUser.userId !== user?.id) {
        sendProblemAssignmentNotification(newProblem, assignedUser, assignmentType);
      }

      // Show success message with assignment info
      if (assignedUser) {
        if (assignmentType === 'MANUAL_ASSIGNMENT') {
          toast.success(`✅ Problem submitted and manually assigned to ${assignedUser.userName}`);
        } else {
          toast.success(`✅ Problem submitted and auto-assigned to ${assignedUser.userName}`);
        }
      } else {
        toast.success('✅ Problem submitted successfully! Will be assigned manually.');
      }
      
      // Reset form
      setFormData({ 
        department: '', 
        service: '', 
        priority: '', 
        statement: '', 
        client: '', 
        assignedTo: '',
        images: [] 
      });
      setPreviewImages([]);
      setShowManualAssignment(false);
      
      // Redirect
      setTimeout(() => {
        if (user?.role === 'admin' || user?.role === 'team_leader') {
          navigate('/problems');
        } else {
          navigate('/employee-dashboard');
        }
      }, 1500);
      
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
                    {/* <div className="d-flex align-items-center">
                      <span className="badge bg-warning me-2">
                        <FaBan className="me-1" />
                        Self-Assignment Blocked
                      </span>
                    </div> */}
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

                    {/* 🔥 MANUAL ASSIGNMENT SECTION WITH CREATOR PROTECTION */}
                    <div className="mt-3">
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <label className="form-label fw-semibold mb-0">
                          <FaUserPlus className="me-2" />
                          Assign To <span className="text-muted">(Optional)</span>
                        </label>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => setShowManualAssignment(!showManualAssignment)}
                        >
                          {showManualAssignment ? 'Hide' : 'Assign Manually'}
                        </button>
                      </div>
                      
                      {showManualAssignment && (
                        <div>
                          <select
                            className="form-control"
                            name="assignedTo"
                            value={formData.assignedTo}
                            onChange={handleChange}
                          >
                            <option value="">-- Select Team Member --</option>
                            {teamMembers.map(member => (
                              <option key={member.id} value={member.id}>
                                {member.name} ({member.department}) - {member.role}
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
                        </div>
                      )}
                      {/* <small className="text-muted">
                        {showManualAssignment 
                          ? 'Manual assignment will override First Face auto-assignment' 
                          : 'Leave empty for First Face auto-assignment (excluding yourself)'
                        }
                      </small> */}
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

                    {/* Security Notice */}
                    {/* <div className="alert alert-warning mt-3">
                      <h6 className="mb-2">
                        <FaBan className="me-2" />
                        Assignment Security
                      </h6>
                      <p className="mb-0 small">
                        For security and efficiency reasons, problems cannot be assigned to the person who created them. 
                        This ensures proper workflow and prevents self-assignment conflicts.
                      </p>
                    </div> */}

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