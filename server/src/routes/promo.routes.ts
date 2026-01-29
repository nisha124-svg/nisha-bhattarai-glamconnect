import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

/**
 * Get all promo codes for a salon
 * GET /api/promos
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

    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return res.status(404).json({ message: 'No salon found' });
    }

    const promoCodes = await prisma.promoCode.findMany({
      where: { salonId: salon.id },
      orderBy: { createdAt: 'desc' }
    });

    res.json(promoCodes);
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    res.status(500).json({ message: 'Error fetching promo codes. Please try again.' });
  }
});

/**
 * Create a new promo code
 * POST /api/promos
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

    const salon = await prisma.salon.findFirst();
    if (!salon) {
      return res.status(404).json({ message: 'No salon found' });
    }

    const { 
      code, 
      description, 
      discountType, 
      discountValue, 
      minPurchase, 
      maxUses, 
      validFrom, 
      validUntil 
    } = req.body;

    if (!code || !discountValue) {
      return res.status(400).json({ message: 'Code and discount value are required' });
    }

    // Check if code already exists
    const existingCode = await prisma.promoCode.findUnique({ where: { code: code.toUpperCase() } });
    if (existingCode) {
      return res.status(400).json({ message: 'Promo code already exists' });
    }

    const promoCode = await prisma.promoCode.create({
      data: {
        salonId: salon.id,
        code: code.toUpperCase(),
        description,
        discountType: discountType || 'PERCENTAGE',
        discountValue: parseFloat(discountValue),
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : new Date(),
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive: true
      }
    });

    res.status(201).json(promoCode);
  } catch (error) {
    console.error('Error creating promo code:', error);
    res.status(500).json({ message: 'Error creating promo code. Please try again.' });
  }
});

/**
 * Update a promo code
 * PUT /api/promos/:id
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
    const { 
      description, 
      discountType, 
      discountValue, 
      minPurchase, 
      maxUses, 
      validFrom, 
      validUntil,
      isActive 
    } = req.body;

    const promoCode = await prisma.promoCode.update({
      where: { id },
      data: {
        description,
        discountType,
        discountValue: discountValue ? parseFloat(discountValue) : undefined,
        minPurchase: minPurchase ? parseFloat(minPurchase) : null,
        maxUses: maxUses ? parseInt(maxUses) : null,
        validFrom: validFrom ? new Date(validFrom) : undefined,
        validUntil: validUntil ? new Date(validUntil) : null,
        isActive
      }
    });

    res.json(promoCode);
  } catch (error) {
    console.error('Error updating promo code:', error);
    res.status(500).json({ message: 'Error updating promo code. Please try again.' });
  }
});

/**
 * Delete a promo code
 * DELETE /api/promos/:id
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

    await prisma.promoCode.delete({ where: { id } });

    res.json({ message: 'Promo code deleted successfully' });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    res.status(500).json({ message: 'Error deleting promo code. Please try again.' });
  }
});

/**
 * Validate a promo code (for customers)
 * POST /api/promos/validate
 */
router.post('/validate', async (req, res: Response) => {
  try {
    const { code, salonId, purchaseAmount } = req.body;

    if (!code || !salonId) {
      return res.status(400).json({ message: 'Code and salon ID are required' });
    }

    const promoCode = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() }
    });

    if (!promoCode) {
      return res.status(404).json({ message: 'Invalid promo code' });
    }

    if (promoCode.salonId !== salonId) {
      return res.status(400).json({ message: 'This code is not valid for this salon' });
    }

    if (!promoCode.isActive) {
      return res.status(400).json({ message: 'This promo code is no longer active' });
    }

    const now = new Date();
    if (promoCode.validFrom > now) {
      return res.status(400).json({ message: 'This promo code is not yet valid' });
    }

    if (promoCode.validUntil && promoCode.validUntil < now) {
      return res.status(400).json({ message: 'This promo code has expired' });
    }

    if (promoCode.maxUses && promoCode.usedCount >= promoCode.maxUses) {
      return res.status(400).json({ message: 'This promo code has reached its usage limit' });
    }

    if (promoCode.minPurchase && purchaseAmount < promoCode.minPurchase) {
      return res.status(400).json({ 
        message: `Minimum purchase of $${promoCode.minPurchase} required` 
      });
    }

    // Calculate discount
    let discountAmount = 0;
    if (promoCode.discountType === 'PERCENTAGE') {
      discountAmount = (purchaseAmount * promoCode.discountValue) / 100;
    } else {
      discountAmount = Math.min(promoCode.discountValue, purchaseAmount);
    }

    res.json({
      valid: true,
      code: promoCode.code,
      discountType: promoCode.discountType,
      discountValue: promoCode.discountValue,
      discountAmount,
      finalAmount: purchaseAmount - discountAmount
    });
  } catch (error) {
    console.error('Error validating promo code:', error);
    res.status(500).json({ message: 'Error validating promo code. Please try again.' });
  }
});

export default router;
