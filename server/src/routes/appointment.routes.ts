import { Router, Response } from 'express';
import prisma from '../config/database';
import { sendBookingConfirmation } from '../services/email.service';
import { sendBookingSMS, sendCancellationSMS, sendRescheduleSMS } from '../services/sms.service';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Create a new appointment
 * POST /api/appointments
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { salonId, serviceId, stylistId, date, price } = req.body;

    // Input validation
    if (!salonId || !serviceId || !stylistId || !date || !price) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Validate that the date is in the future
    const appointmentDate = new Date(date);
    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'Appointment date must be in the future' });
    }

    // Verify salon, service, and stylist exist
    const [salon, service, stylist] = await Promise.all([
      prisma.salon.findUnique({ where: { id: salonId } }),
      prisma.service.findUnique({ where: { id: serviceId } }),
      prisma.stylist.findUnique({ where: { id: stylistId } })
    ]);

    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    if (!stylist) {
      return res.status(404).json({ message: 'Stylist not found' });
    }

    // Check if salon has auto-accept enabled and slot is available
    let initialStatus: 'PENDING' | 'CONFIRMED' = 'PENDING';
    
    if (salon.autoAcceptBookings) {
      // Check if the time slot is free for the stylist
      const conflicting = await prisma.appointment.findFirst({
        where: {
          stylistId,
          date: appointmentDate,
          status: { notIn: ['CANCELLED', 'REJECTED'] }
        }
      });
      if (!conflicting) {
        initialStatus = 'CONFIRMED';
      }
    }

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.userId,
        salonId,
        serviceId,
        stylistId,
        date: appointmentDate,
        price,
        status: initialStatus
      },
      include: {
        salon: true,
        service: true,
        stylist: true,
        user: { select: { name: true, email: true, phone: true } }
      }
    });

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      if (initialStatus === 'CONFIRMED') {
        io.to(`user_${req.userId}`).emit('booking_confirmed', {
          serviceName: appointment.service.name,
          userName: appointment.user.name,
          date: appointment.date
        });
        // Create notification for the customer
        await prisma.notification.create({
          data: {
            message: `Your booking for ${appointment.service.name} at ${appointment.salon.name} has been confirmed!`,
            type: 'BOOKING_CONFIRMED',
            userId: req.userId!,
            link: appointment.id,
          }
        });
      } else {
        // Notify salon owner about new booking request
        const salonData = await prisma.salon.findUnique({ where: { id: salonId }, select: { ownerId: true } });
        if (salonData?.ownerId) {
          io.to(`user_${salonData.ownerId}`).emit('booking_request', {
            serviceName: appointment.service.name,
            userName: appointment.user.name,
            date: appointment.date
          });
          await prisma.notification.create({
            data: {
              message: `New booking request from ${appointment.user.name} for ${appointment.service.name}`,
              type: 'BOOKING_REQUEST',
              userId: salonData.ownerId,
              link: appointment.id,
            }
          });
          io.to(`user_${salonData.ownerId}`).emit('new_notification', {
            message: `New booking request from ${appointment.user.name}`,
            type: 'BOOKING_REQUEST',
            link: appointment.id,
          });
        }
      }
    }

    // Send email confirmation (only if auto-accepted)
    if (initialStatus === 'CONFIRMED') {
      try {
        await sendBookingConfirmation(appointment.user.email, {
          userName: appointment.user.name,
          serviceName: appointment.service.name,
          salonName: appointment.salon.name,
          date: appointment.date,
          price: appointment.price
        });
      } catch (emailError) {
        console.error('Failed to send confirmation email:', emailError);
      }

      // Send SMS confirmation if phone number is available
      if (appointment.user.phone) {
        try {
          await sendBookingSMS(appointment.user.phone, {
            userName: appointment.user.name,
            serviceName: appointment.service.name,
            salonName: appointment.salon.name,
            date: appointment.date,
            price: appointment.price
          });
        } catch (smsError) {
          console.error('Failed to send confirmation SMS:', smsError);
        }
      }
    }

    res.status(201).json(appointment);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ message: 'Error creating appointment. Please try again.' });
  }
});

/**
 * Get user's appointments
 * GET /api/appointments/my-appointments
 */
router.get('/my-appointments', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId: req.userId },
      include: {
        salon: true,
        service: true,
        stylist: true
      },
      orderBy: { date: 'desc' }
    });

    res.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    res.status(500).json({ message: 'Error fetching appointments. Please try again.' });
  }
});

