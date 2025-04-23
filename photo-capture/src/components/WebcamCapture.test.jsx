import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import WebcamCapture from './WebcamCapture';

// --- Mocking Browser Media APIs ---

// Store original APIs
const originalMediaDevices = navigator.mediaDevices;
const originalCanvasProto = HTMLCanvasElement.prototype;

describe('WebcamCapture', () => {
  let mockOnCapture;
  let mockMediaStream;
  let mockGetUserMedia;
  let mockVideoTrackStop; // To check stop() call specifically

  beforeEach(() => {
    // Reset mocks
    mockOnCapture = jest.fn();
    mockVideoTrackStop = jest.fn(); // Create mock for stop
    mockMediaStream = {
      getTracks: jest.fn(() => [
        { stop: mockVideoTrackStop, kind: 'video' }, // Use the specific mock
      ]),
    };
    mockGetUserMedia = jest.fn();

    // Mock navigator.mediaDevices
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {
        getUserMedia: mockGetUserMedia,
      },
    });

    // Mock canvas methods (basic)
    HTMLCanvasElement.prototype.getContext = jest.fn(() => ({
      drawImage: jest.fn(),
    }));
    HTMLCanvasElement.prototype.toBlob = jest.fn((callback) => {
      // Simulate successful blob creation
      const mockBlob = new Blob(['mock image data'], { type: 'image/jpeg' });
      callback(mockBlob);
    });

    // Mock video properties needed for capture (Use configurable: true for cleanup)
    Object.defineProperty(HTMLVideoElement.prototype, 'videoWidth', { writable: true, value: 640, configurable: true });
    Object.defineProperty(HTMLVideoElement.prototype, 'videoHeight', { writable: true, value: 480, configurable: true });
    
    // Mock srcObject using only accessors
    let internalSrcObject = null;
    Object.defineProperty(HTMLVideoElement.prototype, 'srcObject', { 
        configurable: true, // Allow deletion in afterEach
        set(stream) { internalSrcObject = stream; },
        get() { return internalSrcObject; }
    });
  });

  afterEach(() => {
    // Restore original APIs
    Object.defineProperty(navigator, 'mediaDevices', { value: originalMediaDevices });
    // Avoid trying to redefine HTMLCanvasElement.prototype if it wasn't changed drastically
    // Resetting individual methods might be safer if needed, but let's try without first.
    
    // Remove the properties we added to the video prototype
    delete HTMLVideoElement.prototype.videoWidth;
    delete HTMLVideoElement.prototype.videoHeight;
    delete HTMLVideoElement.prototype.srcObject;
  });

  test('renders initializing state and requests camera access', async () => {
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    render(<WebcamCapture onCapture={mockOnCapture} />);

    expect(screen.getByText(/Initializing camera.../i)).toBeInTheDocument();
    await waitFor(() => expect(mockGetUserMedia).toHaveBeenCalledTimes(1));
    
    // Check if video element appears using data-testid
    await waitFor(() => {
        expect(screen.getByTestId('webcam-video')).toBeInTheDocument();
    });
    expect(screen.queryByText(/Initializing camera.../i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Capture Image/i })).toBeEnabled();
  });

  test('displays error message if camera access is denied', async () => {
    const permissionError = new Error('Permission denied');
    permissionError.name = 'NotAllowedError';
    mockGetUserMedia.mockRejectedValue(permissionError); // Simulate denial

    render(<WebcamCapture onCapture={mockOnCapture} />);

    await waitFor(() => expect(mockGetUserMedia).toHaveBeenCalledTimes(1));
    await waitFor(() => {
        expect(screen.getByText(/Error: Permission denied/i)).toBeInTheDocument();
    });
     expect(screen.queryByText(/Initializing camera.../i)).not.toBeInTheDocument();
     // Capture button should be disabled on error
     expect(screen.getByRole('button', { name: /Capture Image/i })).toBeDisabled();
  });

  test('displays error message if getUserMedia is not supported', async () => {
    // Temporarily remove getUserMedia for this test
    Object.defineProperty(navigator, 'mediaDevices', {
      writable: true,
      value: {},
    });

    render(<WebcamCapture onCapture={mockOnCapture} />);

    await waitFor(() => {
        expect(screen.getByText(/Error: Webcam access is not supported/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('button', { name: /Capture Image/i })).toBeDisabled();
  });

  test('calls onCapture with blob when Capture button is clicked', async () => {
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    render(<WebcamCapture onCapture={mockOnCapture} />);

    // Wait for camera to become active and video element to be available
    const videoElement = await screen.findByTestId('webcam-video'); 
    await waitFor(() => {
        expect(screen.getByRole('button', { name: /Capture Image/i })).toBeEnabled();
    });

    // Ensure video element instance has dimensions just before capture
    Object.defineProperty(videoElement, 'videoWidth', { value: 640, configurable: true });
    Object.defineProperty(videoElement, 'videoHeight', { value: 480, configurable: true });

    const captureButton = screen.getByRole('button', { name: /Capture Image/i });
    
    act(() => {
        fireEvent.click(captureButton);
    });

    // Wait specifically for the onCapture callback to be called
    await waitFor(() => {
      expect(mockOnCapture).toHaveBeenCalledTimes(1);
    });

    // Optionally, check the blob type if needed
    expect(mockOnCapture.mock.calls[0][0]).toBeInstanceOf(Blob);
    // expect(mockOnCapture.mock.calls[0][0].type).toBe('image/jpeg');

    // Clean up instance properties
    delete videoElement.videoWidth;
    delete videoElement.videoHeight;
  });

  test('cleans up stream on unmount', async () => {
    mockGetUserMedia.mockResolvedValue(mockMediaStream);
    const { unmount } = render(<WebcamCapture onCapture={mockOnCapture} />);

    // Wait for stream to be acquired
    await waitFor(() => expect(mockGetUserMedia).toHaveBeenCalledTimes(1));

    // Unmount the component
    unmount();

    // Check if the specific track's stop method was called
    expect(mockVideoTrackStop).toHaveBeenCalledTimes(1);
  });

  // TODO: Test case where canvas.toBlob fails?
  // TODO: More specific checks on canvas drawImage arguments?
}); 