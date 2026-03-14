import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import prisma from '../config/database';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';

const router = Router();

// Initialize Stripe
const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
let stripe: Stripe | null = null;

if (stripeSecretKey && stripeSecretKey.length > 10) {
  stripe = new Stripe(stripeSecretKey, {
    apiVersion: '2024-12-18.acacia' as any,
  });
  console.log('Stripe initialized successfully');
}

/**
 * Create a payment intent for an appointment
 * POST /api/payments/create-intent
 */
router.post('/create-intent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { appointmentId, amount, currency = 'npr' } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }

    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      select: { email: true, name: true }
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If Stripe is not configured, return mock response for demo
    if (!stripe) {
      console.log('Stripe not configured. Returning mock payment intent.');
      return res.json({
        clientSecret: 'mock_client_secret_' + Date.now(),
        paymentIntentId: 'mock_pi_' + Date.now(),
        amount,
        currency,
        status: 'requires_payment_method',
        demo: true
      });
    }

    // Convert to smallest unit for Stripe
    // Note: Stripe test mode doesn't support NPR, so we use USD for processing
    const stripeCurrency = 'usd';
    const amountInSmallestUnit = Math.round(amount * 100);

    // Create and auto-confirm payment intent with test card (for FYP demo)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: stripeCurrency,
      metadata: {
        appointmentId: appointmentId || '',
        userId: req.userId,
        userEmail: user.email
      },
      receipt_email: user.email,
      description: `GlamConnect Appointment Payment${appointmentId ? ` - ${appointmentId}` : ''}`,
      payment_method: 'pm_card_visa', // Stripe test card for demo
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      },
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      status: paymentIntent.status
    });
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ 
      message: 'Error creating payment. Please try again.',
      error: error.message 
    });
  }
});

/**
 * Confirm payment and update appointment
 * POST /api/payments/confirm
 */
router.post('/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentIntentId, appointmentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ message: 'Payment intent ID is required' });
    }

    // For demo mode without Stripe
    if (!stripe || paymentIntentId.startsWith('mock_')) {
      console.log('Mock payment confirmed:', paymentIntentId);
      
      // Update appointment if provided
      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { 
            status: 'CONFIRMED'
          }
        });
      }

      return res.json({
        success: true,
        paymentId: paymentIntentId,
        status: 'succeeded',
        demo: true
      });
    }

    // Retrieve the payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'requires_capture') {
      // Update appointment if provided
      if (appointmentId) {
        await prisma.appointment.update({
          where: { id: appointmentId },
          data: { 
            status: 'CONFIRMED'
          }
        });
      }

      res.json({
        success: true,
        paymentId: paymentIntent.id,
        status: paymentIntent.status,
        amount: paymentIntent.amount / 100,
        currency: paymentIntent.currency
      });
    } else if (paymentIntent.status === 'requires_payment_method' || paymentIntent.status === 'requires_confirmation') {
      // Try to confirm it server-side (test/demo mode)
      try {
        const confirmed = await stripe.paymentIntents.confirm(paymentIntentId, {
          payment_method: 'pm_card_visa', // Stripe test card
        });
        
        if (appointmentId) {
          await prisma.appointment.update({
            where: { id: appointmentId },
            data: { status: 'CONFIRMED' }
          });
        }

        res.json({
          success: true,
          paymentId: confirmed.id,
          status: confirmed.status,
          amount: confirmed.amount / 100,
          currency: confirmed.currency
        });
      } catch (confirmError: any) {
        console.error('Auto-confirm failed:', confirmError.message);
        res.status(400).json({
          success: false,
          status: paymentIntent.status,
          message: 'Payment requires manual confirmation. Please try Pay at Salon.'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        status: paymentIntent.status,
        message: 'Payment not completed'
      });
    }
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    res.status(500).json({ 
      message: 'Error confirming payment. Please try again.',
      error: error.message 
    });
  }
});

