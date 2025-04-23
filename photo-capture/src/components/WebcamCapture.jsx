import React, { useState, useRef, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';

/**
 * Component to display webcam stream and capture images.
 */
function WebcamCapture({ onCapture, width = 640, height = 480 }) {
  const [stream, setStream] = useState(null);
  const [error, setError] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // --- Request camera access and setup stream ---
  useEffect(() => {
    let currentStream = null; // Local variable for cleanup

    const enableStream = async () => {
      try {
        // Check for browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('getUserMedia is not supported by this browser.');
        }

        currentStream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: width }, height: { ideal: height } },
          // audio: false, // No audio needed
        });
        setStream(currentStream);
        if (videoRef.current) {
          videoRef.current.srcObject = currentStream;
        }
        setIsCameraActive(true);
        setError(null); // Clear previous errors
      } catch (err) {
        console.error("Error accessing webcam:", err);
        let friendlyError = 'Could not access webcam.';
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          friendlyError = 'Permission denied. Please allow camera access in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
          friendlyError = 'No webcam found. Please ensure a camera is connected and enabled.';
        } else if (err.message.includes('getUserMedia')) {
            friendlyError = 'Webcam access is not supported by this browser.';
        }
        setError(friendlyError);
        setIsCameraActive(false);
      }
    };

    enableStream();

    // --- Cleanup function --- 
    return () => {
      // Use the local currentStream variable captured by the closure
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        console.log('Webcam stream stopped.');
      }
      setIsCameraActive(false);
    };
  // Re-run effect if width/height props change (though this might be unlikely)
  }, [width, height]); 

  // --- Handle Capture Button Click ---
  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current || !isCameraActive) {
      console.warn('Capture attempted but video stream or canvas not ready.');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    // Set canvas dimensions to match video element (actual stream size)
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw the current video frame onto the canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convert canvas to Blob
    canvas.toBlob((blob) => {
      if (blob) {
        onCapture(blob);
      } else {
        console.error('Canvas to Blob conversion failed');
        setError('Could not capture image.')
      }
    }, 'image/jpeg', 0.9); // Use JPEG format, quality 90%

  }, [onCapture, isCameraActive, videoRef, canvasRef]);

  // TODO: Add better styling for video feed and button
  // TODO: Consider adding visual feedback during capture
  return (
    <div className="webcam-capture">
      <h4>Live Camera Feed</h4>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      <video
        ref={videoRef}
        autoPlay
        playsInline // Important for iOS
        muted // Mute audio to avoid feedback loops if audio was enabled
        width={width}
        height={height}
        style={{ display: isCameraActive ? 'block' : 'none', border: '1px solid grey' }}
        data-testid="webcam-video"
      >
        Your browser does not support the video tag.
      </video>
      {!isCameraActive && !error && <p>Initializing camera...</p>}
      {/* Hidden canvas for capturing frames */} 
      <canvas ref={canvasRef} style={{ display: 'none' }} /> 

      <button
        type="button"
        onClick={handleCapture}
        disabled={!isCameraActive || !!error}
      >
        Capture Image
      </button>
    </div>
  );
}

WebcamCapture.propTypes = {
  /** Callback function invoked with the captured image Blob */
  onCapture: PropTypes.func.isRequired,
  /** Desired width for the video stream */
  width: PropTypes.number,
  /** Desired height for the video stream */
  height: PropTypes.number,
};

export default WebcamCapture; 