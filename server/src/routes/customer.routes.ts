import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get all customer history for a salon
 * GET /api/customers
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
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

    // Get all customers who have appointments at this salon
    const appointments = await prisma.appointment.findMany({
      where: { salonId: salon.id },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: true
      },
      orderBy: { date: 'desc' }
    });

    // Group by customer
    const customerMap = new Map<string, {
      user: { id: string; name: string; email: string };
      appointments: typeof appointments;
      totalSpent: number;
      lastVisit: Date | null;
    }>();

    appointments.forEach(apt => {
      const existing = customerMap.get(apt.userId);
      if (existing) {
        existing.appointments.push(apt);
        if (apt.status === 'COMPLETED') {
          existing.totalSpent += apt.price;
        }
        if (!existing.lastVisit || new Date(apt.date) > existing.lastVisit) {
          existing.lastVisit = new Date(apt.date);
        }
      } else {
        customerMap.set(apt.userId, {
          user: apt.user,
          appointments: [apt],
          totalSpent: apt.status === 'COMPLETED' ? apt.price : 0,
          lastVisit: new Date(apt.date)
        });
      }
    });

    // Get customer history records
    const customerHistories = await prisma.customerHistory.findMany({
      where: { salonId: salon.id }
    });

    const historyMap = new Map(customerHistories.map(h => [h.userId, h]));

    // Combine data
    const customers = Array.from(customerMap.values()).map(data => {
      const history = historyMap.get(data.user.id);
      return {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        totalVisits: data.appointments.length,
        totalSpent: data.totalSpent,
        lastVisit: data.lastVisit,
        preferences: history?.preferences || null,
        allergies: history?.allergies || null,
        notes: history?.notes || null,
        recentServices: data.appointments.slice(0, 5).map(apt => ({
          service: apt.service.name,
          date: apt.date,
          price: apt.price,
          status: apt.status
        }))
      };
    });

    res.json(customers.sort((a, b) => b.totalSpent - a.totalSpent));
  } catch (error) {
    console.error('Error fetching customers:', error);
    res.status(500).json({ message: 'Error fetching customers. Please try again.' });
  }
});

/**
 * Get single customer history
 * GET /api/customers/:userId
 */
router.get('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const { userId } = req.params;

    const salon = await prisma.salon.findFirst({ where: { ownerId: req.userId } });
    if (!salon) {
      return res.status(404).json({ message: 'No salon found for this owner' });
    }

    const customer = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true }
    });

    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const appointments = await prisma.appointment.findMany({
      where: { userId, salonId: salon.id },
      include: {
        service: true,
        stylist: true
      },
      orderBy: { date: 'desc' }
    });

    const history = await prisma.customerHistory.findUnique({
      where: { salonId_userId: { salonId: salon.id, userId } }
    });

    const totalSpent = appointments
      .filter(a => a.status === 'COMPLETED')
      .reduce((sum, a) => sum + a.price, 0);

    // Find favorite services
    const serviceCount: { [key: string]: number } = {};
    appointments.forEach(apt => {
      serviceCount[apt.service.name] = (serviceCount[apt.service.name] || 0) + 1;
    });
    const favoriteServices = Object.entries(serviceCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    // Find preferred stylist
    const stylistCount: { [key: string]: { name: string; count: number } } = {};
    appointments.forEach(apt => {
      if (apt.stylist) {
        if (!stylistCount[apt.stylistId]) {
          stylistCount[apt.stylistId] = { name: apt.stylist.name, count: 0 };
        }
        stylistCount[apt.stylistId].count++;
      }
    });
    const preferredStylist = Object.values(stylistCount)
      .sort((a, b) => b.count - a.count)[0] || null;

    res.json({
      customer,
      totalVisits: appointments.length,
      totalSpent,
      lastVisit: appointments[0]?.date || null,
      preferences: history?.preferences || null,
      allergies: history?.allergies || null,
      notes: history?.notes || null,
      favoriteServices,
      preferredStylist,
      appointments: appointments.map(apt => ({
        id: apt.id,
        service: apt.service.name,
        stylist: apt.stylist?.name,
        date: apt.date,
        price: apt.price,
        status: apt.status
      }))
    });
  } catch (error) {
    console.error('Error fetching customer:', error);
    res.status(500).json({ message: 'Error fetching customer. Please try again.' });
  }
});

/**
 * Update customer notes/preferences
 * PUT /api/customers/:userId
 */
router.put('/:userId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const { userId } = req.params;
    const { preferences, allergies, notes } = req.body;

    const salon = await prisma.salon.findFirst({ where: { ownerId: req.userId } });
    if (!salon) {
      return res.status(404).json({ message: 'No salon found for this owner' });
    }

    const history = await prisma.customerHistory.upsert({
      where: { salonId_userId: { salonId: salon.id, userId } },
      update: { preferences, allergies, notes },
      create: {
        salonId: salon.id,
        userId,
        preferences,
        allergies,
        notes
      }
    });

    res.json(history);
  } catch (error) {
    console.error('Error updating customer:', error);
    res.status(500).json({ message: 'Error updating customer. Please try again.' });
  }
});

export default router;
