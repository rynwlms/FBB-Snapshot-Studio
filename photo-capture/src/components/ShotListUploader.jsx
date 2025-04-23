import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import * as XLSX from 'xlsx'; // Import the xlsx library

/**
 * Component to handle uploading and parsing the XLS shot list file.
 */
function ShotListUploader({ onShotListParsed }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFileChange = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return; // No file selected
    }

    setIsLoading(true);
    setError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target.result;
        const workbook = XLSX.read(data, { type: 'binary' });

        // --- Assuming the first sheet is the relevant one ---
        const sheetName = workbook.SheetNames[0];
        if (!sheetName) {
          throw new Error('No sheets found in the workbook.');
        }
        const worksheet = workbook.Sheets[sheetName];

        // --- Convert sheet to JSON array of objects ---
        // header: 1 assumes the first row is headers
        // TODO: Make header row configurable? Add validation?
        // TODO: Define expected headers explicitly (e.g., 'itemID', 'itemColor', etc.)
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        if (jsonData.length < 2) { // Check if there's at least one header row and one data row
          throw new Error('Sheet appears to be empty or lacks data rows.');
        }

        // --- Extract headers and data --- 
        const headers = jsonData[0];
        const dataRows = jsonData.slice(1);

        // --- Find column indices (case-insensitive matching) ---
        // TODO: Make these expected header names more robust or configurable
        const lowerCaseHeaders = headers.map(h => String(h).toLowerCase());
        const itemIDIndex = lowerCaseHeaders.indexOf('itemid');
        const itemColorIndex = lowerCaseHeaders.indexOf('itemcolor');
        const viewTypeIndex = lowerCaseHeaders.indexOf('viewtype');
        const filenameIndex = lowerCaseHeaders.indexOf('filename');

        // Basic validation: Check if all required columns were found
        if ([itemIDIndex, itemColorIndex, viewTypeIndex, filenameIndex].some(index => index === -1)) {
            console.error('Missing required headers. Found:', headers);
            // Construct a more helpful error message
            const missing = [];
            if (itemIDIndex === -1) missing.push('itemID');
            if (itemColorIndex === -1) missing.push('itemColor');
            if (viewTypeIndex === -1) missing.push('viewType');
            if (filenameIndex === -1) missing.push('filename');
            throw new Error(`Missing required columns in XLS: ${missing.join(', ')}. Please ensure the header row contains these exact names (case-insensitive).`);
        }

        // --- Map data rows to Shot objects ---
        const shots = dataRows.map((row, index) => {
          // Basic check if the row has enough columns
          if (row.length <= Math.max(itemIDIndex, itemColorIndex, viewTypeIndex, filenameIndex)) {
              console.warn(`Skipping row ${index + 2}: Insufficient columns.`);
              return null; // Skip rows that don't have enough data for required fields
          }
          const shot = {
            // Add a unique key for React lists, using row index
            key: `shot-${index}`,
            // Convert values to strings and trim whitespace
            itemID: String(row[itemIDIndex] || '').trim(),
            itemColor: String(row[itemColorIndex] || '').trim(),
            viewType: String(row[viewTypeIndex] || '').trim(),
            filename: String(row[filenameIndex] || '').trim(),
          };
          // Validate filename (basic check for non-empty)
          if (!shot.filename) {
            console.warn(`Skipping row ${index + 2}: Missing filename.`);
            return null; // Skip rows with missing filenames
          }
          return shot;
        }).filter(Boolean); // Remove null entries from skipped/invalid rows

        if (shots.length === 0) {
            throw new Error('No valid shot data found in the file after processing.');
        }

        // --- Pass the parsed data up to the parent component ---
        onShotListParsed(shots);
        setError(null); // Clear any previous error on success

      } catch (err) {
        console.error("Error parsing XLS file:", err);
        setError(`Failed to parse file: ${err.message}`);
        onShotListParsed([]); // Clear any existing list in the parent on error
      } finally {
        setIsLoading(false);
        // Reset the input value so the same file can be selected again if needed
        event.target.value = null;
      }
    };

    reader.onerror = (err) => {
      console.error("FileReader error:", err);
      setError('Failed to read file.');
      setIsLoading(false);
      onShotListParsed([]); // Clear any existing list
      event.target.value = null;
    };

    // Read the file as a binary string
    reader.readAsBinaryString(file);

  }, [onShotListParsed]);

  // TODO: Add better styling and loading/error indicators
  return (
    <div className="shot-list-uploader">
      <label htmlFor="xls-upload">Upload Shot List (XLS/XLSX):</label>
      <input
        type="file"
        id="xls-upload"
        accept=".xls, .xlsx" // Accept both old and new Excel formats
        onChange={handleFileChange}
        disabled={isLoading}
        aria-describedby={error ? "uploader-error" : undefined}
      />
      {isLoading && <p>Loading file...</p>}
      {error && <p id="uploader-error" style={{ color: 'red' }}>Error: {error}</p>}
    </div>
  );
}

ShotListUploader.propTypes = {
  /** Callback function invoked with the array of parsed Shot objects */
  onShotListParsed: PropTypes.func.isRequired,
};

export default ShotListUploader; 