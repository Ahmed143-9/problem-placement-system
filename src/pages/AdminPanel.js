// src/pages/AdminPanel.js - UPDATED FOR NEW API ENDPOINTS
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaUserPlus, FaUsers, FaEdit, FaTrash, FaKey, FaEye, FaEyeSlash, 
  FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, 
  FaChevronLeft, FaChevronRight, FaSpinner, FaInfoCircle, FaSync, 
  FaBell, FaShieldAlt, FaUserCheck 
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function AdminPanel() {
  const { user, isSuperAdmin, isHiddenUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [formData, setFormData] = useState({
  name: '',
  email: '',
  password: '',
  role_ids: [2], // Default to 'user' role (id: 2)
  status: 1, // 1 for active, 0 for inactive
  department: '' // Add this line
});
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  
  // Add missing state variables
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [problems, setProblems] = useState([]);
  const [showFirstFaceModal, setShowFirstFaceModal] = useState(false);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingFirstFace, setLoadingFirstFace] = useState(false);
  const [firstFaceAssignments, setFirstFaceAssignments] = useState([]);
  const [selectedFirstFace, setSelectedFirstFace] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [savingFirstFace, setSavingFirstFace] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [loadingRoles, setLoadingRoles] = useState(false);
  
  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  useEffect(() => {
    loadUsers();
    loadRoles();
    loadFirstFaceAssignmentsFromStorage();
  }, []);
   const departments = [
  'Enterprise Business Solutions',
  'Board Management',
  'Support Stuff',
  'Administration and Human Resources',
  'Finance and Accounts',
  'Business Dev and Operations',
  'Implementation and Support',
  'Technical and Networking Department'
];
  // Load all roles from API
  const loadRoles = async () => {
    try {
      setLoadingRoles(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch('http://localhost:8000/api/v1/role/getAllRoles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      
      if (data.status === 'success' && data.data?.rolelist) {
        setRoles(data.data.rolelist);
        console.log('✅ Roles loaded successfully:', data.data.rolelist);
      } else {
        toast.error('Failed to load roles');
      }
    } catch (error) {
      console.error('Failed to load roles:', error);
      toast.error('Error loading roles');
    } finally {
      setLoadingRoles(false);
    }
  };

  // Load First Face assignments from localStorage
  const loadFirstFaceAssignmentsFromStorage = () => {
    try {
      const assignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      setFirstFaceAssignments(assignments);
      console.log('✅ First Face assignments loaded from localStorage:', assignments.length);
    } catch (error) {
      console.error('❌ Error loading First Face assignments:', error);
      toast.error('Failed to load First Face assignments');
    }
  };

// Load Users with New API
const loadUsers = async () => {
  try {
    setLoadingUsers(true);
    const token = localStorage.getItem('token');
    
    const response = await fetch('http://localhost:8000/api/v1/getAllUsers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.status === 'success' && data.data) {
      // Fetch detailed user info for each user to get their role
      const detailedUsers = await Promise.all(
        data.data.map(async (user) => {
          try {
            const userDetailResponse = await fetch('http://localhost:8000/api/v1/getUser', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
              },
              body: JSON.stringify({ id: user.id }),
            });

            if (userDetailResponse.ok) {
              const userDetailData = await userDetailResponse.json();
              if (userDetailData.status === 'success') {
                return {
                  ...user,
                  role: userDetailData.data.roles && userDetailData.data.roles.length > 0 
                    ? userDetailData.data.roles[0] 
                    : 'user',
                  username: userDetailData.data.username || user.email.split('@')[0],
                  status: userDetailData.data.status === 1 ? 'active' : 'inactive',
                  department: userDetailData.data.department || 'Not Assigned' // Fixed this line
                };
              }
            }
            return {
              ...user,
              role: 'user',
              username: user.email.split('@')[0],
              status: 'active',
              department: 'Not Assigned' // Fixed this line - removed invalid reference
            };
          } catch (error) {
            console.error(`Error fetching details for user ${user.id}:`, error);
            return {
              ...user,
              role: 'user',
              username: user.email.split('@')[0],
              status: 'active',
              department: 'Not Assigned' // Fixed this line
            };
          }
        })
      );

      // Filter out hidden users (Super Admin)
      const filteredUsers = detailedUsers.filter(user => !isHiddenUser(user));
      setUsers(filteredUsers);
      console.log('✅ Users loaded successfully (filtered):', filteredUsers.length);
      
      // Also set active users for First Face assignment
      const activeUsersList = filteredUsers.filter(u => u.status === 'active');
      setActiveUsers(activeUsersList);
      
    } else {
      toast.error(data.message || 'Failed to load users');
    }
  } catch (error) {
    console.error('Failed to load users:', error);
    toast.error('Network error while loading users');
  } finally {
    setLoadingUsers(false);
  }
};

  // Handle input changes for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle role selection (multi-select to array)
  const handleRoleChange = (e) => {
    const selectedRoleId = parseInt(e.target.value);
    setFormData(prev => ({
      ...prev,
      role_ids: [selectedRoleId] // Currently only one role, but kept as array for API compatibility
    }));
  };

const handleSaveUser = async () => {
  if (!isAdmin) {
    toast.error('Only Admin can add or edit users!');
    return;
  }

  if (!formData.name || !formData.email) {
    toast.error('Name and Email are required fields');
    return;
  }

  console.log('📥 Form data:', formData);

  // Password validation for new users
  if (!editingUser && !formData.password) {
    toast.error('Password is required for new user');
    return;
  }

  if (formData.password && !validatePassword(formData.password)) {
    toast.error('Password must be 8+ chars, include 1 uppercase, 1 number & 1 special char (@$!%*?&.)');
    return;
  }

  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
    };

    let url, method, requestBody;

    if (editingUser) {
      // Update user
      url = 'http://localhost:8000/api/v1/updateUser';
      method = 'POST';
      requestBody = {
        id: editingUser.id,
        name: formData.name,
        email: formData.email,
        password: formData.password || undefined, // Only include if provided
        role_ids: formData.role_ids,
        status: formData.status ? 1 : 0,
        department: formData.department || '' // Add this line
      };
    } else {
      // Create user
      url = 'http://localhost:8000/api/v1/createUser';
      method = 'POST';
      requestBody = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role_ids: formData.role_ids,
        status: formData.status ? 1 : 0,
        department: formData.department || '' // Add this line
      };
    }

    // Remove password field if it's empty (for updates)
    if (editingUser && !formData.password) {
      delete requestBody.password;
    }

    console.log('📡 Sending request to:', url);
    console.log('📦 Request body:', requestBody);

    const response = await fetch(url, {
      method: method,
      headers: headers,
      body: JSON.stringify(requestBody),
    });

    console.log('📊 Response status:', response.status);
    
    const data = await response.json();
    console.log('🟢 Response data:', data);

    if (data.status === 'success') {
      // Send notification
      if (editingUser) {
        sendUserUpdateNotification(editingUser, formData);
        toast.success('User updated successfully!');
      } else {
        sendUserCreationNotification(formData);
        toast.success('User created successfully!');
      }

      // Reset form and close modal
      setFormData({
        name: '',
        email: '',
        password: '',
        role_ids: [2], // Default to 'user' role
        status: 1,
        department: '' // Add this line
      });
      setShowModal(false);
      setEditingUser(null);
      setShowPassword(false);
      
      // Reload users
      loadUsers();
      
    } else {
      console.error('❌ API Error:', data);
      toast.error(data.message || data.errors || 'Failed to save user');
    }
  } catch (error) {
    console.error('❌ Save user error:', error);
    toast.error(error.message || 'Failed to save user');
  }
};

  // Send Notification for User Creation
  const sendUserCreationNotification = async (newUserData) => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const notificationPayload = {
        type: 'user_created',
        title: 'New User Created',
        message: `A new user "${newUserData.name}" has been created.`,
        recipient_role: 'admin',
        sender_id: user?.id,
      };

      const response = await fetch('http://localhost:8000/api/v1/notifications', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(notificationPayload),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('🔔 User creation notification sent');
      } else {
        console.error('❌ Failed to send user creation notification:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to send user creation notification:', error);
    }
  };

  // Send Notification for User Update
  const sendUserUpdateNotification = async (oldUserData, newUserData) => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const notificationPayload = {
        type: 'user_updated',
        title: 'User Updated',
        message: `User "${oldUserData.name}" has been updated.`,
        recipient_role: 'admin',
        sender_id: user?.id,
      };

      const response = await fetch('http://localhost:8000/api/v1/notifications', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(notificationPayload),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('🔔 User update notification sent');
      } else {
        console.error('❌ Failed to send user update notification:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to send user update notification:', error);
    }
  };

  // Send Notification for User Deletion
  const sendUserDeletionNotification = async (deletedUserData) => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const notificationPayload = {
        type: 'user_deleted',
        title: 'User Deleted',
        message: `User "${deletedUserData.name}" has been deleted from the system.`,
        recipient_role: 'admin',
        sender_id: user?.id,
      };

      const response = await fetch('http://localhost:8000/api/v1/notifications', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(notificationPayload),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('🔔 User deletion notification sent');
      } else {
        console.error('❌ Failed to send user deletion notification:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to send user deletion notification:', error);
    }
  };

  // Send Notification for User Status Change
  const sendUserStatusNotification = async (userData, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      const notificationPayload = {
        type: 'user_status_changed',
        title: 'User Status Changed',
        message: `User "${userData.name}" status has been changed to "${newStatus}".`,
        recipient_role: 'admin',
        sender_id: user?.id,
      };

      const response = await fetch('http://localhost:8000/api/v1/notifications', {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(notificationPayload),
      });

      const data = await response.json();
      
      if (data.success) {
        console.log('🔔 User status notification sent');
      } else {
        console.error('❌ Failed to send user status notification:', data.error);
      }
    } catch (error) {
      console.error('❌ Failed to send user status notification:', error);
    }
  };

  // Helper Functions
  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

