import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays the current shot progress (e.g., "Shot 5 of 20").
 */
function ProgressTracker({ currentShotIndex, totalShots }) {
  // Add 1 to currentShotIndex because array indices are 0-based
  const currentShotNumber = currentShotIndex + 1;

  // Avoid displaying progress if totalShots is 0 or less
  if (totalShots <= 0) {
    return null; // Or return some placeholder text?
  }

  // TODO: Add styling
  // TODO: Consider accessibility (e.g., aria-live region?)
  return (
    <div className="progress-tracker">
      <p>
        Shot {currentShotNumber} of {totalShots}
      </p>
    </div>
  );
}

ProgressTracker.propTypes = {
  /** The 0-based index of the current shot being processed */
  currentShotIndex: PropTypes.number.isRequired,
  /** The total number of shots in the list */
  totalShots: PropTypes.number.isRequired,
};

ProgressTracker.defaultProps = {
  // No default props needed as they are required
};

export default ProgressTracker; 