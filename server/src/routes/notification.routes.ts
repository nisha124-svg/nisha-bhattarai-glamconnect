import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get all notifications for the current user
 * GET /api/notifications
 */
router.get('/', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { userId: req.userId, read: false },
    });

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications.' });
  }
});

/**
 * Mark a notification as read
 * PATCH /api/notifications/:id/read
 */
router.patch('/:id/read', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const updated = await prisma.notification.update({
      where: { id: req.params.id },
      data: { read: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error updating notification.' });
  }
});

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
router.patch('/read-all', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.userId, read: false },
      data: { read: true },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error updating notifications.' });
  }
});

/**
 * Delete a notification
 * DELETE /api/notifications/:id
 */
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const notification = await prisma.notification.findUnique({
      where: { id: req.params.id },
    });

    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    if (notification.userId !== req.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({ message: 'Error deleting notification.' });
  }
});

export default router;
