/**
 * Utility to save a Blob to the local file system, using File System Access API
 * with a fallback to standard anchor download.
 *
 * Manages a persistent directory handle within a session to avoid repeated prompts.
 */

// Store the directory handle persistently within the module scope (session)
let directoryHandle = null;

/**
 * Sanitizes a filename to remove characters potentially problematic for file systems.
 * Allows letters, numbers, periods, underscores, and hyphens.
 * Replaces invalid characters with underscores.
 * @param {string} filename - The original filename.
 * @returns {string} The sanitized filename.
 */
function sanitizeFilename(filename) {
  if (!filename) return 'downloaded_image.jpg'; // Default filename
  // Replace disallowed characters with underscores
  const sanitized = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Optional: Prevent filenames starting with a dot (hidden files)
  if (sanitized.startsWith('.')) {
    return `_${sanitized}`;
  }
  // Optional: Limit length (e.g., 255 chars which is common limit)
  return sanitized.slice(0, 255);
}

/**
 * Saves a blob to a file using the File System Access API if available,
 * otherwise falls back to creating a download link.
 *
 * @param {Blob} blob - The blob data to save (e.g., an image).
 * @param {string} suggestedName - The desired filename for the file.
 */
export async function saveBlob(blob, suggestedName) {
  const fileName = sanitizeFilename(suggestedName);

  // --- Strategy 1: File System Access API --- 
  if ('showDirectoryPicker' in window) {
    try {
      // 1. Get Directory Handle (reuse if possible)
      if (!directoryHandle) {
        console.log('Requesting directory access...');
        directoryHandle = await window.showDirectoryPicker();
      }

      // 2. Verify Permission (check if handle is still valid)
      //    If permission was revoked, this will throw, and we'll re-prompt in catch.
      const permissionStatus = await directoryHandle.queryPermission({ mode: 'readwrite' });
      if (permissionStatus !== 'granted') {
         // Request permission again if not granted
        if (await directoryHandle.requestPermission({ mode: 'readwrite' }) !== 'granted') {
            console.error('Directory write permission denied.');
            // Clear handle so we prompt next time
            directoryHandle = null; 
            throw new Error('Permission denied to write to the selected directory.');
        }
      }

      // 3. Get File Handle & Writable Stream
      const fileHandle = await directoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();

      // 4. Write Blob & Close
      await writable.write(blob);
      await writable.close();

      console.log(`File '${fileName}' saved successfully via FS Access API.`);
      return { success: true, method: 'fs-access' };

    } catch (err) {
      console.error('Error saving file via FS Access API:', err);
      // Specific check if the error is because the user dismissed the picker
      if (err.name === 'AbortError') {
        alert('Save cancelled: You did not select a directory.');
        return { success: false, error: 'Save cancelled.', method: 'fs-access' };
      }
      // If an error occurred (like permission denial mid-save, or picker error),
      // clear the handle to ensure we prompt again next time.
      directoryHandle = null;
      alert(`Failed to save file: ${err.message}\nWill attempt fallback download.`);
      // Fall through to the fallback method if FS API fails after getting handle
    } 
  }

  // --- Strategy 2: Fallback using Anchor Download --- 
  console.log('Using fallback download method.');
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;

    // Append link, click it, remove it
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the object URL after a short delay to ensure download starts
    setTimeout(() => URL.revokeObjectURL(url), 100);

    console.log(`File '${fileName}' initiated for download via fallback.`);
    return { success: true, method: 'download' };
  } catch (err) {
    console.error('Error creating fallback download link:', err);
    alert(`Failed to initiate download: ${err.message}`);
    return { success: false, error: err.message, method: 'download' };
  }
}

/**
 * Resets the stored directory handle, forcing the next save
 * to prompt the user for a directory again.
 */
export function resetDirectoryHandle() {
    console.log('Resetting stored directory handle.');
    directoryHandle = null;
} 