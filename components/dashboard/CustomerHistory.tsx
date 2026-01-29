import React, { useState, useEffect } from 'react';
import { Search, User, Calendar, DollarSign, Heart, AlertCircle, X, RefreshCw, ChevronRight } from 'lucide-react';
import { customers } from '../../api/client';

interface CustomerData {
  id: string;
  name: string;
  email: string;
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  preferences: string | null;
  allergies: string | null;
  notes: string | null;
  recentServices: {
    service: string;
    date: string;
    price: number;
    status: string;
  }[];
}

interface CustomerDetail {
  customer: { id: string; name: string; email: string };
  totalVisits: number;
  totalSpent: number;
  lastVisit: string | null;
  preferences: string | null;
  allergies: string | null;
  notes: string | null;
  favoriteServices: { name: string; count: number }[];
  preferredStylist: { name: string; count: number } | null;
  appointments: {
    id: string;
    service: string;
    stylist: string;
    date: string;
    price: number;
    status: string;
  }[];
}

export const CustomerHistory: React.FC = () => {
  const [customerList, setCustomerList] = useState<CustomerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesForm, setNotesForm] = useState({
    preferences: '',
    allergies: '',
    notes: ''
  });
  const [saving, setSaving] = useState(false);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const response = await customers.getAll();
      setCustomerList(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const openCustomerDetail = async (customerId: string) => {
    try {
      const response = await customers.getById(customerId);
      setSelectedCustomer(response.data);
      setNotesForm({
        preferences: response.data.preferences || '',
        allergies: response.data.allergies || '',
        notes: response.data.notes || ''
      });
      setShowDetailModal(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load customer details');
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;

    try {
      setSaving(true);
      await customers.update(selectedCustomer.customer.id, notesForm);
      setEditingNotes(false);
      // Refresh customer detail
      const response = await customers.getById(selectedCustomer.customer.id);
      setSelectedCustomer(response.data);
      fetchCustomers();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save notes');
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customerList.filter(customer =>
    customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Customer History</h2>
          <p className="text-sm text-gray-500">Track customer preferences and visit history</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search customers by name or email..."
          className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pink-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          {error}
          <button onClick={() => setError(null)} className="ml-4 text-sm underline">Dismiss</button>
        </div>
      )}

      {/* Customer List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-gray-500 text-sm">
              <tr>
                <th className="px-6 py-4 font-medium text-left">Customer</th>
                <th className="px-6 py-4 font-medium text-left">Total Visits</th>
                <th className="px-6 py-4 font-medium text-left">Total Spent</th>
                <th className="px-6 py-4 font-medium text-left">Last Visit</th>
                <th className="px-6 py-4 font-medium text-left">Notes</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCustomers.map((customer) => (
                <tr key={customer.id} className="hover:bg-pink-50/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold mr-3">
                        {customer.name[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{customer.name}</p>
                        <p className="text-sm text-gray-500">{customer.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.totalVisits}</td>
                  <td className="px-6 py-4 text-gray-600">${customer.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-gray-600">
                    {customer.lastVisit 
                      ? new Date(customer.lastVisit).toLocaleDateString()
                      : 'Never'
                    }
                  </td>
                  <td className="px-6 py-4">
                    {(customer.preferences || customer.allergies || customer.notes) ? (
                      <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        <Heart className="h-3 w-3" /> Has notes
                      </span>
                    ) : (
                      <span className="text-gray-400 text-sm">No notes</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => openCustomerDetail(customer.id)}
                      className="inline-flex items-center gap-1 text-pink-600 hover:text-pink-700 font-medium text-sm"
                    >
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                    {searchQuery ? 'No customers found matching your search' : 'No customer history available'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Detail Modal */}
      {showDetailModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xl">
                  {selectedCustomer.customer.name[0]}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedCustomer.customer.name}</h3>
                  <p className="text-sm text-gray-500">{selectedCustomer.customer.email}</p>
                </div>
              </div>
              <button
                onClick={() => { setShowDetailModal(false); setEditingNotes(false); }}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-pink-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-pink-600 mb-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">Total Visits</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{selectedCustomer.totalVisits}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-green-600 mb-1">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm">Total Spent</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">${selectedCustomer.totalSpent.toLocaleString()}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 text-blue-600 mb-1">
                    <User className="h-4 w-4" />
                    <span className="text-sm">Last Visit</span>
                  </div>
                  <p className="text-lg font-bold text-gray-900">
                    {selectedCustomer.lastVisit 
                      ? new Date(selectedCustomer.lastVisit).toLocaleDateString()
                      : 'N/A'
                    }
                  </p>
                </div>
              </div>

              {/* Favorites */}
              {(selectedCustomer.favoriteServices.length > 0 || selectedCustomer.preferredStylist) && (
                <div className="bg-gray-50 p-4 rounded-xl">
                  <h4 className="font-medium text-gray-900 mb-3">Favorites</h4>
                  <div className="space-y-2 text-sm">
                    {selectedCustomer.favoriteServices.length > 0 && (
                      <div className="flex items-start gap-2">
                        <Heart className="h-4 w-4 text-pink-500 mt-0.5" />
                        <div>
                          <span className="text-gray-600">Favorite Services: </span>
                          <span className="text-gray-900">
                            {selectedCustomer.favoriteServices.map(s => s.name).join(', ')}
                          </span>
                        </div>
                      </div>
                    )}
                    {selectedCustomer.preferredStylist && (
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-purple-500" />
                        <span className="text-gray-600">Preferred Stylist: </span>
                        <span className="text-gray-900">{selectedCustomer.preferredStylist.name}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Notes Section */}
              <div className="bg-white border border-gray-200 rounded-xl">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                  <h4 className="font-medium text-gray-900">Customer Notes & Preferences</h4>
                  {!editingNotes && (
                    <button
                      onClick={() => setEditingNotes(true)}
                      className="text-sm text-pink-600 hover:text-pink-700"
                    >
                      Edit
                    </button>
                  )}
                </div>

                {editingNotes ? (
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Preferences
                      </label>
                      <textarea
                        value={notesForm.preferences}
                        onChange={(e) => setNotesForm({ ...notesForm, preferences: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows={2}
                        placeholder="e.g., Prefers shorter wait times, likes quiet environment"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        <span className="flex items-center gap-1">
                          <AlertCircle className="h-4 w-4 text-amber-500" />
                          Allergies / Sensitivities
                        </span>
                      </label>
                      <textarea
                        value={notesForm.allergies}
                        onChange={(e) => setNotesForm({ ...notesForm, allergies: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows={2}
                        placeholder="e.g., Allergic to certain hair dyes, sensitive skin"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        General Notes
                      </label>
                      <textarea
                        value={notesForm.notes}
                        onChange={(e) => setNotesForm({ ...notesForm, notes: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500"
                        rows={3}
                        placeholder="Any other relevant notes about this customer"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setEditingNotes(false)}
                        className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveNotes}
                        disabled={saving}
                        className="flex-1 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition disabled:opacity-50"
                      >
                        {saving ? 'Saving...' : 'Save Notes'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    {selectedCustomer.preferences && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Preferences: </span>
                        <span className="text-sm text-gray-600">{selectedCustomer.preferences}</span>
                      </div>
                    )}
                    {selectedCustomer.allergies && (
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5" />
                        <div>
                          <span className="text-sm font-medium text-amber-700">Allergies: </span>
                          <span className="text-sm text-gray-600">{selectedCustomer.allergies}</span>
                        </div>
                      </div>
                    )}
                    {selectedCustomer.notes && (
                      <div>
                        <span className="text-sm font-medium text-gray-700">Notes: </span>
                        <span className="text-sm text-gray-600">{selectedCustomer.notes}</span>
                      </div>
                    )}
                    {!selectedCustomer.preferences && !selectedCustomer.allergies && !selectedCustomer.notes && (
                      <p className="text-sm text-gray-400">No notes added yet</p>
                    )}
                  </div>
                )}
              </div>

              {/* Visit History */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Visit History</h4>
                <div className="space-y-2">
                  {selectedCustomer.appointments.slice(0, 10).map((apt) => (
                    <div key={apt.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">{apt.service}</p>
                        <p className="text-sm text-gray-500">
                          {apt.stylist && `with ${apt.stylist} • `}
                          {new Date(apt.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">${apt.price}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          apt.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          apt.status === 'CANCELLED' ? 'bg-red-100 text-red-700' :
                          'bg-blue-100 text-blue-700'
                        }`}>
                          {apt.status}
                        </span>
                      </div>
                    </div>
                  ))}
                  {selectedCustomer.appointments.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">No visit history</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