/**
 * Cancel an appointment
 * PATCH /api/appointments/:id/cancel
 */
router.patch('/:id/cancel', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Check if appointment exists and belongs to user
    const appointment = await prisma.appointment.findUnique({
      where: { id }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to cancel this appointment' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Appointment is already cancelled' });
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        salon: true,
        service: true,
        stylist: true
      }
    });

    res.json(updatedAppointment);
  } catch (error) {
    console.error('Error cancelling appointment:', error);
    res.status(500).json({ message: 'Error cancelling appointment. Please try again.' });
  }
});

/**
 * Reschedule an appointment
 * PATCH /api/appointments/:id/reschedule
 */
router.patch('/:id/reschedule', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { newDate, newStylistId } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!newDate) {
      return res.status(400).json({ message: 'New date is required' });
    }

    // Validate that the new date is in the future
    const newAppointmentDate = new Date(newDate);
    if (newAppointmentDate < new Date()) {
      return res.status(400).json({ message: 'New appointment date must be in the future' });
    }

    // Check if appointment exists and belongs to user
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: { salon: true, service: true, stylist: true, user: { select: { name: true, email: true } } }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    if (appointment.userId !== req.userId) {
      return res.status(403).json({ message: 'Unauthorized to reschedule this appointment' });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({ message: 'Cannot reschedule a cancelled appointment' });
    }

    if (appointment.status === 'COMPLETED') {
      return res.status(400).json({ message: 'Cannot reschedule a completed appointment' });
    }

    // If new stylist is provided, verify they exist and belong to the same salon
    let stylistId = appointment.stylistId;
    if (newStylistId && newStylistId !== appointment.stylistId) {
      const newStylist = await prisma.stylist.findUnique({
        where: { id: newStylistId }
      });

      if (!newStylist) {
        return res.status(404).json({ message: 'Stylist not found' });
      }

      if (newStylist.salonId !== appointment.salonId) {
        return res.status(400).json({ message: 'Stylist does not belong to this salon' });
      }

      stylistId = newStylistId;
    }

    // Check for conflicting appointments for the stylist
    const conflictingAppointment = await prisma.appointment.findFirst({
      where: {
        stylistId,
        date: newAppointmentDate,
        status: { not: 'CANCELLED' },
        id: { not: id }
      }
    });

    if (conflictingAppointment) {
      return res.status(409).json({ message: 'The selected time slot is not available. Please choose a different time.' });
    }

    // Update appointment
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        date: newAppointmentDate,
        stylistId
      },
      include: {
        salon: true,
        service: true,
        stylist: true,
        user: { select: { name: true, email: true } }
      }
    });

    // Emit socket event for real-time notification
    const io = req.app.get('io');
    if (io) {
      // Notify the salon owner
      const salonOwner = await prisma.salon.findUnique({ where: { id: appointment.salonId }, select: { ownerId: true } });
      if (salonOwner?.ownerId) {
        io.to(`user_${salonOwner.ownerId}`).emit('booking_rescheduled', {
          serviceName: updatedAppointment.service.name,
          userName: updatedAppointment.user.name,
          oldDate: appointment.date,
          newDate: updatedAppointment.date
        });
        io.to(`user_${salonOwner.ownerId}`).emit('new_notification', {
          message: `${updatedAppointment.user.name} rescheduled their ${updatedAppointment.service.name} booking`,
          type: 'BOOKING_RESCHEDULED',
          link: updatedAppointment.id,
        });
        await prisma.notification.create({
          data: {
            message: `${updatedAppointment.user.name} rescheduled their ${updatedAppointment.service.name} booking`,
            type: 'BOOKING_RESCHEDULED',
            userId: salonOwner.ownerId,
            link: updatedAppointment.id,
          }
        });
      }
    }

    // Send email notification about rescheduling
    try {
      await sendBookingConfirmation(updatedAppointment.user.email, {
        userName: updatedAppointment.user.name,
        serviceName: `${updatedAppointment.service.name} (Rescheduled)`,
        salonName: updatedAppointment.salon.name,
        date: updatedAppointment.date,
        price: updatedAppointment.price
      });
    } catch (emailError) {
      console.error('Failed to send rescheduling email:', emailError);
    }

    res.json({
      message: 'Appointment rescheduled successfully',
      appointment: updatedAppointment
    });
  } catch (error) {
    console.error('Error rescheduling appointment:', error);
    res.status(500).json({ message: 'Error rescheduling appointment. Please try again.' });
  }
});

