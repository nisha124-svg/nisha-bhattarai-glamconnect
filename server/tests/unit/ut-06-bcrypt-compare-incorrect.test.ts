import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

describe('UT-06 bcrypt.compare incorrect password', () => {
  it('returns false', async () => {
    const hash = await bcrypt.hash('Password@123', 12);
    const result = await bcrypt.compare('WrongPassword', hash);

    expect(result).toBe(false);
  });
});