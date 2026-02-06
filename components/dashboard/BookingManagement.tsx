import React, { useState, useEffect } from 'react';
import { 
  CheckCircle, XCircle, Clock, AlertCircle, Loader2, RefreshCw, 
  Search, User, Calendar, Scissors, Filter, ToggleLeft, ToggleRight,
  CheckCheck, Ban, Eye
} from 'lucide-react';
import { Button } from '../Button';
import { appointments } from '../../api/client';

interface BookingItem {
  id: string;
  date: string;
  price: number;
  status: string;
  createdAt?: string;
  user: { id: string; name: string; email: string; phone?: string };
  service: { id: string; name: string; duration: number; price: number; category: string };
  stylist: { id: string; name: string; role: string; avatar: string };
  salon: { id: string; name: string; autoAcceptBookings: boolean };
}

export const BookingManagement: React.FC = () => {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'REJECTED'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoAccept, setAutoAccept] = useState(true);
  const [togglingAutoAccept, setTogglingAutoAccept] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointments.getSalonBookings();
      setBookings(response.data.bookings || []);
      setAutoAccept(response.data.autoAcceptBookings ?? true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    setActionLoading(id);
    try {
      await appointments.accept(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to accept booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setActionLoading(id);
    try {
      await appointments.reject(id, rejectReason);
      setShowRejectModal(null);
      setRejectReason('');
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to reject booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await appointments.complete(id);
      fetchBookings();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to mark as completed');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleAutoAccept = async () => {
    setTogglingAutoAccept(true);
    try {
      const response = await appointments.toggleAutoAccept(!autoAccept);
      setAutoAccept(response.data.autoAcceptBookings);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update setting');
    } finally {
      setTogglingAutoAccept(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string; icon: React.ReactNode; label: string }> = {
      PENDING: { bg: 'bg-amber-100', text: 'text-amber-700', icon: <Clock className="h-3 w-3" />, label: 'Pending' },
      CONFIRMED: { bg: 'bg-blue-100', text: 'text-blue-700', icon: <CheckCircle className="h-3 w-3" />, label: 'Confirmed' },
      COMPLETED: { bg: 'bg-green-100', text: 'text-green-700', icon: <CheckCheck className="h-3 w-3" />, label: 'Completed' },
      CANCELLED: { bg: 'bg-gray-100', text: 'text-gray-600', icon: <XCircle className="h-3 w-3" />, label: 'Cancelled' },
      REJECTED: { bg: 'bg-red-100', text: 'text-red-700', icon: <Ban className="h-3 w-3" />, label: 'Rejected' },
    };
    const s = styles[status] || styles.PENDING;
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold ${s.bg} ${s.text}`}>
        {s.icon} {s.label}
      </span>
    );
  };

  const filteredBookings = bookings.filter(b => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.user.name.toLowerCase().includes(q) ||
        b.service.name.toLowerCase().includes(q) ||
        b.stylist.name.toLowerCase().includes(q) ||
        b.user.email.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const counts = {
    all: bookings.length,
    PENDING: bookings.filter(b => b.status === 'PENDING').length,
    CONFIRMED: bookings.filter(b => b.status === 'CONFIRMED').length,
    COMPLETED: bookings.filter(b => b.status === 'COMPLETED').length,
    CANCELLED: bookings.filter(b => b.status === 'CANCELLED').length,
    REJECTED: bookings.filter(b => b.status === 'REJECTED').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-pink-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg">
        {error}
        <button onClick={fetchBookings} className="ml-4 text-sm underline hover:no-underline">Try again</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Accept Setting */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-900 text-lg">Booking Settings</h3>
            <p className="text-sm text-gray-500 mt-1">
              {autoAccept 
                ? 'Bookings are automatically accepted when the time slot is free'
                : 'All bookings require your manual approval'
              }
            </p>
          </div>
          <button
            onClick={handleToggleAutoAccept}
            disabled={togglingAutoAccept}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${
              autoAccept 
                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {togglingAutoAccept ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : autoAccept ? (
              <ToggleRight className="h-5 w-5" />
            ) : (
              <ToggleLeft className="h-5 w-5" />
            )}
            Auto-Accept: {autoAccept ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { key: 'PENDING', label: 'Pending', count: counts.PENDING, color: 'amber' },
          { key: 'CONFIRMED', label: 'Confirmed', count: counts.CONFIRMED, color: 'blue' },
          { key: 'COMPLETED', label: 'Completed', count: counts.COMPLETED, color: 'green' },
          { key: 'CANCELLED', label: 'Cancelled', count: counts.CANCELLED, color: 'gray' },
          { key: 'REJECTED', label: 'Rejected', count: counts.REJECTED, color: 'red' },
        ].map(s => (
          <div 
            key={s.key} 
            onClick={() => setFilter(s.key as any)}
            className={`bg-${s.color}-50 border border-${s.color}-100 rounded-xl p-3 text-center cursor-pointer transition hover:shadow-md ${
              filter === s.key ? 'ring-2 ring-pink-400' : ''
            }`}
          >
            <p className={`text-2xl font-bold text-${s.color}-700`}>{s.count}</p>
            <p className={`text-xs text-${s.color}-600 mt-0.5`}>{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2 flex-wrap">
          {(['all', 'PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                filter === f ? 'bg-pink-500 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0) + f.slice(1).toLowerCase()} ({f === 'all' ? counts.all : counts[f]})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search customer, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
      </div>

      {/* Pending Bookings Alert */}
      {counts.PENDING > 0 && filter === 'all' && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
          <div className="bg-amber-100 p-2 rounded-full">
            <AlertCircle className="h-5 w-5 text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-amber-800">
              {counts.PENDING} booking{counts.PENDING > 1 ? 's' : ''} awaiting your response
            </p>
            <p className="text-sm text-amber-600">Review and accept or reject pending requests</p>
          </div>
          <Button size="sm" onClick={() => setFilter('PENDING')}>
            View Pending
          </Button>
        </div>
      )}

      {/* Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {filteredBookings.length === 0 ? (
          <div className="p-12 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No {filter === 'all' ? '' : filter.toLowerCase()} bookings found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Service</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Stylist</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Date & Time</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Price</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredBookings.map(booking => {
                  const apptDate = new Date(booking.date);
                  const isPast = apptDate < new Date();
                  const isLoading = actionLoading === booking.id;

                  return (
                    <tr key={booking.id} className="hover:bg-gray-50 transition">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-xs">
                            {booking.user.name[0]?.toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{booking.user.name}</p>
                            <p className="text-xs text-gray-400">{booking.user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800">{booking.service.name}</p>
                        <p className="text-xs text-gray-400">{booking.service.duration} min · {booking.service.category}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{booking.stylist.name}</td>
                      <td className="px-4 py-3">
                        <p className="text-gray-800">
                          {apptDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-400">
                          {apptDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-semibold text-gray-900">${booking.price}</td>
                      <td className="px-4 py-3">{getStatusBadge(booking.status)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin text-pink-500" />
                          ) : (
                            <>
                              {/* PENDING → Accept or Reject */}
                              {booking.status === 'PENDING' && (
                                <>
                                  <button
                                    onClick={() => handleAccept(booking.id)}
                                    className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition flex items-center gap-1"
                                    title="Accept booking"
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" /> Accept
                                  </button>
                                  <button
                                    onClick={() => { setShowRejectModal(booking.id); setRejectReason(''); }}
                                    className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg text-xs font-medium hover:bg-red-100 transition flex items-center gap-1"
                                    title="Reject booking"
                                  >
                                    <XCircle className="h-3.5 w-3.5" /> Reject
                                  </button>
                                </>
                              )}

                              {/* CONFIRMED → Mark Complete (only for past/current appointments) */}
                              {booking.status === 'CONFIRMED' && (
                                <button
                                  onClick={() => handleComplete(booking.id)}
                                  className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-xs font-medium hover:bg-blue-100 transition flex items-center gap-1"
                                  title="Mark service as completed"
                                >
                                  <CheckCheck className="h-3.5 w-3.5" /> Complete
                                </button>
                              )}

                              {/* View detail */}
                              <button
                                onClick={() => setSelectedBooking(booking)}
                                className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
                                title="View details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 bg-pink-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800">Booking Details</h3>
              <button onClick={() => setSelectedBooking(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-500 text-sm">Status</span>
                {getStatusBadge(selectedBooking.status)}
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-400 text-xs mb-1">Customer</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.user.name}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.user.email}</p>
                  {selectedBooking.user.phone && (
                    <p className="text-xs text-gray-500">{selectedBooking.user.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Service</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.service.name}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.service.duration} min · {selectedBooking.service.category}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Date & Time</p>
                  <p className="font-semibold text-gray-900">
                    {new Date(selectedBooking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedBooking.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <div>
                  <p className="text-gray-400 text-xs mb-1">Stylist</p>
                  <p className="font-semibold text-gray-900">{selectedBooking.stylist.name}</p>
                  <p className="text-xs text-gray-500">{selectedBooking.stylist.role}</p>
                </div>
              </div>
              <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                <span className="text-gray-500">Total</span>
                <span className="text-xl font-bold text-pink-600">${selectedBooking.price}</span>
              </div>

              {/* Action buttons in modal */}
              <div className="flex gap-2 pt-2">
                {selectedBooking.status === 'PENDING' && (
                  <>
                    <Button className="flex-1" onClick={() => { handleAccept(selectedBooking.id); setSelectedBooking(null); }}>
                      <CheckCircle className="h-4 w-4 mr-1" /> Accept
                    </Button>
                    <Button variant="ghost" className="flex-1 text-red-600 hover:bg-red-50" onClick={() => { setShowRejectModal(selectedBooking.id); setSelectedBooking(null); }}>
                      <XCircle className="h-4 w-4 mr-1" /> Reject
                    </Button>
                  </>
                )}
                {selectedBooking.status === 'CONFIRMED' && (
                  <Button className="w-full" onClick={() => { handleComplete(selectedBooking.id); setSelectedBooking(null); }}>
                    <CheckCheck className="h-4 w-4 mr-1" /> Mark as Completed
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Reason Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="text-center mb-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Ban className="h-6 w-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Reject Booking?</h3>
              <p className="text-sm text-gray-500 mt-1">Optionally provide a reason for the customer</p>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl p-3 text-sm focus:ring-pink-500 focus:border-pink-500 mb-4 resize-none"
            />
            <div className="flex gap-3">
              <Button variant="ghost" className="flex-1" onClick={() => setShowRejectModal(null)} disabled={!!actionLoading}>
                Cancel
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-600"
                onClick={() => handleReject(showRejectModal)}
                disabled={!!actionLoading}
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Ban className="h-4 w-4 mr-1" />}
                Reject
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
