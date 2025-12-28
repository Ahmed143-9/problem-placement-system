
import React, { useState, useEffect, useRef } from 'react';
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
    FaEllipsisV,
    FaCheck
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
    const [actionMenuId, setActionMenuId] = useState(null);

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [selectedRoleId, setSelectedRoleId] = useState(null);
    const [name, setName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState([]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (actionMenuId !== null && !event.target.closest('.action-menu-container')) {
                setActionMenuId(null);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [actionMenuId]);

    useEffect(() => {
        fetchRoles();
        fetchPermissions();
    }, []);

    // --- API Functions ---

    const fetchRoles = async () => {
        try {
            setLoading(true);
            setError(null);
            // Use api service which handles base URL and tokens
            const response = await api.post('/v1/role/getAllRoles');

            const data = response.data;
            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            const roleList = data?.data?.rolelist ?? data?.rolelist ?? [];

            if (ok) {
                setRoles(Array.isArray(roleList) ? roleList : []);
            } else {
                setError(data?.message || 'Failed to fetch roles');
            }
        } catch (err) {
            console.error('Fetch roles error:', err);
            setError('Error connecting to server');
        } finally {
            setLoading(false);
        }
    };

    const fetchPermissions = async () => {
        try {
            setPermissionsLoading(true);
            const response = await api.post('/v1/permission/getAllpermissions');

            const data = response.data;
            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            const permissionList = data?.data?.permissionlist ?? data?.permissionlist ?? [];

            if (ok) {
                const permissions = Array.isArray(permissionList) ? permissionList : [];
                setAllPermissions(permissions);
                setPermissionGroups(groupPermissions(permissions));
            } else {
                console.error('Failed to fetch permissions:', data?.message);
            }
        } catch (err) {
            console.error('Fetch permissions error:', err);
        } finally {
            setPermissionsLoading(false);
        }
    };

    const fetchRolePermissions = async (roleId) => {
        try {
            const response = await api.post('/v1/role/getRole', { id: roleId });
            const data = response.data;
            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            if (ok) {
                // Backend returns array of permission NAMES
                const permissionNames = data?.permissions ?? data?.data?.permissions ?? [];

                // Map names to IDs for local state
                const permissionIds = [];
                permissionNames.forEach(permName => {
                    const found = allPermissions.find(p => p.name === permName);
                    if (found) {
                        permissionIds.push(Number(found.id));
                    }
                });
                return permissionIds;
            }
            return [];
        } catch (err) {
            console.error('Fetch role permissions error:', err);
            return [];
        }
    };

    const handleSubmit = async () => {
        if (!name.trim()) {
            addNotification({ type: 'error', title: 'Error', message: 'Role name is required', color: 'danger', icon: '⚠️' });
            return;
        }

        try {
            setModalLoading(true);

            // Convert IDs back to Names for backend
            const permissionNames = selectedPermissions.map(id => {
                const p = allPermissions.find(px => Number(px.id) === Number(id));
                return p ? p.name : null;
            }).filter(Boolean);

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
            const ok = data?.status === 'success' || data?.status === 200 || data?.code === 200;

            if (ok) {
                addNotification({
                    type: 'success',
                    title: 'Success',
                    message: isEditing ? 'Role updated' : 'Role created',
                    color: 'success',
                    icon: '✅'
                });
                setShowModal(false);
                fetchRoles();
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
            console.error('Submit role error:', err);
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
        const groups = {};
        permissions.forEach((p) => {
            const rawName = (p.name || '').trim();
            if (!rawName) return;
            const firstToken = rawName.split(' ')[0].toLowerCase();
            const groupKey = firstToken || 'other';
            if (!groups[groupKey]) {
                groups[groupKey] = {
                    key: groupKey,
                    label: firstToken.charAt(0).toUpperCase() + firstToken.slice(1),
                    permissions: []
                };
            }
            groups[groupKey].permissions.push(p);
        });

        // Convert to array
        const groupArray = Object.values(groups).sort((a, b) => a.label.localeCompare(b.label));
        groupArray.forEach(g => g.permissions.sort((x, y) => x.name.localeCompare(y.name)));
        return groupArray;
    };

    // Selection Logic
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
            // Unselect all
            setSelectedPermissions(prev => prev.filter(id => !pIds.includes(id)));
        } else {
            // Select all
            setSelectedPermissions(prev => {
                const unique = new Set([...prev, ...pIds]);
                return Array.from(unique);
            });
        }
    };

    const isGroupFullySelected = (group) => group.permissions.every(p => selectedPermissions.includes(Number(p.id)));
    const isGroupPartiallySelected = (group) => {
        const count = group.permissions.filter(p => selectedPermissions.includes(Number(p.id))).length;
        return count > 0 && count < group.permissions.length;
    };

    // Modal Openers
    const openCreateModal = () => {
        setIsEditing(false);
        setName('');
        setSelectedPermissions([]);
        setSelectedRoleId(null);
        setShowModal(true);
    };

    const openEditModal = async (role) => {
        setIsEditing(true);
        setName(role.name);
        setSelectedRoleId(role.id);
        setShowModal(true);
        // Fetch current permissions
        const ids = await fetchRolePermissions(role.id);
        setSelectedPermissions(ids);
    };

    // --- UI Components ---

    const toggleSidebar = () => setSidebarMinimized(!sidebarMinimized);
    const sidebarLinkStyle = { transition: 'all 0.2s ease' };

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
                                <Link to="/dashboard" className="nav-link text-white rounded d-flex align-items-center" style={sidebarLinkStyle} title="Dashboard">
                                    <FaHome style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Dashboard</span>}
                                </Link>
                            </li>
                            <li className="nav-item mb-2">
                                <Link to="/problem/create" className="nav-link text-white rounded d-flex align-items-center" style={sidebarLinkStyle} title="Create Problem">
                                    <FaPlusCircle style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Create Problem</span>}
                                </Link>
                            </li>
                            <li className="nav-item mb-2">
                                <Link to="/problems" className="nav-link text-white rounded d-flex align-items-center" style={sidebarLinkStyle} title="All Problems">
                                    <FaExclamationTriangle style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>All Problems</span>}
                                </Link>
                            </li>
                            <li className="nav-item mb-2">
                                <Link to="/reports" className="nav-link text-white rounded d-flex align-items-center" style={sidebarLinkStyle} title="Reports">
                                    <FaFileAlt style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                    {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Reports</span>}
                                </Link>
                            </li>
                            {(user?.role === 'admin' || user?.role === 'team_leader') && (
                                <>
                                    <li className="nav-item mb-2">
                                        <Link to="/admin" className="nav-link text-white rounded d-flex align-items-center" style={sidebarLinkStyle} title="User Management">
                                            <FaUsersCog style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                            {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>User Management</span>}
                                        </Link>
                                    </li>
                                    <li className="nav-item mb-2">
                                        <Link to="/domain-status" className="nav-link text-white rounded d-flex align-items-center" style={sidebarLinkStyle} title="Domain Status">
                                            <FaGlobe style={{ fontSize: '0.9rem', minWidth: '20px' }} />
                                            {!sidebarMinimized && <span className="ms-2" style={{ fontSize: '0.9rem' }}>Domain Status</span>}
                                        </Link>
                                    </li>
                                    {/* Active Page Helper */}
                                    <li className="nav-item mb-2">
                                        <Link to="/roles" className="nav-link text-white bg-primary rounded d-flex align-items-center" style={sidebarLinkStyle} title="Role Management">
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
                        {/* Breadcrumb replacement or actions */}
                    </div>

                    {error && (
                        <div className="alert alert-danger">
                            {error}
                        </div>
                    )}

                    {/* Card */}
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
                                    <thead className="thead-light bg-light">
                                        <tr>
                                            <th className="text-center" style={{ width: '60px' }}>S/N</th>
                                            <th>Name</th>
                                            <th className="text-center" style={{ width: '100px' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loading ? (
                                            <tr>
                                                <td colSpan="3" className="text-center py-5">
                                                    <div className="spinner-border text-primary" role="status">
                                                        <span className="visually-hidden">Loading...</span>
                                                    </div>
                                                </td>
                                            </tr>
                                        ) : currentRoles.length === 0 ? (
                                            <tr>
                                                <td colSpan="3" className="text-center py-4 text-muted">
                                                    No roles found.
                                                </td>
                                            </tr>
                                        ) : (
                                            currentRoles.map((role, index) => (
                                                <tr key={role.id}>
                                                    <td className="text-center">
                                                        {(currentPage - 1) * ITEMS_PER_PAGE + index + 1}
                                                    </td>
                                                    <td className="fw-semibold">{role.name}</td>
                                                    <td className="text-center action-menu-container position-relative">
                                                        <button
                                                            className="btn btn-link text-dark p-0"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setActionMenuId(actionMenuId === role.id ? null : role.id);
                                                            }}
                                                        >
                                                            <FaEllipsisV />
                                                        </button>

                                                        {actionMenuId === role.id && (
                                                            <div className="position-absolute bg-white border rounded shadow-sm py-1"
                                                                style={{ top: '100%', right: '0', zIndex: 10, minWidth: '120px' }}>
                                                                <button
                                                                    className="dropdown-item d-flex align-items-center small py-2"
                                                                    onClick={() => openEditModal(role)}
                                                                >
                                                                    <FaEdit className="me-2 text-primary" /> Edit
                                                                </button>
                                                                {/* Optional Delete Button */}
                                                                {/* <button className="dropdown-item d-flex align-items-center small py-2 text-danger">
                                   <FaTrash className="me-2" /> Delete
                                 </button> */}
                                                            </div>
                                                        )}
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
                        <div className="border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
                            <h5 className="mb-0">{isEditing ? 'Edit Role' : 'Create New Role'}</h5>
                            <button
                                className="btn-close"
                                onClick={() => setShowModal(false)}
                                aria-label="Close"
                            ></button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-4 overflow-auto">
                            <div className="mb-4">
                                <label className="form-label fw-bold">Role Name <span className="text-danger">*</span></label>
                                <input
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter role name"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="form-label fw-bold">Permissions</label>
                                <div className="border rounded bg-light p-3" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                                    {permissionsLoading ? (
                                        <div className="text-center py-3">Loading permissions...</div>
                                    ) : permissionGroups.length === 0 ? (
                                        <p className="text-muted text-center mb-0">No permissions found.</p>
                                    ) : (
                                        <div className="row g-3">
                                            {permissionGroups.map(group => (
                                                <div key={group.key} className="col-md-6 col-lg-4">
                                                    <div className="card h-100 shadow-sm border-0">
                                                        <div className="card-header bg-white py-2 d-flex justify-content-between align-items-center">
                                                            <span className="fw-bold small">{group.label}</span>
                                                            <div className="form-check m-0">
                                                                <input
                                                                    className="form-check-input"
                                                                    type="checkbox"
                                                                    checked={isGroupFullySelected(group)}
                                                                    ref={el => { if (el) el.indeterminate = isGroupPartiallySelected(group); }}
                                                                    onChange={() => handleGroupToggle(group)}
                                                                    style={{ cursor: 'pointer' }}
                                                                />
                                                            </div>
                                                        </div>
                                                        <div className="card-body p-2 bg-light">
                                                            {group.permissions.map(perm => (
                                                                <div key={perm.id} className="form-check mb-1">
                                                                    <input
                                                                        className="form-check-input"
                                                                        type="checkbox"
                                                                        id={`perm-${perm.id}`}
                                                                        checked={selectedPermissions.includes(Number(perm.id))}
                                                                        onChange={() => togglePermissionSelection(Number(perm.id))}
                                                                        style={{ cursor: 'pointer' }}
                                                                    />
                                                                    <label className="form-check-label small" htmlFor={`perm-${perm.id}`} style={{ cursor: 'pointer' }}>
                                                                        {perm.name}
                                                                    </label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <div className="mt-2 small text-muted">
                                    {selectedPermissions.length} permissions selected.
                                </div>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-top px-4 py-3 d-flex justify-content-end bg-light rounded-bottom">
                            <button className="btn btn-secondary me-2" onClick={() => setShowModal(false)}>Cancel</button>
                            <button
                                className="btn btn-primary"
                                onClick={handleSubmit}
                                disabled={modalLoading}
                            >
                                {modalLoading ? <span className="spinner-border spinner-border-sm me-2" /> : null}
                                {isEditing ? 'Update Role' : 'Create Role'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
