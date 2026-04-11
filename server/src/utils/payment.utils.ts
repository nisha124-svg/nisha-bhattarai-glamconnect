export const normalizeCardNumber = (cardNumber?: string): string => String(cardNumber || '').replace(/\D/g, '');

export const DEMO_CARD_BEHAVIORS: Record<string, 'succeeded' | 'declined' | 'requires_action'> = {
  '4242424242424242': 'succeeded',
  '4000000000000002': 'declined',
  '4000002500003155': 'requires_action',
  '5555555555554444': 'succeeded',
  '378282246310005': 'succeeded',
};

type DemoPaymentIntentResult = {
  clientSecret?: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'requires_action' | 'requires_payment_method';
  requiresAction?: boolean;
  message?: string;
  error?: string;
  demo: true;
};

export const createDemoPaymentIntent = (
  rawCardNumber: string,
  amount: number,
  currency = 'npr',
  now = Date.now()
): DemoPaymentIntentResult | null => {
  const demoBehavior = DEMO_CARD_BEHAVIORS[rawCardNumber];
  if (!demoBehavior) {
    return null;
  }

  const paymentIntentId = `mock_pi_${now}`;

  if (demoBehavior === 'declined') {
    return {
      paymentIntentId,
      amount,
      currency,
      status: 'requires_payment_method',
      message: 'Your card was declined. Please try a different card.',
      error: 'card_declined',
      demo: true,
    };
  }

  if (demoBehavior === 'requires_action') {
    return {
      clientSecret: `mock_client_secret_${now}`,
      paymentIntentId,
      amount,
      currency,
      status: 'requires_action',
      requiresAction: true,
      message: 'This card requires additional authentication. Please complete 3D Secure or use another payment method.',
      demo: true,
    };
  }

  return {
    clientSecret: `mock_client_secret_${now}`,
    paymentIntentId,
    amount,
    currency,
    status: 'succeeded',
    demo: true,
  };
};
