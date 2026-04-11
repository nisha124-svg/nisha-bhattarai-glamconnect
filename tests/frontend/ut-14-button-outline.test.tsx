import React from 'react';
import { describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Button } from '../../components/Button';

describe('UT-14 Frontend Button outline variant', () => {
  it('renders outline variant and respects disabled state', () => {
    render(
      <Button variant="outline" disabled>
        Contact Salon
      </Button>
    );

    const button = screen.getByRole('button', { name: 'Contact Salon' }) as HTMLButtonElement;

    expect(button.className).toContain('border-2');
    expect(button.className).toContain('text-pink-600');
    expect(button.disabled).toBe(true);
    cleanup();
  });
});