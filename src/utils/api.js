// src/utils/api.js - Create this file
const API_BASE_URL = 'http://localhost:8000/api';

// Get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': `Bearer ${token}`,
  };
};

// Main API request function
export const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config = {
    headers: getAuthHeaders(),
    ...options,
  };

  // If body is provided, stringify it
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    console.log(`🟡 API CALL: ${config.method || 'GET'} ${url}`);
    
    const response = await fetch(url, config);
    
    console.log(`🔵 API RESPONSE: ${response.status} ${response.statusText}`);

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
    }

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ API Error Response:', data);
      throw new Error(data.message || data.error || `HTTP error! status: ${response.status}`);
    }

    console.log('✅ API Success:', data);
    return data;

  } catch (error) {
    console.error(`🚨 API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Specific API methods
export const userAPI = {
  getUsers: () => apiRequest('/users'),
  createUser: (userData) => apiRequest('/users', { method: 'POST', body: userData }),
  updateUser: (id, userData) => apiRequest(`/users/${id}`, { method: 'PUT', body: userData }),
  deleteUser: (id) => apiRequest(`/users/${id}`, { method: 'DELETE' }),
  toggleUserStatus: (id) => apiRequest(`/users/${id}/toggle-status`, { method: 'PATCH' }),
  getActiveUsers: () => apiRequest('/active-users'),
};

export const problemAPI = {
  getProblems: () => apiRequest('/problems'),
  createProblem: (problemData) => apiRequest('/problems', { method: 'POST', body: problemData }),
  updateProblem: (id, problemData) => apiRequest(`/problems/${id}`, { method: 'PUT', body: problemData }),
  deleteProblem: (id) => apiRequest(`/problems/${id}`, { method: 'DELETE' }),
};

export const firstFaceAPI = {
  getAssignments: () => apiRequest('/first-face-assignments'), // ✅ FIXED ROUTE
  createAssignment: (data) => apiRequest('/first-face-assignments', { 
    method: 'POST', 
    body: data 
  }),
  deleteAssignment: (id) => apiRequest(`/first-face-assignments/${id}`, { 
    method: 'DELETE' 
  }),
};