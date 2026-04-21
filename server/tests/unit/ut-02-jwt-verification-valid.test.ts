import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

describe('UT-02 JWT verification with valid token', () => {
  it('returns decoded payload', () => {
    const payload = { userId: 'user_123', role: 'USER' };
    const token = jwt.sign(payload, 'unit-test-secret', { expiresIn: '1h' });
    const decoded = jwt.verify(token, 'unit-test-secret') as typeof payload;

    expect(decoded.userId).toBe(payload.userId);
    expect(decoded.role).toBe(payload.role);
  });
});
