import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get all services for a salon
 * GET /api/services/:salonId
 */
router.get('/:salonId', async (req, res: Response) => {
  try {
    const { salonId } = req.params;

    const services = await prisma.service.findMany({
      where: { salonId },
      orderBy: [{ category: 'asc' }, { name: 'asc' }]
    });

    res.json(services);
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({ message: 'Error fetching services. Please try again.' });
  }
});

/**
 * Create a new service
 * POST /api/services
 */
router.post('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const { salonId, name, duration, price, category } = req.body;

    if (!salonId || !name || !duration || !price || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const service = await prisma.service.create({
      data: {
        salonId,
        name,
        duration: parseInt(duration),
        price: parseFloat(price),
        category
      }
    });

    res.status(201).json(service);
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({ message: 'Error creating service. Please try again.' });
  }
});

/**
 * Update a service
 * PUT /api/services/:id
 */
router.put('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const { id } = req.params;
    const { name, duration, price, category } = req.body;

    const service = await prisma.service.update({
      where: { id },
      data: {
        name,
        duration: parseInt(duration),
        price: parseFloat(price),
        category
      }
    });

    res.json(service);
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({ message: 'Error updating service. Please try again.' });
  }
});

/**
 * Delete a service
 * DELETE /api/services/:id
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || user.role !== 'SALON_OWNER') {
      return res.status(403).json({ message: 'Access denied. Salon owners only.' });
    }

    const { id } = req.params;

    // Check if service has appointments
    const appointments = await prisma.appointment.findFirst({
      where: { serviceId: id }
    });

    if (appointments) {
      return res.status(400).json({ 
        message: 'Cannot delete service with existing appointments. Consider deactivating instead.' 
      });
    }

    await prisma.service.delete({ where: { id } });

    res.json({ message: 'Service deleted successfully' });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({ message: 'Error deleting service. Please try again.' });
  }
});

export default router;
