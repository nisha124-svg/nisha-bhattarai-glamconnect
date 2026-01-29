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

/**
 * Advanced search with filters
 * POST /api/salons/filter
 */
router.post('/filter', async (req: Request, res: Response) => {
  try {
    const { 
      query, 
      serviceTypes, 
      minRating, 
      priceMin, 
      priceMax,
      sortBy = 'rating',
      sortOrder = 'desc'
    } = req.body;

    const whereConditions: any = {};

    // Text search
    if (query && query.length >= 2) {
      whereConditions.OR = [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { address: { contains: query, mode: 'insensitive' } },
        { tags: { hasSome: [query.toLowerCase()] } }
      ];
    }

    // Rating filter
    if (minRating) {
      whereConditions.rating = { gte: minRating };
    }

    // Service type filter
    if (serviceTypes && serviceTypes.length > 0) {
      whereConditions.services = {
        some: {
          OR: serviceTypes.map((type: string) => ({
            OR: [
              { category: { equals: type, mode: 'insensitive' } },
              { name: { contains: type, mode: 'insensitive' } }
            ]
          }))
        }
      };
    }

    let salons = await prisma.salon.findMany({
      where: whereConditions,
      include: {
        services: true,
        stylists: true,
        reviews: {
          include: { user: { select: { name: true } } },
          take: 5,
          orderBy: { date: 'desc' }
        }
      }
    });

    // Price filter (done in JS since it requires aggregation)
    if (priceMin !== undefined || priceMax !== undefined) {
      salons = salons.filter(salon => {
        if (salon.services.length === 0) return false;
        const avgPrice = salon.services.reduce((sum, s) => sum + s.price, 0) / salon.services.length;
        if (priceMin !== undefined && avgPrice < priceMin) return false;
        if (priceMax !== undefined && avgPrice > priceMax) return false;
        return true;
      });
    }

    // Sorting
    salons.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'rating':
          comparison = a.rating - b.rating;
          break;
        case 'price':
          const avgA = a.services.length > 0 ? a.services.reduce((s, svc) => s + svc.price, 0) / a.services.length : 0;
          const avgB = b.services.length > 0 ? b.services.reduce((s, svc) => s + svc.price, 0) / b.services.length : 0;
          comparison = avgA - avgB;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'reviewCount':
          comparison = a.reviewCount - b.reviewCount;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    res.json(salons);
  } catch (error) {
    console.error('Error filtering salons:', error);
    res.status(500).json({ message: 'Error filtering salons. Please try again.' });
  }
});

/**
 * Get featured salons (top rated)
 * GET /api/salons/featured
 */
router.get('/featured/list', async (req: Request, res: Response) => {
  try {
    const salons = await prisma.salon.findMany({
      where: {
        rating: { gte: 4.5 }
      },
      include: {
        services: true,
        stylists: true
      },
      orderBy: { rating: 'desc' },
      take: 6
    });

    res.json(salons);
  } catch (error) {
    console.error('Error fetching featured salons:', error);
    res.status(500).json({ message: 'Error fetching featured salons.' });
  }
});

/**
 * Get salons by service category
 * GET /api/salons/category/:category
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const { category } = req.params;

    const salons = await prisma.salon.findMany({
      where: {
        services: {
          some: {
            category: { equals: category, mode: 'insensitive' }
          }
        }
      },
      include: {
        services: {
          where: { category: { equals: category, mode: 'insensitive' } }
        },
        stylists: true,
        reviews: { take: 3 }
      },
      orderBy: { rating: 'desc' }
    });

    res.json(salons);
  } catch (error) {
    console.error('Error fetching salons by category:', error);
    res.status(500).json({ message: 'Error fetching salons.' });
  }
});

/**
 * Find nearby salons based on user's location
 * GET /api/salons/nearby
 * Query params: lat, lng, radius (in km), limit
 */
router.get('/nearby', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius = 10, limit = 20 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const userLat = parseFloat(lat as string);
    const userLng = parseFloat(lng as string);
    const searchRadius = parseFloat(radius as string);
    const resultLimit = parseInt(limit as string);

    if (isNaN(userLat) || isNaN(userLng)) {
      return res.status(400).json({ message: 'Invalid coordinates' });
    }

    // Get all salons with coordinates
    const salons = await prisma.salon.findMany({
      where: {
        latitude: { not: null },
        longitude: { not: null }
      },
      include: {
        services: true,
        stylists: true,
        reviews: { take: 3 }
      }
    });

    // Calculate distance and filter by radius
    const nearbySalons = salons
      .map(salon => ({
        ...salon,
        distance: calculateDistance(userLat, userLng, salon.latitude!, salon.longitude!)
      }))
      .filter(salon => salon.distance <= searchRadius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, resultLimit);

    res.json({
      userLocation: { lat: userLat, lng: userLng },
      radius: searchRadius,
      count: nearbySalons.length,
      salons: nearbySalons
    });
  } catch (error) {
    console.error('Error finding nearby salons:', error);
    res.status(500).json({ message: 'Error finding nearby salons.' });
  }
});

/**
 * Get salons by city
 * GET /api/salons/city/:cityName
 */
router.get('/city/:cityName', async (req: Request, res: Response) => {
  try {
    const { cityName } = req.params;

    const salons = await prisma.salon.findMany({
      where: {
        OR: [
          { city: { equals: cityName, mode: 'insensitive' } },
          { address: { contains: cityName, mode: 'insensitive' } }
        ]
      },
      include: {
        services: true,
        stylists: true,
        reviews: { take: 3 }
      },
      orderBy: { rating: 'desc' }
    });

    res.json(salons);
  } catch (error) {
    console.error('Error fetching salons by city:', error);
    res.status(500).json({ message: 'Error fetching salons.' });
  }
});

/**
 * Update salon location (for salon owners)
 * PUT /api/salons/:id/location
 */
router.put('/:id/location', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { latitude, longitude, city } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: 'Latitude and longitude are required' });
    }

    const updatedSalon = await prisma.salon.update({
      where: { id },
      data: {
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        city: city || undefined
      }
    });

    res.json({
      message: 'Location updated successfully',
      salon: updatedSalon
    });
  } catch (error) {
    console.error('Error updating salon location:', error);
    res.status(500).json({ message: 'Error updating salon location.' });
  }
});

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return Math.round(distance * 100) / 100; // Round to 2 decimal places
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

export default router;
