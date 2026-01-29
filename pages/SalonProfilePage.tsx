import React, { useState } from 'react';
import { ArrowLeft, Star, MapPin, Clock, Calendar, CheckCircle } from 'lucide-react';
import { Button } from '../components/Button';
import { Salon, Service, Stylist } from '../types';

import { appointments } from '../api/client';

interface SalonProfilePageProps {
  salon: Salon;
  onBack: () => void;
  onBookSuccess: () => void;
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

  const handleBookClick = (service: Service) => {
    setSelectedService(service);
    setShowBookingModal(true);
    setBookingStep(1);
  };

  const handleBookingSubmit = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;

    try {
      await appointments.create({
        salonId: salon.id,
        serviceId: selectedService.id,
        stylistId: selectedStylist?.id,
        date: `${selectedDate}T${convertTo24Hour(selectedTime)}`,
        price: selectedService.price
      });
      setShowBookingModal(false);
      onBookSuccess();
    } catch (error) {
      console.error('Booking failed:', error);
      alert('Failed to book appointment. Please try again.');
    }
  };

  const convertTo24Hour = (time12h: string) => {
    const [time, modifier] = time12h.split(' ');
    let [hours, minutes] = time.split(':');
    if (hours === '12') {
      hours = '00';
    }
    if (modifier === 'PM') {
      hours = (parseInt(hours, 10) + 12).toString();
    }
    return `${hours}:${minutes}:00`;
  };

  const timeSlots = ["09:00 AM", "10:00 AM", "11:30 AM", "01:00 PM", "02:30 PM", "04:00 PM"];

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
            <Button variant="outline">Contact</Button>
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
                {salon.reviews.length > 0 ? (
                  salon.reviews.map((review) => (
                    <div key={review.id} className="bg-gray-50 rounded-xl p-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-gray-900">{review.user}</span>
                        <span className="text-gray-400 text-sm">{review.date}</span>
                      </div>
                      <div className="flex text-yellow-400 mb-2">
                        {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                      </div>
                      <p className="text-gray-600">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No reviews yet.</p>
                )}
              </div>
            )}

            {activeTab === 'about' && (
              <div className="bg-gray-50 rounded-xl p-6 text-gray-700 leading-relaxed">
                <p>{salon.description}</p>
                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-2">Gallery</h4>
                  <div className="grid grid-cols-3 gap-2">
                    {salon.gallery.map((img, i) => (
                      <img key={i} src={img} alt="Salon interior" className="rounded-lg h-24 w-full object-cover" />
                    ))}
                  </div>
                </div>
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
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-pink-50">
              <h3 className="font-bold text-xl text-gray-800">Book Appointment</h3>
              <button onClick={() => setShowBookingModal(false)} className="text-gray-400 hover:text-gray-600">
                <div className="sr-only">Close</div>
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="p-6 md:p-8">
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      className="w-full border border-gray-300 rounded-lg p-3 focus:ring-pink-500 focus:border-pink-500"
                      onChange={(e) => setSelectedDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Slots</label>
                    <div className="grid grid-cols-3 gap-3">
                      {timeSlots.map(time => (
                        <button
                          key={time}
                          onClick={() => setSelectedTime(time)}
                          className={`py-2 px-3 rounded-lg text-sm font-medium border ${selectedTime === time ? 'bg-pink-500 text-white border-pink-500' : 'bg-white border-gray-200 text-gray-700 hover:border-pink-300'}`}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Review */}
              {bookingStep === 3 && (
                <div className="bg-gray-50 rounded-xl p-6">
                  <h4 className="font-bold text-lg mb-4 text-center">Confirm Booking</h4>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between border-b border-gray-200 pb-2">
                      <span className="text-gray-500">Service</span>
                      <span className="font-bold text-gray-900">{selectedService?.name}</span>
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
                      <span className="font-bold text-gray-900">{selectedDate || 'Tomorrow'} at {selectedTime || '10:00 AM'}</span>
                    </div>
                    <div className="flex justify-between pt-2">
                      <span className="font-bold text-gray-900 text-lg">Total</span>
                      <span className="font-bold text-pink-600 text-lg">${selectedService?.price}</span>
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
                  (bookingStep === 2 && (!selectedDate && !selectedTime))
                }
                onClick={() => {
                  if (bookingStep < 3) setBookingStep(bookingStep + 1);
                  else handleBookingSubmit();
                }}
              >
                {bookingStep === 3 ? 'Confirm Payment' : 'Next Step'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};