/**
 * Get available time slots for a stylist on a specific date
 * GET /api/appointments/available-slots
 */
router.get('/available-slots', async (req, res) => {
  try {
    const { stylistId, date, salonId } = req.query;

    if (!stylistId || !date || !salonId) {
      return res.status(400).json({ message: 'stylistId, date, and salonId are required' });
    }

    const queryDate = new Date(date as string);
    const startOfDay = new Date(queryDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(queryDate.setHours(23, 59, 59, 999));

    // Get all appointments for the stylist on this date
    const existingAppointments = await prisma.appointment.findMany({
      where: {
        stylistId: stylistId as string,
        salonId: salonId as string,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'CANCELLED' }
      },
      orderBy: { date: 'asc' }
    });

    // Generate time slots (9 AM to 7 PM, 1-hour slots)
    const allSlots: { time: string; display: string; available: boolean }[] = [];
    for (let hour = 9; hour <= 18; hour++) {
      const slotTime = new Date(startOfDay);
      slotTime.setHours(hour, 0, 0, 0);
      allSlots.push({
        time: slotTime.toISOString(),
        display: `${hour > 12 ? hour - 12 : hour}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        available: true
      });
    }

    // Mark booked slots as unavailable
    existingAppointments.forEach(appt => {
      const apptHour = new Date(appt.date).getHours();
      const slotIndex = allSlots.findIndex(slot => new Date(slot.time).getHours() === apptHour);
      if (slotIndex !== -1) {
        allSlots[slotIndex].available = false;
      }
    });

    res.json({
      date: date,
      stylistId,
      slots: allSlots
    });
  } catch (error) {
    console.error('Error fetching available slots:', error);
    res.status(500).json({ message: 'Error fetching available slots. Please try again.' });
  }
});

// =====================================================
// SALON OWNER ENDPOINTS
// =====================================================

/**
 * Get all bookings for the salon owner's salon
 * GET /api/appointments/salon-bookings
 */
router.get('/salon-bookings', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const salon = await prisma.salon.findFirst({ where: { ownerId: req.userId } });
    if (!salon) {
      return res.status(404).json({ message: 'No salon found for this owner' });
    }

    const bookings = await prisma.appointment.findMany({
      where: { salonId: salon.id },
      include: {
        user: { select: { id: true, name: true, email: true, phone: true } },
        service: true,
        stylist: true,
        salon: { select: { id: true, name: true, autoAcceptBookings: true } }
      },
      orderBy: { date: 'desc' }
    });

    res.json({ bookings, autoAcceptBookings: salon.autoAcceptBookings });
  } catch (error) {
    console.error('Error fetching salon bookings:', error);
    res.status(500).json({ message: 'Error fetching salon bookings.' });
  }
});

/**
 * Accept a pending booking
 * PATCH /api/appointments/:id/accept
 */
router.patch('/:id/accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { salon: true, service: true, stylist: true, user: { select: { name: true, email: true, phone: true } } }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot accept a ${appointment.status.toLowerCase()} appointment` });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'CONFIRMED' },
      include: { salon: true, service: true, stylist: true, user: { select: { name: true, email: true, phone: true } } }
    });

    // Notify customer
    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updated.userId}`).emit('booking_confirmed', {
        serviceName: updated.service.name,
        userName: updated.user.name,
        date: updated.date
      });
      io.to(`user_${updated.userId}`).emit('new_notification', {
        message: `Your booking for ${updated.service.name} has been confirmed!`,
        type: 'BOOKING_CONFIRMED',
        link: updated.id,
      });
    }

    // Persist notification
    await prisma.notification.create({
      data: {
        message: `Your booking for ${updated.service.name} at ${updated.salon.name} has been confirmed!`,
        type: 'BOOKING_CONFIRMED',
        userId: updated.userId,
        link: updated.id,
      }
    });

    // Send confirmation email
    try {
      await sendBookingConfirmation(updated.user.email, {
        userName: updated.user.name,
        serviceName: updated.service.name,
        salonName: updated.salon.name,
        date: updated.date,
        price: updated.price
      });
    } catch (e) { console.error('Email error:', e); }

    // Send SMS
    if (updated.user.phone) {
      try {
        await sendBookingSMS(updated.user.phone, {
          userName: updated.user.name,
          serviceName: updated.service.name,
          salonName: updated.salon.name,
          date: updated.date,
          price: updated.price
        });
      } catch (e) { console.error('SMS error:', e); }
    }

    res.json({ message: 'Booking accepted', appointment: updated });
  } catch (error) {
    console.error('Error accepting booking:', error);
    res.status(500).json({ message: 'Error accepting booking.' });
  }
});

/**
 * Reject a pending booking
 * PATCH /api/appointments/:id/reject
 */
router.patch('/:id/reject', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { salon: true, service: true, user: { select: { name: true, email: true, phone: true } } }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'PENDING') {
      return res.status(400).json({ message: `Cannot reject a ${appointment.status.toLowerCase()} appointment` });
    }

    const reason = req.body.reason || '';

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'REJECTED' },
      include: { salon: true, service: true, stylist: true, user: { select: { name: true, email: true, phone: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updated.userId}`).emit('booking_rejected', {
        serviceName: updated.service.name,
        userName: updated.user.name,
        reason
      });
      io.to(`user_${updated.userId}`).emit('new_notification', {
        message: `Your booking for ${updated.service.name} was rejected${reason ? ': ' + reason : ''}`,
        type: 'BOOKING_REJECTED',
        link: updated.id,
      });
    }

    // Persist notification
    await prisma.notification.create({
      data: {
        message: `Your booking for ${updated.service.name} at ${updated.salon.name} was rejected${reason ? ': ' + reason : ''}`,
        type: 'BOOKING_REJECTED',
        userId: updated.userId,
        link: updated.id,
      }
    });

    // Send cancellation SMS
    if (updated.user.phone) {
      try {
        await sendCancellationSMS(updated.user.phone, {
          userName: updated.user.name,
          serviceName: updated.service.name,
          salonName: updated.salon.name,
          date: updated.date,
          price: updated.price
        });
      } catch (e) { console.error('SMS error:', e); }
    }

    res.json({ message: 'Booking rejected', appointment: updated });
  } catch (error) {
    console.error('Error rejecting booking:', error);
    res.status(500).json({ message: 'Error rejecting booking.' });
  }
});

