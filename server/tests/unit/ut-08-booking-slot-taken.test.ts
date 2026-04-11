import { describe, expect, it } from 'vitest';
import { isBookingSlotAvailable } from '../../src/utils/business-rules.utils';

describe('UT-08 Booking conflict detection - slot taken', () => {
  it('returns slot as unavailable', () => {
    expect(isBookingSlotAvailable({ id: 'apt_1', status: 'CONFIRMED' })).toBe(false);
  });
});