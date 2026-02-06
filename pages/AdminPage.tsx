import React, { useState, useEffect } from 'react';
import {
  Users, Building2, Calendar, TrendingUp, Settings, Shield,
  Search, MoreVertical, CheckCircle, XCircle, Clock, AlertTriangle, AlertCircle,
  BarChart3, DollarSign, Star, Eye, Trash2, Edit, Ban, ChevronDown, Loader2, RefreshCw
} from 'lucide-react';
import { Button } from '../components/Button';
import { admin } from '../api/client';

type AdminTab = 'overview' | 'users' | 'salons' | 'bookings' | 'reports' | 'settings';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'SALON_OWNER' | 'ADMIN';
  status: 'active' | 'suspended' | 'pending';
  createdAt: string;
  totalBookings: number;
}

interface SalonAdmin {
  id: string;
  name: string;
  owner: { name: string; email: string } | null;
  status: string;
  rating: number;
  _count?: { appointments: number };
  totalRevenue?: number;
  createdAt: string;
}

interface Booking {
  id: string;
  user: { name: string; email: string } | null;
  salon: { name: string } | null;
  service: { name: string } | null;
  date: string;
  time: string;
  status: string;
  totalPrice: number;
}

interface Stats {
  totalUsers: number;
  totalSalons: number;
  totalAppointments: number;
  pendingSalons: number;
  pendingOwners: number;
  totalRevenue: number;
}

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('all');
  
  // Data states
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [salons, setSalons] = useState<SalonAdmin[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [pendingOwners, setPendingOwners] = useState<any[]>([]);
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: 'user' | 'salon'; id: string; name: string } | null>(null);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  
  // Loading states
  const [loading, setLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(false);
  const [salonsLoading, setSalonsLoading] = useState(false);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if user is admin
  const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = currentUser?.role === 'ADMIN';
  const isLoggedIn = !!localStorage.getItem('token');

  // Fetch overview stats
  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await admin.getStats();
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers || []);
      setRecentBookings(response.data.recentAppointments || []);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      if (error.response?.status === 401) {
        setError('You must be logged in to access this page.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access the admin panel. Only administrators can access this page.');
      } else {
        setError('Failed to load admin data. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch users
  const fetchUsers = async (filter?: string) => {
    try {
      setUsersLoading(true);
      const params: any = {};
      if (filter && filter !== 'all') params.role = filter;
      if (searchQuery) params.search = searchQuery;
      const response = await admin.getUsers(params);
      setUsers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setUsersLoading(false);
    }
  };

  // Fetch salons
  const fetchSalons = async (filter?: string) => {
    try {
      setSalonsLoading(true);
      const params: any = {};
      if (filter && filter !== 'all') params.status = filter;
      if (searchQuery) params.search = searchQuery;
      const response = await admin.getSalons(params);
      setSalons(response.data.salons || []);
    } catch (error) {
      console.error('Error fetching salons:', error);
    } finally {
      setSalonsLoading(false);
    }
  };

  // Fetch bookings
  const fetchBookings = async (filter?: string) => {
    try {
      setBookingsLoading(true);
      const params: any = {};
      if (filter && filter !== 'all') params.status = filter;
      const response = await admin.getBookings(params);
      setBookings(response.data.bookings || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setBookingsLoading(false);
    }
  };

  // Handle salon approval
  const handleApproveSalon = async (salonId: string) => {
    try {
      await admin.approveSalon(salonId);
      fetchSalons();
      fetchStats();
    } catch (error) {
      console.error('Error approving salon:', error);
    }
  };

  // Handle salon suspension
  const handleSuspendSalon = async (salonId: string) => {
    try {
      await admin.suspendSalon(salonId, 'Suspended by admin');
      fetchSalons();
      fetchStats();
    } catch (error) {
      console.error('Error suspending salon:', error);
    }
  };

  // Handle user role update
  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      await admin.updateUserRole(userId, role);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
    }
  };

  // Fetch pending salon owners
  const fetchPendingOwners = async () => {
    try {
      const response = await admin.getPendingOwners();
      setPendingOwners(response.data || []);
    } catch (error) {
      console.error('Error fetching pending owners:', error);
    }
  };

  // Handle approve salon owner
  const handleApproveOwner = async (userId: string) => {
    try {
      await admin.approveOwner(userId);
      fetchPendingOwners();
      fetchStats();
      fetchUsers();
    } catch (error) {
      console.error('Error approving owner:', error);
    }
  };

  // Handle reject salon owner
  const handleRejectOwner = async (userId: string) => {
    try {
      await admin.rejectOwner(userId, 'Rejected by admin');
      fetchPendingOwners();
      fetchStats();
      fetchUsers();
    } catch (error) {
      console.error('Error rejecting owner:', error);
    }
  };

  // Handle delete user
  const handleDeleteUser = async (userId: string) => {
    try {
      await admin.deleteUser(userId);
      setDeleteConfirm(null);
      fetchUsers();
      fetchStats();
      fetchPendingOwners();
    } catch (error) {
      console.error('Error deleting user:', error);
    }
  };

  // Handle delete salon
  const handleDeleteSalon = async (salonId: string) => {
    try {
      await admin.deleteSalon(salonId);
      setDeleteConfirm(null);
      fetchSalons();
      fetchStats();
    } catch (error) {
      console.error('Error deleting salon:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchPendingOwners();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers(selectedFilter);
    if (activeTab === 'salons') fetchSalons(selectedFilter);
    if (activeTab === 'bookings') fetchBookings(selectedFilter);
  }, [activeTab, selectedFilter]);

  const tabs: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="h-5 w-5" /> },
    { id: 'users', label: 'Users', icon: <Users className="h-5 w-5" /> },
    { id: 'salons', label: 'Salons', icon: <Building2 className="h-5 w-5" /> },
    { id: 'bookings', label: 'Bookings', icon: <Calendar className="h-5 w-5" /> },
    { id: 'reports', label: 'Reports', icon: <TrendingUp className="h-5 w-5" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'confirmed':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'suspended':
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
      case 'completed':
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'suspended':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  if (loading && !stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Show error if not authorized or other error occurred
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          {!isLoggedIn && (
            <p className="text-sm text-gray-500 mb-4">
              Please login with admin credentials:<br />
              <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">admin@glamconnect.com / admin123</span>
            </p>
          )}
          <Button onClick={() => window.location.href = '/'}>
            Go to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">Admin Control Panel</h1>
                <p className="text-purple-200 text-sm">Manage your GlamConnect platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center absolute -top-1 -right-1">
                  {(stats?.pendingSalons || 0) + (stats?.pendingOwners || 0)}
                </div>
                <Button variant="ghost" className="text-white hover:bg-white/10">
                  <AlertTriangle className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-white rounded-xl p-1 shadow-sm mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Users</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-2">+12% from last month</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Active Salons</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalSalons || 0}</p>
                  </div>
                  <div className="bg-pink-100 p-3 rounded-full">
                    <Building2 className="h-6 w-6 text-pink-600" />
                  </div>
                </div>
                <p className="text-yellow-600 text-sm mt-2">{stats?.pendingSalons || 0} pending approval</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Total Bookings</p>
                    <p className="text-3xl font-bold text-gray-900">{stats?.totalAppointments || 0}</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <Calendar className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-2">+18% from last month</p>
              </div>

              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">Platform Revenue</p>
                    <p className="text-3xl font-bold text-gray-900">Rs. {(stats?.totalRevenue || 0).toLocaleString()}</p>
                  </div>
                  <div className="bg-purple-100 p-3 rounded-full">
                    <DollarSign className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <p className="text-green-600 text-sm mt-2">+22% from last month</p>
              </div>
            </div>

            {/* Pending Owner Approvals */}
            {pendingOwners.length > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-orange-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Pending Salon Owner Approvals ({pendingOwners.length})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => { setActiveTab('users'); setSelectedFilter('SALON_OWNER'); }}>
                    View All
                  </Button>
                </div>
                <div className="space-y-3">
                  {pendingOwners.slice(0, 5).map((owner: any) => (
                    <div key={owner.id} className="flex items-center justify-between bg-white rounded-lg p-3 border border-orange-100">
                      <div>
                        <p className="font-medium text-gray-900">{owner.name}</p>
                        <p className="text-sm text-gray-500">{owner.email}</p>
                        <p className="text-xs text-gray-400">Registered {new Date(owner.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleApproveOwner(owner.id)} className="bg-green-600 hover:bg-green-700 text-white">
                          <CheckCircle className="h-4 w-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleRejectOwner(owner.id)} className="text-red-600 border-red-300 hover:bg-red-50">
                          <XCircle className="h-4 w-4 mr-1" /> Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Pending Salon Approvals */}
            {(stats?.pendingSalons || 0) > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-yellow-800 flex items-center">
                    <AlertTriangle className="h-5 w-5 mr-2" />
                    Pending Salon Approvals ({stats?.pendingSalons})
                  </h3>
                  <Button size="sm" variant="outline" onClick={() => { setActiveTab('salons'); setSelectedFilter('pending'); }}>
                    View All
                  </Button>
                </div>
              </div>
            )}

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Recent Bookings</h3>
                  <Button size="sm" variant="ghost" onClick={() => fetchStats()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-4">
                  {recentBookings.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No recent bookings</p>
                  ) : recentBookings.slice(0, 5).map((booking: any) => (
                    <div key={booking.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div>
                        <p className="font-medium text-gray-900">{booking.user?.name || 'Unknown'}</p>
                        <p className="text-sm text-gray-500">{booking.service?.name} at {booking.salon?.name}</p>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(booking.status?.toLowerCase())}`}>
                        {getStatusIcon(booking.status?.toLowerCase())}
                        {booking.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Recent Users</h3>
                <div className="space-y-4">
                  {recentUsers.length === 0 ? (
                    <p className="text-gray-500 text-sm text-center py-4">No recent users</p>
                  ) : recentUsers.slice(0, 5).map((user: any) => (
                    <div key={user.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                        user.role === 'SALON_OWNER' ? 'bg-pink-100 text-pink-700' :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {user.role}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900">User Management</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Roles</option>
                    <option value="USER">Users</option>
                    <option value="SALON_OWNER">Salon Owners</option>
                    <option value="ADMIN">Admins</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">User</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Role</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Joined</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Bookings</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersLoading ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto" />
                      </td>
                    </tr>
                  ) : users.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-500">No users found</td>
                    </tr>
                  ) : users.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <p className="font-medium text-gray-900">{user.name}</p>
                            <p className="text-sm text-gray-500">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'SALON_OWNER' ? 'bg-pink-100 text-pink-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(user.status || 'active')}`}>
                            {getStatusIcon(user.status || 'active')}
                            {user.status || 'active'}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-gray-500 text-sm">{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-gray-900">{user.totalBookings}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {user.status === 'pending' && user.role === 'SALON_OWNER' ? (
                              <>
                                <button 
                                  onClick={() => handleApproveOwner(user.id)}
                                  className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 flex items-center gap-1"
                                >
                                  <CheckCircle className="h-3 w-3" /> Approve
                                </button>
                                <button 
                                  onClick={() => handleRejectOwner(user.id)}
                                  className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium hover:bg-red-200 flex items-center gap-1"
                                >
                                  <XCircle className="h-3 w-3" /> Reject
                                </button>
                              </>
                            ) : (
                              <>
                                <button className="p-1 hover:bg-gray-100 rounded" title="View">
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </button>
                                <select 
                                  className="text-xs border rounded px-1 py-0.5"
                                  value={user.role}
                                  onChange={(e) => handleUpdateUserRole(user.id, e.target.value)}
                                >
                                  <option value="USER">User</option>
                                  <option value="SALON_OWNER">Salon Owner</option>
                                  <option value="ADMIN">Admin</option>
                                </select>
                                <button 
                                  className="p-1 hover:bg-red-50 rounded" 
                                  title="Delete User"
                                  onClick={() => setDeleteConfirm({ type: 'user', id: user.id, name: user.name })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Salons Tab */}
        {activeTab === 'salons' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900">Salon Management</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search salons..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="active">Active</option>
                    <option value="pending">Pending</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Salon</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Owner</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Rating</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Bookings</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Revenue</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {salonsLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto" />
                      </td>
                    </tr>
                  ) : salons.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-500">No salons found</td>
                    </tr>
                  ) : salons.map(salon => (
                      <tr key={salon.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <p className="font-medium text-gray-900">{salon.name}</p>
                        </td>
                        <td className="py-4 px-6 text-gray-500">{salon.owner?.name || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(salon.status || 'pending')}`}>
                            {getStatusIcon(salon.status || 'pending')}
                            {salon.status || 'pending'}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {salon.rating > 0 ? (
                            <div className="flex items-center">
                              <Star className="h-4 w-4 text-yellow-400 fill-current mr-1" />
                              <span>{salon.rating?.toFixed(1)}</span>
                            </div>
                          ) : (
                            <span className="text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="py-4 px-6 text-gray-900">{salon._count?.appointments || 0}</td>
                        <td className="py-4 px-6 font-medium text-green-600">NPR {(salon.totalRevenue || 0).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            {salon.status === 'pending' ? (
                              <>
                                <Button 
                                  size="sm" 
                                  className="bg-green-500 hover:bg-green-600 text-xs px-2 py-1 h-auto"
                                  onClick={() => handleApproveSalon(salon.id)}
                                >
                                  Approve
                                </Button>
                                <Button size="sm" variant="outline" className="text-red-600 border-red-200 text-xs px-2 py-1 h-auto">
                                  Reject
                                </Button>
                              </>
                            ) : (
                              <>
                                <button className="p-1 hover:bg-gray-100 rounded" title="View">
                                  <Eye className="h-4 w-4 text-gray-500" />
                                </button>
                                {salon.status === 'active' ? (
                                  <button 
                                    className="p-1 hover:bg-red-50 rounded" 
                                    title="Suspend"
                                    onClick={() => handleSuspendSalon(salon.id)}
                                  >
                                    <Ban className="h-4 w-4 text-red-500" />
                                  </button>
                                ) : (
                                  <button 
                                    className="p-1 hover:bg-green-50 rounded" 
                                    title="Activate"
                                    onClick={() => handleApproveSalon(salon.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                  </button>
                                )}
                                <button 
                                  className="p-1 hover:bg-red-50 rounded" 
                                  title="Delete Salon"
                                  onClick={() => setDeleteConfirm({ type: 'salon', id: salon.id, name: salon.name })}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="p-6 border-b border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h3 className="font-bold text-lg text-gray-900">All Bookings</h3>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search bookings..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <select
                    value={selectedFilter}
                    onChange={(e) => setSelectedFilter(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Booking ID</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Customer</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Salon</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Service</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Date</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Amount</th>
                    <th className="text-left py-3 px-6 text-sm font-medium text-gray-500">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookingsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center">
                        <Loader2 className="h-6 w-6 animate-spin text-purple-500 mx-auto" />
                      </td>
                    </tr>
                  ) : bookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-500">No bookings found</td>
                    </tr>
                  ) : bookings.map(booking => (
                      <tr key={booking.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 font-mono text-sm text-gray-500">#{booking.id}</td>
                        <td className="py-4 px-6 font-medium text-gray-900">{booking.user?.name || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-500">{booking.salon?.name || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-500">{booking.service?.name || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-500">{new Date(booking.date).toLocaleDateString()} {booking.time}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${getStatusColor(booking.status.toLowerCase())}`}>
                            {getStatusIcon(booking.status.toLowerCase())}
                            {booking.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-medium text-gray-900">NPR {booking.totalPrice?.toLocaleString() || 0}</td>
                        <td className="py-4 px-6">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 hover:bg-gray-100 rounded" title="View">
                              <Eye className="h-4 w-4 text-gray-500" />
                            </button>
                            {booking.status === 'PENDING' && (
                              <>
                                <button className="p-1 hover:bg-green-50 rounded" title="Confirm">
                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                </button>
                                <button className="p-1 hover:bg-red-50 rounded" title="Cancel">
                                  <XCircle className="h-4 w-4 text-red-500" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reports Tab */}
        {activeTab === 'reports' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">Revenue Overview</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                    <p>Revenue chart would be displayed here</p>
                    <p className="text-sm">Integration with Recharts available</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="font-bold text-gray-900 mb-4">User Growth</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                  <div className="text-center">
                    <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                    <p>User growth chart would be displayed here</p>
                    <p className="text-sm">Integration with Recharts available</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Quick Reports</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button variant="outline" className="justify-start">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Monthly Revenue Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <Users className="h-4 w-4 mr-2" />
                  User Activity Report
                </Button>
                <Button variant="outline" className="justify-start">
                  <Building2 className="h-4 w-4 mr-2" />
                  Salon Performance Report
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Platform Settings</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">New Salon Registration</p>
                    <p className="text-sm text-gray-500">Allow new salons to register on the platform</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Require Salon Approval</p>
                    <p className="text-sm text-gray-500">New salons require admin approval before going live</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div>
                    <p className="font-medium text-gray-900">Email Notifications</p>
                    <p className="text-sm text-gray-500">Send email notifications for new registrations</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" defaultChecked />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium text-gray-900">Platform Commission Rate</p>
                    <p className="text-sm text-gray-500">Commission percentage on each booking</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      defaultValue="10"
                      className="w-20 border border-gray-200 rounded-lg px-3 py-2 text-sm text-center"
                    />
                    <span className="text-gray-500">%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4">Danger Zone</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium text-red-800">Maintenance Mode</p>
                    <p className="text-sm text-red-600">Take the platform offline for maintenance</p>
                  </div>
                  <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-100">
                    Enable
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Confirm Deletion</h3>
                <p className="text-sm text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-700 mb-2">
              Are you sure you want to delete this {deleteConfirm.type}?
            </p>
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="font-medium text-gray-900">{deleteConfirm.name}</p>
              <p className="text-xs text-red-500 mt-1">
                {deleteConfirm.type === 'user'
                  ? 'All appointments, reviews, notifications, and owned salons will also be deleted.'
                  : 'All services, staff, appointments, reviews, and promo codes for this salon will also be deleted.'}
              </p>
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  if (deleteConfirm.type === 'user') {
                    handleDeleteUser(deleteConfirm.id);
                  } else {
                    handleDeleteSalon(deleteConfirm.id);
                  }
                  setDeleteConfirm(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
