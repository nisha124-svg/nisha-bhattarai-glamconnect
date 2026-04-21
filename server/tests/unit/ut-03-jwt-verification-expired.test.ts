import jwt from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';

describe('UT-03 JWT verification with expired token', () => {
  it('throws JsonWebTokenError', () => {
    const expiredToken = jwt.sign({ userId: 'user_123', role: 'USER' }, 'unit-test-secret', { expiresIn: -1 });

    expect(() => jwt.verify(expiredToken, 'unit-test-secret')).toThrowError();
  });
});
