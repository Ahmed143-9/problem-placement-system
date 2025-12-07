// src/pages/AdminPanel.js - COMPLETE CODE WITH SUPER ADMIN (FIXED)
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaUserPlus, FaUsers, FaEdit, FaTrash, FaKey, FaEye, FaEyeSlash, FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaChevronLeft, FaChevronRight, FaRobot, FaTasks, FaArrowRight, FaUserCheck, FaLayerGroup, FaUserTie, FaSpinner, FaInfoCircle, FaSync, FaBell, FaShieldAlt } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';

export default function AdminPanelUserManagement() {
  const { user, API_BASE_URL, isSuperAdmin, isHiddenUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [problems, setProblems] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState('');
  const [showFirstFaceModal, setShowFirstFaceModal] = useState(false);
  const [selectedFirstFace, setSelectedFirstFace] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [firstFaceStats, setFirstFaceStats] = useState({ assigned: 0, total: 0 });
  const [firstFaceAssignments, setFirstFaceAssignments] = useState([]);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  
  // Loading states
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [loadingFirstFace, setLoadingFirstFace] = useState(false);
  const [loadingActiveUsers, setLoadingActiveUsers] = useState(false);
  const [savingFirstFace, setSavingFirstFace] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    email: '',
    password: '',
    role: 'user',
    department: '',
    status: 'active'
  });

  // Handle input changes for form fields
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const isAdmin = user?.role === 'admin' || isSuperAdmin;

  useEffect(() => {
    loadUsers();
    loadProblems();
    loadFirstFaceAssignments();
    loadActiveUsers();
  }, [API_BASE_URL]);

  // Load Users with Hidden User Filtering
  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/users`, {
        headers: headers,
      });

      const data = await response.json();

      if (data.success) {
        // FILTER OUT HIDDEN USERS (Super Admin)
        const filteredUsers = data.users.filter(user => !isHiddenUser(user));
        setUsers(filteredUsers);
        console.log('✅ Users loaded successfully (filtered):', filteredUsers.length);
        
        // Save users to localStorage for name resolution
        localStorage.setItem('system_users', JSON.stringify(data.users));
      } else {
        toast.error(data.error || 'Failed to load users');
      }
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error('Network error while loading users');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Load Problems
  const loadProblems = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/problems`, {
        headers: headers,
      });

      const data = await response.json();

      if (data.success) {
        setProblems(data.problems);
      } else {
        toast.error(data.error || 'Failed to load problems');
      }
    } catch (error) {
      console.error('Failed to load problems:', error);
      toast.error('Network error while loading problems');
    }
  };

  // Load First Face Assignments with Name Resolution
  const loadFirstFaceAssignments = async () => {
    setLoadingFirstFace(true);
    try {
      console.log('🔄 Loading first face assignments...');
      
      // Load from localStorage first for immediate display
      const localAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      
      // Resolve user names
      const systemUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      const assignmentsWithNames = localAssignments.map(assignment => {
        const user = systemUsers.find(u => u.id === assignment.userId);
        return {
          ...assignment,
          userName: user ? user.name : assignment.userName || 'Unknown User',
          userEmail: user ? user.email : assignment.userEmail || ''
        };
      });

      console.log('📋 First Face Assignments with Names:', assignmentsWithNames);
      setFirstFaceAssignments(assignmentsWithNames);

    } catch (error) {
      console.error('🔴 Failed to load first face assignments:', error);
      toast.error('Failed to load first face assignments');
    } finally {
      setLoadingFirstFace(false);
    }
  };

  // Load Active Users with Hidden User Filtering
  const loadActiveUsers = async () => {
    setLoadingActiveUsers(true);
    try {
      console.log('🔄 Loading active users...');
      
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/users/active`, {
        headers: headers,
      });

      console.log('🔵 Active Users Response Status:', response.status);

      if (response.status === 401) {
        console.error('🔴 Authentication failed');
        toast.error('Please login again');
        return;
      }

      const data = await response.json();
      console.log('🟢 Active Users Data:', data);

      if (data.success) {
        // FILTER OUT HIDDEN USERS (Super Admin)
        const filteredActiveUsers = (data.activeUsers || []).filter(user => !isHiddenUser(user));
        setActiveUsers(filteredActiveUsers);
        console.log('✅ Active users loaded (filtered):', filteredActiveUsers.length);
      } else {
        console.error('🔴 Active Users API Error:', data.error);
        // Fallback to all users if active users endpoint fails
        const allUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
        const activeUsers = allUsers.filter(u => u.status === 'active' && !isHiddenUser(u));
        setActiveUsers(activeUsers);
        console.log('📋 Using fallback active users (filtered):', activeUsers.length);
      }
    } catch (error) {
      console.error('🔴 Failed to load active users:', error);
      // Fallback to localStorage users
      const allUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      const activeUsers = allUsers.filter(u => u.status === 'active' && !isHiddenUser(u));
      setActiveUsers(activeUsers);
      console.log('📋 Using localStorage active users (filtered):', activeUsers.length);
    } finally {
      setLoadingActiveUsers(false);
    }
  };

  // Handle First Face Assignment with Notification Setup
  const handleFirstFaceAssignment = async () => {
    if (!selectedFirstFace) {
      toast.error('Please select a First Face');
      return;
    }

    setSavingFirstFace(true);
    try {
      console.log('🔄 Starting First Face assignment...');
      
      // Get user details
      let selectedUser = activeUsers.find(u => u.id == selectedFirstFace);
      
      if (!selectedUser) {
        // Fallback: check all users from localStorage
        const allUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
        selectedUser = allUsers.find(u => u.id == selectedFirstFace);
      }

      if (!selectedUser) {
        toast.error('Selected user not found');
        return;
      }

      console.log('👤 Selected user:', selectedUser);

      const newAssignment = {
        id: Date.now(), // Unique ID
        userId: parseInt(selectedFirstFace),
        userName: selectedUser.name,
        userEmail: selectedUser.email,
        department: selectedDepartment,
        type: selectedDepartment === 'all' ? 'all' : 'specific',
        isActive: true,
        assignedAt: new Date().toISOString(),
        assignedBy: user.name,
        assignedById: user.id
      };

      console.log('📝 New assignment:', newAssignment);

      // Save to localStorage for frontend auto-assignment
      const existingAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      console.log('📋 Existing assignments:', existingAssignments);
      
      // Deactivate previous assignments for same department or all departments
      const updatedAssignments = existingAssignments.map(assignment => {
        // If assigning for all departments, deactivate all existing assignments
        if (selectedDepartment === 'all') {
          return { ...assignment, isActive: false };
        }
        // Otherwise, only deactivate assignments for the same department
        else if (assignment.department === selectedDepartment) {
          return { ...assignment, isActive: false };
        }
        // Keep other assignments as they are
        else {
          return assignment;
        }
      });

      // Add new assignment
      updatedAssignments.push(newAssignment);
      localStorage.setItem('firstFace_assignments', JSON.stringify(updatedAssignments));

      console.log('💾 Saved to localStorage:', updatedAssignments);

      // Send notification to the assigned user
      sendFirstFaceAssignmentNotification(newAssignment);

      toast.success(`✅ ${selectedUser.name} set as First Face for ${selectedDepartment === 'all' ? 'All Departments' : selectedDepartment}`);
      setShowFirstFaceModal(false);
      setSelectedFirstFace('');
      setSelectedDepartment('');
      
      // Reload assignments to show in UI
      await loadFirstFaceAssignments();
    } catch (error) {
      console.error('❌ First Face Assignment Error:', error);
      toast.error('Failed to assign First Face: ' + error.message);
    } finally {
      setSavingFirstFace(false);
    }
  };

  // Send Notification for First Face Assignment
  const sendFirstFaceAssignmentNotification = (assignment) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: assignment.userId,
        userName: assignment.userName,
        type: 'first_face_assignment',
        title: '🎯 First Face Assignment',
        message: `You have been assigned as First Face for ${assignment.department === 'all' ? 'All Departments' : assignment.department}. New problems will be automatically assigned to you.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        assignment: assignment
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('🔔 First Face assignment notification sent:', notification);
      
      // Show toast notification
      toast.info(`Notification sent to ${assignment.userName}`);
    } catch (error) {
      console.error('❌ Failed to send notification:', error);
    }
  };

  // Handle Remove First Face with Notification
  const handleRemoveFirstFace = async (assignmentId) => {
    try {
      console.log('🔄 Removing First Face Assignment:', assignmentId);
      
      if (!window.confirm('Are you sure you want to remove this First Face assignment?')) {
        return;
      }

      // Find assignment details before removal
      const existingAssignments = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
      const assignmentToRemove = existingAssignments.find(a => a.id === assignmentId);
      
      // Remove from localStorage
      const updatedAssignments = existingAssignments.filter(assignment => assignment.id !== assignmentId);
      localStorage.setItem('firstFace_assignments', JSON.stringify(updatedAssignments));

      console.log('✅ Removed from localStorage');

      // Send removal notification
      if (assignmentToRemove) {
        sendFirstFaceRemovalNotification(assignmentToRemove);
      }

      toast.success('First Face assignment removed successfully!');
      loadFirstFaceAssignments(); // Refresh the list
    } catch (error) {
      console.error('🔴 Remove First Face Error:', error);
      toast.error('Failed to remove First Face: ' + error.message);
    }
  };

  // Send Notification for First Face Removal
  const sendFirstFaceRemovalNotification = (assignment) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: assignment.userId,
        userName: assignment.userName,
        type: 'first_face_removal',
        title: '❌ First Face Assignment Removed',
        message: `Your First Face assignment for ${assignment.department === 'all' ? 'All Departments' : assignment.department} has been removed.`,
        isRead: false,
        createdAt: new Date().toISOString(),
        assignment: assignment
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('First Face removal notification sent:', notification);
      
      // Show toast notification
      toast.info(`Removal notification sent to ${assignment.userName}`);
    } catch (error) {
      console.error('Failed to send removal notification:', error);
    }
  };

  // Handle Save User with Notification
  const handleSaveUser = async () => {
    if (!isAdmin) return toast.error('Only Admin can add or edit users!');
    if (!formData.name || !formData.username || !formData.email) return toast.error('Fill all required fields');

    // Log form data before validation
    console.log('📥 Form data before validation:', formData);
  
    // Log department value specifically with detailed inspection
    console.log('🔍 Department inspection:', {
      value: formData.department,
      type: typeof formData.department,
      length: formData.department.length,
      charCodes: formData.department.split('').map((char, index) => ({ index, char, code: char.charCodeAt(0) })),
      trimmed: formData.department.trim(),
      hasWhitespace: /\s/.test(formData.department),
      hasControlChars: /[\x00-\x1F\x7F]/.test(formData.department)
    });
  
    // Log password value specifically
    console.log('🔍 Password inspection:', {
      value: formData.password,
      type: typeof formData.password,
      length: formData.password.length,
      hasDot: formData.password.includes('.'),
      hasAt: formData.password.includes('@')
    });

    // Password validation - BOTH new user AND edit mode যদি password provide করা হয়
    if (formData.password) {
      // যদি password দেওয়া থাকে (edit বা new উভয় ক্ষেত্রেই), validation চেক করব
      if (!validatePassword(formData.password)) {
        return toast.error('Password must be 8+ chars, include 1 uppercase, 1 number & 1 special char (@$!%*?&.)');
      }
    } 
    // New user এর জন্য password required
    else if (!editingUser) {
      return toast.error('Password is required for new user');
    }
  
    // Log the data being sent
    console.log('📤 Sending user data to backend:', formData);
  
    // Check if department is valid
    const validDepartments = [
      'Enterprise Business Solutions',
      'Board Management',
      'Support Stuff',
      'Administration and Human Resources',
      'Finance and Accounts',
      'Business Dev and Operations',
      'Implementation and Support',
      'Technical and Networking Department'
    ];
  
    if (formData.department && !validDepartments.includes(formData.department)) {
      console.warn('⚠️ Invalid department selected:', formData.department);
      console.log('📋 Valid departments:', validDepartments);
      console.log('🔄 Comparing with valid departments:');
      validDepartments.forEach((dept, index) => {
        console.log(`  ${index + 1}. "${formData.department}" === "${dept}" ? ${formData.department === dept}`);
        console.log(`     Trimmed: "${formData.department.trim()}" === "${dept.trim()}" ? ${formData.department.trim() === dept.trim()}`);
      });
    }
    
    // Edit mode এ password blank হলে remove করুন request থেকে
    const submitData = { ...formData };
    if (editingUser && !submitData.password) {
      delete submitData.password; // Password field remove করুন যদি blank থাকে
    }

    try {
      const token = localStorage.getItem('token');
      const url = editingUser ? `${API_BASE_URL}/users/${editingUser.id}` : `${API_BASE_URL}/users`;
      const method = editingUser ? 'PUT' : 'POST';

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      
      console.log('📡 Sending request to:', url);
      console.log('📥 Request method:', method);
      console.log('📨 Request headers:', headers);
      console.log('📦 Request body:', JSON.stringify(submitData, null, 2));

      const response = await fetch(url, {
        method: method,
        headers: headers,
        body: JSON.stringify(submitData),
      });
      
      console.log('📊 Response status:', response.status);
      console.log('📊 Response headers:', response.headers);
      
      const responseText = await response.text();
      console.log('🟡 RAW RESPONSE:', responseText);

      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('🔴 JSON PARSE ERROR:', parseError);
        throw new Error('Server returned invalid JSON');
      }

      console.log('🟢 PARSED RESPONSE:', data);

      if (data.success) {
        // Send notification for user creation/update
        if (editingUser) {
          sendUserUpdateNotification(editingUser, formData);
          toast.success('User updated successfully!');
        } else {
          sendUserCreationNotification(formData);
          toast.success('User created successfully!');
        }

        setFormData({
          name: '',
          username: '',
          email: '',
          password: '',
          role: 'user',
          department: '',
          status: 'active'
        });
        setShowAddModal(false);
        setEditingUser(null);
        setShowPassword(false); // Reset password visibility
        loadUsers();
        
      } else {
        console.error('🔴 BACKEND ERROR:', data);
        // Log specific validation errors
        if (data.errors) {
          console.log('📋 Validation errors:', data.errors);
          Object.keys(data.errors).forEach(field => {
            console.log(`  ${field}:`, data.errors[field]);
          });
        }
        toast.error(data.error || 'Failed to save user');
      }
    } catch (error) {
      console.error('🔴 SAVE USER ERROR:', error);
      toast.error(error.message || 'Failed to save user');
    }
  };

  // Send Notification for User Creation
  const sendUserCreationNotification = (userData) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: Date.now(), // Temporary ID for new user
        userName: userData.name,
        type: 'user_created',
        title: '👤 New User Created',
        message: `New user "${userData.name}" has been created with role: ${userData.role}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        userData: userData
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('User creation notification sent:', notification);
    } catch (error) {
      console.error('Failed to send user creation notification:', error);
    }
  };

  // Send Notification for User Update
  const sendUserUpdateNotification = (oldUser, newUserData) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: oldUser.id,
        userName: oldUser.name,
        type: 'user_updated',
        title: 'User Updated',
        message: `User "${oldUser.name}" profile has been updated`,
        isRead: false,
        createdAt: new Date().toISOString(),
        oldData: oldUser,
        newData: newUserData
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('User update notification sent:', notification);
    } catch (error) {
      console.error('Failed to send user update notification:', error);
    }
  };

  // Handle Edit User
  const handleEditUser = userId => {
    if (!isAdmin) return toast.error('Only Admin can edit users!');
    const userToEdit = users.find(u => u.id === userId);
    if (userToEdit) {
      setEditingUser(userToEdit);
      setFormData({
        name: userToEdit.name,
        username: userToEdit.username,
        email: userToEdit.email,
        password: '', // Password blank রাখুন (security reason)
        role: userToEdit.role,
        department: userToEdit.department,
        status: userToEdit.status
      });
      setShowAddModal(true);
      setShowPassword(false); // Reset password visibility
    }
  };

  // Handle Delete User with Notification
  const handleDeleteUser = async userId => {
    if (!isAdmin) return toast.error('Only Admin can delete users!');
    if (!window.confirm('Are you sure you want to delete this user?')) return;

    try {
      const userToDelete = users.find(u => u.id === userId);
      
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
        method: 'DELETE',
        headers: headers,
      });

      const data = await response.json();

      if (data.success) {
        // Send deletion notification
        sendUserDeletionNotification(userToDelete);
        
        toast.success('User deleted successfully!');
        loadUsers();
      } else {
        toast.error(data.error || 'Failed to delete user');
      }
    } catch (error) {
      toast.error('Failed to delete user');
      console.error(error);
    }
  };

  // Send Notification for User Deletion
  const sendUserDeletionNotification = (user) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        type: 'user_deleted',
        title: '🗑️ User Deleted',
        message: `User "${user.name}" has been deleted from the system`,
        isRead: false,
        createdAt: new Date().toISOString(),
        userData: user
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('User deletion notification sent:', notification);
    } catch (error) {
      console.error('Failed to send user deletion notification:', error);
    }
  };

  // Handle Toggle Status with Notification
  const handleToggleStatus = async userId => {
    if (!isAdmin) return toast.error('Only Admin can change user status!');
    try {
      const userToUpdate = users.find(u => u.id === userId);
      const newStatus = userToUpdate.status === 'active' ? 'inactive' : 'active';
      
      const token = localStorage.getItem('token');
      
      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${API_BASE_URL}/users/${userId}/toggle-status`, {
        method: 'PATCH',
        headers: headers,
      });

      const data = await response.json();

      if (data.success) {
        // Send status change notification
        sendUserStatusNotification(userToUpdate, newStatus);
        
        toast.success('User status updated!');
        loadUsers();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (error) {
      toast.error('Failed to update status');
      console.error(error);
    }
  };

  // Send Notification for User Status Change
  const sendUserStatusNotification = (user, newStatus) => {
    try {
      const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
      
      const notification = {
        id: Date.now(),
        userId: user.id,
        userName: user.name,
        type: 'user_status_changed',
        title: newStatus === 'active' ? '✅ User Activated' : '⏸️ User Deactivated',
        message: `User "${user.name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        oldStatus: user.status,
        newStatus: newStatus
      };

      notifications.push(notification);
      localStorage.setItem('notifications', JSON.stringify(notifications));

      console.log('🔔 User status notification sent:', notification);
    } catch (error) {
      console.error('❌ Failed to send user status notification:', error);
    }
  };

  // Helper Functions
  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  // ✅ validatePassword function - এখানে রাখো (handleInputChange এর পরে)
  const validatePassword = (password) => {
  console.log('🔍 Frontend validating password:', password);
  console.log('🔍 Password details:', {
    length: password.length,
    hasUppercase: /[A-Z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecial: /[@$!%*?&.]/.test(password),
    uppercaseCheck: password.match(/[A-Z]/),
    numberCheck: password.match(/\d/),
    specialCheck: password.match(/[@$!%*?&.]/)
  });

  // Step-by-step validation
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
                      onClick={() => setShowFirstFaceModal(true)}
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
                        setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: '', status: 'active' });
                        setShowAddModal(true);
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
                        ) : firstFaceAssignments.filter(ff => ff.isActive).length > 0 ? (
                          <div className="row g-2">
                            {firstFaceAssignments.filter(ff => ff.isActive).map(assignment => (
                              <div key={assignment.id} className="col-md-6">
                                <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded">
                                  <div>
                                    <strong>{assignment.userName}</strong>
                                    <small className="text-muted d-block">
                                      {assignment.department === 'all' ? 'All Departments' : assignment.department}
                                    </small>
                                    <small className="text-muted">
                                      Assigned: {new Date(assignment.assignedAt).toLocaleDateString()}
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
                          <h3 className="text-primary mb-0">{users.filter(u => u.role === 'team_leader').length}</h3>
                          <small className="text-muted">Team Leaders</small>
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
                          <h3 className="text-warning mb-0">{firstFaceAssignments.filter(ff => ff.isActive).length}</h3>
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
                                    setFormData({ name: '', username: '', email: '', password: '', role: 'user', department: '', status: 'active' });
                                    setShowAddModal(true);
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
                                  {u.username}
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
                <div className="alert alert-info">
                  <strong>First Face System:</strong> New problems will be automatically assigned to First Face users based on department.
                </div>
                
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
                            <option key={user.id} value={user.id}>
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
      {showAddModal && isAdmin && (
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
                  onClick={() => { setShowAddModal(false); setEditingUser(null); }}
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
                      onChange={(e) => {
                        handleInputChange(e);

                        const emailValue = e.target.value;

                        if (!editingUser) {
                          setFormData(prev => ({
                            ...prev,
                            username: emailValue
                          }));
                        }
                      }}
                      placeholder="john@example.com"
                    />
                    <small className="text-muted">Username will mirror your email automatically</small>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Username *</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      name="username" 
                      value={formData.username} 
                      onChange={handleInputChange} 
                      placeholder="johndoe" 
                    />
                    <small className="text-muted">Auto-generated from email, can be modified</small>
                  </div>

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
                          type={showPassword ? 'text' : 'password'} 
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
                          onClick={() => setShowPassword(prev => !prev)}
                          title={showPassword ? "Hide Password" : "Show Password"}
                        >
                          {showPassword ? <FaEye /> : <FaEyeSlash />}
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
                    <select 
                      className="form-control" 
                      name="role" 
                      value={formData.role} 
                      onChange={handleInputChange}
                    >
                      <option value="user">User (Employee)</option>
                      {/* <option value="team_leader">Team Leader</option> */}
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Department *</label>
                    <select 
                      className="form-control" 
                      name="department" 
                      value={formData.department} 
                      onChange={handleInputChange}
                    >
                      <option value="">Select Department</option>
                      <option value="Enterprise Business Solutions">Enterprise Business Solutions</option>
                      <option value="Board Management">Board Management</option>
                      <option value="Support Stuff">Support Stuff</option>
                      <option value="Administration and Human Resources">Administration and Human Resources</option>
                      <option value="Finance and Accounts">Finance and Accounts</option>
                      <option value="Business Dev and Operations">Business Dev and Operations</option>
                      <option value="Implementation and Support">Implementation and Support</option>
                      <option value="Technical and Networking Department">Technical and Networking Department</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Status</label>
                    <select 
                      className="form-control" 
                      name="status" 
                      value={formData.status} 
                      onChange={handleInputChange}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
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
                    onClick={() => { setShowAddModal(false); setEditingUser(null); }}
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