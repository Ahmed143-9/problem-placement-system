// src/utils/api.js - UPDATED FOR NEW API STRUCTURE
const API_BASE_URL = 'http://localhost:8000/api';

// Get auth headers with token
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token being sent:', token);
  
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

// Main API request function - UPDATED FOR NEW RESPONSE STRUCTURE
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
    console.log('🔑 Headers:', config.headers);
    
    const response = await fetch(url, config);
    
    console.log(`🔵 API RESPONSE: ${response.status} ${response.statusText}`);

    // Handle unauthorized
    if (response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
      localStorage.removeItem('roles');
      window.location.href = '/login';
      throw new Error('Authentication failed. Please login again.');
    }

    // Check if response is JSON
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('❌ Non-JSON response:', text.substring(0, 200));
      throw new Error(`Server returned HTML instead of JSON. Status: ${response.status}`);
    }

    const data = await response.json();
    console.log('📊 API Response Data:', data);

    // Handle API error responses
    if (response.status >= 400) {
      const errorMessage = data.message || 
                          data.error || 
                          (Array.isArray(data.errors) ? data.errors.join(', ') : 'Unknown error');
      console.error('❌ API Error:', errorMessage);
      throw new Error(errorMessage);
    }

    console.log('✅ API Success');
    return data;

  } catch (error) {
    console.error(`🚨 API Error [${endpoint}]:`, error);
    throw error;
  }
};

// Auth API functions
export const authAPI = {
  login: (credentials) => apiRequest('/v1/login', { 
    method: 'POST', 
    body: credentials 
  }),
  logout: () => apiRequest('/v1/logout', { method: 'POST' }),
  changePassword: (data) => apiRequest('/v1/change-password', { 
    method: 'POST', 
    body: data 
  }),
  getProfile: () => apiRequest('/v1/profile'),
};

// User API functions
export const userAPI = {
  getUsers: () => apiRequest('/v1/users'),
  createUser: (userData) => apiRequest('/v1/users', { 
    method: 'POST', 
    body: userData 
  }),
  updateUser: (id, userData) => apiRequest(`/v1/users/${id}`, { 
    method: 'PUT', 
    body: userData 
  }),
  deleteUser: (id) => apiRequest(`/v1/users/${id}`, { 
    method: 'DELETE' 
  }),
  toggleUserStatus: (id) => apiRequest(`/v1/users/${id}/toggle-status`, { 
    method: 'PATCH' 
  }),
  getActiveUsers: () => apiRequest('/v1/active-users'),
  resetUserPassword: (id, newPassword) => apiRequest(`/v1/users/${id}/reset-password`, { 
    method: 'POST', 
    body: { password: newPassword } 
  }),
  getUserPassword: (id) => apiRequest(`/v1/users/${id}/password`)
};

// Problem API functions
export const problemAPI = {
  getProblems: () => apiRequest('/v1/problems'),
  createProblem: (problemData) => apiRequest('/v1/problems', { 
    method: 'POST', 
    body: problemData 
  }),
  updateProblem: (id, problemData) => apiRequest(`/v1/problems/${id}`, { 
    method: 'PUT', 
    body: problemData 
  }),
  deleteProblem: (id) => apiRequest(`/v1/problems/${id}`, { 
    method: 'DELETE' 
  }),
};

// First Face API functions
export const firstFaceAPI = {
  getAssignments: () => apiRequest('/v1/first-face-assignments'),
  createAssignment: (data) => apiRequest('/v1/first-face-assignments', { 
    method: 'POST', 
    body: data 
  }),
  deleteAssignment: (id) => apiRequest(`/v1/first-face-assignments/${id}`, { 
    method: 'DELETE' 
  }),
};