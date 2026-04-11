import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

describe('UT-04 bcrypt hash of password', () => {
  it('returns 60-char hash string', async () => {
    const hash = await bcrypt.hash('Password@123', 12);

    expect(typeof hash).toBe('string');
    expect(hash).toHaveLength(60);
  });
});