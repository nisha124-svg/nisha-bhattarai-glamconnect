import bcrypt from 'bcryptjs';
import { describe, expect, it } from 'vitest';

describe('UT-05 bcrypt.compare correct password', () => {
  it('returns true', async () => {
    const hash = await bcrypt.hash('Password@123', 12);
    const result = await bcrypt.compare('Password@123', hash);

    expect(result).toBe(true);
  });
});
