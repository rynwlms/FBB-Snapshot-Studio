import React from 'react';
import PropTypes from 'prop-types';

/**
 * Displays the details for the current shot.
 */
function ShotDetailDisplay({ itemID, itemColor, viewType }) {
  // TODO: Add styling
  // TODO: Handle potential edge cases like very long strings? Truncation?
  return (
    <div className="shot-detail-display">
      <h2>Current Shot Details</h2>
      <p><strong>Item ID:</strong> {itemID || 'N/A'}</p>
      <p><strong>Color:</strong> {itemColor || 'N/A'}</p>
      <p><strong>View:</strong> {viewType || 'N/A'}</p>
    </div>
  );
}

ShotDetailDisplay.propTypes = {
  /** The unique identifier for the item */
  itemID: PropTypes.string,
  /** The color of the item */
  itemColor: PropTypes.string,
  /** The specific view or angle required for the shot */
  viewType: PropTypes.string,
};

// Provide default values for props if they are not passed
ShotDetailDisplay.defaultProps = {
  itemID: '',
  itemColor: '',
  viewType: '',
};

export default ShotDetailDisplay; 