const resetForm = () => {
  setFormData({
    name: '',
    email: '',
    password: '',
    role_ids: [2],
    status: 1,
    department: '' // Changed from 'departments' to empty string
  });
  setEditingUser(null);
  setShowPassword(false);
};
const openEditModal = async (userToEdit) => {
  try {
    const token = localStorage.getItem('token');
    
    // Fetch detailed user info
    const response = await fetch('http://localhost:8000/api/v1/getUser', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ id: userToEdit.id }),
    });

    if (response.ok) {
      const data = await response.json();
      if (data.status === 'success') {
        const userData = data.data;
        setEditingUser(userData);
        setFormData({
          name: userData.name,
          email: userData.email,
          password: '', // Keep empty for security
          role_ids: userData.roles && userData.roles.length > 0 
            ? [roles.find(r => r.name === userData.roles[0])?.id || 2] 
            : [2],
          status: userData.status,
          department: userData.department || '' // Add this line
        });
        setShowModal(true);
        setShowPassword(false);
      }
    }
  } catch (error) {
    console.error('Error loading user details:', error);
    toast.error('Failed to load user details');
  }
};

  // ✅ validatePassword function
  const validatePassword = (password) => {
    console.log('🔍 Frontend validating password:', password);
    console.log('🔍 Password details:', {
      length: password.length,
      hasUppercase: /[A-Z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&.]/.test(password),
    });

    if (!password || password.length < 8) {
      console.log('❌ Password too short or empty');
      return false;
    }
    
    if (!/[A-Z]/.test(password)) {
      console.log('❌ No uppercase letter found');
      return false;
    }
    
    if (!/\d/.test(password)) {
      console.log('❌ No number found');
      return false;
    }
    
    if (!/[@$!%*?&.]/.test(password)) {
      console.log('❌ No special character found');
      return false;
    }
    
    console.log('✅ Frontend password validation passed');
    return true;
  };

  const getRoleBadge = role => {
    const badges = { 
      admin: 'bg-danger',
      team_leader: 'bg-primary',  
      user: 'bg-info'
    };
    return badges[role] || 'bg-secondary';
  };

  const getStatusBadge = status => (status === 'active' ? 'bg-success' : 'bg-secondary');

  const handleViewEmail = (email) => {
    setSelectedEmail(email);
    setShowEmailModal(true);
  };

