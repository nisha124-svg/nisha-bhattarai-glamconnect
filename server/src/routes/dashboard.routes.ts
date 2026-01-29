import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get analytics data for salon owner dashboard
 * GET /api/dashboard/analytics
 */
router.get('/analytics', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user to check role
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    // Get the salon owned by this user (for now, get first salon - in production, link salon to owner)
    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return res.status(404).json({ message: 'No salon found' });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Get appointments for analytics
    const appointments = await prisma.appointment.findMany({
      where: {
        salonId: salon.id,
        createdAt: { gte: thirtyDaysAgo }
      },
      include: {
        service: true,
        user: { select: { id: true, name: true } }
      },
      orderBy: { date: 'desc' }
    });

    // Calculate revenue
    const totalRevenue = appointments
      .filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
      .reduce((sum, a) => sum + a.price, 0);

    const lastWeekAppointments = appointments.filter(a => new Date(a.createdAt) >= sevenDaysAgo);
    const weeklyRevenue = lastWeekAppointments
      .filter(a => a.status === 'COMPLETED' || a.status === 'CONFIRMED')
      .reduce((sum, a) => sum + a.price, 0);

    // Get unique customers
    const uniqueCustomers = new Set(appointments.map(a => a.userId)).size;

    // Get new customers (first appointment in last 30 days)
    const allTimeCustomerIds = await prisma.appointment.findMany({
      where: { salonId: salon.id },
      select: { userId: true, createdAt: true },
      orderBy: { createdAt: 'asc' }
    });

    const customerFirstVisit = new Map<string, Date>();
    allTimeCustomerIds.forEach(a => {
      if (!customerFirstVisit.has(a.userId)) {
        customerFirstVisit.set(a.userId, a.createdAt);
      }
    });

    const newCustomers = Array.from(customerFirstVisit.entries())
      .filter(([_, date]) => date >= thirtyDaysAgo).length;

    // Calculate daily revenue for chart
    const dailyRevenue: { [key: string]: { revenue: number; bookings: number } } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dayName = days[date.getDay()];
      dailyRevenue[dayName] = { revenue: 0, bookings: 0 };
    }

    lastWeekAppointments.forEach(apt => {
      const dayName = days[new Date(apt.date).getDay()];
      if (dailyRevenue[dayName]) {
        if (apt.status === 'COMPLETED' || apt.status === 'CONFIRMED') {
          dailyRevenue[dayName].revenue += apt.price;
        }
        dailyRevenue[dayName].bookings += 1;
      }
    });

    const chartData = Object.entries(dailyRevenue).map(([name, data]) => ({
      name,
      revenue: data.revenue,
      bookings: data.bookings
    }));

    // Service popularity
    const serviceStats: { [key: string]: number } = {};
    appointments.forEach(apt => {
      const serviceName = apt.service.name;
      serviceStats[serviceName] = (serviceStats[serviceName] || 0) + 1;
    });

    const popularServices = Object.entries(serviceStats)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Customer frequency (how many times customers visit)
    const customerVisits: { [key: string]: number } = {};
    appointments.forEach(apt => {
      customerVisits[apt.userId] = (customerVisits[apt.userId] || 0) + 1;
    });

    const frequencyDistribution = {
      oneTime: 0,
      returning: 0,
      loyal: 0
    };

    Object.values(customerVisits).forEach(visits => {
      if (visits === 1) frequencyDistribution.oneTime++;
      else if (visits <= 3) frequencyDistribution.returning++;
      else frequencyDistribution.loyal++;
    });

    res.json({
      summary: {
        totalRevenue,
        weeklyRevenue,
        totalAppointments: appointments.length,
        weeklyAppointments: lastWeekAppointments.length,
        uniqueCustomers,
        newCustomers,
        avgOrderValue: appointments.length > 0 ? totalRevenue / appointments.length : 0
      },
      chartData,
      popularServices,
      customerFrequency: frequencyDistribution
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Error fetching analytics. Please try again.' });
  }
});

/**
 * Get daily schedule for staff
 * GET /api/dashboard/schedule
 */
router.get('/schedule', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { date } = req.query;
    const targetDate = date ? new Date(date as string) : new Date();
    const startOfDay = new Date(targetDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(targetDate.setHours(23, 59, 59, 999));

    const salon = await prisma.salon.findFirst({
      include: { stylists: true }
    });

    if (!salon) {
      return res.status(404).json({ message: 'No salon found' });
    }

    // Get all appointments for the day
    const appointments = await prisma.appointment.findMany({
      where: {
        salonId: salon.id,
        date: {
          gte: startOfDay,
          lte: endOfDay
        },
        status: { not: 'CANCELLED' }
      },
      include: {
        service: true,
        stylist: true,
        user: { select: { name: true, email: true } }
      },
      orderBy: { date: 'asc' }
    });

    // Get staff schedules for the day
    const dayOfWeek = new Date(startOfDay).getDay();
    const staffSchedules = await prisma.staffSchedule.findMany({
      where: {
        stylist: { salonId: salon.id },
        dayOfWeek
      },
      include: {
        stylist: true
      }
    });

    // Organize appointments by stylist
    const scheduleByStaff = salon.stylists.map(stylist => {
      const stylistAppointments = appointments.filter(a => a.stylistId === stylist.id);
      const schedule = staffSchedules.find(s => s.stylistId === stylist.id);
      
      return {
        stylist: {
          id: stylist.id,
          name: stylist.name,
          role: stylist.role,
          avatar: stylist.avatar
        },
        workingHours: schedule ? {
          start: schedule.startTime,
          end: schedule.endTime,
          isWorking: schedule.isWorking
        } : {
          start: '09:00',
          end: '18:00',
          isWorking: true
        },
        appointments: stylistAppointments.map(apt => ({
          id: apt.id,
          time: new Date(apt.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          service: apt.service.name,
          duration: apt.service.duration,
          customer: apt.user.name,
          customerEmail: apt.user.email,
          price: apt.price,
          status: apt.status
        }))
      };
    });

    res.json({
      date: startOfDay.toISOString().split('T')[0],
      dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][dayOfWeek],
      totalAppointments: appointments.length,
      scheduleByStaff
    });
  } catch (error) {
    console.error('Error fetching schedule:', error);
    res.status(500).json({ message: 'Error fetching schedule. Please try again.' });
  }
});

/**
 * Update staff schedule
 * PUT /api/dashboard/schedule/:stylistId
 */
router.put('/schedule/:stylistId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { stylistId } = req.params;
    const { dayOfWeek, startTime, endTime, isWorking } = req.body;

    const schedule = await prisma.staffSchedule.upsert({
      where: {
        stylistId_dayOfWeek: { stylistId, dayOfWeek }
      },
      update: { startTime, endTime, isWorking },
      create: { stylistId, dayOfWeek, startTime, endTime, isWorking }
    });

    res.json(schedule);
  } catch (error) {
    console.error('Error updating schedule:', error);
    res.status(500).json({ message: 'Error updating schedule. Please try again.' });
  }
});

export default router;
