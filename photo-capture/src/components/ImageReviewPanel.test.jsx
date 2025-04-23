import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ImageReviewPanel from './ImageReviewPanel';

describe('ImageReviewPanel', () => {
  const mockOnAccept = jest.fn();
  const mockOnRetake = jest.fn();
  const testImageUrl = 'blob:http://localhost/test-image-guid'; // Example blob URL

  // Reset mocks before each test
  beforeEach(() => {
    mockOnAccept.mockClear();
    mockOnRetake.mockClear();
  });

  test('renders nothing when imageBlobUrl is null', () => {
    const { container } = render(
      <ImageReviewPanel onAccept={mockOnAccept} onRetake={mockOnRetake} />
    );
    expect(container.firstChild).toBeNull();
  });

  test('renders image and buttons when imageBlobUrl is provided', () => {
    render(
      <ImageReviewPanel
        imageBlobUrl={testImageUrl}
        onAccept={mockOnAccept}
        onRetake={mockOnRetake}
      />
    );

    // Check for the image
    const image = screen.getByAltText('Captured shot preview');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', testImageUrl);

    // Check for buttons
    expect(screen.getByRole('button', { name: 'Accept' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retake' })).toBeInTheDocument();
  });

  test('calls onAccept when Accept button is clicked', () => {
    render(
      <ImageReviewPanel
        imageBlobUrl={testImageUrl}
        onAccept={mockOnAccept}
        onRetake={mockOnRetake}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Accept' }));

    expect(mockOnAccept).toHaveBeenCalledTimes(1);
    expect(mockOnRetake).not.toHaveBeenCalled();
  });

  test('calls onRetake when Retake button is clicked', () => {
    render(
      <ImageReviewPanel
        imageBlobUrl={testImageUrl}
        onAccept={mockOnAccept}
        onRetake={mockOnRetake}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Retake' }));

    expect(mockOnRetake).toHaveBeenCalledTimes(1);
    expect(mockOnAccept).not.toHaveBeenCalled();
  });

  // --- Failing Test Proposal ---
  test.skip('TODO: Accept button should be disabled while processing', () => {
    // This test would require adding a prop like `isProcessing`
    render(
      <ImageReviewPanel
        imageBlobUrl={testImageUrl}
        onAccept={mockOnAccept}
        onRetake={mockOnRetake}
        // isProcessing={true} // Hypothetical prop
      />
    );
    expect(screen.getByRole('button', { name: 'Accept' })).toBeDisabled();
  });
}); 