// Load First Face assignments from backend
const loadFirstFaceAssignments = async () => {
  setLoadingFirstFace(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8000/api/first-face-assignments/getAll', {
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
        setFirstFaceAssignments(data.data);
        console.log('✅ First Face assignments loaded from backend:', data.data.length);
      }
    }
  } catch (error) {
    console.error('❌ Error loading First Face assignments:', error);
    toast.error('Failed to load First Face assignments');
  } finally {
    setLoadingFirstFace(false);
  }
};

// Create First Face assignment via backend
const handleFirstFaceAssignment = async () => {
  if (!selectedFirstFace || !selectedDepartment) {
    toast.error('Please select both a user and a department');
    return;
  }

  setSavingFirstFace(true);
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8000/api/first-face-assignments/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        user_id: parseInt(selectedFirstFace),
        department: selectedDepartment === 'all' ? null : selectedDepartment,
        is_active: true,
      }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      setSelectedFirstFace('');
      setSelectedDepartment('');
      setShowFirstFaceModal(false);
      loadFirstFaceAssignments();
      toast.success(data.messages[0]);
    } else {
     
      toast.error(data.messages?.[0] || 'Failed to create First Face assignment');

    }
  } catch (error) {
    console.error('❌ Error creating First Face assignment:', error);
    toast.error(error.message || 'Failed to create First Face assignment');
  } finally {
    setSavingFirstFace(false);
  }
};

