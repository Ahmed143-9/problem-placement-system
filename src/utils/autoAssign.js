export const autoAssignProblem = async (problemDepartment) => {
  try {
    console.log('🔍 Auto-assign checking for department:', problemDepartment);
    
    // ✅ SAFE localStorage access with error handling
    const getLocalStorage = (key, defaultValue = '[]') => {
      try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : JSON.parse(defaultValue);
      } catch (error) {
        console.error(`❌ Error reading localStorage key "${key}":`, error);
        return JSON.parse(defaultValue);
      }
    };

    // 1. First check Pre-Assignments (by member ID)
    const preAssignments = getLocalStorage('pre_assignments', '{}');
    const preAssignedMemberId = preAssignments[problemDepartment];
    
    if (preAssignedMemberId) {
      const users = getLocalStorage('system_users', '[]');
      const assignedUser = users.find(u => u.id === parseInt(preAssignedMemberId));
      if (assignedUser) {
        console.log('✅ Pre-assignment found:', assignedUser.name);
        return {
          type: 'PRE_ASSIGNED',
          assignedTo: assignedUser.name,
          assignedToId: assignedUser.id,
          status: 'In Progress'
        };
      }
    }
    
    // 2. Then check First Face Assignments (by username)
    const firstFaceAssignments = getLocalStorage('firstFace_assignments', '[]');
    
    // Check for specific department assignment
    const departmentAssignment = firstFaceAssignments.find(a => a.department === problemDepartment);
    if (departmentAssignment) {
      console.log('✅ First Face department assignment found:', departmentAssignment.userName);
      return {
        type: 'FIRST_FACE_DEPARTMENT',
        assignedTo: departmentAssignment.userName,
        status: 'Assigned'
      };
    }
    
    // Check for "all" departments assignment
    const allDepartmentsAssignment = firstFaceAssignments.find(a => a.department === 'all');
    if (allDepartmentsAssignment) {
      console.log('✅ First Face all departments assignment found:', allDepartmentsAssignment.userName);
      return {
        type: 'FIRST_FACE_ALL',
        assignedTo: allDepartmentsAssignment.userName,
        status: 'Assigned'
      };
    }
    
    // 3. If no assignment found
    console.log('❌ No auto-assignment found for department:', problemDepartment);
    return {
      type: 'NOT_ASSIGNED',
      assignedTo: 'Unassigned',
      status: 'Pending'
    };
    
  } catch (error) {
    console.error('❌ Auto-assign error:', error);
    return {
      type: 'ERROR',
      assignedTo: 'Unassigned',
      status: 'Pending'
    };
  }
};

// ✅ NEW: Function to sync with Laravel backend
export const syncFirstFaceAssignments = async () => {
  try {
    const API_BASE_URL = 'https://ticketapi.wineds.com/api';
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_BASE_URL}/first-face-assignments`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response from Laravel:', text.substring(0, 200));
      throw new Error('Server returned HTML instead of JSON. Check API routes.');
    }

    const result = await response.json();
    
    if (result.success && result.data) {
      // Save to localStorage for frontend use
      localStorage.setItem('firstFace_assignments', JSON.stringify(result.data));
      console.log('✅ First face assignments synced from Laravel:', result.data);
      return result.data;
    } else {
      throw new Error(result.message || 'Failed to sync assignments');
    }
    
  } catch (error) {
    console.error('❌ Failed to sync first face assignments:', error);
    // Fallback to localStorage data
    const localData = JSON.parse(localStorage.getItem('firstFace_assignments') || '[]');
    return localData;
  }
};