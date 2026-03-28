import React, { useState, useEffect } from 'react';
import { ArrowLeft, Star, MapPin, Clock, Calendar, CheckCircle, Loader2, AlertCircle, Phone, Mail, MessageCircle, Send, BadgeCheck, CreditCard, Wallet, Gift, Receipt } from 'lucide-react';
import { Button } from '../components/Button';
import { Salon, Service, Stylist } from '../types';
import { SalonMap } from '../components/GoogleMap';
import { SalonChat } from '../components/SalonChat';

import { appointments, salons as salonApi, reviews as reviewsApi, payments, loyalty } from '../api/client';

interface SalonProfilePageProps {
  salon: Salon;
  onBack: () => void;
  onBookSuccess: () => void;
}

interface TimeSlot {
  time: string;
  available: boolean;
}

export const SalonProfilePage: React.FC<SalonProfilePageProps> = ({ salon, onBack, onBookSuccess }) => {
  const [activeTab, setActiveTab] = useState<'services' | 'reviews' | 'about'>('services');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  // Booking State
  const [bookingStep, setBookingStep] = useState(1);
  const [selectedStylist, setSelectedStylist] = useState<Stylist | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);

  // Payment & Loyalty State
  const [paymentMethod, setPaymentMethod] = useState<'ONLINE' | 'PAY_AT_SALON'>('PAY_AT_SALON');
  const [loyaltyStatus, setLoyaltyStatus] = useState<{ points: number; tier: string; redemptionValue: number } | null>(null);
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [loyaltyDiscount, setLoyaltyDiscount] = useState(0);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [cardholderName, setCardholderName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');

  // Check if user is logged in
  const isLoggedIn = !!localStorage.getItem('token');

  // Chat state
  const [showChat, setShowChat] = useState(false);

  // Review state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [canReviewData, setCanReviewData] = useState<{ canReview: boolean; hasCompletedBooking: boolean } | null>(null);
  const [salonReviews, setSalonReviews] = useState<any[]>([]);
  const [reviewsRestricted, setReviewsRestricted] = useState(false);

  // Check review eligibility and fetch reviews on mount
  useEffect(() => {
    if (isLoggedIn) {
      reviewsApi.canReview(salon.id).then(res => {
        setCanReviewData(res.data);
      }).catch(() => {});
    }
    // Fetch reviews (API returns restricted response for non-admin/non-owner)
    reviewsApi.getBySalon(salon.id).then(res => {
      if (res.data?.restricted) {
        setReviewsRestricted(true);
        setSalonReviews([]);
      } else if (Array.isArray(res.data)) {
        setReviewsRestricted(false);
        setSalonReviews(res.data);
      }
    }).catch(() => {});
  }, [salon.id, isLoggedIn]);

  const handleSubmitReview = async () => {
    if (reviewRating === 0 || !reviewComment.trim()) {
      setReviewError('Please provide a rating and comment');
      return;
    }
    setReviewLoading(true);
    setReviewError(null);
    try {
      const response = await reviewsApi.create(salon.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      });
      setSalonReviews(prev => [response.data, ...prev]);
      setReviewSuccess(true);
      setShowReviewForm(false);
      setReviewRating(0);
      setReviewComment('');
      setCanReviewData({ canReview: false, hasCompletedBooking: true });
      setTimeout(() => setReviewSuccess(false), 3000);
    } catch (error: any) {
      setReviewError(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewLoading(false);
    }
  };

  // Generate time slots based on service duration
  const generateTimeSlots = (duration: number): TimeSlot[] => {
    const slots: TimeSlot[] = [];
    const startHour = 9; // 9 AM
    const endHour = 18; // 6 PM
    const slotDuration = Math.max(30, duration); // Minimum 30 min slots

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += slotDuration) {
        if (hour + (minute + slotDuration) / 60 <= endHour) {
          const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          const period = hour >= 12 ? 'PM' : 'AM';
          const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
          slots.push({
            time: `${displayHour}:${minute.toString().padStart(2, '0')} ${period}`,
            available: true // Will be updated by API
          });
        }
      }
    }
    return slots;
  };

  const isPastTimeSlot = (dateStr: string, timeLabel: string): boolean => {
    const selectedDay = new Date(`${dateStr}T00:00:00`);
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    // Safety check: if somehow a past date is selected, mark every slot unavailable.
    if (selectedDay < todayStart) return true;
    if (selectedDay > todayStart) return false;

    const timePart = timeLabel.trim();
    const twelveHourMatch = timePart.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    const twentyFourHourMatch = timePart.match(/^(\d{1,2}):(\d{2})$/);

    let hours = 0;
    let minutes = 0;

    if (twelveHourMatch) {
      hours = parseInt(twelveHourMatch[1], 10);
      minutes = parseInt(twelveHourMatch[2], 10);
      const meridiem = twelveHourMatch[3].toUpperCase();
      if (hours === 12) {
        hours = meridiem === 'AM' ? 0 : 12;
      } else if (meridiem === 'PM') {
        hours += 12;
      }
    } else if (twentyFourHourMatch) {
      hours = parseInt(twentyFourHourMatch[1], 10);
      minutes = parseInt(twentyFourHourMatch[2], 10);
    } else {
      return false;
    }

    const slotDateTime = new Date(selectedDay);
    slotDateTime.setHours(hours, minutes, 0, 0);

    return slotDateTime <= today;
  };

  // Fetch available slots when date or stylist changes
  useEffect(() => {
    if (selectedDate && selectedService) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedStylist, selectedService]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate || !selectedService) return;

    setLoadingSlots(true);
    try {
      const stylistId = selectedStylist?.id || salon.stylists[0]?.id;
      if (stylistId) {
        // Fetch real-time availability from the server (prevents double-booking)
        const response = await appointments.getAvailableSlots(stylistId, selectedDate, salon.id);
        const serverSlots = response.data.slots || [];
        // Map server slots to our TimeSlot format
        const mappedSlots: TimeSlot[] = serverSlots.map((slot: any) => ({
          time: slot.display,
          available: slot.available && !isPastTimeSlot(selectedDate, slot.display)
        }));
        setAvailableSlots(mappedSlots);
      } else {
        // Fallback to generated slots if no stylist available
        const generatedSlots = generateTimeSlots(selectedService.duration).map((slot) => ({
          ...slot,
          available: slot.available && !isPastTimeSlot(selectedDate, slot.time),
        }));
        setAvailableSlots(generatedSlots);
      }
    } catch (error) {
      console.error('Error fetching slots:', error);
      // Fallback to client-generated slots
      const generatedSlots = generateTimeSlots(selectedService.duration).map((slot) => ({
        ...slot,
        available: slot.available && !isPastTimeSlot(selectedDate, slot.time),
      }));
      setAvailableSlots(generatedSlots);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleBookClick = (service: Service) => {
    if (!isLoggedIn) {
      alert('Please login to book an appointment');
      return;
    }
    setSelectedService(service);
    setShowBookingModal(true);
    setBookingStep(1);
    setBookingError(null);
    setPromoCode('');
    setDiscount(0);
    setPaymentMethod('PAY_AT_SALON');
    setRedeemPoints(0);
    setLoyaltyDiscount(0);
    setPaymentProcessing(false);
    setPaymentSuccess(false);
    setCardholderName('');
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    // Fetch loyalty status
    loyalty.getStatus().then(res => {
      setLoyaltyStatus(res.data);
    }).catch(() => setLoyaltyStatus(null));
  };

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) {
      setBookingError('Please select all required options');
      return;
    }

    setBookingLoading(true);
    setBookingError(null);

    try {
      const finalTotal = calculateTotal();
      let paymentIntentId: string | null = null;

      // If paying online, create and confirm a payment intent with actual card details
      if (paymentMethod === 'ONLINE') {
        setPaymentProcessing(true);

        // Parse expiry date (MM/YY) into month and year
        const [expMonth, expYearShort] = expiryDate.split('/');
        const expYear = `20${expYearShort}`; // Convert YY to YYYY
        const rawCardNumber = cardNumber.replace(/\s/g, ''); // Remove spaces

        // Send actual card details to backend for Stripe PaymentMethod creation
        const intentRes = await payments.createIntent({
          amount: finalTotal,
          cardNumber: rawCardNumber,
          expMonth,
          expYear,
          cvc: cvv,
        } as any);

        // Check if payment requires additional action (3D Secure)
        if (intentRes.data.requiresAction) {
          setPaymentProcessing(false);
          setBookingError(intentRes.data.message || 'This card requires additional authentication. Please try a different card or pay at salon.');
          setBookingLoading(false);
          return;
        }

        // Check if payment was successful
        if (intentRes.data.status !== 'succeeded') {
          setPaymentProcessing(false);
          setBookingError(intentRes.data.message || 'Payment was not successful. Please try a different card.');
          setBookingLoading(false);
          return;
        }

        paymentIntentId = intentRes.data.paymentIntentId;

        // Confirm payment status
        const confirmRes = await payments.confirm({ paymentIntentId });
        if (!confirmRes.data.success) {
          setPaymentProcessing(false);
          setBookingError(confirmRes.data.message || 'Payment confirmation failed. Please try again.');
          setBookingLoading(false);
          return;
        }

        setPaymentSuccess(true);
        setPaymentProcessing(false);
      }

      // If loyalty points are being redeemed, call the redeem API
      if (redeemPoints > 0) {
        await loyalty.redeem({ points: redeemPoints });
      }

      // Create the appointment with payment details
      await appointments.create({
        salonId: salon.id,
        serviceId: selectedService.id,
        stylistId: selectedStylist?.id || salon.stylists[0]?.id,
        date: `${selectedDate}T${convertTo24Hour(selectedTime)}`,
        price: finalTotal,
        paymentMethod,
        paymentIntentId,
        loyaltyPointsUsed: redeemPoints,
        loyaltyDiscount,
      });
      setShowBookingModal(false);
      onBookSuccess();
    } catch (error: any) {
      console.error('Booking failed:', error);
      setPaymentProcessing(false);
      setBookingError(error.response?.data?.message || 'Failed to book appointment. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = modifier === 'AM' ? '00' : '12';
    } else if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours.padStart(2, '0')}:${minutes}:00`;
  };

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get maximum date (30 days from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 30);
    return maxDate.toISOString().split('T')[0];
  };

  const calculateTotal = () => {
    if (!selectedService) return 0;
    return Math.max(0, selectedService.price - discount - loyaltyDiscount);
  };

  const normalizeCardNumber = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const normalizeExpiryDate = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    if (digits.length <= 2) return digits;
    return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  };

  const isPaymentInfoComplete = () => {
    if (paymentMethod !== 'ONLINE') return true;
    const rawCardNumber = cardNumber.replace(/\s/g, '');
    return (
      cardholderName.trim().length >= 2 &&
      /^\d{16}$/.test(rawCardNumber) &&
      /^(0[1-9]|1[0-2])\/\d{2}$/.test(expiryDate) &&
      /^\d{3,4}$/.test(cvv)
    );
  };

  return (
    <div className="bg-white min-h-screen pb-12">
      {/* Cover Image */}
      <div className="relative h-64 md:h-80 w-full bg-gray-200">
        <img src={salon.image} alt={salon.name} className="w-full h-full object-cover" />
        <div className="absolute top-0 left-0 p-4">
          <button
            onClick={onBack}
            className="bg-white/90 p-2 rounded-full hover:bg-white text-gray-800 shadow-md transition"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        {/* Header Card */}
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border border-gray-100">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{salon.name}</h1>
            <div className="flex items-center text-gray-500 mb-2">
              <MapPin className="h-4 w-4 mr-1 text-pink-500" />
              {salon.address}
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center text-yellow-500 font-bold">
                <Star className="h-4 w-4 fill-current mr-1" />
                {salon.rating} <span className="text-gray-400 font-normal text-sm ml-1">({salon.reviewCount} reviews)</span>
              </div>
              <span className="text-green-600 text-sm font-medium bg-green-50 px-2 py-0.5 rounded-full">Open Now</span>
            </div>
          </div>
          <div className="mt-4 md:mt-0 flex space-x-3">
            <Button variant="outline" onClick={() => {
              if (!isLoggedIn) { alert('Please sign in to chat'); return; }
              setShowChat(true);
            }}>
              <MessageCircle className="h-4 w-4 mr-1" /> Chat
            </Button>
            <Button variant="secondary">Favorite</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6 space-x-8">
              {['services', 'reviews', 'about'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`pb-3 text-base font-medium capitalize transition border-b-2 ${activeTab === tab
                      ? 'border-pink-500 text-pink-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                >
                  {tab}
                  {tab === 'reviews' && salon.reviews?.length > 0 && (
                    <span className="ml-2 bg-gray-100 text-gray-600 text-xs px-2 py-0.5 rounded-full">
                      {salon.reviews.length}
                    </span>
                  )}
                  {tab === 'services' && salon.services?.length > 0 && (
                    <span className="ml-2 bg-pink-100 text-pink-600 text-xs px-2 py-0.5 rounded-full">
                      {salon.services.length}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeTab === 'services' && (
              <div className="space-y-4">
                {salon.services.map((service) => (
                  <div key={service.id} className="bg-white border border-gray-100 rounded-xl p-5 hover:shadow-md transition flex justify-between items-center group">
                    <div>
                      <h3 className="font-bold text-gray-900 text-lg group-hover:text-pink-600 transition">{service.name}</h3>
                      <p className="text-gray-500 text-sm mt-1">{service.duration} mins • {service.category}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-gray-900 mb-2">${service.price}</div>
                      <Button size="sm" onClick={() => handleBookClick(service)}>Book</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-6">
                {/* Review Success Message */}
                {reviewSuccess && (
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-2 text-green-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-medium">Your review has been submitted!</span>
                  </div>
                )}

                {/* Write Review Button / Form */}
                {isLoggedIn && canReviewData?.canReview && !showReviewForm && (
                  <button
                    onClick={() => setShowReviewForm(true)}
                    className="w-full bg-gradient-to-r from-pink-500 to-rose-400 text-white rounded-xl p-4 flex items-center justify-center gap-2 font-semibold hover:from-pink-600 hover:to-rose-500 transition shadow-md"
                  >
                    <Star className="h-5 w-5" />
                    Write a Review
                    {canReviewData.hasCompletedBooking && (
                      <span className="ml-2 bg-white/20 px-2 py-0.5 rounded-full text-xs">Verified Customer</span>
                    )}
                  </button>
                )}

                {/* Review Form */}
                {showReviewForm && (
                  <div className="bg-white border border-pink-100 rounded-xl p-6 shadow-md">
                    <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Star className="h-5 w-5 text-pink-500" />
                      Write Your Review
                    </h4>
                    
                    {/* Star Rating */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => setReviewRating(star)}
                            onMouseEnter={() => setReviewHoverRating(star)}
                            onMouseLeave={() => setReviewHoverRating(0)}
                            className="p-1 transition-transform hover:scale-110"
                          >
                            <Star
                              className={`h-8 w-8 ${
                                star <= (reviewHoverRating || reviewRating)
                                  ? 'text-yellow-400 fill-current'
                                  : 'text-gray-300'
                              } transition-colors`}
                            />
                          </button>
                        ))}
                        {reviewRating > 0 && (
                          <span className="ml-3 text-sm text-gray-500 self-center">
                            {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][reviewRating]}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Your Experience</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        placeholder="Share your experience with this salon..."
                        rows={4}
                        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-pink-500 focus:border-pink-500 resize-none"
                      />
                    </div>

                    {canReviewData?.hasCompletedBooking && (
                      <div className="mb-4 flex items-center gap-2 text-green-600 text-sm bg-green-50 rounded-lg p-2">
                        <BadgeCheck className="h-4 w-4" />
                        Your review will be marked as "Verified" (completed booking)
                      </div>
                    )}

                    {reviewError && (
                      <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm flex items-center gap-2">
                        <AlertCircle className="h-4 w-4" />
                        {reviewError}
                      </div>
                    )}

                    <div className="flex gap-3">
                      <Button
                        variant="ghost"
                        onClick={() => { setShowReviewForm(false); setReviewError(null); }}
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
                )}

                {/* Reviews List */}
                {reviewsRestricted ? (
                  <div className="bg-gray-50 rounded-xl p-8 text-center">
                    <div className="flex justify-center mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className={`h-6 w-6 ${i < Math.round(salon.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} />
                      ))}
                    </div>
                    <p className="text-2xl font-bold text-gray-900 mb-1">{salon.rating} / 5</p>
                    <p className="text-gray-500 text-sm mb-4">Based on {salon.reviewCount} review{salon.reviewCount !== 1 ? 's' : ''}</p>
                    <div className="bg-white border border-gray-200 rounded-lg p-4 text-sm text-gray-500">
                      <AlertCircle className="h-4 w-4 inline mr-1 text-gray-400" />
                      Individual reviews are only visible to the salon owner and system admin.
                    </div>
                  </div>
                ) : salonReviews.length > 0 ? (
                  salonReviews.map((review: any) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-gray-900">{review.user?.name || review.user}</span>
                          {review.isVerified && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-700">
                              <BadgeCheck className="h-3 w-3" />
                              Verified
                            </span>
                          )}
                        </div>
                        <span className="text-gray-400 text-sm">
                          {new Date(review.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={`h-4 w-4 ${i < review.rating ? 'fill-current' : 'text-gray-300'}`} />
                        ))}
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No reviews yet. Be the first to review!</p>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="space-y-6">
                {/* Description */}
                <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed">
                  <h4 className="font-bold text-gray-900 mb-3 text-lg">About {salon.name}</h4>
                  <p>{salon.description}</p>
                </div>

                {/* Location Map */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-pink-500" /> Location
                  </h4>
                  <p className="text-gray-600 mb-4">{salon.address}</p>
                  <SalonMap
                    salons={[salon]}
                    userLocation={null}
                    height="250px"
                  />
                </div>

                {/* Opening Hours */}
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-gray-900 mb-3 text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5 text-pink-500" /> Opening Hours
                  </h4>
                  <div className="space-y-2 text-sm text-gray-600">
                    {[
                      { day: 'Monday', hours: '09:00 AM - 08:00 PM' },
                      { day: 'Tuesday', hours: '09:00 AM - 08:00 PM' },
                      { day: 'Wednesday', hours: '09:00 AM - 08:00 PM' },
                      { day: 'Thursday', hours: '09:00 AM - 08:00 PM' },
                      { day: 'Friday', hours: '09:00 AM - 08:00 PM' },
                      { day: 'Saturday', hours: '10:00 AM - 06:00 PM' },
                      { day: 'Sunday', hours: 'Closed' },
                    ].map(schedule => {
                      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' });
                      const isToday = schedule.day === today;
                      return (
                        <div 
                          key={schedule.day} 
                          className={`flex justify-between py-2 px-3 rounded-lg ${isToday ? 'bg-pink-50 border border-pink-100' : ''}`}
                        >
                          <span className={`font-medium ${isToday ? 'text-pink-600' : ''}`}>
                            {schedule.day} {isToday && <span className="text-xs">(Today)</span>}
                          </span>
                          <span className={schedule.hours === 'Closed' ? 'text-red-500 font-medium' : ''}>
                            {schedule.hours}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Stylists */}
                {salon.stylists?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Our Team</h4>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {salon.stylists.map(stylist => (
                        <div key={stylist.id} className="bg-white rounded-xl p-4 text-center border border-gray-100">
                          <img src={stylist.avatar} alt={stylist.name} className="h-16 w-16 rounded-full object-cover mx-auto mb-2" />
                          <p className="font-bold text-gray-900">{stylist.name}</p>
                          <p className="text-xs text-gray-500">{stylist.role}</p>
                          <div className="flex items-center justify-center gap-1 mt-1">
                            <Star className="h-3 w-3 fill-current text-yellow-400" />
                            <span className="text-sm font-medium">{stylist.rating}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Gallery */}
                {salon.gallery?.length > 0 && (
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="font-bold text-gray-900 mb-4 text-lg">Gallery</h4>
                    <div className="grid grid-cols-3 gap-3">
                      {salon.gallery.map((img, i) => (
                        <img key={i} src={img} alt={`${salon.name} gallery ${i+1}`} className="rounded-lg h-32 w-full object-cover hover:opacity-90 transition cursor-pointer" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg border border-pink-100 p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center">
                <Clock className="h-5 w-5 mr-2 text-pink-500" /> Opening Hours
              </h3>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between"><span>Mon - Fri</span> <span>09:00 - 20:00</span></div>
                <div className="flex justify-between"><span>Saturday</span> <span>10:00 - 18:00</span></div>
                <div className="flex justify-between text-pink-500 font-medium"><span>Sunday</span> <span>Closed</span></div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-pink-500 to-rose-400 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="font-bold text-xl mb-2">New Customer?</h3>
              <p className="text-pink-100 text-sm mb-4">Get 20% off your first booking with code GLAMNEW</p>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Modal Overlay */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pink-50">
              <h3 className="font-bold text-xl text-gray-800">Book Appointment</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <div className="sr-only">Close</div>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 md:p-8 overflow-y-auto flex-1">
              {/* Progress Steps */}
              <div className="flex mb-8 justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-200 -z-10 transform -translate-y-1/2"></div>
                {[1, 2, 3].map((step) => (
                  <div key={step} className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${bookingStep >= step ? 'bg-pink-500 text-white' : 'bg-gray-200 text-gray-500'} transition-colors`}>
                    {step}
                  </div>
                ))}
              </div>

              {/* Step 1: Stylist */}
              {bookingStep === 1 && (
                <div>
                  <h4 className="font-bold text-lg mb-4">Select Stylist</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setSelectedStylist(null)}
                      className={`p-4 rounded-xl border-2 cursor-pointer flex items-center space-x-3 ${!selectedStylist ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}`}
                    >
                      <div className="bg-gray-200 h-12 w-12 rounded-full flex items-center justify-center text-xs text-gray-500 font-bold">ANY</div>
                      <div>
                        <div className="font-bold">Any Professional</div>
                        <div className="text-xs text-gray-500">Maximum availability</div>
                      </div>
                    </div>
                    {salon.stylists.map(stylist => (
                      <div
                        key={stylist.id}
                        onClick={() => setSelectedStylist(stylist)}
                        className={`p-4 rounded-xl border-2 cursor-pointer flex items-center space-x-3 ${selectedStylist?.id === stylist.id ? 'border-pink-500 bg-pink-50' : 'border-gray-200 hover:border-pink-200'}`}
                      >
                        <img src={stylist.avatar} className="h-12 w-12 rounded-full object-cover" alt={stylist.name} />
                        <div>
                          <div className="font-bold">{stylist.name}</div>
                          <div className="text-xs text-gray-500">{stylist.role}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 2: Date & Time */}
              {bookingStep === 2 && (
                <div>
                  <h4 className="font-bold text-lg mb-4">Select Date & Time</h4>
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="inline h-4 w-4 mr-1" /> Select Date
                    </label>
                    <input
                      type="date"
                      min={getMinDate()}
                      max={getMaxDate()}
                      value={selectedDate}
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-pink-500 focus:border-pink-500"
                      onChange={(e) => {
                        setSelectedDate(e.target.value);
                        setSelectedTime('');
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Clock className="inline h-4 w-4 mr-1" /> Available Slots
                      {selectedService && <span className="text-gray-400 ml-2">({selectedService.duration} min service)</span>}
                    </label>
                    {!selectedDate ? (
                      <p className="text-gray-400 text-sm italic py-4 text-center">Please select a date first</p>
                    ) : loadingSlots ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-6 w-6 animate-spin text-pink-500" />
                        <span className="ml-2 text-gray-500">Loading available slots...</span>
                      </div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                        {availableSlots.map(slot => (
                          <button
                            key={slot.time}
                            onClick={() => slot.available && setSelectedTime(slot.time)}
                            disabled={!slot.available}
                            className={`py-2 px-3 rounded-lg text-sm font-medium border transition ${
                              selectedTime === slot.time 
                                ? 'bg-pink-500 text-white border-pink-500' 
                                : slot.available 
                                  ? 'bg-white border-gray-200 text-gray-700 hover:border-pink-300' 
                                  : 'bg-gray-100 border-gray-100 text-gray-400 cursor-not-allowed line-through'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {bookingStep === 3 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4 text-center flex items-center justify-center">
                    <CheckCircle className="h-5 w-5 mr-2 text-green-500" />
                    Confirm Booking
                  </h4>
                  
                  {bookingError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center text-red-600 text-sm">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      {bookingError}
                    </div>
                  )}

                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Service</span>
                      <span className="font-bold text-gray-900">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Duration</span>
                      <span className="font-bold text-gray-900">{selectedService?.duration} minutes</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Salon</span>
                      <span className="font-bold text-gray-900">{salon.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Stylist</span>
                      <span className="font-bold text-gray-900">{selectedStylist?.name || 'Any Professional'}</span>
                    </div>
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Date & Time</span>
                      <span className="font-bold text-gray-900">
                        {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} at {selectedTime}
                      </span>
                    </div>

                    {/* Promo Code Section */}
                    <div className="pt-2 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Promo Code</label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Enter code"
                          value={promoCode}
                          onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (promoCode === 'GLAMNEW' && selectedService) {
                              setDiscount(Math.round(selectedService.price * 0.2));
                            } else if (promoCode === 'SAVE10' && selectedService) {
                              setDiscount(10);
                            } else {
                              alert('Invalid promo code');
                              setDiscount(0);
                            }
                          }}
                        >
                          Apply
                        </Button>
                      </div>
                      {discount > 0 && (
                        <p className="text-green-600 text-xs mt-1">✓ Code applied! You save NPR {discount}</p>
                      )}
                    </div>

                    {/* Loyalty Points Redemption */}
                    {loyaltyStatus && loyaltyStatus.points > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Gift className="inline h-4 w-4 mr-1 text-purple-500" />
                          Redeem Loyalty Points
                        </label>
                        <div className="bg-purple-50 rounded-lg p-3 mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-purple-700">Available Points</span>
                            <span className="font-bold text-purple-700">{loyaltyStatus.points} pts</span>
                          </div>
                          <div className="flex justify-between text-xs text-purple-500">
                            <span>Tier: {loyaltyStatus.tier}</span>
                            <span>Worth up to NPR {loyaltyStatus.redemptionValue}</span>
                          </div>
                        </div>
                        <div className="flex gap-2 items-center">
                          <input
                            type="number"
                            min={0}
                            max={Math.min(loyaltyStatus.points, (selectedService?.price || 0) * 10)}
                            step={10}
                            placeholder="Points to redeem"
                            value={redeemPoints || ''}
                            onChange={(e) => {
                              const pts = Math.min(
                                parseInt(e.target.value) || 0,
                                loyaltyStatus.points,
                                (selectedService?.price || 0) * 10 // Can't redeem more than total price
                              );
                              setRedeemPoints(Math.max(0, pts));
                              setLoyaltyDiscount(Math.floor(pts / 10)); // 10 pts = NPR 1
                            }}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-purple-500 focus:border-purple-500"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const maxPts = Math.min(
                                loyaltyStatus.points,
                                (selectedService?.price || 0) * 10
                              );
                              setRedeemPoints(maxPts);
                              setLoyaltyDiscount(Math.floor(maxPts / 10));
                            }}
                          >
                            Use All
                          </Button>
                        </div>
                        {loyaltyDiscount > 0 && (
                          <p className="text-purple-600 text-xs mt-1">✓ {redeemPoints} points = NPR {loyaltyDiscount} discount</p>
                        )}
                      </div>
                    )}

                    {/* Payment Method Selection */}
                    <div className="pt-3 border-t border-gray-200">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        <CreditCard className="inline h-4 w-4 mr-1" />
                        Payment Method
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setPaymentMethod('ONLINE')}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition text-sm font-medium ${
                            paymentMethod === 'ONLINE'
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
                          }`}
                        >
                          <CreditCard className="h-4 w-4" />
                          Pay Online
                        </button>
                        <button
                          onClick={() => setPaymentMethod('PAY_AT_SALON')}
                          className={`flex items-center justify-center gap-2 p-3 rounded-lg border-2 transition text-sm font-medium ${
                            paymentMethod === 'PAY_AT_SALON'
                              ? 'border-pink-500 bg-pink-50 text-pink-700'
                              : 'border-gray-200 bg-white text-gray-600 hover:border-pink-300'
                          }`}
                        >
                          <Wallet className="h-4 w-4" />
                          Pay at Salon
                        </button>
                      </div>
                      {paymentMethod === 'ONLINE' && (
                        <div className="mt-3 space-y-3">
                          <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700">
                            <CreditCard className="inline h-3 w-3 mr-1" />
                            Secure online payment via Stripe. Your card will be charged NPR {calculateTotal()}.
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Cardholder Name</label>
                              <input
                                type="text"
                                placeholder="Name on card"
                                value={cardholderName}
                                onChange={(e) => setCardholderName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                              />
                            </div>
                            <div className="sm:col-span-2">
                              <label className="block text-xs font-medium text-gray-600 mb-1">Card Number</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="1234 5678 9012 3456"
                                value={cardNumber}
                                onChange={(e) => setCardNumber(normalizeCardNumber(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">Expiry (MM/YY)</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                placeholder="MM/YY"
                                value={expiryDate}
                                onChange={(e) => setExpiryDate(normalizeExpiryDate(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-600 mb-1">CVV</label>
                              <input
                                type="password"
                                inputMode="numeric"
                                placeholder="123"
                                value={cvv}
                                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-pink-500 focus:border-pink-500"
                              />
                            </div>
                          </div>
                          {!isPaymentInfoComplete() && (
                            <p className="text-xs text-amber-600">Please enter valid card details to continue with online payment.</p>
                          )}
                        </div>
                      )}
                      {paymentMethod === 'PAY_AT_SALON' && (
                        <div className="mt-3 bg-yellow-50 rounded-lg p-3 text-xs text-yellow-700">
                          <Wallet className="inline h-3 w-3 mr-1" />
                          Pay in cash or card when you visit the salon. No upfront charge.
                        </div>
                      )}
                    </div>

                    {/* Price Breakdown */}
                    <div className="flex justify-between pt-4 border-t border-gray-300">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="text-gray-700">NPR {selectedService?.price}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Promo Discount</span>
                        <span>-NPR {discount}</span>
                      </div>
                    )}
                    {loyaltyDiscount > 0 && (
                      <div className="flex justify-between text-purple-600">
                        <span>Points Discount ({redeemPoints} pts)</span>
                        <span>-NPR {loyaltyDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between pt-2 border-t border-gray-300">
                      <span className="font-bold text-gray-900 text-lg">Total</span>
                      <span className="font-bold text-pink-600 text-lg">NPR {calculateTotal()}</span>
                    </div>
                    <div className="flex items-center text-xs text-gray-400 mt-1">
                      <Receipt className="h-3 w-3 mr-1" />
                      A digital receipt will be sent after booking confirmation.
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-gray-100 flex justify-between bg-gray-50">
              <Button variant="ghost" onClick={() => {
                if (bookingStep > 1) setBookingStep(bookingStep - 1);
                else setShowBookingModal(false);
              }}>
                {bookingStep === 1 ? 'Cancel' : 'Back'}
              </Button>
              <Button
                disabled={
                  (bookingStep === 2 && (!selectedDate || !selectedTime)) ||
                  (bookingStep === 3 && paymentMethod === 'ONLINE' && !isPaymentInfoComplete()) ||
                  bookingLoading || paymentProcessing
                }
                onClick={() => {
                  if (bookingStep < 3) setBookingStep(bookingStep + 1);
                  else handleBookingSubmit();
                }}
              >
                {bookingLoading || paymentProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    {paymentProcessing ? 'Processing Payment...' : 'Booking...'}
                  </>
                ) : bookingStep === 3 ? (
                  paymentMethod === 'ONLINE' ? (
                    <>
                      <CreditCard className="h-4 w-4 mr-2" />
                      Pay & Confirm (NPR {calculateTotal()})
                    </>
                  ) : 'Confirm Booking'
                ) : 'Next Step'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Chat Button */}
      {isLoggedIn && !showChat && !showBookingModal && (
        <button
          onClick={() => setShowChat(true)}
          className="fixed bottom-6 right-6 bg-pink-500 text-white p-4 rounded-full shadow-lg hover:bg-pink-600 transition-all hover:scale-105 z-40"
          title="Chat with salon"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Modal */}
      {showChat && (
        <SalonChat
          salonId={salon.id}
          salonName={salon.name}
          onClose={() => setShowChat(false)}
        />
      )}
    </div>
  );
};