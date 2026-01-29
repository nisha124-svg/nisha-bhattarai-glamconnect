import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Membership plans configuration
const MEMBERSHIP_PLANS = {
  BASIC: {
    name: 'Basic',
    price: 0,
    priceMonthly: 0,
    features: [
      'Access to all salons',
      'Standard booking',
      'Email notifications',
      'Basic loyalty points (1x)'
    ],
    benefits: {
      discountPercent: 0,
      priorityBooking: false,
      freeRescheduling: false,
      loyaltyMultiplier: 1,
      exclusiveOffers: false,
      dedicatedSupport: false
    }
  },
  SILVER: {
    name: 'Silver',
    price: 999, // NPR per year
    priceMonthly: 99,
    features: [
      'All Basic features',
      '5% discount on all services',
      'Priority booking slots',
      'Free appointment rescheduling',
      '1.25x loyalty points'
    ],
    benefits: {
      discountPercent: 5,
      priorityBooking: true,
      freeRescheduling: true,
      loyaltyMultiplier: 1.25,
      exclusiveOffers: false,
      dedicatedSupport: false
    }
  },
  GOLD: {
    name: 'Gold',
    price: 1999,
    priceMonthly: 199,
    features: [
      'All Silver features',
      '10% discount on all services',
      'Exclusive member-only offers',
      '1.5x loyalty points',
      'SMS reminders'
    ],
    benefits: {
      discountPercent: 10,
      priorityBooking: true,
      freeRescheduling: true,
      loyaltyMultiplier: 1.5,
      exclusiveOffers: true,
      dedicatedSupport: false
    }
  },
  PLATINUM: {
    name: 'Platinum',
    price: 3999,
    priceMonthly: 399,
    features: [
      'All Gold features',
      '15% discount on all services',
      'Dedicated customer support',
      '2x loyalty points',
      'VIP appointment slots',
      'Free cancellation anytime',
      'Birthday special rewards'
    ],
    benefits: {
      discountPercent: 15,
      priorityBooking: true,
      freeRescheduling: true,
      loyaltyMultiplier: 2,
      exclusiveOffers: true,
      dedicatedSupport: true
    }
  }
};

/**
 * Get all membership plans
 * GET /api/membership/plans
 */
router.get('/plans', (req, res) => {
  const plans = Object.entries(MEMBERSHIP_PLANS).map(([key, plan]) => ({
    id: key,
    ...plan
  }));

  res.json(plans);
});

/**
 * Get current user's membership status
 * GET /api/membership/status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        membershipTier: true,
        loyaltyPoints: true,
        totalSpent: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentPlan = MEMBERSHIP_PLANS[user.membershipTier as keyof typeof MEMBERSHIP_PLANS] || MEMBERSHIP_PLANS.BASIC;

    res.json({
      currentTier: user.membershipTier,
      plan: currentPlan,
      loyaltyPoints: user.loyaltyPoints,
      totalSpent: user.totalSpent,
      memberSince: user.createdAt
    });
  } catch (error) {
    console.error('Error fetching membership status:', error);
    res.status(500).json({ message: 'Error fetching membership status' });
  }
});

/**
 * Upgrade membership (simulated - would integrate with payment)
 * POST /api/membership/upgrade
 */
router.post('/upgrade', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { targetTier, paymentMethod } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!targetTier || !MEMBERSHIP_PLANS[targetTier as keyof typeof MEMBERSHIP_PLANS]) {
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { membershipTier: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentTierIndex = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'].indexOf(user.membershipTier);
    const targetTierIndex = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'].indexOf(targetTier);

    if (targetTierIndex <= currentTierIndex) {
      return res.status(400).json({ message: 'Can only upgrade to a higher tier' });
    }

    const targetPlan = MEMBERSHIP_PLANS[targetTier as keyof typeof MEMBERSHIP_PLANS];

    // In a real implementation, this would process payment via Stripe
    // For demo purposes, we'll just update the tier
    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { membershipTier: targetTier }
    });

    // Award upgrade bonus points
    const bonusPoints = 100 * (targetTierIndex - currentTierIndex);
    await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          userId: req.userId,
          points: bonusPoints,
          type: 'BONUS',
          description: `Membership upgrade bonus: ${user.membershipTier} → ${targetTier}`
        }
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: { loyaltyPoints: { increment: bonusPoints } }
      })
    ]);

    res.json({
      success: true,
      message: `Successfully upgraded to ${targetPlan.name} membership!`,
      newTier: targetTier,
      bonusPointsAwarded: bonusPoints,
      benefits: targetPlan.benefits
    });
  } catch (error) {
    console.error('Error upgrading membership:', error);
    res.status(500).json({ message: 'Error upgrading membership' });
  }
});

/**
 * Downgrade membership
 * POST /api/membership/downgrade
 */
router.post('/downgrade', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { targetTier } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!targetTier || !MEMBERSHIP_PLANS[targetTier as keyof typeof MEMBERSHIP_PLANS]) {
      return res.status(400).json({ message: 'Invalid membership tier' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { membershipTier: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const currentTierIndex = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'].indexOf(user.membershipTier);
    const targetTierIndex = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'].indexOf(targetTier);

    if (targetTierIndex >= currentTierIndex) {
      return res.status(400).json({ message: 'Can only downgrade to a lower tier' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId },
      data: { membershipTier: targetTier }
    });

    res.json({
      success: true,
      message: `Membership changed to ${MEMBERSHIP_PLANS[targetTier as keyof typeof MEMBERSHIP_PLANS].name}`,
      newTier: targetTier
    });
  } catch (error) {
    console.error('Error downgrading membership:', error);
    res.status(500).json({ message: 'Error downgrading membership' });
  }
});

/**
 * Get membership benefits for applying discounts
 * GET /api/membership/benefits
 */
router.get('/benefits', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { membershipTier: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = MEMBERSHIP_PLANS[user.membershipTier as keyof typeof MEMBERSHIP_PLANS] || MEMBERSHIP_PLANS.BASIC;

    res.json({
      tier: user.membershipTier,
      benefits: plan.benefits
    });
  } catch (error) {
    console.error('Error fetching membership benefits:', error);
    res.status(500).json({ message: 'Error fetching membership benefits' });
  }
});

/**
 * Calculate price with membership discount
 * POST /api/membership/calculate-discount
 */
router.post('/calculate-discount', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { originalPrice } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!originalPrice || originalPrice <= 0) {
      return res.status(400).json({ message: 'Valid price is required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { membershipTier: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const plan = MEMBERSHIP_PLANS[user.membershipTier as keyof typeof MEMBERSHIP_PLANS] || MEMBERSHIP_PLANS.BASIC;
    const discountAmount = Math.round(originalPrice * (plan.benefits.discountPercent / 100));
    const finalPrice = originalPrice - discountAmount;

    res.json({
      originalPrice,
      discountPercent: plan.benefits.discountPercent,
      discountAmount,
      finalPrice,
      membershipTier: user.membershipTier
    });
  } catch (error) {
    console.error('Error calculating discount:', error);
    res.status(500).json({ message: 'Error calculating discount' });
  }
});

export default router;