// Remove First Face assignment via backend
const handleRemoveFirstFace = async (id) => {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch('http://localhost:8000/api/first-face-assignments/delete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({ id }),
    });

    const data = await response.json();

    if (data.status === 'success') {
      loadFirstFaceAssignments();
      toast.success('First Face assignment removed!');
    } else {
      toast.error(data.messages[0] || 'Failed to remove First Face assignment');
    }
  } catch (error) {
    console.error('❌ Error removing First Face assignment:', error);
    toast.error(error.message || 'Failed to remove First Face assignment');
  }
};


  const loadActiveUsers = async () => {
    setLoadingActiveUsers(true);
    try {
      const activeUsersList = users.filter(u => u.status === 'active');
      setActiveUsers(activeUsersList);
      console.log('✅ Active users filtered successfully:', activeUsersList.length);
    } catch (error) {
      console.error('Failed to filter active users:', error);
      toast.error('Error while preparing active users list');
    } finally {
      setLoadingActiveUsers(false);
    }
  };

  const handleEditUser = (userId) => {
    if (!isAdmin) {
      toast.error('Only Admin can edit users!');
      return;
    }
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      openEditModal(userToEdit);
    }
  };

  // Toggle user status - NOTE: You'll need to create this API endpoint
  const handleToggleStatus = async (userId) => {
    if (!isAdmin) {
      toast.error('Only Admin can change user status!');
      return;
    }
    
    try {
      const userToUpdate = users.find(u => u.id === userId);
      const newStatus = userToUpdate.status === 'active' ? 'inactive' : 'active';
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      // You'll need to create this API endpoint
      const response = await fetch(`http://localhost:8000/api/v1/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: headers,
      });

      const data = await response.json();

      if (data.status === 'success') {
        sendUserStatusNotification(userToUpdate, newStatus);
        toast.success('User status updated!');
        loadUsers();
      } else {
        toast.error(data.message || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  // Reset user password - NOTE: You'll need to create this API endpoint
  const handleResetPassword = async (userId, userName) => {
    if (!isAdmin) {
      toast.error('Only Admin can reset passwords!');
      return;
    }
    
    const newPassword = prompt(`Enter new password for ${userName}:`);
    if (!newPassword) return;
    
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      // You'll need to create this API endpoint
      const response = await fetch(`http://localhost:8000/api/v1/users/${userId}/reset-password`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ password: newPassword }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        toast.success(`Password reset successfully for ${userName}!`);
        loadUsers();
      } else {
        toast.error(data.message || 'Failed to reset password');
      }
    } catch (error) {
      toast.error('Failed to reset password');
      console.error(error);
    }
  };

  // Delete user - NOTE: You'll need to create this API endpoint
  const handleDeleteUser = async (userId) => {
    if (!isAdmin) {
      toast.error('Only Admin can delete users!');
      return;
    }
    
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const userToDelete = users.find(u => u.id === userId);
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      };

      // You'll need to create this API endpoint
      const response = await fetch(`http://localhost:8000/api/v1/users/${userId}`, {
        method: 'DELETE',
        headers: headers,
      });

      const data = await response.json();

      if (data.status === 'success') {
        sendUserDeletionNotification(userToDelete);
        toast.success('User deleted successfully!');
        loadUsers();
      } else {
        toast.error(data.message || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  const getUnassignedProblemsByDepartment = () => {
    const unassigned = problems.filter(p => !p.assigned_to && p.status === 'pending');
    const byDepartment = {
      all: unassigned.length,
      'Enterprise Business Solutions': unassigned.filter(p => p.department === 'Enterprise Business Solutions').length,
      'Board Management': unassigned.filter(p => p.department === 'Board Management').length,
      'Support Stuff': unassigned.filter(p => p.department === 'Support Stuff').length,
      'Administration and Human Resources': unassigned.filter(p => p.department === 'Administration and Human Resources').length,
      'Finance and Accounts': unassigned.filter(p => p.department === 'Finance and Accounts').length,
      'Business Dev and Operations': unassigned.filter(p => p.department === 'Business Dev and Operations').length,
      'Implementation and Support': unassigned.filter(p => p.department === 'Implementation and Support').length,
      'Technical and Networking Department': unassigned.filter(p => p.department === 'Technical and Networking Department').length
    };
    return byDepartment;
  };

  const unassignedProblemsByDept = getUnassignedProblemsByDepartment();
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
                  className="nav-link text-white rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
                  onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(108, 117, 125, 0.2)'}
                  onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
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
              {(user?.role === 'admin' || isSuperAdmin) && (
                <li className="nav-item mb-2">
                  <Link 
                    to="/admin" 
                    className="nav-link text-white bg-primary rounded d-flex align-items-center"
                    style={sidebarLinkStyle}
                    title="Admin Panel"
                  >
                    <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} /> 
                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>User Management</span>}
                  </Link>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Main Content */}
        <div 
          className="flex-grow-1 p-3" 
          style={{ 
            overflowY: 'auto',
            transition: 'margin-left 0.3s ease'
          }}
        >
          <div className="card shadow-sm border-0">
            {/* Header */}
            <div className="card-header bg-danger text-white">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <div className="flex-grow-1">
                  <h4 className="mb-1 fw-semibold text-truncate">
                    <FaUsers className="me-2" /> 
                    User Management Panel
                    {isSuperAdmin && (
                        <span className="badge bg-warning text-dark ms-2">
                          <FaShieldAlt className="me-1" />
                          Super Admin
                        </span>
                      )}
                  </h4>
                  <small className="opacity-75">
                    {isAdmin ? 'Add and manage Team Leaders and Users' : 'View team members (Read-only access)'}
                  </small>
                </div>
                {isAdmin && (
                  <div className="d-flex gap-2">
                    <button
                      className="btn btn-warning btn-sm"
                      onClick={() => {
                        loadActiveUsers();
                        setShowFirstFaceModal(true);
                      }}
                      disabled={loadingActiveUsers}
                    >
                      {loadingActiveUsers ? (
                        <>
                          <FaSpinner className="me-1 fa-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <FaUserCheck className="me-1" />
                          First Face
                        </>
                      )}
                    </button>
                    
                    <button
                      className="btn btn-light btn-sm"
                      onClick={() => {
                        setEditingUser(null);
                        setFormData({ name: '', email: '', password: '', role_ids: [2], status: 1 });
                        setShowModal(true);
                        setShowPassword(false);
                      }}
                    >
                      <FaUserPlus className="me-1" />
                      <span>Add New User</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="card-body">
              {!isAdmin && (
                <div className="alert alert-info mb-4">
                  <strong>Note:</strong> As a Team Leader, you can view all users but cannot add, edit, or delete them.
                </div>
              )}

              {/* Loading States for Users Table */}
              {loadingUsers ? (
                <div className="text-center py-5">
                  <FaSpinner className="fa-spin fs-1 text-primary mb-3" />
                  <p className="text-muted">Loading users...</p>
                </div>
              ) : (
                <>
                  {/* First Face Assignments Section with Loading */}
                  {isAdmin && (
                    <div className="card border-warning mb-4">
                      <div className="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                        <h6 className="mb-0">
                          <FaUserCheck className="me-2" />
                          Active First Face Assignments
                          {loadingFirstFace && (
                            <FaSpinner className="fa-spin ms-2" />
                          )}
                        </h6>
                        <button 
                          className="btn btn-sm btn-outline-dark"
                          onClick={loadFirstFaceAssignments}
                          disabled={loadingFirstFace}
                        >
                          <FaSync className={loadingFirstFace ? 'fa-spin' : ''} />
                        </button>
                      </div>
                      <div className="card-body p-3">
                        {loadingFirstFace ? (
                          <div className="text-center py-3">
                            <FaSpinner className="fa-spin text-warning me-2" />
                            Loading First Face assignments...
                          </div>
                        ) : firstFaceAssignments.filter(ff => ff.is_active)
.length > 0 ? (
                          <div className="row g-2">
                            {firstFaceAssignments.filter(ff => ff.is_active)
.map(assignment => (
                              <div key={assignment.id} className="col-md-6">
                                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                  <div>
                                    <strong>{assignment.user?.name}</strong>
                                    <small className="text-muted d-block">
                                      {assignment.department === null ? 'All Departments' : assignment.department}
                                    </small>
                                    <small className="text-muted">
                                      Assigned: {new Date(assignment.assigned_at).toLocaleDateString()}
                                    </small>
                                  </div>
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => handleRemoveFirstFace(assignment.id)}
                                    title="Remove First Face"
                                    disabled={savingFirstFace}
                                  >
                                    <FaTrash />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center text-muted py-2">
                            <FaInfoCircle className="me-2" />
                            No active First Face assignments
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Stats Cards */}
                  <div className="row g-3 mb-4">
                    <div className="col-md-3">
                      <div className="card border-primary text-center h-100">
                        <div className="card-body">
                          <h3 className="text-primary mb-0">{users.filter(u => u.role === 'admin').length}</h3>
                          <small className="text-muted">Admin</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-info text-center h-100">
                        <div className="card-body">
                          <h3 className="text-info mb-0">{users.filter(u => u.role === 'user').length}</h3>
                          <small className="text-muted">Users</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-success text-center h-100">
                        <div className="card-body">
                          <h3 className="text-success mb-0">{users.filter(u => u.status === 'active').length}</h3>
                          <small className="text-muted">Active Users</small>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-3">
                      <div className="card border-warning text-center h-100">
                        <div className="card-body">
                          <h3 className="text-warning mb-0">{firstFaceAssignments.filter(ff => ff.is_active)
.length}</h3>
                          <small className="text-muted">First Face Assignments</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Users Table */}
                  <div className="table-responsive">
                    <table className="table table-striped">
                      <thead className="table-dark">
                        <tr>
                          <th>Name</th>
                          <th>Username</th>
                          <th style={{ textAlign: 'center' }}>Email</th>
                          <th>Role</th>
                          <th>Department</th>
                          <th>Status</th>
                          <th style={{ textAlign: 'center' }}>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.length === 0 ? (
                          <tr>
                            <td colSpan="7" className="text-center py-5">
                              <FaUsers className="fs-1 text-muted mb-3 d-block mx-auto" />
                              <p className="text-muted mb-3">No users found.</p>
                              {isAdmin && (
                                <button 
                                  className="btn btn-primary" 
                                  onClick={() => {
                                    setEditingUser(null);
                                    setFormData({ name: '', email: '', password: '', role_ids: [2], status: 1 });
                                    setShowModal(true);
                                    setShowPassword(false);
                                  }}
                                >
                                  <FaUserPlus className="me-2" /> 
                                  Add User
                                </button>
                              )}
                            </td>
                          </tr>
                        ) : (
                          users.map(u => (
                            <tr key={u.id} className="align-middle">
                              <td className="fw-semibold">
                                {u.name}
                                {firstFaceAssignments.some(ff => (ff.userId === u.id) && ff.isActive) && (
                                  <span className="badge bg-warning text-dark ms-1" title="First Face">
                                    <FaBell className="me-1" /> FF
                                  </span>
                                )}
                              </td>
                              <td>
                                <code className="bg-light px-2 py-1 rounded d-inline-block">
                                  {u.username || u.email.split('@')[0]}
                                </code>
                              </td>
                              <td style={{ textAlign: 'center' }}>
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => handleViewEmail(u.email)}
                                  title="View Email"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <FaEye />
                                </button>
                              </td>
                              <td>
                                <span className={`badge ${getRoleBadge(u.role)}`}>
                                  {u.role === 'admin' ? ' Admin' : 
                                  u.role === 'team_leader' ? ' Team Leader' : 
                                  ' User'}
                                </span>
                              </td>
                              <td>{u.department}</td>
                              <td>
                                <span className={`badge ${getStatusBadge(u.status)}`}>
                                  {u.status}
                                </span>
                              </td>
                              <td>
                                {isAdmin ? (
                                  <div className="d-flex gap-1 justify-content-center">
                                    <button 
                                      className="btn btn-sm btn-outline-primary" 
                                      onClick={() => handleEditUser(u.id)} 
                                      title="Edit"
                                      style={{ padding: '6px 10px' }}
                                    >
                                      <FaEdit />
                                    </button>
                                    <button 
                                      className={`btn btn-sm btn-outline-${u.status === 'active' ? 'warning' : 'success'}`} 
                                      onClick={() => handleToggleStatus(u.id)} 
                                      title={u.status === 'active' ? 'Deactivate' : 'Activate'}
                                      style={{ padding: '6px 10px' }}
                                    >
                                      {u.status === 'active' ? '⏸' : '▶'}
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-info" 
                                      onClick={() => handleResetPassword(u.id, u.name)} 
                                      title="Reset Password"
                                      style={{ padding: '6px 10px' }}
                                    >
                                      <FaKey />
                                    </button>
                                    <button 
                                      className="btn btn-sm btn-outline-danger" 
                                      onClick={() => handleDeleteUser(u.id)} 
                                      title="Delete"
                                      style={{ padding: '6px 10px' }}
                                    >
                                      <FaTrash />
                                    </button>
                                  </div>
                                ) : (
                                  <span className="badge bg-secondary">View Only</span>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email View Modal */}
      {showEmailModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-info text-white py-2">
                <h6 className="modal-title mb-0 fw-semibold">
                  <FaEye className="me-2" />
                  Email Address
                </h6>
                <button 
                  type="button" 
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => setShowEmailModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="p-3 bg-light rounded text-center">
                  <p className="mb-0 fs-5 fw-semibold text-primary">
                    {selectedEmail}
                  </p>
                </div>
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-info btn-sm"
                    onClick={() => setShowEmailModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* First Face Assignment Modal */}
      {showFirstFaceModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-warning text-dark">
                <h5 className="modal-title">
                  <FaUserCheck className="me-2" />
                  First Face Assignment
                </h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={() => {
                    setShowFirstFaceModal(false);
                    setSelectedFirstFace('');
                    setSelectedDepartment('');
                  }}
                  disabled={savingFirstFace}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label fw-semibold">Select First Face User:</label>
                  {loadingActiveUsers ? (
                    <div className="text-center py-3">
                      <FaSpinner className="fa-spin text-warning me-2" />
                      Loading active users...
                    </div>
                  ) : (
                    <>
                      <select
                        className="form-control"
                        value={selectedFirstFace}
                        onChange={(e) => setSelectedFirstFace(e.target.value)}
                        disabled={savingFirstFace}
                      >
                        <option value="">-- Select User --</option>
                        {activeUsers.length > 0 ? (
                          activeUsers.map(user => (
                            <option key={user.id} value={user.id.toString()}>
                              {user.name} 
                              {user.role === 'team_leader' && ' '} 
                              {user.role === 'user' && ' '} 
                              - {user.department}
                              {user.role === 'admin' && ' '}
                            </option>
                          ))
                        ) : (
                          <option value="" disabled>No active users available</option>
                        )}
                      </select>
                      <small className="text-muted">
                        You can select any active user (Admin, Team Leader or Regular User)
                      </small>
                    </>
                  )}
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold">Assign For Department:</label>
                  <select
                    className="form-control"
                    value={selectedDepartment}
                    onChange={(e) => setSelectedDepartment(e.target.value)}
                    disabled={savingFirstFace}
                  >
                    <option value="">Select Department</option>
                    <option value="all">All Departments</option>
                    <option value="Enterprise Business Solutions">Enterprise Business Solutions</option>
                    <option value="Board Management">Board Management</option>
                    <option value="Support Stuff">Support Stuff</option>
                    <option value="Administration and Human Resources">Administration and Human Resources</option>
                    <option value="Finance and Accounts">Finance and Accounts</option>
                    <option value="Business Dev and Operations">Business Dev and Operations</option>
                    <option value="Implementation and Support">Implementation and Support</option>
                    <option value="Technical and Networking Department">Technical and Networking Department</option>
                  </select>
                  <small className="text-muted">
                    {!selectedDepartment 
                      ? 'Please select a department' 
                      : selectedDepartment === 'all'
                        ? 'Will receive problems from ALL departments'
                        : `Will receive only ${selectedDepartment} department problems`
                    }
                  </small>
                </div>

                <div className="d-flex gap-2 mt-4">
                  <button 
                    className="btn btn-warning flex-grow-1"
                    onClick={handleFirstFaceAssignment}
                    disabled={!selectedFirstFace || activeUsers.length === 0 || savingFirstFace}
                  >
                    {savingFirstFace ? (
                      <>
                        <FaSpinner className="fa-spin me-2" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <FaUserCheck className="me-2" />
                        Set as First Face
                      </>
                    )}
                  </button>
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowFirstFaceModal(false);
                      setSelectedFirstFace('');
                      setSelectedDepartment('');
                    }}
                    disabled={savingFirstFace}
                  >
                    Cancel
                  </button>
                </div>

                {/* Process Explanation */}
                <div className="mt-4 p-3 bg-light rounded">
                  <h6 className="text-warning mb-2">
                    <FaInfoCircle className="me-2" />
                    How First Face Works:
                  </h6>
                  <ol className="small mb-0">
                    <li>Select a user and department above</li>
                    <li>Click "Set as First Face" to save the assignment</li>
                    <li>New problems in selected department will auto-assign to this user</li>
                    <li>First Face users get priority for new problem assignments</li>
                    <li>You can have different First Face users for different departments</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit User Modal */}
      {showModal && isAdmin && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white">
                <h5 className="modal-title">
                  <FaUserPlus className="me-2" /> 
                  {editingUser ? 'Edit User' : 'Add New User'}
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white" 
                  onClick={() => { 
                    setShowModal(false); 
                    setEditingUser(null); 
                    setShowPassword(false);
                  }}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Full Name *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleInputChange} 
                      placeholder="John Doe" 
                    />
                  </div>
                  
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Email *</label>
                    <input
                      type="email"
                      className="form-control"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="john@example.com"
                    />
                    <small className="text-muted">Username will be generated from email</small>
                  </div>

                  {/* Password Field */}
                  <div className="col-md-6 position-relative">
                    <label className="form-label fw-semibold">
                      <FaKey className="me-1" /> 
                      Password 
                      {editingUser ? (
                        <small className="text-muted"> (Leave blank to keep current password)</small>
                      ) : (
                        <span className="text-danger"> *</span>
                      )}
                    </label>
                    
                    <div className="input-group">
                      <input 
                        type={showPassword ? "text" : "password"} 
                        className="form-control" 
                        name="password" 
                        value={formData.password} 
                        onChange={handleInputChange}
                        onFocus={() => setShowPasswordRequirements(true)}
                        onBlur={() => setShowPasswordRequirements(false)}
                        placeholder={
                          editingUser 
                            ? "Leave blank to keep current password" 
                            : "8+ chars, 1 uppercase, 1 number, 1 special char"
                        } 
                      />
                      <button 
                        className="btn btn-outline-secondary"
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        title={showPassword ? "Hide Password" : "Show Password"}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    
                    {editingUser && formData.password && (
                      <div className="form-text text-warning">
                        <FaInfoCircle className="me-1" />
                        New password will replace the current one
                      </div>
                    )}
                    
                    {showPasswordRequirements && !editingUser && (
                      <div className="form-text">
                        Password must contain:
                        <ul className="small mb-0">
                          <li>At least 8 characters</li>
                          <li>1 uppercase letter</li>
                          <li>1 number</li>
                          <li>1 special character (@$!%*?&.)</li>
                          <li className="text-success">Dot (.) is allowed!</li>
                        </ul>
                      </div>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Role *</label>
                    {loadingRoles ? (
                      <div className="text-center py-2">
                        <FaSpinner className="fa-spin me-2" />
                        Loading roles...
                      </div>
                    ) : (
                      <select 
                        className="form-control" 
                        name="role_ids" 
                        value={formData.role_ids[0] || ''} 
                        onChange={handleRoleChange}
                      >
                        <option value="">Select Role</option>
                        {roles.map(role => (
                          <option key={role.id} value={role.id}>
                            {role.name === 'admin' ? 'Admin' : 
                             role.name === 'team_leader' ? 'Team Leader' : 
                             'User'}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select 
                      className="form-control" 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange}
                    >
                      <option value={1}>Active</option>
                      <option value={0}>Inactive</option>
                    </select>
                  </div>
                  <div className="col-md-6">
  <label className="form-label fw-semibold">Department</label>
  <select
    className="form-control"
    name="department"
    value={formData.department}
    onChange={handleInputChange}
  >
    <option value="">Not Assigned</option>
    {departments.map(dept => (
      <option key={dept} value={dept}>
        {dept}
      </option>
    ))}
  </select>
  <small className="text-muted">Optional: Assign user to a department</small>
</div>
                </div>

                <div className="d-flex gap-2 mt-4 pt-3 border-top">
                  <button 
                    className="btn btn-primary flex-grow-1" 
                    onClick={handleSaveUser}
                  >
                    {editingUser ? 'Update User' : 'Add User'}
                  </button>
                  <button 
                    className="btn btn-secondary" 
                    onClick={() => { 
                      setShowModal(false); 
                      setEditingUser(null); 
                      setShowPassword(false);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}