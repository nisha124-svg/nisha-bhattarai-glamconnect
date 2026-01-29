import { Router, Response } from 'express';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Loyalty program configuration
const LOYALTY_CONFIG = {
  pointsPerNPR: 1, // 1 point per NPR 100 spent
  pointsMultiplier: 100, // Spend this many NPR to get 1 point
  redemptionRate: 10, // 10 points = NPR 1 discount
  tiers: {
    BASIC: { minPoints: 0, discount: 0, bonus: 1 },
    SILVER: { minPoints: 500, discount: 5, bonus: 1.25 },
    GOLD: { minPoints: 2000, discount: 10, bonus: 1.5 },
    PLATINUM: { minPoints: 5000, discount: 15, bonus: 2 }
  },
  welcomeBonus: 50,
  referralBonus: 100,
  birthdayBonus: 200
};

/**
 * Get user's loyalty status
 * GET /api/loyalty/status
 */
router.get('/status', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: {
        loyaltyPoints: true,
        totalSpent: true,
        membershipTier: true,
        name: true
      }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tier = LOYALTY_CONFIG.tiers[user.membershipTier as keyof typeof LOYALTY_CONFIG.tiers] || LOYALTY_CONFIG.tiers.BASIC;
    const nextTier = getNextTier(user.membershipTier);
    const pointsToNextTier = nextTier ? LOYALTY_CONFIG.tiers[nextTier as keyof typeof LOYALTY_CONFIG.tiers].minPoints - user.loyaltyPoints : 0;

    res.json({
      points: user.loyaltyPoints,
      totalSpent: user.totalSpent,
      tier: user.membershipTier,
      tierBenefits: {
        discountPercent: tier.discount,
        pointsMultiplier: tier.bonus
      },
      nextTier: nextTier,
      pointsToNextTier: pointsToNextTier > 0 ? pointsToNextTier : 0,
      redemptionValue: Math.floor(user.loyaltyPoints / LOYALTY_CONFIG.redemptionRate)
    });
  } catch (error) {
    console.error('Error fetching loyalty status:', error);
    res.status(500).json({ message: 'Error fetching loyalty status' });
  }
});

/**
 * Get loyalty transaction history
 * GET /api/loyalty/history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const transactions = await prisma.loyaltyTransaction.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching loyalty history:', error);
    res.status(500).json({ message: 'Error fetching loyalty history' });
  }
});

/**
 * Earn points from a purchase
 * POST /api/loyalty/earn
 */
router.post('/earn', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { amount, appointmentId } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    // Get user's current tier for bonus multiplier
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { membershipTier: true, loyaltyPoints: true, totalSpent: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const tier = LOYALTY_CONFIG.tiers[user.membershipTier as keyof typeof LOYALTY_CONFIG.tiers] || LOYALTY_CONFIG.tiers.BASIC;
    
    // Calculate points earned (with tier bonus)
    const basePoints = Math.floor(amount / LOYALTY_CONFIG.pointsMultiplier);
    const bonusPoints = Math.floor(basePoints * (tier.bonus - 1));
    const totalPoints = basePoints + bonusPoints;

    // Create transaction and update user
    const [transaction, updatedUser] = await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          userId: req.userId,
          points: totalPoints,
          type: 'EARNED',
          description: `Earned from NPR ${amount} purchase`,
          appointmentId
        }
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: {
          loyaltyPoints: { increment: totalPoints },
          totalSpent: { increment: amount }
        }
      })
    ]);

    // Check and update tier
    const newTier = calculateTier(updatedUser.loyaltyPoints);
    if (newTier !== user.membershipTier) {
      await prisma.user.update({
        where: { id: req.userId },
        data: { membershipTier: newTier }
      });
    }

    res.json({
      pointsEarned: totalPoints,
      basePoints,
      bonusPoints,
      newBalance: updatedUser.loyaltyPoints,
      tier: newTier
    });
  } catch (error) {
    console.error('Error earning points:', error);
    res.status(500).json({ message: 'Error earning points' });
  }
});