/**
 * Mark an appointment as completed (service delivered)
 * PATCH /api/appointments/:id/complete
 */
router.patch('/:id/complete', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.id },
      include: { salon: true, service: true }
    });

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    if (appointment.status !== 'CONFIRMED') {
      return res.status(400).json({ message: `Can only complete confirmed appointments. Current status: ${appointment.status}` });
    }

    const updated = await prisma.appointment.update({
      where: { id: req.params.id },
      data: { status: 'COMPLETED' },
      include: { salon: true, service: true, stylist: true, user: { select: { name: true, email: true, phone: true } } }
    });

    const io = req.app.get('io');
    if (io) {
      io.to(`user_${updated.userId}`).emit('service_completed', {
        serviceName: updated.service.name,
        userName: updated.user.name,
        salonName: updated.salon.name
      });
      io.to(`user_${updated.userId}`).emit('new_notification', {
        message: `Your ${updated.service.name} at ${updated.salon.name} is complete! Leave a review.`,
        type: 'BOOKING_COMPLETED',
        link: updated.id,
      });
    }

    // Persist notification
    await prisma.notification.create({
      data: {
        message: `Your ${updated.service.name} at ${updated.salon.name} is complete! We'd love to hear your feedback.`,
        type: 'BOOKING_COMPLETED',
        userId: updated.userId,
        link: updated.id,
      }
    });

    res.json({ message: 'Service marked as completed', appointment: updated });
  } catch (error) {
    console.error('Error completing appointment:', error);
    res.status(500).json({ message: 'Error completing appointment.' });
  }
});

/**
 * Toggle auto-accept bookings for a salon
 * PATCH /api/appointments/toggle-auto-accept
 */
router.patch('/toggle-auto-accept', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const { autoAccept } = req.body;
    if (typeof autoAccept !== 'boolean') {
      return res.status(400).json({ message: 'autoAccept must be a boolean' });
    }

    // Find salon by owner
    const salon = await prisma.salon.findFirst({ where: { ownerId: req.userId } });
    if (!salon) return res.status(404).json({ message: 'No salon found for this owner' });

    const updated = await prisma.salon.update({
      where: { id: salon.id },
      data: { autoAcceptBookings: autoAccept }
    });

    res.json({ message: `Auto-accept bookings ${autoAccept ? 'enabled' : 'disabled'}`, autoAcceptBookings: updated.autoAcceptBookings });
  } catch (error) {
    console.error('Error toggling auto-accept:', error);
    res.status(500).json({ message: 'Error updating setting.' });
  }
});

export default router;
