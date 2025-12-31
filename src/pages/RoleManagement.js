import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import {
    FaHome,
    FaPlus,
    FaEdit,
    FaTrash,
    FaUsersCog,
    FaExclamationTriangle,
    FaFileAlt,
    FaGlobe,
    FaChevronLeft,
    FaChevronRight,
    FaPlusCircle,
    FaCheck,
    FaSync,
    FaSpinner,
    FaInfoCircle,
    FaExclamationCircle
} from 'react-icons/fa';

export default function RoleManagement() {
    const { user } = useAuth();
    const { addNotification } = useNotifications();
    const [sidebarMinimized, setSidebarMinimized] = useState(false);

    // Role Management State
    const [roles, setRoles] = useState([]);
    const [allPermissions, setAllPermissions] = useState([]);
    const [permissionGroups, setPermissionGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [permissionsLoading, setPermissionsLoading] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [error, setError] = useState(null);
    const [deletingRoleId, setDeletingRoleId] = useState(null);
    const [permissionError, setPermissionError] = useState(null);
    const [meData, setMeData] = useState(null);
    const [mePermissions, setMePermissions] = useState([]);

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);
    const [fetchingPermissions, setFetchingPermissions] = useState(false);
    const [initialPermissionsLoaded, setInitialPermissionsLoaded] = useState(false);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Default permissions (fallback if API fails)
    const defaultPermissions = [
        { id: 1, name: 'create user' },
        { id: 2, name: 'edit user' },
        { id: 3, name: 'delete user' },
        { id: 4, name: 'view user' },
        { id: 5, name: 'create role' },
        { id: 6, name: 'edit role' },
        { id: 7, name: 'delete role' },
        { id: 8, name: 'view role' },
        { id: 9, name: 'create problem' },
        { id: 10, name: 'edit problem' },
        { id: 11, name: 'delete problem' },
        { id: 12, name: 'view problem' }
    ];

    useEffect(() => {
        const init = async () => {
            try {
                await fetchMe();
            } catch (e) {
                console.warn('Could not fetch /me', e);
            }

            // fetch permissions and roles after /me so we can use role-based permissions if needed
            await fetchAllPermissions();
            await fetchRoles();
        };

        init();
    }, []);

    // Debug effect
    useEffect(() => {
        if (selectedPermissions.length > 0) {
            console.log('🔄 Selected Permissions:', {
                count: selectedPermissions.length,
                ids: selectedPermissions
            });
        }
    }, [selectedPermissions]);

    // --- API Functions ---

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await api.post('/v1/role/getAllRoles');

            const data = response.data;
            console.log('📊 Roles API Response:', data);

            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;
            const roleList = data?.data?.rolelist ?? data?.rolelist ?? [];

            if (ok) {
                setRoles(Array.isArray(roleList) ? roleList : []);
                console.log(`✅ Loaded ${roleList.length} roles`);
            } else {
                setError(data?.message || 'Failed to fetch roles');
            }
        } catch (err) {
            console.error('❌ Fetch roles error:', err);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchAllPermissions = async () => {
        try {
            setPermissionsLoading(true);
            setPermissionError(null);
            console.log('🔄 Fetching all permissions...');
            
            const response = await api.post('/v1/permission/getAllpermissions');
            const data = response.data;
            console.log('📊 Permissions API Response:', data);

            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;
            const permissionList = data?.data?.permissionlist ?? data?.permissionlist ?? [];

            if (ok) {
                const permissions = Array.isArray(permissionList) ? permissionList : [];
                console.log(`✅ Loaded ${permissions.length} permissions from API`);
                setAllPermissions(permissions);
                setPermissionGroups(groupPermissions(permissions));
            } else {
                // User doesn't have permission to view permissions list
                console.warn('⚠️ Cannot fetch permissions list. Using default permissions.');
                setPermissionError('You do not have permission to view the permissions list. Using available permissions.');

                // Prefer permissions from /me if present
                if (mePermissions && mePermissions.length > 0) {
                    const mapped = mePermissions.map((p, i) => {
                        if (typeof p === 'object' && (p.id || p.name)) return { id: p.id ?? 1000 + i, name: p.name ?? String(p) };
                        return { id: 1000 + i, name: String(p) };
                    });
                    setAllPermissions(mapped);
                    setPermissionGroups(groupPermissions(mapped));
                } else {
                    setAllPermissions(defaultPermissions);
                    setPermissionGroups(groupPermissions(defaultPermissions));
                }
                
                addNotification({
                    type: 'warning',
                    title: 'Limited Access',
                    message: 'Using default permissions. Contact admin for full access.',
                    color: 'warning',
                    icon: '⚠️'
                });
            }
        } catch (err) {
            console.error('❌ Fetch permissions error:', err);
            setPermissionError('Failed to load permissions. Using available permissions.');

            if (mePermissions && mePermissions.length > 0) {
                const mapped = mePermissions.map((p, i) => {
                    if (typeof p === 'object' && (p.id || p.name)) return { id: p.id ?? 2000 + i, name: p.name ?? String(p) };
                    return { id: 2000 + i, name: String(p) };
                });
                setAllPermissions(mapped);
                setPermissionGroups(groupPermissions(mapped));
            } else {
                setAllPermissions(defaultPermissions);
                setPermissionGroups(groupPermissions(defaultPermissions));
            }
        } finally {
            setPermissionsLoading(false);
        }
    };

    // Fetch current authenticated user (and their permissions)
    const fetchMe = async () => {
        try {
            const response = await api.post('/v1/me');
            const data = response.data;
            console.log('📥 /me response:', data);

            // store me data
            setMeData(data?.data ?? data ?? null);

            // extract permissions from possible shapes
            let perms = [];
            if (data?.data) {
                const d = data.data;
                if (Array.isArray(d.permissions)) perms = d.permissions;
                else if (d.user && Array.isArray(d.user.permissions)) perms = d.user.permissions;
                else if (d.role && Array.isArray(d.role.permissions)) perms = d.role.permissions;
            } else if (Array.isArray(data?.permissions)) {
                perms = data.permissions;
            }

            // normalize permission entries to strings or objects
            setMePermissions(perms);
            return perms;
        } catch (err) {
            console.error('❌ Fetch /me error:', err);
            setMeData(null);
            setMePermissions([]);
            return [];
        }
    };

    // Fetch permissions for a specific role
    const fetchRolePermissions = async (roleId) => {
        try {
            console.log(`🔍 Fetching permissions for role ID: ${roleId}`);
            
            const response = await api.post('/v1/role/getRole', { id: roleId });
            const data = response.data;
            console.log('📊 Role Detail Response:', data);

            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            if (ok) {
                // Gather candidate permission entries from known/unknown shapes
                let rawPerms = [];
                const pushIfArray = (v) => { if (Array.isArray(v)) rawPerms.push(...v); };

                pushIfArray(data.data?.permissions);
                pushIfArray(data.data?.role?.permissions);
                pushIfArray(data.permissions);
                pushIfArray(data.data?.role?.permissions?.data);
                // try some other possible shapes
                if (data.data && typeof data.data === 'object') {
                    Object.keys(data.data).forEach(k => {
                        if (Array.isArray(data.data[k]) && data.data[k].length && typeof data.data[k][0] !== 'object') {
                            // ignore primitive arrays
                        }
                    });
                }

                // Helper: normalize strings for comparison
                const normalize = (s) => String(s || '').toLowerCase().trim().replace(/[_-]+/g, ' ').replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, ' ');

                const permissionIds = [];
                const unmatched = [];

                for (const perm of rawPerms) {
                    if (perm == null) continue;

                    // numeric id
                    if (typeof perm === 'number' || (!isNaN(Number(perm)) && String(perm).trim() !== '')) {
                        const idNum = Number(perm);
                        if (!isNaN(idNum)) permissionIds.push(idNum);
                        continue;
                    }

                    // object with id
                    if (typeof perm === 'object') {
                        if (perm.id || perm.permission_id || perm.permissionId) {
                            const id = Number(perm.id ?? perm.permission_id ?? perm.permissionId);
                            if (!isNaN(id)) { permissionIds.push(id); continue; }
                        }

                        // nested permission object
                        if (perm.permission && typeof perm.permission === 'object' && perm.permission.id) {
                            permissionIds.push(Number(perm.permission.id));
                            continue;
                        }

                        // has name — try to match by name
                        if (perm.name) {
                            const n = normalize(perm.name);
                            const found = allPermissions.find(p => normalize(p.name) === n || normalize(p.name).includes(n) || n.includes(normalize(p.name)));
                            if (found) { permissionIds.push(Number(found.id)); continue; }
                            unmatched.push(perm.name);
                            continue;
                        }

                        // fallback: try to find any numeric property
                        const keys = Object.keys(perm);
                        let foundNum = false;
                        for (const k of keys) {
                            if (!isNaN(Number(perm[k]))) { permissionIds.push(Number(perm[k])); foundNum = true; break; }
                        }
                        if (foundNum) continue;
                        unmatched.push(JSON.stringify(perm));
                        continue;
                    }

                    // string — treat as permission name
                    if (typeof perm === 'string') {
                        const n = normalize(perm);
                        const found = allPermissions.find(p => normalize(p.name) === n || normalize(p.name).includes(n) || n.includes(normalize(p.name)));
                        if (found) { permissionIds.push(Number(found.id)); continue; }
                        // try replacing dots, slashes etc
                        const alt = n.replace(/\./g, ' ').replace(/\//g, ' ');
                        const found2 = allPermissions.find(p => normalize(p.name) === alt || normalize(p.name).includes(alt) || alt.includes(normalize(p.name)));
                        if (found2) { permissionIds.push(Number(found2.id)); continue; }
                        unmatched.push(perm);
                        continue;
                    }
                }

                // As a last resort, attempt to extract any ids nested deeply in data
                if (permissionIds.length === 0) {
                    const deepIds = [];
                    const walk = (obj) => {
                        if (!obj || typeof obj !== 'object') return;
                        for (const k of Object.keys(obj)) {
                            const v = obj[k];
                            if (typeof v === 'number' && k.toLowerCase().includes('id')) deepIds.push(v);
                            if (Array.isArray(v)) v.forEach(item => walk(item));
                            if (v && typeof v === 'object') walk(v);
                        }
                    };
                    walk(data);
                    if (deepIds.length) {
                        deepIds.forEach(id => permissionIds.push(Number(id)));
                    }
                }

                // Remove duplicates
                const uniqueIds = [...new Set(permissionIds.map(Number).filter(n => !isNaN(n)))];

                if (uniqueIds.length === 0) {
                    console.warn('⚠️ No permissions mapped for role. Raw perms:', rawPerms, 'Unmatched:', unmatched);
                } else {
                    console.log(`✅ Retrieved ${uniqueIds.length} permissions for role ${roleId}:`, uniqueIds);
                }

                return uniqueIds;
            } else {
                console.warn('⚠️ No permissions found for role, returning empty array');
                return [];
            }
        } catch (err) {
            console.error('❌ Fetch role permissions error:', err);
            return [];
        }
    };

    // Delete Role Function
    const handleDeleteRole = async (role) => {
        if (!window.confirm(`Are you sure you want to delete the role "${role.name}"?\n\nThis action cannot be undone.`)) {
            return;
        }

        try {
            setDeletingRoleId(role.id);
            
            const response = await api.post('/v1/role/deleteRole', { id: role.id });
            const data = response.data;
            console.log('🗑️ Delete response:', data);

            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            if (ok) {
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: `Role "${role.name}" deleted successfully`,
                    color: 'success',
                    icon: '✅'
                });
                
                // Refresh roles list
                await fetchRoles();
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: data?.message || 'Failed to delete role',
                    color: 'danger',
                    icon: '❌'
                });
            }
        } catch (err) {
            console.error('❌ Delete role error:', err);
            addNotification({
                type: 'error',
                title: 'Error',
                message: err.message || 'Server connection error',
                color: 'danger',
                icon: '❌'
            });
        } finally {
            setDeletingRoleId(null);
        }
    };

    // Submit Role (Create/Update)
    const handleSubmit = async () => {
        if (!name.trim()) {
            addNotification({ 
                type: 'error', 
                title: 'Error', 
                message: 'Role name is required', 
                color: 'danger', 
                icon: '⚠️' 
            });
            return;
        }

        // Optional: Warn if no permissions selected
        if (selectedPermissions.length === 0) {
            if (!window.confirm('No permissions selected. Are you sure you want to create/update this role without any permissions?')) {
                return;
            }
        }

        try {
            setModalLoading(true);

            // Convert permission IDs to names for backend
            const permissionNames = selectedPermissions.map(id => {
                const p = allPermissions.find(px => Number(px.id) === Number(id));
                return p ? p.name : null;
            }).filter(Boolean);

            console.log('📤 Submitting role:', {
                name: name.trim(),
                permissionCount: permissionNames.length
            });

            const endpoint = isEditing ? '/v1/role/updateRole' : '/v1/role/createRole';
            const payload = {
                name: name.trim(),
                guard_name: 'web',
                permissions: permissionNames
            };

            if (isEditing) {
                payload.id = selectedRoleId;
            }

            const response = await api.post(endpoint, payload);
            const data = response.data;
            console.log('📥 Submit response:', data);
            
            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            if (ok) {
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: isEditing 
                        ? `Role "${name}" updated successfully` 
                        : `Role "${name}" created successfully`,
                    color: 'success',
                    icon: '✅'
                });
                
                setShowModal(false);
                await fetchRoles();
            } else {
                addNotification({
                    type: 'error',
                    title: 'Error',
                    message: data?.message || 'Operation failed',
                    color: 'danger',
                    icon: '❌'
                });
            }
        } catch (err) {
            console.error('❌ Submit role error:', err);
            addNotification({
                type: 'error',
                title: 'Error',
                message: err.message || 'Server connection error',
                color: 'danger',
                icon: '❌'
            });
        } finally {
            setModalLoading(false);
        }
    };

    // --- Helper Functions ---

    const groupPermissions = (permissions) => {
        if (!Array.isArray(permissions) || permissions.length === 0) {
            return [];
        }

        const groups = {};
        permissions.forEach((p) => {
            if (!p || !p.name) return;
            
            const rawName = p.name.trim();
            // Group by first word
            const firstWord = rawName.split(' ')[0].toLowerCase();
            const groupKey = firstWord || 'other';
            
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    label: firstWord.charAt(0).toUpperCase() + firstWord.slice(1),
                    permissions: []
                };
            }
            groups[groupKey].permissions.push(p);
        });

        const groupArray = Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
        return groupArray;
    };

    // Permission Selection Helpers
    const togglePermissionSelection = (permissionId) => {
        setSelectedPermissions(prev => {
            return prev.includes(permissionId)
                ? prev.filter(id => id !== permissionId)
                : [...prev, permissionId];
        });
    };

    const handleGroupToggle = (group) => {
        const pIds = group.permissions.map(p => Number(p.id));
        const allSelected = pIds.every(id => selectedPermissions.includes(id));

        if (allSelected) {
            // Unselect all in group
            setSelectedPermissions(prev => prev.filter(id => !pIds.includes(id)));
        } else {
            // Select all in group
            setSelectedPermissions(prev => {
                const unique = new Set([...prev, ...pIds]);
                return Array.from(unique);
            });
        }
    };

    const isGroupFullySelected = (group) => {
        return group.permissions.every(p => selectedPermissions.includes(Number(p.id)));
    };

    const isGroupPartiallySelected = (group) => {
        const selectedCount = group.permissions.filter(p => selectedPermissions.includes(Number(p.id))).length;
        return selectedCount > 0 && selectedCount < group.permissions.length;
    };

    // Modal Openers
    const openCreateModal = () => {
        console.log('📝 Opening CREATE modal');
        setIsEditing(false);
        setName('');
        setSelectedPermissions([]);
        setSelectedRoleId(null);
        setFetchingPermissions(false);
        setInitialPermissionsLoaded(true);
        setShowModal(true);
    };

    const openEditModal = async (role) => {
        console.log(`📝 Opening EDIT modal for role "${role.name}" (ID: ${role.id})`);
        
        // Set basic modal state
        setIsEditing(true);
        setName(role.name);
        setSelectedRoleId(role.id);
        setFetchingPermissions(true);
        setInitialPermissionsLoaded(false);
        
        // Show modal immediately
        setShowModal(true);
        
        // Clear previous selections
        setSelectedPermissions([]);
        
        // Ensure permissions list is available before mapping names -> ids
        try {
            if (!permissionsLoading && allPermissions.length === 0) {
                await fetchAllPermissions();
            } else if (permissionsLoading) {
                // wait until permissionsLoading clears (simple poll)
                let attempts = 0;
                while (permissionsLoading && attempts < 10) {
                    // small delay
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(res => setTimeout(res, 150));
                    attempts += 1;
                }
            }

            const permissionIds = await fetchRolePermissions(role.id);
            console.log(`✅ Retrieved ${permissionIds.length} permissions for editing`);
            setSelectedPermissions(permissionIds);
            setInitialPermissionsLoaded(true);

            if (permissionIds.length === 0) {
                console.log('ℹ️ No permissions found for this role');
            }
        } catch (error) {
            console.error('❌ Error fetching role permissions:', error);
            setSelectedPermissions([]); // Clear on error
        } finally {
            setFetchingPermissions(false);
        }
    };

    // --- UI Components ---

    const toggleSidebar = () => setSidebarMinimized(!sidebarMinimized);

    // Pagination logic
    const totalItems = roles.length;
    const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
    const currentRoles = roles.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    return (
        <div className="d-flex flex-column min-vh-100" style={{ backgroundColor: '#f8f9fa' }}>
            <Navbar />

            <div className="d-flex flex-grow-1">
                {/* Sidebar */}
                <div
                    className="bg-dark text-white position-relative"
                    style={{ width: sidebarMinimized ? '70px' : '250px', minHeight: '100%', transition: 'width 0.3s ease' }}
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
                        {sidebarMinimized ? <FaChevronRight size={14} color="#333" /> : <FaChevronLeft size={14} color="#333" />}
                    </button>

                    <div className="p-3">
                        {!sidebarMinimized && (
                            <h5 className="text-center mb-4 pb-3 border-bottom border-secondary" style={{ fontSize: '1rem', fontWeight: '500', color: 'white' }}>
                                Navigation
                            </h5>
                        )}
                        <ul className="nav flex-column">
                            <li className="nav-item mb-2">
                                <Link to="/dashboard" className="nav-link text-white rounded d-flex align-items-center" title="Dashboard">
                                    <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                                </Link>
                            </li>
                            <li className="nav-item mb-2">
                                <Link to="/problem/create" className="nav-link text-white rounded d-flex align-items-center" title="Create Problem">
                                    <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                                </Link>
                            </li>
                            <li className="nav-item mb-2">
                                <Link to="/problems" className="nav-link text-white rounded d-flex align-items-center" title="All Problems">
                                    <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                                </Link>
                            </li>
                            <li className="nav-item mb-2">
                                <Link to="/reports" className="nav-link text-white rounded d-flex align-items-center" title="Reports">
                                    <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                                </Link>
                            </li>
                            {(user?.role === 'admin' || user?.role === 'team_leader') && (
                                <>
                                    <li className="nav-item mb-2">
                                        <Link to="/admin" className="nav-link text-white rounded d-flex align-items-center" title="User Management">
                                            <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                            {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>User Management</span>}
                                        </Link>
                                    </li>
                                    <li className="nav-item mb-2">
                                        <Link to="/domain-status" className="nav-link text-white rounded d-flex align-items-center" title="Domain Status">
                                            <FaGlobe style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                            {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Domain Status</span>}
                                        </Link>
                                    </li>
                                    {/* Active Page */}
                                    <li className="nav-item mb-2">
                                        <Link to="/roles" className="nav-link text-white bg-primary rounded d-flex align-items-center" title="Role Management">
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
                <div className="flex-grow-1 p-4" style={{ overflowY: 'auto', transition: 'margin-left 0.3s ease' }}>
                    {/* Header */}
                    <div className="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h1 className="h3 mb-0" style={{ color: '#333' }}>Role Management</h1>
                            <p className="text-muted mb-0 small">Manage user roles and permissions</p>
                        </div>
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                                onClick={fetchRoles}
                                disabled={loading}
                            >
                                <FaSync className={loading ? 'fa-spin me-1' : 'me-1'} size={12} />
                                Refresh Roles
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {permissionError && (
                        <div className="alert alert-warning">
                            <FaExclamationCircle className="me-2" />
                            {permissionError}
                        </div>
                    )}

                    {/* Roles Table Card */}
                    <div className="card border-0 shadow-sm">
                        <div className="card-header bg-white d-flex justify-content-between align-items-center py-3">
                            <h5 className="mb-0" style={{ color: '#333' }}>Roles List</h5>
                            <button
                                className="btn btn-primary d-flex align-items-center btn-sm"
                                onClick={openCreateModal}
                                disabled={permissionsLoading}
                            >
                                {permissionsLoading ? <span className="spinner-border spinner-border-sm me-2" /> : <FaPlus className="me-2" />}
                                Create New Role
                            </button>
                        </div>

                        <div className="card-body p-0">
                            <div className="table-responsive">
                                <table className="table table-hover mb-0 align-middle">
                                    <thead className="table-dark">
                                        <tr>
                                            <th className="text-center" style={{ width: '60px' }}>#</th>
                                            <th>Role Name</th>
                                            {/* <th>ID</th> */}
                                            <th className="text-center" style={{ width: '140px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : currentRoles.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="text-center py-4 text-muted">
                                                    No roles found. Click "Create New Role" to add one.
                                                </td>
                                            </tr>
                                        ) : (
                                            currentRoles.map((role, index) => (
                                                <tr key={role.id}>
                                                    <td className="text-center fw-medium">
                                                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                    </td>
                                                    <td className="fw-semibold">
                                                        {role.name}
                                                    </td>
                                                    {/* <td>
                                                        <code className="bg-light px-2 py-1 rounded">{role.id}</code>
                                                    </td> */}
                                                    <td className="text-center">
                                                        <div className="d-flex justify-content-center gap-2">
                                                            <button
                                                                className="btn btn-sm btn-outline-primary d-flex align-items-center"
                                                                onClick={() => openEditModal(role)}
                                                                title="Edit Role"
                                                                style={{ padding: '5px 10px', fontSize: '0.85rem' }}
                                                                disabled={permissionsLoading}
                                                            >
                                                                <FaEdit className="me-1" size={12} />
                                                                Edit
                                                            </button>
                                                            {/* <button
                                                                className="btn btn-sm btn-outline-danger d-flex align-items-center"
                                                                onClick={() => handleDeleteRole(role)}
                                                                title="Delete Role"
                                                                style={{ padding: '5px 10px', fontSize: '0.85rem' }}
                                                                disabled={deletingRoleId === role.id || loading}
                                                            >
                                                                {deletingRoleId === role.id ? (
                                                                    <>
                                                                        <span className="spinner-border spinner-border-sm me-1" />
                                                                        Deleting...
                                                                    </>
                                                                ) : (
                                                                    <>
                                                                        <FaTrash className="me-1" size={12} />
                                                                        Delete
                                                                    </>
                                                                )}
                                                            </button> */}
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="card-footer bg-white d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                    Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} of {totalItems}
                                </small>
                                <div>
                                    <button
                                        className="btn btn-sm btn-outline-secondary me-1"
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                    >
                                        Previous
                                    </button>
                                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                        <button
                                            key={page}
                                            className={`btn btn-sm me-1 ${currentPage === page ? 'btn-primary' : 'btn-outline-secondary'}`}
                                            onClick={() => setCurrentPage(page)}
                                        >
                                            {page}
                                        </button>
                                    ))}
                                    <button
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Overlay */}
            {showModal && (
                <div style={{
                    position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1055
                }}>
                    <div className="bg-white rounded shadow-lg d-flex flex-column" style={{ width: '95%', maxWidth: '800px', maxHeight: '90vh' }}>
                        {/* Modal Header */}
                        <div className="border-bottom px-4 py-3 d-flex justify-content-between align-items-center bg-primary text-white">
                            <h5 className="mb-0">
                                {isEditing ? 'Edit Role' : 'Create New Role'}
                                {isEditing && fetchingPermissions && (
                                    <span className="badge bg-warning text-dark ms-2">
                                        <FaSpinner className="fa-spin me-1" /> Loading...
                                    </span>
                                )}
                            </h5>
                            <button
                                className="btn-close btn-close-white"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                                disabled={modalLoading}
                            ></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-auto">
                            {/* Role Name Input */}
                            <div className="mb-4">
                                <label className="form-label fw-bold">Role Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter role name (e.g., admin, team_leader, user)"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    disabled={modalLoading}
                                />
                            </div>

                            {/* Permission Status Section */}
                            <div className="mb-4">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                    <div>
                                        <label className="form-label fw-bold">Permissions</label>
                                        {isEditing && (
                                            <div className="text-muted small">
                                                {fetchingPermissions ? (
                                                    <span className="text-warning">
                                                        <FaSpinner className="fa-spin me-1" /> Loading previous permissions...
                                                    </span>
                                                ) : initialPermissionsLoaded ? (
                                                    <span className="text-success">
                                                        <FaCheck className="me-1" /> {selectedPermissions.length} previous permissions loaded
                                                    </span>
                                                ) : null}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Permission Summary */}
                                {selectedPermissions.length > 0 && (
                                    <div className="alert alert-info py-2 mb-3">
                                        <div className="d-flex align-items-center">
                                            <FaInfoCircle className="me-2" />
                                            <div>
                                                <strong>{selectedPermissions.length} permission(s) selected</strong>
                                                <div className="small mt-1">
                                                    {selectedPermissions.slice(0, 3).map(id => {
                                                        const perm = allPermissions.find(p => Number(p.id) === Number(id));
                                                        return perm ? (
                                                            <span key={id} className="badge bg-primary bg-opacity-25 text-primary me-1 mb-1">
                                                                {perm.name}
                                                            </span>
                                                        ) : null;
                                                    })}
                                                    {selectedPermissions.length > 3 && (
                                                        <span className="badge bg-secondary">
                                                            +{selectedPermissions.length - 3} more
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Permissions Container */}
                                <div className="border rounded bg-light p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {permissionsLoading ? (
                                        <div className="text-center py-5">
                                            <FaSpinner className="fa-spin text-primary mb-3" size={24} />
                                            <p className="text-muted">Loading permissions...</p>
                                        </div>
                                    ) : allPermissions.length === 0 ? (
                                        <div className="text-center py-4">
                                            <FaExclamationCircle className="text-warning mb-2" size={24} />
                                            <p className="text-muted">No permissions available</p>
                                            <small className="text-muted d-block">
                                                Contact administrator to configure permissions
                                            </small>
                                        </div>
                                    ) : fetchingPermissions ? (
                                        <div className="text-center py-4">
                                            <div className="d-flex align-items-center justify-content-center">
                                                <FaSpinner className="fa-spin text-primary me-2" />
                                                <span>Loading previously granted permissions...</span>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="row g-3">
                                            {permissionGroups.map(group => {
                                                const selectedCount = group.permissions.filter(p => 
                                                    selectedPermissions.includes(Number(p.id))
                                                ).length;
                                                const totalCount = group.permissions.length;
                                                
                                                return (
                                                    <div key={group.key} className="col-md-6 col-lg-4">
                                                        <div className="card h-100 shadow-sm border-0">
                                                            {/* Group Header */}
                                                            <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                                                <span className="fw-bold small">{group.label}</span>
                                                                <div className="d-flex align-items-center">
                                                                    <div className="form-check m-0 position-relative">
                                                                        <input
                                                                            className="form-check-input"
                                                                            type="checkbox"
                                                                            checked={isGroupFullySelected(group)}
                                                                            ref={el => {
                                                                                if (el) {
                                                                                    el.indeterminate = isGroupPartiallySelected(group);
                                                                                }
                                                                            }}
                                                                            onChange={() => handleGroupToggle(group)}
                                                                            style={{ cursor: 'pointer' }}
                                                                            disabled={modalLoading}
                                                                        />
                                                                    </div>
                                                                    <span className={`badge ${selectedCount > 0 ? 'bg-success' : 'bg-secondary'} ms-2`} style={{ fontSize: '0.7rem' }}>
                                                                        {selectedCount}/{totalCount}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                            {/* Group Permissions */}
                                                            <div className="card-body p-2 bg-light">
                                                                {group.permissions.map(perm => {
                                                                    const isSelected = selectedPermissions.includes(Number(perm.id));
                                                                    return (
                                                                        <div key={perm.id} className="form-check mb-1 d-flex align-items-center">
                                                                            <input
                                                                                className="form-check-input"
                                                                                type="checkbox"
                                                                                id={`perm-${perm.id}`}
                                                                                checked={isSelected}
                                                                                onChange={() => togglePermissionSelection(Number(perm.id))}
                                                                                style={{ cursor: 'pointer' }}
                                                                                disabled={modalLoading}
                                                                            />
                                                                            <label 
                                                                                className={`form-check-label small ms-2 flex-grow-1 ${isSelected ? 'fw-semibold text-primary' : ''}`}
                                                                                htmlFor={`perm-${perm.id}`}
                                                                                style={{ cursor: 'pointer' }}
                                                                            >
                                                                                {perm.name}
                                                                            </label>
                                                                            {isSelected && (
                                                                                <FaCheck className="text-success ms-2" size={12} />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                                
                                {/* Permission Actions */}
                                <div className="mt-3 d-flex justify-content-between align-items-center">
                                    <div className="small text-muted">
                                        Total permissions: {allPermissions.length} • Selected: {selectedPermissions.length}
                                    </div>
                                    <div>
                                        <button 
                                            className="btn btn-sm btn-outline-primary me-2"
                                            onClick={() => {
                                                if (selectedPermissions.length === allPermissions.length) {
                                                    setSelectedPermissions([]);
                                                } else {
                                                    setSelectedPermissions(allPermissions.map(p => Number(p.id)));
                                                }
                                            }}
                                            disabled={modalLoading || permissionsLoading || allPermissions.length === 0}
                                        >
                                            {selectedPermissions.length === allPermissions.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                        <button 
                                            className="btn btn-sm btn-outline-secondary"
                                            onClick={() => setSelectedPermissions([])}
                                            disabled={modalLoading || selectedPermissions.length === 0}
                                        >
                                            Clear All
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Warning for Edit Mode */}
                            {isEditing && initialPermissionsLoaded && (
                                <div className="alert alert-warning">
                                    <FaInfoCircle className="me-2" />
                                    <strong>Note:</strong> You are viewing previously granted permissions. 
                                    Any changes will update the role's permissions.
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="border-top px-4 py-3 d-flex justify-content-end bg-light rounded-bottom">
                            <button 
                                className="btn btn-secondary me-2" 
                                onClick={() => setShowModal(false)}
                                disabled={modalLoading}
                            >
                                Cancel
                            </button>
                            <button
                                className="btn btn-primary d-flex align-items-center"
                                onClick={handleSubmit}
                                disabled={modalLoading || (isEditing && fetchingPermissions)}
                            >
                                {modalLoading ? (
                                    <>
                                        <FaSpinner className="fa-spin me-2" />
                                        {isEditing ? 'Updating...' : 'Creating...'}
                                    </>
                                ) : (
                                    <>
                                        {isEditing ? 'Update Role' : 'Create Role'}
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}