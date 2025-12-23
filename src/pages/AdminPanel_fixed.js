// src/pages/AdminPanel.js - WITHOUT SUPERADMIN DEPENDENCY
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { 
  FaUserPlus, FaUsers, FaEdit, FaTrash, FaKey, FaEye, FaEyeSlash, 
  FaHome, FaPlusCircle, FaExclamationTriangle, FaFileAlt, FaUsersCog, 
  FaChevronLeft, FaChevronRight, FaSpinner, FaInfoCircle, FaSync, 
  FaBell, FaShieldAlt, FaUserCheck, FaGlobe
} from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';