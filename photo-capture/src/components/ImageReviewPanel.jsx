import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays the captured image preview and provides Accept/Retake options.
 */
function ImageReviewPanel({ imageBlobUrl, onAccept, onRetake }) {
  // TODO: Add styling for the preview image and buttons
  // TODO: Handle cases where imageBlobUrl might be null or invalid initially
  // TODO: Ensure buttons are disabled appropriately if needed (e.g., during save)

  if (!imageBlobUrl) {
    // Don't render anything if there's no image to review yet
    return null;
  }

  return (
    <div className="image-review-panel">
      <h3>Review Captured Image</h3>
      <img
        src={imageBlobUrl}
        alt="Captured shot preview"
        style={{ maxWidth: '100%', height: 'auto' }} // Basic responsive styling
      />
      <div className="button-group">
        <button type="button" onClick={onAccept}>Accept</button>
        <button type="button" onClick={onRetake}>Retake</button>
      </div>
    </div>
  );
}

ImageReviewPanel.propTypes = {
  /** A Blob URL representing the captured image preview */
  imageBlobUrl: PropTypes.string,
  /** Callback function to execute when the user accepts the image */
  onAccept: PropTypes.func.isRequired,
  /** Callback function to execute when the user wants to retake the image */
  onRetake: PropTypes.func.isRequired,
};

ImageReviewPanel.defaultProps = {
  imageBlobUrl: null,
};

export default ImageReviewPanel; 