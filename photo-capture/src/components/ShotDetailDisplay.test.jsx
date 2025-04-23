import React from 'react';
import { render, screen } from '@testing-library/react';
import ShotDetailDisplay from './ShotDetailDisplay';

describe('ShotDetailDisplay', () => {
  const defaultProps = {
    itemID: 'SKU123',
    itemColor: 'Blue',
    viewType: 'Front',
  };

  test('renders shot details correctly', () => {
    render(<ShotDetailDisplay {...defaultProps} />);

    expect(screen.getByText('Item ID:')).toBeInTheDocument();
    expect(screen.getByText('SKU123')).toBeInTheDocument();

    expect(screen.getByText('Color:')).toBeInTheDocument();
    expect(screen.getByText('Blue')).toBeInTheDocument();

    expect(screen.getByText('View:')).toBeInTheDocument();
    expect(screen.getByText('Front')).toBeInTheDocument();
  });

  test('renders N/A when props are missing', () => {
    render(<ShotDetailDisplay />); // No props passed

    // Check that the labels are still there
    expect(screen.getByText('Item ID:')).toBeInTheDocument();
    expect(screen.getByText('Color:')).toBeInTheDocument();
    expect(screen.getByText('View:')).toBeInTheDocument();

    // Check that 'N/A' is rendered (due to defaultProps and || 'N/A')
    // We expect 3 instances of 'N/A'
    const naElements = screen.getAllByText('N/A');
    expect(naElements).toHaveLength(3);
  });

  // --- Failing Test Proposal (as per AI Self-Review Prompt) ---
  // This test checks for a specific structure or class that might be added later.
  // It's expected to fail initially.
  test.skip('TODO: should have a specific container class for styling', () => {
    const { container } = render(<ShotDetailDisplay {...defaultProps} />);
    // Let's assume we want a more specific BEM-style class later
    const expectedClass = 'shot-detail-display__container';
    // The current implementation uses "shot-detail-display"
    expect(container.firstChild).toHaveClass(expectedClass);
  });
}); 