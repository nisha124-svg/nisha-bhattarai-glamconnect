import { describe, expect, it } from 'vitest';
import { createDemoPaymentIntent } from '../../src/utils/payment.utils';

describe('UT-12 Stripe payment intent creation', () => {
  it('returns payment intent with client_secret', () => {
    const result = createDemoPaymentIntent('4242424242424242', 1500, 'npr', 1700000000000);

    expect(result).not.toBeNull();
    expect(result?.paymentIntentId).toContain('mock_pi_');
    expect(result?.clientSecret).toContain('mock_client_secret_');
    expect(result?.status).toBe('succeeded');
  });
});