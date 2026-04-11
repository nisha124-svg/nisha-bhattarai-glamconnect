import React from 'react';
import { describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Button } from '../../components/Button';

describe('UT-13 Frontend Button primary variant', () => {
  it('renders the default primary button', () => {
    render(<Button>Book Now</Button>);

    const button = screen.getByRole('button', { name: 'Book Now' });

    expect(button).toBeTruthy();
    expect(button.className).toContain('bg-pink-500');
    expect(button.className).toContain('text-white');
    cleanup();
  });
});