import { describe, expect, it } from 'vitest';
import { isReviewEligibleFromCompletedBooking } from '../../src/utils/business-rules.utils';

describe('UT-09 Review eligibility - completed booking exists', () => {
  it('returns eligible=true', () => {
    expect(isReviewEligibleFromCompletedBooking({ id: 'apt_1', status: 'COMPLETED' })).toBe(true);
  });
});