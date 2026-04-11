import { describe, expect, it } from 'vitest';
import { isReviewEligibleFromCompletedBooking } from '../../src/utils/business-rules.utils';

describe('UT-10 Review eligibility - no completed booking', () => {
  it('returns eligible=false', () => {
    expect(isReviewEligibleFromCompletedBooking(null)).toBe(false);
  });
});