/**
 * Get payment history for user
 * GET /api/payments/history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    // Get completed appointments as payment history
    const appointments = await prisma.appointment.findMany({
      where: {
        userId: req.userId,
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      },
      include: {
        salon: { select: { name: true } },
        service: { select: { name: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 20
    });

    const paymentHistory = appointments.map(apt => ({
      id: apt.id,
      date: apt.createdAt,
      appointmentDate: apt.date,
      amount: apt.price,
      status: apt.status,
      salon: apt.salon.name,
      service: apt.service.name
    }));

    res.json(paymentHistory);
  } catch (error) {
    console.error('Error fetching payment history:', error);
    res.status(500).json({ message: 'Error fetching payment history' });
  }
});

/**
 * Process refund for cancelled appointment
 * POST /api/payments/refund
 */
router.post('/refund', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const { paymentIntentId, appointmentId, reason } = req.body;

    if (!paymentIntentId && !appointmentId) {
      return res.status(400).json({ message: 'Payment intent ID or appointment ID is required' });
    }

    // For demo mode
    if (!stripe || (paymentIntentId && paymentIntentId.startsWith('mock_'))) {
      return res.json({
        success: true,
        refundId: 'mock_refund_' + Date.now(),
        status: 'succeeded',
        demo: true
      });
    }

    // Create refund in Stripe
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      reason: 'requested_by_customer'
    });

    // Update appointment status if provided
    if (appointmentId) {
      await prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' }
      });
    }

    res.json({
      success: true,
      refundId: refund.id,
      status: refund.status,
      amount: refund.amount / 100
    });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    res.status(500).json({ 
      message: 'Error processing refund. Please try again.',
      error: error.message 
    });
  }
});

/**
 * Stripe webhook for payment events
 * POST /api/payments/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret) {
    return res.status(200).json({ received: true, demo: true });
  }

  try {
    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      webhookSecret
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log('Payment succeeded:', paymentIntent.id);
        // Update appointment status in database
        if (paymentIntent.metadata.appointmentId) {
          await prisma.appointment.update({
            where: { id: paymentIntent.metadata.appointmentId },
            data: { status: 'CONFIRMED' }
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as Stripe.PaymentIntent;
        console.log('Payment failed:', failedPayment.id);
        break;

      case 'charge.refunded':
        const refund = event.data.object as Stripe.Charge;
        console.log('Refund processed:', refund.id);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error: any) {
    console.error('Webhook error:', error.message);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

/**
 * Get digital receipt/invoice for an appointment
 * GET /api/payments/receipt/:appointmentId
 */
router.get('/receipt/:appointmentId', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ message: 'User not authenticated' });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id: req.params.appointmentId },
      include: {
        salon: { select: { name: true, address: true, image: true } },
        service: { select: { name: true, duration: true, price: true, category: true } },
        stylist: { select: { name: true, role: true } },
        user: { select: { name: true, email: true, phone: true } },
      }
    });

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Only the booking customer or salon owner can view the receipt
    if (appointment.userId !== req.userId) {
      const salon = await prisma.salon.findUnique({ where: { id: appointment.salonId } });
      if (!salon || salon.ownerId !== req.userId) {
        return res.status(403).json({ message: 'Not authorized to view this receipt' });
      }
    }

    // Build receipt data
    const receipt = {
      receiptNumber: `GC-${appointment.id.slice(0, 8).toUpperCase()}`,
      invoiceDate: appointment.createdAt,
      appointmentDate: appointment.date,
      status: appointment.status,
      customer: {
        name: appointment.user.name,
        email: appointment.user.email,
        phone: appointment.user.phone,
      },
      salon: {
        name: appointment.salon.name,
        address: appointment.salon.address,
      },
      service: {
        name: appointment.service.name,
        category: appointment.service.category,
        duration: appointment.service.duration,
        price: appointment.service.price,
      },
      stylist: {
        name: appointment.stylist.name,
        role: appointment.stylist.role,
      },
      payment: {
        method: (appointment as any).paymentMethod || 'PAY_AT_SALON',
        status: (appointment as any).paymentStatus || 'PENDING',
        paymentIntentId: (appointment as any).paymentIntentId || null,
        subtotal: appointment.service.price,
        loyaltyPointsUsed: (appointment as any).loyaltyPointsUsed || 0,
        loyaltyDiscount: (appointment as any).loyaltyDiscount || 0,
        totalPaid: appointment.price,
      },
    };

    res.json(receipt);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ message: 'Error generating receipt' });
  }
});

export default router;
