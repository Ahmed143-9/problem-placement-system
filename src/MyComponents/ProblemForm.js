// src/pages/ProblemForm.js - COMPLETE VERSION WITH NOTIFICATIONS
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import { 
  FaHome, FaPlusCircle, FaFileAlt, FaChevronLeft, FaChevronRight, 
  FaExclamationTriangle, FaUserPlus, FaBan, FaSpinner, FaUserTie,
  FaBuilding, FaTag, FaClock, FaUsersCog, FaArrowLeft, FaImage,
  FaTimes, FaUpload, FaCheckCircle, FaInfoCircle, FaChevronDown, FaGlobe
} from 'react-icons/fa';

// Import WebSocket service
import webSocketService from '../services/websocket';

const SERVICES = [
  'Bulk SMS -> WinText',
  'Topup -> Winfin',
  'Whatsapp Solution -> Infobip <-> Omnichannel channel',
  'Email Solution -> Infobip <-> Omnichannel channel',
  'Push-Pull -> VAS & EBS',
  'Games -> VAS & EBS',
  'DCB -> VAS & EBS',
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
    images: []
  });

  const [loading, setLoading] = useState(false);
  const [previewImages, setPreviewImages] = useState([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [showManualAssignment, setShowManualAssignment] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Initialize notification system
  useEffect(() => {
    loadTeamMembers();
    if (user?.department && !formData.department) {
      setFormData(prev => ({ ...prev, department: user.department }));
    }

    // Initialize notification context reference
    if (!window.notificationContext) {
      window.notificationContext = {
        addNotification: (notification) => {
          console.log('📨 Notification would be added:', notification);
          // This will be properly set by the NotificationContext
        },
        addAssignedProblem: (problem) => {
          console.log('📋 Assigned problem would be added:', problem);
        }
      };
    }

    // Connect WebSocket
    setTimeout(() => {
      if (webSocketService) {
        webSocketService.connect();
      }
    }, 1500);

    return () => {
      // Cleanup if needed
    };
  }, [user]);

  const loadTeamMembers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('https://ticketapi.wineds.com/api/v1/getAllUsers', {
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
          const activeUsers = data.data.filter(u => 
            u.status === 'active' && u.id !== user?.id
          );
          setTeamMembers(activeUsers);
          console.log('👥 Team members loaded (excluding self):', activeUsers.length);
        }
      }
    } catch (error) {
      console.error('❌ Failed to load team members:', error);
      toast.error('Failed to load team members', { autoClose: 3000 });
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length === 0) return;
    
    if (files.length + previewImages.length > 5) {
      toast.warning('Maximum 5 images allowed', { autoClose: 3000 });
      e.target.value = '';
      return;
    }
    
    setUploadingImages(true);
    const token = localStorage.getItem('token');
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
        if (!file.type.startsWith('image/')) {
        toast.warning(`${file.name} is not an image file`, { autoClose: 3000 });
        continue;
      }
      
        if (file.size > 5 * 1024 * 1024) {
        toast.warning(`${file.name} exceeds 5MB limit`, { autoClose: 3000 });
        continue;
      }

      const previewUrl = URL.createObjectURL(file);
      const tempPreview = {
        url: previewUrl,
        name: file.name,
        uploading: true,
        originalName: file.name,
        index: i
      };
      
      setPreviewImages(prev => [...prev, tempPreview]);

      const uploadData = new FormData();
      uploadData.append('file', file);
      
      const originalFileName = file.name;
      const fileNameWithoutExt = originalFileName.substring(0, originalFileName.lastIndexOf('.'));
      const fileExtension = originalFileName.substring(originalFileName.lastIndexOf('.') + 1);
      
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const uniqueFileName = `${fileNameWithoutExt}_${timestamp}_${randomString}.${fileExtension}`;
      
      uploadData.append('file_path', 'uploads/modules/general/');
      uploadData.append('file_name', uniqueFileName);

      try {
        console.log('📤 Uploading image:', file.name);
        
        const response = await fetch('https://ticketapi.wineds.com/api/v1/general/file/file-upload', {
          method: 'POST',
          headers: {
            'Authorization': token ? `Bearer ${token}` : ''
          },
          body: uploadData
        });

        const data = await response.json();
        console.log('📥 Upload response:', data);
        
          if (data.status === 'success') {
          let imageUrl = '';
          
          if (data.data?.file_path) {
            const filePath = data.data.file_path
              .replace(/\\/g, '')
              .replace(/^\/+/, '');
            
            imageUrl = `https://ticketapi.wineds.com/${filePath}`;
            
            console.log('🔗 Testing image URL:', imageUrl);
            
            const imgTest = new Image();
            imgTest.onload = () => console.log('✅ Image URL is accessible');
            imgTest.onerror = () => console.log('⚠️ Image URL might not be accessible');
            imgTest.src = imageUrl;
          }
          
          console.log('✅ Final image URL:', imageUrl);
          
          if (!imageUrl) {
            throw new Error('Could not construct valid image URL');
          }

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

          toast.success(`${file.name} uploaded successfully`, { autoClose: 3000 });
          
        } else {
          throw new Error(data.message?.[0] || 'Upload failed');
        }
      } catch (error) {
        console.error('❌ Upload error:', error);
        toast.error(`Failed to upload ${file.name}`, { autoClose: 3000 });
        
        setPreviewImages(prev => prev.filter(img => img.originalName !== file.name));
        URL.revokeObjectURL(previewUrl);
      }
    }
    
    setTimeout(() => {
      setUploadingImages(false);
      console.log('🔄 Final formData.images after upload:', formData.images);
    }, 500);
    
    e.target.value = '';
  };

  const removeImage = (index) => {
    const imageToRemove = previewImages[index];
    
    if (imageToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(imageToRemove.url);
    }
    
    const newPreviews = previewImages.filter((_, i) => i !== index);
    setPreviewImages(newPreviews);
    
    const newImages = [...formData.images];
    newImages.splice(index, 1);
    
    setFormData(prev => ({
      ...prev,
      images: newImages
    }));
    
    toast.info('Image removed', { autoClose: 3000 });
  };

  const getAutoAssignedUser = (department) => {
    try {
      console.log('🔄 Checking First Face assignments for department:', department);
      console.log('👤 Current user (problem creator):', user?.name);
      
      let assignedUser = null;

      const deptUsers = teamMembers.filter(member => 
        member.department === department && member.id !== user?.id
      );

      if (deptUsers.length > 0) {
        assignedUser = {
          id: deptUsers[0].id,
          name: deptUsers[0].name,
          type: 'FIRST_FACE_DEPARTMENT'
        };
        console.log('✅ Assigned to Department First Face:', assignedUser);
      } else {
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

  // Helper function to store notifications for polling (fallback)
  const storeNotificationForPolling = (notification) => {
    try {
      // Get existing pending notifications
      const pendingNotifications = JSON.parse(localStorage.getItem('pending_notifications') || '[]');
      
      // Add new notification
      pendingNotifications.push({
        ...notification,
        stored_at: new Date().toISOString(),
        attempts: 0
      });
      
      // Keep only last 50 notifications
      const trimmedNotifications = pendingNotifications.slice(-50);
      
      localStorage.setItem('pending_notifications', JSON.stringify(trimmedNotifications));
      console.log('💾 Notification stored for polling delivery');
      
    } catch (storageError) {
      console.error('Failed to store notification for polling:', storageError);
    }
  };

  // Send notification to assigned user
  const sendAssignmentNotification = async (assignedTo, assignedUser, problem, assignmentType) => {
    try {
      // Prepare notification data
      const notificationPayload = {
        type: 'assignment',
        title: 'New Problem Assigned',
        message: `You have been assigned to problem: "${formData.statement.substring(0, 100)}${formData.statement.length > 100 ? '...' : ''}"`,
        problem_id: problem.id,
        recipient_id: assignedTo,
        sender_id: user?.id,
        sender_name: user?.name || 'System',
        priority: formData.priority,
        department: formData.department,
        assignment_type: assignmentType,
        created_at: new Date().toISOString()
      };

      console.log('📤 Sending assignment notification:', notificationPayload);
      
      // Try to send via WebSocket
      let wsSuccess = false;
      if (webSocketService && webSocketService.sendMessage) {
        wsSuccess = webSocketService.sendMessage('notification', notificationPayload);
      }
      
      // If WebSocket fails, store for polling
      if (!wsSuccess) {
        console.log('📡 WebSocket not available, storing for polling');
        storeNotificationForPolling(notificationPayload);
      }
      
      // Also store in localStorage for immediate display
      try {
        const localNotifications = JSON.parse(localStorage.getItem('local_notifications') || '[]');
        localNotifications.unshift({
          id: `assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          ...notificationPayload,
          read: false,
          timestamp: new Date().toISOString(),
          local_stored: true
        });
        
        // Keep only last 20 notifications
        const trimmedLocalNotifications = localNotifications.slice(0, 20);
        localStorage.setItem('local_notifications', JSON.stringify(trimmedLocalNotifications));
        
        // Trigger storage event to notify other tabs/components
        window.dispatchEvent(new Event('localStorageChange'));
        
      } catch (localError) {
        console.error('Failed to store notification locally:', localError);
      }
      
      return true;
      
    } catch (notificationError) {
      console.error('❌ Failed to send notification:', notificationError);
      return false;
    }
  };

  // Send notification to admins about unassigned problem
  const sendUnassignedNotification = (problem) => {
    try {
      const adminNotification = {
        type: 'new_problem',
        title: 'New Problem Created - Needs Assignment',
        message: `New problem created: "${formData.statement.substring(0, 80)}${formData.statement.length > 80 ? '...' : ''}" in ${formData.department}`,
        problem_id: problem.id,
        sender_id: user?.id,
        sender_name: user?.name || 'Unknown',
        priority: formData.priority,
        department: formData.department,
        created_at: new Date().toISOString(),
        needs_assignment: true
      };

      console.log('📤 Notifying admins about unassigned problem:', adminNotification);
      
      // Store for polling (admin notifications)
      storeNotificationForPolling({
        ...adminNotification,
        recipient_role: 'admin' // This would go to all admins
      });
      
    } catch (error) {
      console.error('Failed to send unassigned notification:', error);
    }
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  
  if (uploadingImages) {
    toast.warning('Please wait for images to finish uploading', { autoClose: 3000 });
    return;
  }
  
  const stillUploading = previewImages.some(img => img.uploading);
  if (stillUploading) {
    toast.warning('Some images are still uploading. Please wait.', { autoClose: 3000 });
    return;
  }

  setLoading(true);

  try {
    if (!formData.department || !formData.priority || !formData.statement.trim()) {
      toast.error('Please fill all required fields (Department, Priority, Problem Statement)', { autoClose: 3000 });
      setLoading(false);
      return;
    }

    console.log('🔄 Starting problem creation...');
    console.log('👤 Problem creator:', user?.name);

    let assignedTo = null;
    let assignmentType = 'NOT_ASSIGNED';
    let assignedUser = null;

    if (formData.assigned_to) {
      const selectedUser = teamMembers.find(member => member.id == formData.assigned_to);
      
      if (selectedUser && selectedUser.id !== user?.id) {
        assignedTo = selectedUser.id;
        assignedUser = selectedUser;
        assignmentType = 'MANUAL_ASSIGNMENT';
        console.log('🔧 Manual assignment:', selectedUser.name);
      } else {
        console.warn('⚠️ Manual assignment failed - possibly assigning to creator');
        toast.warning('Cannot assign problem to yourself. Please select another team member.', { autoClose: 3000 });
        setLoading(false);
        return;
      }
    }

    if (!assignedTo) {
      const autoUser = getAutoAssignedUser(formData.department);
      if (autoUser) {
        assignedTo = autoUser.id;
        assignedUser = teamMembers.find(u => u.id === autoUser.id);
        assignmentType = autoUser.type;
        console.log('🤖 Auto assignment:', autoUser.name);
      }
    }

    if (assignedTo === user?.id) {
      console.error('🚨 CRITICAL: Attempted to assign problem to creator - BLOCKED');
      assignedTo = null;
      assignedUser = null;
      assignmentType = 'NOT_ASSIGNED';
      toast.warning('Problem cannot be assigned to the creator. Please select another team member.', { autoClose: 3000 });
    }

    const problemData = {
      statement: formData.statement,
      department: formData.department,
      priority: formData.priority,
      description: formData.description || '',
      created_by: user?.userId || user?.id,
      assigned_to: assignedTo || null,
      images: formData.images
    };

    console.log('📝 Problem data for backend:', problemData);
    console.log('🖼️ Images to send:', formData.images);

    const token = localStorage.getItem('token');
    const response = await fetch('https://ticketapi.wineds.com/api/problems/create', {
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
      
      // ✅ SEND NOTIFICATION TO ASSIGNED USER
      if (assignedTo && assignedUser) {
        try {
          // Create notification for assigned user
          const notificationData = {
            recipient_id: assignedTo,
            recipient_name: assignedUser.name,
            type: 'assignment',
            title: 'New Problem Assigned',
            message: `You have been assigned a new problem: "${formData.statement.substring(0, 80)}${formData.statement.length > 80 ? '...' : ''}"`,
            problem_id: problem.id,
            problem_statement: formData.statement,
            priority: formData.priority,
            department: formData.department,
            sender_id: user?.id,
            sender_name: user?.name || 'System'
          };

          // Import notification service
          import('../services/notificationService').then(({ default: notificationService }) => {
            // Create notification
            const notification = notificationService.createNotification(notificationData);
            
            console.log('✅ Notification created for assigned user:', notification);
            
            // Show success message
            toast.success(`✅ Problem submitted successfully! Assigned to ${assignedUser.name}`, { 
              autoClose: 4000,
              position: "top-right"
            });
            
            // Also show a toast for the assigned user (if they're on the same browser)
            if (parseInt(localStorage.getItem('current_user_id')) === assignedTo) {
              toast.info(`📨 You have been assigned a new problem: "${formData.statement.substring(0, 50)}..."`, {
                autoClose: 5000,
                position: "top-right"
              });
            }
            
          }).catch(error => {
            console.error('Failed to import notification service:', error);
            toast.success(`✅ Problem submitted successfully! Assigned to ${assignedUser.name}`, { 
              autoClose: 4000 
            });
          });
          
        } catch (notificationError) {
          console.error('❌ Failed to create notification:', notificationError);
          toast.success(`✅ Problem submitted successfully! Assigned to ${assignedUser.name}`, { 
            autoClose: 4000 
          });
        }
      } else {
        // Problem created but not assigned
        toast.success(`✅ Problem submitted successfully!`, { 
          autoClose: 3000 
        });
        
        // Notify admins about unassigned problem if creator is regular user
        if (user?.role === 'user' || user?.role === 'employee') {
          try {
            import('../services/notificationService').then(({ default: notificationService }) => {
              // Find admin users
              const adminUsers = teamMembers.filter(member => 
                member.role === 'admin' || member.role === 'team_leader'
              );
              
              // Send notification to each admin
              adminUsers.forEach(admin => {
                const adminNotification = {
                  recipient_id: admin.id,
                  recipient_name: admin.name,
                  type: 'new_problem',
                  title: 'New Problem Created - Needs Assignment',
                  message: `New problem created in ${formData.department}: "${formData.statement.substring(0, 80)}..."`,
                  problem_id: problem.id,
                  problem_statement: formData.statement,
                  priority: formData.priority,
                  department: formData.department,
                  sender_id: user?.id,
                  sender_name: user?.name || 'Unknown'
                };
                
                notificationService.createNotification(adminNotification);
              });
              
              console.log(`📨 Notified ${adminUsers.length} admins about unassigned problem`);
            });
          } catch (error) {
            console.error('Failed to notify admins:', error);
          }
        }
      }
      
      // Cleanup image previews
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
      
      // Navigate after delay
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
              : <FaChevronLeft size={14} color="#333" />}
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
                  title="Reports"
                >
                  <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                  {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                </Link>
              </li>
              
              {(user?.role === 'admin' || user?.role === 'team_leader') && (
                <>
                  <li className="nav-item mb-2">
                    <Link 
                      to="/admin" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      title="User Management"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>User Management</span>}
                    </Link>
                  </li>
                  
                  <li className="nav-item mb-2">
                    <Link 
                      to="/domain-status" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      title="Domain Status"
                    >
                      <FaGlobe style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Domain Status</span>}
                    </Link>
                  </li>
                  
                  <li className="nav-item mb-2">
                    <Link 
                      to="/roles" 
                      className="nav-link text-white rounded d-flex align-items-center"
                      title="Role Management"
                    >
                      <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                      {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Role Management</span>}
                    </Link>
                  </li>
                </>
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
                          Department <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-control pe-4"
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
                          <span className="position-absolute end-0 top-50 translate-middle-y me-3">
                            <FaChevronDown />
                          </span>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Service <span className="text-muted"></span>
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-control pe-4"
                            name="service"
                            value={formData.service}
                            onChange={handleChange}
                          >
                            <option value="">Select Service</option>
                            {SERVICES.map(service => (
                              <option key={service} value={service}>{service}</option>
                            ))}
                          </select>
                          <span className="position-absolute end-0 top-50 translate-middle-y me-3">
                            <FaChevronDown />
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Priority & Client - Side by Side */}
                    <div className="row g-3 mt-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Priority <span className="text-danger">*</span>
                        </label>
                        <div className="position-relative">
                          <select
                            className="form-control pe-4"
                            name="priority"
                            value={formData.priority}
                            onChange={handleChange}
                            required
                          >
                            <option value="Low">Low - Can wait</option>
                            <option value="Medium">Medium - Important</option>
                            <option value="High">High - Urgent</option>
                          </select>
                          <span className="position-absolute end-0 top-50 translate-middle-y me-3">
                            <FaChevronDown />
                          </span>
                        </div>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Client <span className="text-muted"></span>
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          name="client"
                          value={formData.client}
                          onChange={handleChange}
                          placeholder="Enter client name or company..."
                        />
                      </div>
                    </div>

                    {/* Problem Statement */}
                    <div className="mt-4">
                      <label className="form-label fw-semibold">
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

                    {/* Image Upload Section */}
                    <div className="mt-4">
                      <label className="form-label fw-semibold">
                        Attach Screenshots <span className="text-muted">(Optional)</span>
                      </label>
                      
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
                                  
                                  {img.uploading && (
                                    <div className="position-absolute top-50 start-50 translate-middle">
                                      <FaSpinner className="fa-spin text-primary" size={20} />
                                    </div>
                                  )}
                                  
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}