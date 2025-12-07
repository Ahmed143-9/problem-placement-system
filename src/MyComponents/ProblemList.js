import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import './ProblemList.css';

export default function ProblemList() {
  const { user, isAuthenticated } = useAuth();
  const { notifyAssignment, notifyTransfer } = useNotifications();
  const API_BASE_URL = 'http://127.0.0.1:8000/api'; // Match AuthContext
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarMinimized, setSidebarMinimized] = useState(false);
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [isTransfer, setIsTransfer] = useState(false);
  const [showProblemModal, setShowProblemModal] = useState(false);
  const [selectedProblemStatement, setSelectedProblemStatement] = useState('');
  const [problems, setProblems] = useState([]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated && !loading) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  // Load all data
  useEffect(() => {
    if (isAuthenticated) {
      const loadAllData = async () => {
        try {
          setLoading(true);
          await loadProblems();
          await fetchTeamMembers();
        } catch (error) {
          console.error('Error loading data:', error);
          toast.error('Failed to load data');
        } finally {
          setLoading(false);
        }
      };

      loadAllData();
    }
  }, [isAuthenticated]);

  // Create sample problems in localStorage
  const createSampleProblems = () => {
    const sampleProblems = [
      {
        id: 1,
        department: 'Technical and Networking Department',
        service: 'Server Maintenance',
        priority: 'High',
        status: 'pending',
        statement: 'Server downtime affecting user login functionality',
        client: 'Internal IT',
        createdBy: user?.name || 'Admin User',
        createdById: user?.id || 1,
        assignedTo: null,
        assignedToName: null,
        assignedToEmail: null,
        createdAt: new Date().toISOString(),
        comments: [],
        transferHistory: [],
        actionHistory: [{
          action: 'Problem Created',
          by: user?.name || 'Admin User',
          timestamp: new Date().toISOString(),
          comment: 'Initial problem report'
        }]
      },
      {
        id: 2,
        department: 'Enterprise Business Solutions',
        service: 'Customer Portal',
        priority: 'Medium',
        status: 'in_progress',
        statement: 'Update pricing page with new product features',
        client: 'ABC Corporation',
        createdBy: user?.name || 'Admin User',
        createdById: user?.id || 1,
        assignedTo: 2, // John Doe's ID
        assignedToName: 'John Doe',
        assignedToEmail: 'john.doe@example.com',
        createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
        comments: [],
        transferHistory: [],
        actionHistory: [{
          action: 'Problem Created',
          by: user?.name || 'Admin User',
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          comment: 'Initial problem report'
        }, {
          action: 'Assigned',
          by: user?.name || 'Admin User',
          timestamp: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
          comment: 'Assigned to John Doe'
        }]
      },
      {
        id: 3,
        department: 'Finance and Accounts',
        service: 'Billing System',
        priority: 'Low',
        status: 'done',
        statement: 'Fix calculation error in monthly reports',
        client: 'Finance Department',
        createdBy: user?.name || 'Admin User',
        createdById: user?.id || 1,
        assignedTo: 3, // Jane Smith's ID
        assignedToName: 'Jane Smith',
        assignedToEmail: 'jane.smith@example.com',
        createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
        comments: [],
        transferHistory: [],
        actionHistory: [{
          action: 'Problem Created',
          by: user?.name || 'Admin User',
          timestamp: new Date(Date.now() - 172800000).toISOString(),
          comment: 'Initial problem report'
        }, {
          action: 'Assigned',
          by: user?.name || 'Admin User',
          timestamp: new Date(Date.now() - 129600000).toISOString(), // 36 hours ago
          comment: 'Assigned to Jane Smith'
        }, {
          action: 'Resolved',
          by: 'Jane Smith',
          timestamp: new Date(Date.now() - 86400000).toISOString(), // 24 hours ago
          comment: 'Issue fixed and tested'
        }]
      }
    ];
  
    setProblems(sampleProblems);
    localStorage.setItem('problems', JSON.stringify(sampleProblems));
    toast.info('Created sample problems to get you started!');
  };

  // Main load problems function - FIXED DATA PERSISTENCE
  const loadProblems = async () => {
    try {
      console.log('🔄 Starting to load problems...');
      
      const token = localStorage.getItem('token');
      console.log('🔑 Token exists:', !!token);

      // First, try to load from API if token exists
      if (token) {
        try {
          console.log('🌐 Attempting API call to:', `${API_BASE_URL}/problems`);
          
          const response = await fetch(`${API_BASE_URL}/problems`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('📡 API Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('API response data:', data);
          
            // Handle different response structures
            let apiProblems = [];
            if (data.success && Array.isArray(data.problems)) {
              apiProblems = data.problems;
            } else if (data.success && Array.isArray(data.data)) {
              apiProblems = data.data;
            } else if (Array.isArray(data)) {
              apiProblems = data;
            }

            console.log(`📊 Extracted ${apiProblems.length} problems from API response`);

            if (apiProblems.length > 0) {
              // Transform data to match frontend structure
              const transformedProblems = apiProblems.map(problem => {
                // Get assignee information if available
                const assignee = problem.assignee;
                
                return {
                  id: problem.id,
                  department: problem.department,
                  service: problem.service || '',
                  priority: problem.priority,
                  status: problem.status,
                  statement: problem.statement,
                  client: problem.client || '',
                  createdBy: problem.creator?.name || problem.created_by || problem.createdBy || 'Unknown',
                  createdById: problem.creator?.id || problem.created_by_id || problem.createdById,
                  assignedTo: assignee?.id || problem.assigned_to || problem.assignedTo,
                  assignedToName: assignee?.name || problem.assigned_to_name || problem.assignedToName,
                  assignedToEmail: assignee?.email || problem.assigned_to_email || problem.assignedToEmail,
                  transferHistory: problem.transfer_history || problem.transferHistory || [],
                  actionHistory: problem.action_history || problem.actionHistory || [],
                  comments: problem.comments || [],
                  createdAt: problem.created_at || problem.createdAt
                };
              });

              setProblems(transformedProblems);
              localStorage.setItem('problems', JSON.stringify(transformedProblems));
              console.log(`✅ Loaded ${transformedProblems.length} problems from server`);
              return;
            }
          }
        } catch (apiError) {
          console.warn('⚠️ API call failed, using localStorage:', apiError);
        }
      }

      // Fallback: Use localStorage
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      console.log(`📁 Found ${storedProblems.length} problems in localStorage`);
      
      if (storedProblems.length > 0) {
        setProblems(storedProblems);
        console.log(`📁 Loaded ${storedProblems.length} problems from localStorage`);
      } else {
        console.log('📝 No problems found anywhere, creating local samples...');
        createSampleProblems();
      }

    } catch (error) {
      console.error('💥 Error loading problems:', error);
      
      // Final fallback
      const storedProblems = JSON.parse(localStorage.getItem('problems') || '[]');
      if (storedProblems.length === 0) {
        createSampleProblems();
      } else {
        setProblems(storedProblems);
      }
    }
  };

  // Fixed: Fetch team members from API
  const fetchTeamMembers = async () => {
    try {
      console.log('🔄 Fetching team members...');
      const token = localStorage.getItem('token');
      
      // Try API first
      if (token) {
        try {
          console.log('🌐 Attempting API call to:', `${API_BASE_URL}/users`);
          const response = await fetch(`${API_BASE_URL}/users`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
          });

          console.log('📡 API Response status:', response.status);

          if (response.ok) {
            const data = await response.json();
            console.log('API response data:', data);
          
            if (data.success) {
              const members = data.users.filter(u => 
                u.email !== 'admin@example.com' && u.status === 'active'
              );
              setTeamMembers(members);
              console.log(`✅ Loaded ${members.length} team members from API`);
              return;
            }
          }
        } catch (apiError) {
          console.warn('API call failed, using localStorage:', apiError);
        }
      }

      // Fallback to localStorage
      const storedUsers = JSON.parse(localStorage.getItem('system_users') || '[]');
      console.log('📁 Stored users from localStorage:', storedUsers);

      if (storedUsers.length === 0) {
        // Create sample team members
        const sampleMembers = [
          { id: 1, name: 'John Doe', role: 'team_leader', department: 'Technical and Networking Department', status: 'active', username: 'john', email: 'john.doe@example.com' },
          { id: 2, name: 'Jane Smith', role: 'user', department: 'Enterprise Business Solutions', status: 'active', username: 'jane', email: 'jane.smith@example.com' },
          { id: 3, name: 'Mike Johnson', role: 'user', department: 'Finance and Accounts', status: 'active', username: 'mike', email: 'mike.johnson@example.com' }
        ];
        localStorage.setItem('system_users', JSON.stringify(sampleMembers));
        setTeamMembers(sampleMembers);
        console.log('📝 Created sample team members');
      } else {
        const members = storedUsers.filter(u => 
          u.email !== 'admin@example.com' && u.status === 'active'
        );
        setTeamMembers(members);
        console.log(`📁 Loaded ${members.length} team members from localStorage`);
      }
    } catch (error) {
      console.error('❌ Failed to fetch team members:', error);
      setTeamMembers([]);
    }
  };

  const toggleSidebar = () => {
    setSidebarMinimized(!sidebarMinimized);
  };

  const openAssignModal = (problem, transfer = false) => {
    setSelectedProblem(problem);
    setIsTransfer(transfer);
    setSelectedMember('');
    setShowAssignModal(true);
  };

  const openProblemModal = (problem) => {
    setSelectedProblemStatement(problem.statement);
    setShowProblemModal(true);
  };

  // Fixed: Assign/Transfer function - BETTER DATA PERSISTENCE
 // Fixed: Assign/Transfer function - PROPER NAME RESOLUTION