/**
 * Redeem points for discount
 * POST /api/loyalty/redeem
 */
router.post('/redeem', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { points, appointmentId } = req.body;

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Valid points amount is required' });
    }

    // Get user's current points
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { loyaltyPoints: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.loyaltyPoints < points) {
      return res.status(400).json({ 
        message: 'Insufficient points',
        available: user.loyaltyPoints,
        required: points
      });
    }

    // Calculate discount value
    const discountValue = Math.floor(points / LOYALTY_CONFIG.redemptionRate);

    // Create transaction and update user
    const [transaction, updatedUser] = await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          userId: req.userId,
          points: -points,
          type: 'REDEEMED',
          description: `Redeemed for NPR ${discountValue} discount`,
          appointmentId
        }
      }),
      prisma.user.update({
        where: { id: req.userId },
        data: {
          loyaltyPoints: { decrement: points }
        }
      })
    ]);

    res.json({
      pointsRedeemed: points,
      discountValue,
      newBalance: updatedUser.loyaltyPoints
    });
  } catch (error) {
    console.error('Error redeeming points:', error);
    res.status(500).json({ message: 'Error redeeming points' });
  }
});

/**
 * Award bonus points (admin/system use)
 * POST /api/loyalty/bonus
 */
router.post('/bonus', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { userId, points, reason, type = 'BONUS' } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ message: 'Valid points amount is required' });
    }

    const targetUserId = userId || req.userId;

    // Create transaction and update user
    const [transaction, updatedUser] = await prisma.$transaction([
      prisma.loyaltyTransaction.create({
        data: {
          userId: targetUserId,
          points,
          type: type as any,
          description: reason || 'Bonus points awarded'
        }
      }),
      prisma.user.update({
        where: { id: targetUserId },
        data: {
          loyaltyPoints: { increment: points }
        }
      })
    ]);

    // Check and update tier
    const newTier = calculateTier(updatedUser.loyaltyPoints);
    await prisma.user.update({
      where: { id: targetUserId },
      data: { membershipTier: newTier }
    });

    res.json({
      pointsAwarded: points,
      reason,
      newBalance: updatedUser.loyaltyPoints,
      tier: newTier
    });
  } catch (error) {
    console.error('Error awarding bonus points:', error);
    res.status(500).json({ message: 'Error awarding bonus points' });
  }
});

/**
 * Get loyalty program info/rules
 * GET /api/loyalty/info
 */
router.get('/info', (req, res) => {
  res.json({
    programName: 'GlamConnect Rewards',
    pointsPerNPR: LOYALTY_CONFIG.pointsPerNPR,
    pointsMultiplier: LOYALTY_CONFIG.pointsMultiplier,
    redemptionRate: LOYALTY_CONFIG.redemptionRate,
    tiers: Object.entries(LOYALTY_CONFIG.tiers).map(([name, config]) => ({
      name,
      minPoints: config.minPoints,
      discountPercent: config.discount,
      pointsMultiplier: config.bonus
    })),
    bonuses: {
      welcome: LOYALTY_CONFIG.welcomeBonus,
      referral: LOYALTY_CONFIG.referralBonus,
      birthday: LOYALTY_CONFIG.birthdayBonus
    }
  });
});

// Helper functions
function calculateTier(points: number): string {
  if (points >= LOYALTY_CONFIG.tiers.PLATINUM.minPoints) return 'PLATINUM';
  if (points >= LOYALTY_CONFIG.tiers.GOLD.minPoints) return 'GOLD';
  if (points >= LOYALTY_CONFIG.tiers.SILVER.minPoints) return 'SILVER';
  return 'BASIC';
}

function getNextTier(currentTier: string): string | null {
  const tierOrder = ['BASIC', 'SILVER', 'GOLD', 'PLATINUM'];
  const currentIndex = tierOrder.indexOf(currentTier);
  return currentIndex < tierOrder.length - 1 ? tierOrder[currentIndex + 1] : null;
}

export default router;
