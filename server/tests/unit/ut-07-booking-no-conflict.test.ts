import { describe, expect, it } from 'vitest';
import { isBookingSlotAvailable } from '../../src/utils/business-rules.utils';

describe('UT-07 Booking conflict detection - no conflict', () => {
  it('returns slot as available', () => {
    expect(isBookingSlotAvailable(null)).toBe(true);
  });
});