const handleAssignSubmit = async () => {
  if (!selectedMember) {
    toast.error('Please select a team member');
    return;
  }

  try {
    console.log('🔄 Starting assignment process...');
    
    // ✅ Find the selected member to get NAME
    const selectedUser = teamMembers.find(member => member.id === parseInt(selectedMember));
    
    if (!selectedUser) {
      toast.error('Selected team member not found');
      return;
    }

    console.log('👤 Selected user:', selectedUser.name);

    // Update localStorage FIRST for immediate UI update
    const updatedProblems = problems.map(p => {
      if (p.id === selectedProblem.id) {
        const updatedProblem = { 
          ...p, 
          assignedTo: selectedUser.id, // ✅ Store ID for reference
          assignedToName: selectedUser.name, // ✅ Store NAME for display
          status: p.status === 'pending' ? 'in_progress' : p.status
        };
        
        if (isTransfer && p.assignedTo) {
          updatedProblem.transferHistory = [
            ...(p.transferHistory || []),
            {
              from: p.assignedToName || p.assignedTo, // ✅ Use name if available
              to: selectedUser.name, // ✅ Store name in transfer history
              date: new Date().toISOString(),
              by: user?.name || 'Admin'
            }
          ];
          notifyTransfer(p.id, p.assignedToName || p.assignedTo, selectedUser.name, user?.name);
        } else {
          notifyAssignment(p.id, selectedUser.name, user?.name);
        }
        
        return updatedProblem;
      }
      return p;
    });
    
    // Update state immediately
    setProblems(updatedProblems);
    localStorage.setItem('problems', JSON.stringify(updatedProblems));
    
    console.log('Assignment saved to localStorage');
    
    toast.success(
      isTransfer 
        ? `Transferred to ${selectedUser.name}!`
        : `Assigned to ${selectedUser.name}!`
    );
    
    setShowAssignModal(false);
    setSelectedProblem(null);
    setSelectedMember('');
  } catch (error) {
    console.error('❌ Assignment error:', error);
    toast.error('Failed to assign problem');
  }
};

  // Fixed: Delete function - BETTER DATA PERSISTENCE
  const handleDelete = async (problemId) => {
    if (window.confirm(`Are you sure you want to delete Problem #${problemId}?`)) {
      try {
        const token = localStorage.getItem('token');
        
        // Update localStorage FIRST
        const updatedProblems = problems.filter(p => p.id !== problemId);
        setProblems(updatedProblems);
        localStorage.setItem('problems', JSON.stringify(updatedProblems));
        
        // Then try API delete
        if (token) {
          try {
            const response = await fetch(`${API_BASE_URL}/problems/${problemId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });

            if (response.ok) {
              console.log(`Problem #${problemId} deleted from API`);
            }
          } catch (apiError) {
            console.warn('API delete failed, data deleted locally:', apiError);
          }
        }
        
        toast.success(`Problem #${problemId} deleted!`);
        
      } catch (error) {
        toast.error('Failed to delete problem');
        console.error(error);
      }
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-warning text-dark',
      in_progress: 'bg-info text-white',
      done: 'bg-success text-white',
      pending_approval: 'bg-secondary text-white'
    };
    return badges[status] || 'bg-secondary text-white';
  };

  const getPriorityBadge = (priority) => {
    const badges = {
      High: 'bg-danger text-white',
      Medium: 'bg-warning text-dark',
      Low: 'bg-success text-white'
    };
    return badges[priority] || 'bg-secondary text-white';
  };

  const formatStatus = (status) => {
    if (status === 'done') return 'SOLVED';
    if (status === 'pending_approval') return 'PENDING APPROVAL';
    return status.replace('_', ' ').toUpperCase();
  };

  const canAssign = () => {
    console.log('🔍 canAssign check:', {
      userRole: user?.role,
      result: user?.role === 'admin' || user?.role === 'team_leader'
    });
    return user?.role === 'admin' || user?.role === 'team_leader';
  };

  const canTransfer = (problem) => {
    console.log('🔍 canTransfer check:', {
      problemStatus: problem.status,
      userRole: user?.role,
      userName: user?.name,
      assignedTo: problem.assignedTo,
      assignedToName: problem.assignedToName,
      result: problem.status !== 'done' && 
             problem.status !== 'pending_approval' &&
             (user?.role === 'admin' || 
              user?.role === 'team_leader' || 
              user?.name === problem.assignedTo)
    });
    return problem.status !== 'done' && 
           problem.status !== 'pending_approval' &&
           (user?.role === 'admin' || 
            user?.role === 'team_leader' || 
            user?.name === problem.assignedTo);
  };

  const filteredProblems = problems.filter(problem => {
    const matchesStatus = filterStatus === 'all' || problem.status === filterStatus;
    const matchesDepartment = filterDepartment === 'all' || problem.department === filterDepartment;
    const matchesPriority = filterPriority === 'all' || problem.priority === filterPriority;
    const matchesSearch = searchTerm === '' || 
      problem.statement.toLowerCase().includes(searchTerm.toLowerCase()) ||
      problem.id.toString().includes(searchTerm);
    
    return matchesStatus && matchesDepartment && matchesPriority && matchesSearch;
  });

  // FIXED: Pagination - Show newest first and 10 per page
  const sortedProblems = [...filteredProblems].sort((a, b) => b.id - a.id);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentProblems = sortedProblems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedProblems.length / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterDepartment, filterPriority, searchTerm]);

  const sidebarLinkStyle = {
    transition: 'all 0.2s ease'
  };

  // Debug function to check problems and user data
  const debugProblemsData = () => {
    console.log('=== DEBUG PROBLEMS DATA ===');
    console.log('User:', user);
    console.log('User Role:', user?.role);
    console.log('Is Admin/Team Leader:', user?.role === 'admin' || user?.role === 'team_leader');
    console.log('Problems Count:', problems.length);
    console.log('Current Problems Count:', currentProblems.length);
    
    if (currentProblems.length > 0) {
      console.log('First Problem:', currentProblems[0]);
      console.log('Can Assign First Problem:', canAssign());
      console.log('Can Transfer First Problem:', canTransfer(currentProblems[0]));
      
      // Check each action button condition
      const firstProblem = currentProblems[0];
      console.log('Assign Button Conditions:', {
        canAssign: canAssign(),
        statusNotDone: firstProblem.status !== 'done',
        notAssigned: !firstProblem.assignedTo,
        showAssign: canAssign() && firstProblem.status !== 'done' && !firstProblem.assignedTo
      });
      
      console.log('Reassign Button Conditions:', {
        canAssign: canAssign(),
        statusNotDone: firstProblem.status !== 'done',
        isAssigned: !!firstProblem.assignedTo,
        showReassign: canAssign() && firstProblem.status !== 'done' && !!firstProblem.assignedTo
      });
      
      console.log('Transfer Button Conditions:', {
        canTransfer: canTransfer(firstProblem),
        showTransfer: canTransfer(firstProblem)
      });
    }
    
    console.log('Team Members Count:', teamMembers.length);
    console.log('Team Members:', teamMembers);
    
    // Force a re-render by updating state
    setProblems([...problems]);
  };

  if (loading) {
    return (
      <div>
        <Navbar />
        <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

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
                  className="nav-link text-white bg-primary rounded d-flex align-items-center"
                  style={sidebarLinkStyle}
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
          <div className="card shadow border-0">
            <div className="card-header bg-primary text-white py-3">
              <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
                <div className="d-flex align-items-center w-100 w-md-auto">
                  <h4 className="mb-0 fw-semibold text-truncate flex-grow-1">
                    <i className="bi bi-list-task me-2"></i>
                    Problem Management
                  </h4>
                </div>
                <div className="d-flex gap-2 w-100 w-md-auto mt-2 mt-md-0">
                  <button 
                    className="btn btn-light btn-sm fw-semibold flex-grow-1"
                    onClick={() => navigate('/problem/create')}
                  >
                    <i className="bi bi-plus-circle me-1"></i>
                    Create New
                  </button>
                  {problems.length === 0 && (
                    <button 
                      className="btn btn-warning btn-sm fw-semibold"
                      onClick={createSampleProblems}
                    >
                      <i className="bi bi-magic me-1"></i>
                      Create Samples
                    </button>
                  )}
                  <button 
                    className="btn btn-outline-light btn-sm"
                    onClick={loadProblems}
                    title="Refresh problems"
                  >
                    <i className="bi bi-arrow-clockwise"></i>
                  </button>
                  {/* Debug button - remove in production */}
                  <button 
                    className="btn btn-outline-danger btn-sm"
                    onClick={debugProblemsData}
                    title="Debug Data"
                  >
                    <i className="bi bi-bug"></i>
                  </button>
                </div>
              </div>
            </div>
            <div className="card-body p-3">

              {/* Quick Stats */}
              <div className="row g-2 mb-3">
                <div className="col-auto">
                  <span className="badge bg-warning text-dark fs-6">
                    Pending: {problems.filter(p => p.status === 'pending').length}
                  </span>
                </div>
                <div className="col-auto">
                  <span className="badge bg-info fs-6">
                    In Progress: {problems.filter(p => p.status === 'in_progress').length}
                  </span>
                </div>
                <div className="col-auto">
                  <span className="badge bg-success fs-6">
                    Solved: {problems.filter(p => p.status === 'done').length}
                  </span>
                </div>
                <div className="col-auto">
                  <span className="badge bg-secondary fs-6">
                    Unassigned: {problems.filter(p => !p.assignedTo).length}
                  </span>
                </div>
                <div className="col-auto">
                  <span className="badge bg-primary fs-6">
                    Total: {problems.length}
                  </span>
                </div>
              </div>

              {/* Compact Filters */}
              <div className="row g-2 mb-3">
                <div className="col-md-3 col-sm-6">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="🔍 Search problems..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="col-md-2 col-sm-6">
                  <select
                    className="form-control form-control-sm"
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="in_progress">In Progress</option>
                    <option value="done">Solved</option>
                    <option value="pending_approval">Pending Approval</option>
                  </select>
                </div>
                <div className="col-md-2 col-sm-6">
                  <select
                    className="form-control form-control-sm"
                    value={filterDepartment}
                    onChange={(e) => setFilterDepartment(e.target.value)}
                  >
                    <option value="all">All Depts</option>
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
                <div className="col-md-2 col-sm-6">
                  <select
                    className="form-control form-control-sm"
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value)}
                  >
                    <option value="all">All Priority</option>
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
                <div className="col-md-3 col-sm-12">
                  <div className="d-flex justify-content-end align-items-center">
                    <small className="text-muted">
                      Page {currentPage} of {totalPages}
                    </small>
                  </div>
                </div>
              </div>

              {/* Compact Table */}
              <div className="table-responsive" style={{ maxHeight: '65vh', overflow: 'auto' }}>
                <table className="table table-sm table-striped mb-2">
                  <thead style={{ position: 'sticky', top: 0, backgroundColor: '#bdcfe1ff', color: '#ecf0f1', zIndex: 10 }}>
                    <tr>
                      <th className="text-center" style={{ width: '15%' }}>Department</th>
                      <th className="text-center" style={{ width: '12%' }}>Priority</th>
                      <th className="text-center" style={{ width: '15%' }}>Status</th>
                      <th className="text-center" style={{ width: '15%' }}>Created By</th>
                      <th className="text-center" style={{ width: '15%' }}>Assigned To</th>
                      <th className="text-center" style={{ width: '8%' }}>View</th>
                      <th className="text-center" style={{ width: '20%' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProblems.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-muted">
                          <div className="py-3">
                            <i className="bi bi-inbox display-6 text-muted"></i>
                            <p className="mt-2 mb-2">
                              {problems.length === 0 
                                ? 'No problems found.' 
                                : 'No problems match your filters.'}
                            </p>
                            {problems.length === 0 && (
                              <button 
                                className="btn btn-primary btn-sm"
                                onClick={createSampleProblems}
                              >
                                <i className="bi bi-magic me-1"></i>
                                Create Sample Problems
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentProblems.map((problem) => (
                        <tr key={problem.id} className="align-middle">
                          <td className="text-center">
                            <span className="fw-semibold" style={{ fontSize: '0.95rem' }}>
                              {problem.department}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${getPriorityBadge(problem.priority)}`}>
                              {problem.priority}
                            </span>
                          </td>
                          <td className="text-center">
                            <span className={`badge ${getStatusBadge(problem.status)}`}>
                              {formatStatus(problem.status)}
                            </span>
                          </td>
                          <td className="text-center">
                            <span style={{ fontSize: '0.95rem' }}>{problem.createdBy}</span>
                          </td>
                                <td className="text-center">
                                        {problem.assignedToName ? ( // ✅ Use assignedToName instead of assignedTo
                                          <span className="badge bg-info text-white">{problem.assignedToName}</span>
                                        ) : (
                                          <span className="badge bg-secondary">Unassigned</span>
                                        )}
                                      </td>
                                <td className="text-center">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => openProblemModal(problem)}
                              title="View Problem Statement"
                              style={{ padding: '6px 10px' }}
                            >
                              <i className="bi bi-eye-fill" style={{ fontSize: '1rem' }}></i>
                            </button>
                          </td>
                          <td className="text-center">
                            <div className="d-flex gap-2 justify-content-center flex-wrap">
                              {/* View Details Button */}
                              <button
                                className="btn btn-sm btn-outline-secondary"
                                onClick={() => navigate(`/problem/${problem.id}`)}
                                title="View Details"
                                style={{ padding: '6px 10px' }}
                              >
                                <i className="bi bi-info-circle-fill" style={{ fontSize: '1rem' }}></i>
                              </button>

                              {/* Assign/Reassign Buttons */}
                              {canAssign() && problem.status !== 'done' && !problem.assignedTo && (
                                <button
                                  className="btn btn-sm btn-outline-success"
                                  onClick={() => openAssignModal(problem, false)}
                                  title="Assign Problem"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <i className="bi bi-person-plus-fill" style={{ fontSize: '1rem' }}></i>
                                </button>
                              )}

                              {canAssign() && problem.status !== 'done' && problem.assignedTo && (
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  onClick={() => openAssignModal(problem, false)}
                                  title="Reassign Problem"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <i className="bi bi-arrow-clockwise" style={{ fontSize: '1rem' }}></i>
                                </button>
                              )}

                              {/* Transfer Button */}
                              {canTransfer(problem) && (
                                <button
                                  className="btn btn-sm btn-outline-info"
                                  onClick={() => openAssignModal(problem, true)}
                                  title="Transfer Problem"
                                  style={{ padding: '6px 10px' }}
                                >
                                  <i className="bi bi-arrow-left-right" style={{ fontSize: '1rem' }}></i>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Compact Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-between align-items-center mt-3">
                  <small className="text-muted">
                    Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, sortedProblems.length)} of {sortedProblems.length}
                  </small>
                  
                  <nav>
                    <ul className="pagination pagination-sm mb-0">
                      <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={goToPrevPage}
                          disabled={currentPage === 1}
                        >
                          &laquo;
                        </button>
                      </li>
                      
                      {[...Array(Math.min(5, totalPages))].map((_, index) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = index + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = index + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + index;
                        } else {
                          pageNumber = currentPage - 2 + index;
                        }

                        return (
                          <li 
                            key={pageNumber} 
                            className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                          >
                            <button 
                              className="page-link" 
                              onClick={() => paginate(pageNumber)}
                            >
                              {pageNumber}
                            </button>
                          </li>
                        );
                      })}
                      
                      <li className={`page-item ${currentPage === totalPages ? 'disabled' : ''}`}>
                        <button 
                          className="page-link" 
                          onClick={goToNextPage}
                          disabled={currentPage === totalPages}
                        >
                          &raquo;
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Problem Statement Modal */}
      {showProblemModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content">
              <div className="modal-header bg-primary text-white py-2">
                <h6 className="modal-title mb-0 fw-semibold">
                  <i className="bi bi-card-text me-2"></i>
                  Problem Statement
                </h6>
                <button 
                  type="button" 
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => setShowProblemModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="p-3 bg-light rounded">
                  <p className="mb-0" style={{ fontSize: '1.05rem', lineHeight: '1.6' }}>
                    {selectedProblemStatement}
                  </p>
                </div>
                <div className="text-center mt-3">
                  <button 
                    className="btn btn-primary btn-sm"
                    onClick={() => setShowProblemModal(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Assign/Transfer Modal */}
      {showAssignModal && (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header bg-success text-white py-2">
                <h6 className="modal-title mb-0 fw-semibold">
                  <i className={`bi ${isTransfer ? 'bi-arrow-left-right' : 'bi-person-plus'} me-2`}></i>
                  {isTransfer ? 'Transfer Problem' : 'Assign Problem'}
                </h6>
                <button 
                  type="button" 
                  className="btn-close btn-close-white btn-sm"
                  onClick={() => setShowAssignModal(false)}
                ></button>
              </div>
              <div className="modal-body py-3">
                <div className="mb-2">
                  <small className="text-muted">
                    Problem <strong>#{selectedProblem?.id}</strong> - {selectedProblem?.department}
                  </small>
                  {isTransfer && selectedProblem?.assignedTo && (
                    <div className="mt-1">
                      <small className="text-info">
                        <strong>Current:</strong> {selectedProblem.assignedTo}
                      </small>
                    </div>
                  )}
                </div>

                <div className="mb-3">
  <label className="form-label small fw-semibold mb-1">
    {isTransfer ? 'Transfer to:' : 'Assign to:'}
  </label>
  <select
    className="form-control form-control-sm"
    value={selectedMember}
    onChange={(e) => setSelectedMember(e.target.value)}
  >
    <option value="">-- Select Team Member --</option>
    {teamMembers.map(member => (
      <option 
        key={member.id} 
        value={member.id}
        disabled={member.id === selectedProblem?.assignedTo}
      >
        {member.name} ({member.role === 'team_leader' ? 'Team Leader' : 'User'}) - {member.department}
      </option>
    ))}
  </select>
</div>

                <div className="d-flex gap-2">
                  <button 
                    className="btn btn-success btn-sm flex-grow-1"
                    onClick={handleAssignSubmit}
                    disabled={!selectedMember}
                  >
                    {isTransfer ? 'Transfer' : 'Assign'}
                  </button>
                  <button 
                    className="btn btn-secondary btn-sm"
                    onClick={() => setShowAssignModal(false)}
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