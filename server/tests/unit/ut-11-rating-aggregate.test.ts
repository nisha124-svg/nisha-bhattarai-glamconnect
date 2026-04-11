import { describe, expect, it } from 'vitest';
import { calculateAverageRatingToOneDecimal } from '../../src/utils/business-rules.utils';

describe('UT-11 Rating aggregate calculation', () => {
  it('returns correct average to 1 decimal', () => {
    expect(calculateAverageRatingToOneDecimal([5, 4, 4])).toBe(4.3);
  });
});