import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get reviews for a salon
 * GET /api/reviews/:salonId
 */
router.get('/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;

    const reviews = await prisma.review.findMany({
      where: { salonId },
      include: {
        user: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ message: 'Error fetching reviews.' });
  }
});

/**
 * Create a review for a salon
 * POST /api/reviews/:salonId
 * Body: { rating, comment, appointmentId? }
 */
router.post('/:salonId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { rating, comment, appointmentId } = req.body;

    if (!rating || !comment) {
      return res.status(400).json({ message: 'Rating and comment are required' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Verify salon exists
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) return res.status(404).json({ message: 'Salon not found' });

    // Check if user already reviewed this salon
    const existingReview = await prisma.review.findFirst({
      where: { userId: req.userId, salonId },
    });
    if (existingReview) {
      return res.status(400).json({ message: 'You have already reviewed this salon. You can update your existing review.' });
    }

    // Check if user has a completed booking at this salon (for verified tag)
    let isVerified = false;
    let linkedAppointmentId: string | null = null;

    if (appointmentId) {
      // Verify the specific appointment
      const appointment = await prisma.appointment.findUnique({
        where: { id: appointmentId },
      });
      if (appointment && appointment.userId === req.userId && appointment.salonId === salonId && appointment.status === 'COMPLETED') {
        isVerified = true;
        linkedAppointmentId = appointmentId;
      }
    } else {
      // Check if user has ANY completed booking at this salon
      const completedBooking = await prisma.appointment.findFirst({
        where: {
          userId: req.userId,
          salonId,
          status: 'COMPLETED',
        },
      });
      if (completedBooking) {
        isVerified = true;
        linkedAppointmentId = completedBooking.id;
      }
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Create the review
    const review = await prisma.review.create({
      data: {
        rating: parseInt(rating),
        comment: comment.trim(),
        isVerified,
        appointmentId: linkedAppointmentId,
        userId: req.userId,
        salonId,
      },
      include: {
        user: { select: { name: true } },
      },
    });

    // Update salon's average rating and review count
    const allReviews = await prisma.review.findMany({
      where: { salonId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.salon.update({
      where: { id: salonId },
      data: {
        rating: Math.round(avgRating * 10) / 10,
        reviewCount: allReviews.length,
      },
    });

    // Notify salon owner about new review
    if (salon.ownerId) {
      await prisma.notification.create({
        data: {
          message: `New ${rating}-star review from ${user.name}: "${comment.substring(0, 50)}${comment.length > 50 ? '...' : ''}"`,
          type: 'NEW_REVIEW',
          userId: salon.ownerId,
          link: salonId,
        },
      });

      const io = req.app.get('io');
      if (io) {
        io.to(`user_${salon.ownerId}`).emit('new_notification', {
          message: `New ${rating}-star review from ${user.name}`,
          type: 'NEW_REVIEW',
          link: salonId,
        });
      }
    }

    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ message: 'Error creating review.' });
  }
});

/**
 * Update a review
 * PUT /api/reviews/:reviewId
 */
router.put('/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.userId !== req.userId) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        rating: rating ? parseInt(rating) : undefined,
        comment: comment ? comment.trim() : undefined,
      },
      include: { user: { select: { name: true } } },
    });

    // Recalculate salon rating
    const allReviews = await prisma.review.findMany({
      where: { salonId: review.salonId },
      select: { rating: true },
    });
    const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await prisma.salon.update({
      where: { id: review.salonId },
      data: { rating: Math.round(avgRating * 10) / 10 },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ message: 'Error updating review.' });
  }
});

/**
 * Delete a review
 * DELETE /api/reviews/:reviewId
 */
router.delete('/:reviewId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { reviewId } = req.params;

    const review = await prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) return res.status(404).json({ message: 'Review not found' });
    if (review.userId !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    await prisma.review.delete({ where: { id: reviewId } });

    // Recalculate salon rating
    const allReviews = await prisma.review.findMany({
      where: { salonId: review.salonId },
      select: { rating: true },
    });

    if (allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await prisma.salon.update({
        where: { id: review.salonId },
        data: {
          rating: Math.round(avgRating * 10) / 10,
          reviewCount: allReviews.length,
        },
      });
    } else {
      await prisma.salon.update({
        where: { id: review.salonId },
        data: { rating: 0, reviewCount: 0 },
      });
    }

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ message: 'Error deleting review.' });
  }
});

/**
 * Check if user can review a salon (has completed booking)
 * GET /api/reviews/:salonId/can-review
 */
router.get('/:salonId/can-review', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { salonId } = req.params;

    // Check if user already reviewed
    const existingReview = await prisma.review.findFirst({
      where: { userId: req.userId, salonId },
    });

    if (existingReview) {
      return res.json({ canReview: false, reason: 'already_reviewed', existingReview });
    }

    // Check for completed bookings
    const completedBooking = await prisma.appointment.findFirst({
      where: {
        userId: req.userId,
        salonId,
        status: 'COMPLETED',
      },
      include: { service: true },
    });

    res.json({
      canReview: true,
      hasCompletedBooking: !!completedBooking,
      completedBooking: completedBooking ? {
        id: completedBooking.id,
        serviceName: completedBooking.service.name,
        date: completedBooking.date,
      } : null,
    });
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    res.status(500).json({ message: 'Error checking review eligibility.' });
  }
});

export default router;
