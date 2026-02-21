import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get chat messages for a salon conversation
 * GET /api/chat/:salonId
 */
router.get('/:salonId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { limit = '50', before } = req.query;

    const whereClause: any = { salonId };

    // For customers, only show messages involving them
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    // If user is a regular customer, scope to their conversation
    if (user.role === 'USER') {
      whereClause.OR = [
        { senderId: req.userId },
        { senderRole: 'SALON_OWNER' }
      ];
    }

    if (before) {
      whereClause.createdAt = { lt: new Date(before as string) };
    }

    const messages = await prisma.chatMessage.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
    });

    // Return in chronological order
    res.json(messages.reverse());
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({ message: 'Error fetching messages.' });
  }
});

/**
 * Send a chat message
 * POST /api/chat/:salonId
 */
router.post('/:salonId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { salonId } = req.params;
    const { content, recipientId } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ message: 'Message content is required' });
    }

    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Verify salon exists
    const salon = await prisma.salon.findUnique({ where: { id: salonId } });
    if (!salon) return res.status(404).json({ message: 'Salon not found' });

    const message = await prisma.chatMessage.create({
      data: {
        content: content.trim(),
        senderId: req.userId!,
        senderName: user.name,
        senderRole: user.role,
        salonId,
      },
    });

    // Emit real-time socket event to the salon room
    const io = req.app.get('io');
    if (io) {
      io.to(`salon_${salonId}`).emit('new_chat_message', message);
      // Also emit to the user's personal room
      io.to(`user_${req.userId}`).emit('new_chat_message', message);
    }

    // Create notification for the salon owner (if message is from customer)
    if (user.role === 'USER' && salon.ownerId) {
      await prisma.notification.create({
        data: {
          message: `New message from ${user.name}`,
          type: 'CHAT_MESSAGE',
          userId: salon.ownerId,
          link: salonId,
        },
      });
      // Push notification via socket
      if (io) {
        io.to(`user_${salon.ownerId}`).emit('new_notification', {
          message: `New message from ${user.name}`,
          type: 'CHAT_MESSAGE',
          link: salonId,
        });
      }
    }

    // Notify the customer when salon owner replies
    if ((user.role === 'SALON_OWNER' || user.role === 'ADMIN') && recipientId) {
      await prisma.notification.create({
        data: {
          message: `New reply from ${salon.name}`,
          type: 'CHAT_MESSAGE',
          userId: recipientId,
          link: salonId,
        },
      });
      if (io) {
        io.to(`user_${recipientId}`).emit('new_notification', {
          message: `New reply from ${salon.name}`,
          type: 'CHAT_MESSAGE',
          link: salonId,
          salonName: salon.name,
        });
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending chat message:', error);
    res.status(500).json({ message: 'Error sending message.' });
  }
});

/**
 * Get conversation threads for salon owner
 * GET /api/chat/conversations/my-salon
 */
router.get('/conversations/my-salon', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.userId } });
    if (!user || (user.role !== 'SALON_OWNER' && user.role !== 'ADMIN')) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const salon = await prisma.salon.findFirst({ where: { ownerId: req.userId } });
    if (!salon) return res.status(404).json({ message: 'No salon found for this owner' });

    // Get all messages for this salon from customers
    const messages = await prisma.chatMessage.findMany({
      where: { salonId: salon.id, senderRole: 'USER' },
      orderBy: { createdAt: 'desc' },
    });

    // Group by senderId to get unique conversations
    const conversationsMap = new Map<string, {
      customerId: string;
      customerName: string;
      lastMessage: string;
      lastMessageAt: string;
      messageCount: number;
    }>();

    for (const msg of messages) {
      if (!conversationsMap.has(msg.senderId)) {
        conversationsMap.set(msg.senderId, {
          customerId: msg.senderId,
          customerName: msg.senderName,
          lastMessage: msg.content,
          lastMessageAt: msg.createdAt.toISOString(),
          messageCount: 1,
        });
      } else {
        conversationsMap.get(msg.senderId)!.messageCount++;
      }
    }

    const conversations = Array.from(conversationsMap.values());

    res.json({ salonId: salon.id, salonName: salon.name, conversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ message: 'Error fetching conversations.' });
  }
});

export default router;
