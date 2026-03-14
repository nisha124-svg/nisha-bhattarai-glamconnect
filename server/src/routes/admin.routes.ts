import { Router, Request, Response } from 'express';
import prisma from '../config/database';
import { authMiddleware, adminOnly } from '../middleware/auth.middleware';
import { sendOwnerApplicationDecision } from '../services/email.service';

const router = Router();

// Get platform statistics (admin only)
router.get('/stats', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const [
      totalUsers,
      totalSalons,
      totalAppointments,
      pendingSalons,
      pendingOwners,
      recentUsers,
      recentAppointments
    ] = await Promise.all([
      prisma.user.count(),
      prisma.salon.count(),
      prisma.appointment.count(),
      prisma.salon.count({ where: { isVerified: false } }),
      prisma.user.count({ where: { role: 'SALON_OWNER', isApproved: false } }),
      prisma.user.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      }),
      prisma.appointment.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          salon: { select: { name: true } },
          service: { select: { name: true } }
        }
      })
    ]);

    // Calculate revenue (sum of all completed appointments)
    const completedAppointments = await prisma.appointment.findMany({
      where: { status: 'COMPLETED' }
    });
    const totalRevenue = completedAppointments.reduce((sum, apt) => sum + (apt.price || 0), 0);

    res.json({
      stats: {
        totalUsers,
        totalSalons,
        totalAppointments,
        pendingSalons,
        pendingOwners,
        totalRevenue
      },
      recentUsers,
      recentAppointments
    });
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Error fetching statistics' });
  }
});

// Get all users (admin only)
router.get('/users', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { role, status, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const users = await prisma.user.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isApproved: true,
        createdAt: true,
        _count: {
          select: { appointments: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.user.count({ where });

    res.json({
      users: users.map(u => ({
        ...u,
        totalBookings: u._count.appointments,
        status: u.role === 'SALON_OWNER' && !u.isApproved ? 'pending' : 'active'
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

// Update user role (admin only)
router.put('/users/:id/role', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['USER', 'SALON_OWNER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true
      }
    });

    res.json({ message: 'User role updated', user });
  } catch (error) {
    console.error('Error updating user role:', error);
    res.status(500).json({ message: 'Error updating user role' });
  }
});

// Get all salons for admin (admin only)
router.get('/salons', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status === 'pending') where.isVerified = false;
    if (status === 'active') where.isVerified = true;
    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const salons = await prisma.salon.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        owner: { select: { name: true, email: true } },
        _count: { select: { appointments: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.salon.count({ where });

    // Calculate revenue for each salon
    const salonsWithRevenue = await Promise.all(
      salons.map(async (salon) => {
        const appointments = await prisma.appointment.findMany({
          where: { salonId: salon.id, status: 'COMPLETED' }
        });
        const revenue = appointments.reduce((sum, apt) => sum + (apt.price || 0), 0);
        return {
          ...salon,
          revenue,
          totalBookings: salon._count.appointments,
          status: salon.isVerified ? 'active' : 'pending'
        };
      })
    );

    res.json({
      salons: salonsWithRevenue,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching salons:', error);
    res.status(500).json({ message: 'Error fetching salons' });
  }
});

// Approve salon (admin only)
router.put('/salons/:id/approve', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const salon = await prisma.salon.update({
      where: { id },
      data: { isVerified: true },
      include: {
        owner: { select: { name: true, email: true } }
      }
    });

    // TODO: Send email notification to salon owner

    res.json({ message: 'Salon approved successfully', salon });
  } catch (error) {
    console.error('Error approving salon:', error);
    res.status(500).json({ message: 'Error approving salon' });
  }
});

// Suspend salon (admin only)
router.put('/salons/:id/suspend', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const salon = await prisma.salon.update({
      where: { id },
      data: { isVerified: false },
      include: {
        owner: { select: { name: true, email: true } }
      }
    });

    // TODO: Send email notification to salon owner with reason

    res.json({ message: 'Salon suspended', salon, reason });
  } catch (error) {
    console.error('Error suspending salon:', error);
    res.status(500).json({ message: 'Error suspending salon' });
  }
});

// Get all bookings (admin only)
router.get('/bookings', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;

    const where: any = {};
    if (status && status !== 'all') {
      where.status = (status as string).toUpperCase();
    }

    const bookings = await prisma.appointment.findMany({
      where,
      skip: (Number(page) - 1) * Number(limit),
      take: Number(limit),
      include: {
        user: { select: { name: true, email: true } },
        salon: { select: { name: true } },
        service: { select: { name: true, price: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    const total = await prisma.appointment.count({ where });

    res.json({
      bookings: bookings.map(b => ({
        id: b.id,
        customer: b.user?.name || 'Unknown',
        customerEmail: b.user?.email,
        salon: b.salon?.name || 'Unknown',
        service: b.service?.name || 'Unknown',
        date: b.date,
        status: b.status.toLowerCase(),
        amount: b.price || b.service?.price || 0
      })),
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// Update booking status (admin only)
router.put('/bookings/:id/status', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
        user: { select: { name: true, email: true } },
        salon: { select: { name: true } },
        service: { select: { name: true } }
      }
    });

    res.json({ message: 'Booking status updated', booking });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Error updating booking status' });
  }
});

// Get platform settings (admin only)
router.get('/settings', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  // In a real app, these would be stored in the database
  const settings = {
    allowNewRegistration: true,
    requireSalonApproval: true,
    emailNotifications: true,
    commissionRate: 10,
    maintenanceMode: false
  };

  res.json(settings);
});

// Update platform settings (admin only)
router.put('/settings', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  const settings = req.body;
  // In a real app, save these to the database
  res.json({ message: 'Settings updated', settings });
});

// Get pending salon owners (admin only)
router.get('/pending-owners', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const pendingOwners = await prisma.user.findMany({
      where: { role: 'SALON_OWNER', isApproved: false },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        salonApplicationName: true,
        salonApplicationDescription: true,
        ownershipProofUrl: true,
        locationImageUrls: true,
        applicationSubmittedAt: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(pendingOwners);
  } catch (error) {
    console.error('Error fetching pending owners:', error);
    res.status(500).json({ message: 'Error fetching pending salon owners' });
  }
});

// Approve salon owner (admin only)
router.put('/users/:id/approve', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        isApproved: true,
        applicationReviewedAt: new Date(),
        applicationReviewNote: reason || 'Approved by admin',
      },
      select: { id: true, name: true, email: true, role: true, isApproved: true }
    });

    await sendOwnerApplicationDecision(user.email, {
      ownerName: user.name,
      approved: true,
      reason,
    });

    res.json({ message: `Salon owner "${user.name}" has been approved. They can now log in and set up their salon.`, user });
  } catch (error) {
    console.error('Error approving salon owner:', error);
    res.status(500).json({ message: 'Error approving salon owner' });
  }
});

