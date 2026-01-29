import { Router, Response } from 'express';
import prisma from '../config/database';
import { sendBookingConfirmation } from '../services/email.service';
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

    // Create appointment
    const appointment = await prisma.appointment.create({
      data: {
        userId: req.userId,
        salonId,
        serviceId,
        stylistId,
        date: appointmentDate,
        price,
        status: 'CONFIRMED'
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
      io.emit('booking_confirmed', {
        serviceName: appointment.service.name,
        userName: appointment.user.name,
        date: appointment.date
      });
    }

    // Send email confirmation
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
      // Don't fail the request if email fails
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

export default router;
