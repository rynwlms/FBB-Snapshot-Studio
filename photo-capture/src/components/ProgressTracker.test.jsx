import React from 'react';
import { render, screen } from '@testing-library/react';
import ProgressTracker from './ProgressTracker';

describe('ProgressTracker', () => {
  test('renders the correct progress text', () => {
    render(<ProgressTracker currentShotIndex={4} totalShots={20} />);
    // Expecting "Shot 5 of 20" because index is 0-based
    expect(screen.getByText('Shot 5 of 20')).toBeInTheDocument();
  });

  test('renders correctly for the first shot', () => {
    render(<ProgressTracker currentShotIndex={0} totalShots={15} />);
    expect(screen.getByText('Shot 1 of 15')).toBeInTheDocument();
  });

  test('does not render if totalShots is 0', () => {
    const { container } = render(<ProgressTracker currentShotIndex={0} totalShots={0} />);
    // The component should return null, so the container should be empty
    expect(container.firstChild).toBeNull();
  });

  test('does not render if totalShots is negative (edge case)', () => {
    const { container } = render(<ProgressTracker currentShotIndex={0} totalShots={-5} />);
    expect(container.firstChild).toBeNull();
  });

  // --- Failing Test Proposal --- (Optional)
  // Skipped test for a potential future requirement, like adding specific ARIA attributes
  test.skip('TODO: should have ARIA attributes for accessibility', () => {
    render(<ProgressTracker currentShotIndex={2} totalShots={10} />);
    const progressElement = screen.getByText('Shot 3 of 10');
    // Example: Check for aria-live attribute if this needs to announce updates
    expect(progressElement).toHaveAttribute('aria-live', 'polite');
  });
}); 