// Reject/remove salon owner (admin only)
router.put('/users/:id/reject', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const rejectionReason = reason || 'Your submitted documents could not be verified.';

    // Demote back to regular USER and mark approved (so they can use the platform as a customer)
    const user = await prisma.user.update({
      where: { id },
      data: {
        role: 'USER',
        isApproved: true,
        applicationReviewedAt: new Date(),
        applicationReviewNote: rejectionReason,
      },
      select: { id: true, name: true, email: true, role: true, isApproved: true }
    });

    await sendOwnerApplicationDecision(user.email, {
      ownerName: user.name,
      approved: false,
      reason: rejectionReason,
    });

    res.json({ message: `Salon owner request from "${user.name}" has been rejected. Account converted to regular user.`, user, reason: rejectionReason });
  } catch (error) {
    console.error('Error rejecting salon owner:', error);
    res.status(500).json({ message: 'Error rejecting salon owner' });
  }
});

// Delete a user and all related data (admin only)
router.delete('/users/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Prevent admin from deleting themselves
    if (id === (req as any).userId) {
      return res.status(400).json({ message: 'You cannot delete your own account.' });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Cascade delete all related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete loyalty transactions
      await tx.loyaltyTransaction.deleteMany({ where: { userId: id } });
      // Delete notifications
      await tx.notification.deleteMany({ where: { userId: id } });
      // Delete customer history
      await tx.customerHistory.deleteMany({ where: { userId: id } });
      // Delete reviews
      await tx.review.deleteMany({ where: { userId: id } });
      // Delete appointments
      await tx.appointment.deleteMany({ where: { userId: id } });

      // If salon owner, delete their salons and all salon data
      if (user.role === 'SALON_OWNER') {
        const ownedSalons = await tx.salon.findMany({ where: { ownerId: id } });
        for (const salon of ownedSalons) {
          await tx.appointment.deleteMany({ where: { salonId: salon.id } });
          await tx.review.deleteMany({ where: { salonId: salon.id } });
          await tx.customerHistory.deleteMany({ where: { salonId: salon.id } });
          await tx.promoCode.deleteMany({ where: { salonId: salon.id } });
          // Delete staff schedules for stylists
          const stylists = await tx.stylist.findMany({ where: { salonId: salon.id } });
          for (const stylist of stylists) {
            await tx.staffSchedule.deleteMany({ where: { stylistId: stylist.id } });
          }
          await tx.stylist.deleteMany({ where: { salonId: salon.id } });
          await tx.service.deleteMany({ where: { salonId: salon.id } });
        }
        await tx.salon.deleteMany({ where: { ownerId: id } });
      }

      // Delete the user
      await tx.user.delete({ where: { id } });
    });

    res.json({ message: `User "${user.name}" and all related data have been deleted.` });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Error deleting user' });
  }
});

// Delete a salon and all related data (admin only)
router.delete('/salons/:id', authMiddleware, adminOnly, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const salon = await prisma.salon.findUnique({ where: { id } });
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    await prisma.$transaction(async (tx) => {
      // Delete all appointments for this salon
      await tx.appointment.deleteMany({ where: { salonId: id } });
      // Delete reviews
      await tx.review.deleteMany({ where: { salonId: id } });
      // Delete customer history
      await tx.customerHistory.deleteMany({ where: { salonId: id } });
      // Delete promo codes
      await tx.promoCode.deleteMany({ where: { salonId: id } });
      // Delete staff schedules
      const stylists = await tx.stylist.findMany({ where: { salonId: id } });
      for (const stylist of stylists) {
        await tx.staffSchedule.deleteMany({ where: { stylistId: stylist.id } });
      }
      // Delete stylists
      await tx.stylist.deleteMany({ where: { salonId: id } });
      // Delete services
      await tx.service.deleteMany({ where: { salonId: id } });
      // Delete the salon
      await tx.salon.delete({ where: { id } });
    });

    res.json({ message: `Salon "${salon.name}" and all related data have been deleted.` });
  } catch (error) {
    console.error('Error deleting salon:', error);
    res.status(500).json({ message: 'Error deleting salon' });
  }
});

export default router;
