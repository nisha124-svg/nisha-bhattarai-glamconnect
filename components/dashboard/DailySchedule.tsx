import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Clock, User, RefreshCw } from 'lucide-react';
import { dashboard } from '../../api/client';

interface Appointment {
  id: string;
  time: string;
  service: string;
  duration: number;
  customer: string;
  customerEmail: string;
  price: number;
  status: string;
}

interface StaffScheduleData {
  stylist: {
    id: string;
    name: string;
    role: string;
    avatar: string;
  };
  workingHours: {
    start: string;
    end: string;
    isWorking: boolean;
  };
  appointments: Appointment[];
}

interface ScheduleResponse {
  date: string;
  dayOfWeek: string;
  totalAppointments: number;
  scheduleByStaff: StaffScheduleData[];
}

export const DailySchedule: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [scheduleData, setScheduleData] = useState<ScheduleResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSchedule = async (date: Date) => {
    try {
      setLoading(true);
      const dateStr = date.toISOString().split('T')[0];
      const response = await dashboard.getSchedule(dateStr);
      setScheduleData(response.data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule(selectedDate);
  }, [selectedDate]);

  const navigateDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const timeSlots = generateTimeSlots('08:00', '20:00', 30);

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
        <button 
          onClick={() => fetchSchedule(selectedDate)}
          className="ml-4 text-sm underline hover:no-underline"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Navigation */}
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigateDate(-1)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronLeft className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <h2 className="text-xl font-bold text-gray-900">{formatDate(selectedDate)}</h2>
            <p className="text-sm text-gray-500">
              {scheduleData?.totalAppointments || 0} appointments scheduled
            </p>
          </div>
          
          <button 
            onClick={() => navigateDate(1)}
            className="p-2 hover:bg-gray-100 rounded-full transition"
          >
            <ChevronRight className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Quick date buttons */}
        <div className="flex justify-center gap-2 mt-4">
          <button
            onClick={() => setSelectedDate(new Date())}
            className="px-3 py-1 text-sm bg-pink-50 text-pink-600 rounded-full hover:bg-pink-100 transition"
          >
            Today
          </button>
          <button
            onClick={() => {
              const tomorrow = new Date();
              tomorrow.setDate(tomorrow.getDate() + 1);
              setSelectedDate(tomorrow);
            }}
            className="px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header */}
            <div className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] border-b border-gray-100">
              <div className="p-4 font-medium text-gray-500 text-sm">Time</div>
              {scheduleData?.scheduleByStaff.map((staff) => (
                <div key={staff.stylist.id} className="p-4 border-l border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold">
                      {staff.stylist.name[0]}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{staff.stylist.name}</p>
                      <p className="text-xs text-gray-500">{staff.stylist.role}</p>
                      {staff.workingHours.isWorking ? (
                        <p className="text-xs text-green-600">
                          {staff.workingHours.start} - {staff.workingHours.end}
                        </p>
                      ) : (
                        <p className="text-xs text-red-500">Off duty</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            <div className="divide-y divide-gray-50">
              {timeSlots.map((slot) => (
                <div 
                  key={slot} 
                  className="grid grid-cols-[100px_repeat(auto-fill,minmax(200px,1fr))] min-h-[60px]"
                >
                  <div className="p-2 text-sm text-gray-400 flex items-start">
                    {slot}
                  </div>
                  {scheduleData?.scheduleByStaff.map((staff) => {
                    const appointment = staff.appointments.find(apt => apt.time === slot);
                    return (
                      <div key={`${staff.stylist.id}-${slot}`} className="p-2 border-l border-gray-50">
                        {appointment && (
                          <AppointmentCard appointment={appointment} />
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Staff Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {scheduleData?.scheduleByStaff.map((staff) => (
          <div key={staff.stylist.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-pink-100 flex items-center justify-center text-pink-600 font-bold text-lg">
                {staff.stylist.name[0]}
              </div>
              <div>
                <h4 className="font-medium text-gray-900">{staff.stylist.name}</h4>
                <p className="text-sm text-gray-500">{staff.stylist.role}</p>
              </div>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Appointments</span>
                <span className="font-medium">{staff.appointments.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Working Hours</span>
                <span className="font-medium">
                  {staff.workingHours.isWorking 
                    ? `${staff.workingHours.start} - ${staff.workingHours.end}`
                    : 'Off duty'
                  }
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Revenue</span>
                <span className="font-medium text-green-600">
                  ${staff.appointments.reduce((sum, apt) => sum + apt.price, 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const AppointmentCard: React.FC<{ appointment: Appointment }> = ({ appointment }) => {
  const statusColors: Record<string, string> = {
    PENDING: 'bg-amber-100 border-amber-300 text-amber-800',
    CONFIRMED: 'bg-blue-100 border-blue-300 text-blue-800',
    COMPLETED: 'bg-green-100 border-green-300 text-green-800',
    CANCELLED: 'bg-red-100 border-red-300 text-red-800',
    REJECTED: 'bg-red-100 border-red-300 text-red-700',
  };

  return (
    <div className={`p-2 rounded-lg border ${statusColors[appointment.status] || 'bg-gray-100 border-gray-300'}`}>
      <p className="font-medium text-sm truncate">{appointment.service}</p>
      <div className="flex items-center gap-1 text-xs mt-1">
        <User className="h-3 w-3" />
        <span className="truncate">{appointment.customer}</span>
      </div>
      <div className="flex items-center gap-1 text-xs">
        <Clock className="h-3 w-3" />
        <span>{appointment.duration} min</span>
      </div>
    </div>
  );
};

function generateTimeSlots(start: string, end: string, intervalMinutes: number): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  
  let currentHour = startHour;
  let currentMin = startMin;
  
  while (currentHour < endHour || (currentHour === endHour && currentMin <= endMin)) {
    slots.push(
      `${currentHour.toString().padStart(2, '0')}:${currentMin.toString().padStart(2, '0')}`
    );
    
    currentMin += intervalMinutes;
    if (currentMin >= 60) {
      currentHour += Math.floor(currentMin / 60);
      currentMin = currentMin % 60;
    }
  }
  
  return slots;
}
