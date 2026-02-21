import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Scissors, User, AlertCircle, Loader2, RefreshCw, XCircle, CheckCircle, ChevronDown, Search, Star, Send, BadgeCheck } from 'lucide-react';
import { Button } from '../components/Button';
import { appointments, reviews as reviewsApi } from '../api/client';

interface BookingAppointment {
  id: string;
  date: string;
  price: number;
  status: string;
  salon: { id: string; name: string; address: string; image: string };
  service: { id: string; name: string; duration: number; price: number; category: string };
  stylist: { id: string; name: string; role: string; avatar: string };
}

export const MyBookingsPage: React.FC = () => {
  const [bookings, setBookings] = useState<BookingAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'pending' | 'completed' | 'cancelled'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Reschedule state
  const [rescheduleBooking, setRescheduleBooking] = useState<BookingAppointment | null>(null);
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [availableSlots, setAvailableSlots] = useState<{ time: string; display: string; available: boolean }[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);

  // Cancel state
  const [cancelBookingId, setCancelBookingId] = useState<string | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Review state
  const [reviewBooking, setReviewBooking] = useState<BookingAppointment | null>(null);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewedBookings, setReviewedBookings] = useState<Set<string>>(new Set());

  const handleSubmitReview = async () => {
    if (!reviewBooking || reviewRating === 0 || !reviewComment.trim()) {
      setReviewError('Please provide a rating and comment');
      return;
    }
    setReviewLoading(true);
    setReviewError(null);
    try {
      await reviewsApi.create(reviewBooking.salon.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
        appointmentId: reviewBooking.id,
      });
      setReviewedBookings(prev => new Set(prev).add(reviewBooking.salon.id));
      setReviewBooking(null);
      setReviewRating(0);
      setReviewComment('');
    } catch (error: any) {
      setReviewError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await appointments.getMy();
      setBookings(response.data);
    } catch (err: any) {
      console.error('Error fetching bookings:', err);
      setError(err.response?.data?.message || 'Failed to load bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch available slots for rescheduling
  const fetchSlotsForReschedule = async (date: string) => {
    if (!rescheduleBooking || !date) return;
    setLoadingSlots(true);
    setNewTime('');
    try {
      const response = await appointments.getAvailableSlots(
        rescheduleBooking.stylist.id,
        date,
        rescheduleBooking.salon.id
      );
      setAvailableSlots(response.data.slots || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      // Fallback: generate default slots
      const fallbackSlots = [];
      for (let hour = 9; hour <= 18; hour++) {
        fallbackSlots.push({
          time: `${hour.toString().padStart(2, '0')}:00:00`,
          display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
          available: true
        });
      }
      setAvailableSlots(fallbackSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleReschedule = async () => {
    if (!rescheduleBooking || !newDate || !newTime) return;
    setRescheduleLoading(true);
    setRescheduleError(null);
    try {
      const dateTime = `${newDate}T${newTime}`;
      await appointments.reschedule(rescheduleBooking.id, {
        newDate: dateTime,
        newStylistId: rescheduleBooking.stylist.id
      });
      setRescheduleBooking(null);
      setNewDate('');
      setNewTime('');
      fetchBookings(); // Refresh list
    } catch (err: any) {
      console.error('Reschedule error:', err);
      setRescheduleError(err.response?.data?.message || 'Failed to reschedule. The time slot may no longer be available.');
    } finally {
      setRescheduleLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    setCancelLoading(true);
    try {
      await appointments.cancel(bookingId);
      setCancelBookingId(null);
      fetchBookings(); // Refresh list
    } catch (err: any) {
      console.error('Cancel error:', err);
      alert(err.response?.data?.message || 'Failed to cancel booking.');
    } finally {
      setCancelLoading(false);
    }
  };

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700"><Clock className="h-3 w-3" /> Pending Approval</span>;
      case 'CONFIRMED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700"><CheckCircle className="h-3 w-3" /> Confirmed</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700"><CheckCircle className="h-3 w-3" /> Completed</span>;
      case 'CANCELLED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700"><XCircle className="h-3 w-3" /> Cancelled</span>;
      case 'REJECTED':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-600"><XCircle className="h-3 w-3" /> Rejected by Salon</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">{status}</span>;
    }
  };

  const isUpcoming = (booking: BookingAppointment) => {
    return (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && new Date(booking.date) > new Date();
  };

  const filteredBookings = bookings.filter(b => {
    // Status filter
    if (filter === 'upcoming' && !isUpcoming(b)) return false;
    if (filter === 'pending' && b.status !== 'PENDING') return false;
    if (filter === 'completed' && b.status !== 'COMPLETED') return false;
    if (filter === 'cancelled' && (b.status !== 'CANCELLED' && b.status !== 'REJECTED')) return false;
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        b.salon.name.toLowerCase().includes(q) ||
        b.service.name.toLowerCase().includes(q) ||
        b.stylist.name.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const upcomingCount = bookings.filter(isUpcoming).length;
  const pendingCount = bookings.filter(b => b.status === 'PENDING').length;
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
  const cancelledCount = bookings.filter(b => b.status === 'CANCELLED' || b.status === 'REJECTED').length;

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-500">Loading your bookings...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Something went wrong</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchBookings}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
        <p className="text-gray-500">Manage all your appointments in one place</p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm">
          <p className="text-2xl font-bold text-gray-900">{bookings.length}</p>
          <p className="text-xs text-gray-500 mt-1">Total Bookings</p>
        </div>
        <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 text-center">
          <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
          <p className="text-xs text-amber-600 mt-1">Pending</p>
        </div>
        <div className="bg-blue-50 rounded-xl border border-blue-100 p-4 text-center">
          <p className="text-2xl font-bold text-blue-700">{upcomingCount}</p>
          <p className="text-xs text-blue-600 mt-1">Upcoming</p>
        </div>
        <div className="bg-green-50 rounded-xl border border-green-100 p-4 text-center">
          <p className="text-2xl font-bold text-green-700">{completedCount}</p>
          <p className="text-xs text-green-600 mt-1">Completed</p>
        </div>
        <div className="bg-red-50 rounded-xl border border-red-100 p-4 text-center">
          <p className="text-2xl font-bold text-red-700">{cancelledCount}</p>
          <p className="text-xs text-red-600 mt-1">Cancelled</p>
        </div>
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {[
            { key: 'all', label: 'All', count: bookings.length },
            { key: 'pending', label: 'Pending', count: pendingCount },
            { key: 'upcoming', label: 'Upcoming', count: upcomingCount },
            { key: 'completed', label: 'Completed', count: completedCount },
            { key: 'cancelled', label: 'Cancelled', count: cancelledCount },
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key as any)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                filter === f.key
                  ? 'bg-pink-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-pink-300'
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search bookings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-full text-sm focus:ring-pink-500 focus:border-pink-500"
          />
        </div>
      </div>

      {/* Bookings List */}
      {filteredBookings.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center shadow-sm">
          <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-900 mb-2">
            {bookings.length === 0 ? 'No bookings yet' : 'No matching bookings'}
          </h3>
          <p className="text-gray-500 text-sm">
            {bookings.length === 0
              ? 'Book your first appointment at any of our partner salons!'
              : 'Try adjusting your search or filter.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map(booking => {
            const appointmentDate = new Date(booking.date);
            const isPast = appointmentDate < new Date();
            const canModify = (booking.status === 'CONFIRMED' || booking.status === 'PENDING') && !isPast;

            return (
              <div
                key={booking.id}
                className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition hover:shadow-md ${
                  booking.status === 'CANCELLED' || booking.status === 'REJECTED' ? 'border-red-100 opacity-75' : booking.status === 'PENDING' ? 'border-amber-200' : 'border-gray-100'
                }`}
              >
                <div className="flex flex-col md:flex-row">
                  {/* Salon Image */}
                  <div className="md:w-48 h-40 md:h-auto flex-shrink-0">
                    <img
                      src={booking.salon.image}
                      alt={booking.salon.name}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 p-5">
                    <div className="flex flex-col sm:flex-row justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">{booking.salon.name}</h3>
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5" /> {booking.salon.address}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Service</p>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5 text-pink-500" /> {booking.service.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Date & Time</p>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5 text-pink-500" />
                          {appointmentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                        <p className="text-xs text-gray-500 ml-5">
                          {appointmentDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Stylist</p>
                        <p className="text-sm font-semibold text-gray-800 flex items-center gap-1">
                          <User className="h-3.5 w-3.5 text-pink-500" /> {booking.stylist.name}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-0.5">Price</p>
                        <p className="text-sm font-bold text-pink-600">${booking.price}</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    {canModify && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        {booking.status === 'CONFIRMED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setRescheduleBooking(booking);
                              setNewDate('');
                              setNewTime('');
                              setAvailableSlots([]);
                              setRescheduleError(null);
                            }}
                          >
                            <RefreshCw className="h-3.5 w-3.5 mr-1" /> Reschedule
                          </Button>
                        )}
                        {booking.status === 'PENDING' && (
                          <span className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" /> Awaiting salon confirmation
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setCancelBookingId(booking.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" /> Cancel
                        </Button>
                      </div>
                    )}

                    {/* Write Review for completed bookings */}
                    {booking.status === 'COMPLETED' && !reviewedBookings.has(booking.salon.id) && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <Button
                          size="sm"
                          onClick={() => {
                            setReviewBooking(booking);
                            setReviewRating(0);
                            setReviewComment('');
                            setReviewError(null);
                          }}
                          className="bg-yellow-500 hover:bg-yellow-600"
                        >
                          <Star className="h-3.5 w-3.5 mr-1" /> Write Review
                        </Button>
                      </div>
                    )}
                    {booking.status === 'COMPLETED' && reviewedBookings.has(booking.salon.id) && (
                      <div className="flex gap-2 pt-2 border-t border-gray-100">
                        <span className="text-xs text-green-600 bg-green-50 px-3 py-1.5 rounded-lg flex items-center gap-1">
                          <BadgeCheck className="h-3.5 w-3.5" /> Review submitted
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {cancelBookingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in-95">
            <div className="text-center">
              <div className="h-14 w-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <XCircle className="h-7 w-7 text-red-500" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Cancel Booking?</h3>
              <p className="text-gray-500 text-sm mb-6">
                Are you sure you want to cancel this appointment? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  className="flex-1"
                  onClick={() => setCancelBookingId(null)}
                  disabled={cancelLoading}
                >
                  Keep Booking
                </Button>
                <Button
                  className="flex-1 bg-red-500 hover:bg-red-600"
                  onClick={() => handleCancel(cancelBookingId)}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Yes, Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 bg-pink-50 flex justify-between items-center">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-pink-500" /> Reschedule Appointment
              </h3>
              <button onClick={() => setRescheduleBooking(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6">
              {/* Current booking info */}
              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <p className="text-xs text-gray-400 mb-2 uppercase font-semibold tracking-wide">Current Appointment</p>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-500">Service</p>
                    <p className="font-semibold text-gray-900">{rescheduleBooking.service.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Salon</p>
                    <p className="font-semibold text-gray-900">{rescheduleBooking.salon.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Date</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(rescheduleBooking.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Current Time</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(rescheduleBooking.date).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                </div>
              </div>

              {rescheduleError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4 mr-2 flex-shrink-0" />
                  {rescheduleError}
                </div>
              )}

              {/* New date picker */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="inline h-4 w-4 mr-1 text-pink-500" /> New Date
                </label>
                <input
                  type="date"
                  min={getMinDate()}
                  max={getMaxDate()}
                  value={newDate}
                  onChange={(e) => {
                    setNewDate(e.target.value);
                    fetchSlotsForReschedule(e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>

              {/* Time slots */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="inline h-4 w-4 mr-1 text-pink-500" /> Available Time Slots
                </label>
                {!newDate ? (
                  <p className="text-gray-400 text-sm italic py-4 text-center">Select a new date first</p>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-5 w-5 animate-spin text-pink-500" />
                    <span className="ml-2 text-gray-500 text-sm">Checking availability...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map(slot => (
                      <button
                        key={slot.time}
                        onClick={() => slot.available && setNewTime(slot.time)}
                        disabled={!slot.available}
                        className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                          newTime === slot.time
                            ? 'bg-pink-500 text-white border-pink-500'
                            : slot.available
                              ? 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'
                              : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed line-through'
                        }`}
                      >
                        {slot.display}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50">
              <Button variant="ghost" onClick={() => setRescheduleBooking(null)} disabled={rescheduleLoading}>
                Cancel
              </Button>
              <Button
                onClick={handleReschedule}
                disabled={!newDate || !newTime || rescheduleLoading}
              >
                {rescheduleLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Rescheduling...</>
                ) : (
                  <><RefreshCw className="h-4 w-4 mr-1" /> Confirm Reschedule</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {reviewBooking && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95">
            <div className="p-6 border-b border-gray-100 bg-yellow-50">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-500" /> Write a Review
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {reviewBooking.salon.name} — {reviewBooking.service.name}
              </p>
            </div>

            <div className="p-6">
              {/* Star Rating */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">How was your experience?</label>
                <div className="flex gap-1 justify-center">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setReviewRating(star)}
                      onMouseEnter={() => setReviewHoverRating(star)}
                      onMouseLeave={() => setReviewHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-10 w-10 ${
                          star <= (reviewHoverRating || reviewRating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        } transition-colors`}
                      />
                    </button>
                  ))}
                </div>
                {reviewRating > 0 && (
                  <p className="text-center text-sm text-gray-500 mt-2">
                    {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                  </p>
                )}
              </div>

              {/* Comment */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Tell us more</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="Share details about your experience..."
                  rows={4}
                  className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-pink-500 focus:border-pink-500 resize-none"
                />
              </div>

              <div className="flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg p-2 mb-4">
                <BadgeCheck className="h-4 w-4" />
                Your review will be marked as "Verified" (completed booking)
              </div>

              {reviewError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {reviewError}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50">
              <Button
                variant="ghost"
                onClick={() => setReviewBooking(null)}
                disabled={reviewLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitReview}
                disabled={reviewRating === 0 || !reviewComment.trim() || reviewLoading}
              >
                {reviewLoading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-1" /> Submitting...</>
                ) : (
                  <><Send className="h-4 w-4 mr-1" /> Submit Review</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
