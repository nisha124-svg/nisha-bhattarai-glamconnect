import { Router, Request, Response } from 'express';
import prisma from '../config/database';

const router = Router();

/**
 * Get all salons
 * GET /api/salons
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const salons = await prisma.salon.findMany({
      include: {
        services: true,
        stylists: true,
        reviews: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { date: 'desc' },
          take: 5 // Limit to recent 5 reviews
        }
      },
      orderBy: { rating: 'desc' }
    });

    res.json(salons);
  } catch (error) {
    console.error('Error fetching salons:', error);
    res.status(500).json({ message: 'Error fetching salons. Please try again.' });
  }
});

/**
 * Get salon by ID
 * GET /api/salons/:id
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const salon = await prisma.salon.findUnique({
      where: { id },
      include: {
        services: true,
        stylists: true,
        reviews: {
          include: {
            user: { select: { name: true } }
          },
          orderBy: { date: 'desc' }
        }
      }
    });

    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }

    res.json(salon);
  } catch (error) {
    console.error('Error fetching salon:', error);
    res.status(500).json({ message: 'Error fetching salon. Please try again.' });
  }
});

/**
 * Search salons by name or tags
 * GET /api/salons/search?q=keyword
 */
router.get('/search/query', async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ message: 'Search query is required' });
    }

    const searchTerm = q.toLowerCase();

    const salons = await prisma.salon.findMany({
      where: {
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { tags: { hasSome: [searchTerm] } }
        ]
      },
      include: {
        services: true,
        stylists: true,
        reviews: {
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    res.json(salons);
  } catch (error) {
    console.error('Error searching salons:', error);
    res.status(500).json({ message: 'Error searching salons. Please try again.' });
  }
});

export default router;
