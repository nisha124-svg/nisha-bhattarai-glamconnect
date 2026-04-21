import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

describe('UT-01 JWT generation with valid payload', () => {
  it('returns signed token string', () => {
    const token = jwt.sign({ userId: 'user_123', role: 'USER' }, 'unit-test-secret', { expiresIn: '1h' });

    expect(typeof token).toBe('string');
    expect(token.length).toBeGreaterThan(20);
  });
});
2