# FBB Snapshot Tool

## Objective

A fully-local browser application (single HTML file) that ingests an XLS shot list, walks the user through USB-webcam capture for each shot, allows immediate review/acceptance, and saves each image locally with the exact filename provided in the list.

This tool aims to eliminate manual naming errors and provide a frictionless, step-by-step workflow for capturing product images based on a predefined list.

## Usage

1.  **Obtain the `index.html` file:** Find the bundled application file in the `dist/` directory after running `npm run build`.
2.  **Prepare your Shot List:** Create an XLS or XLSX file with the following columns (header row is required, case-insensitive):
    *   `ItemID`: Unique identifier for the item.
    *   `ItemColor`: Color description.
    *   `ViewType`: The view/angle required (e.g., Front, Side, Top).
    *   `Filename`: The **exact** filename to use when saving the captured image (e.g., `SKU123_Red_Front.jpg`).
3.  **Open the Application:** Double-click the `index.html` file or open it using your web browser (`File -> Open File`). The application runs entirely locally; no internet connection is needed after opening.
4.  **Load Shot List:** Click the "Upload Shot List" input and select your prepared XLS/XLSX file.
5.  **Grant Permissions:** Allow the browser to access your webcam when prompted.
6.  **Capture:** Follow the on-screen details (`ItemID`, `Color`, `View`). Position the item and click "Capture Image".
7.  **Review:** Check the captured preview.
    *   Click **Accept** to save the image.
    *   Click **Retake** to discard the preview and capture again.
8.  **Select Save Directory (First Time):** If using a browser that supports the File System Access API (like Chrome, Edge), you will be prompted to select a directory to save the images *only the first time* you click "Accept". Subsequent images will be saved automatically to the same directory.
9.  **Fallback Download:** If your browser doesn't support the File System Access API, or if permission is denied, clicking "Accept" will trigger a standard browser download for each image.
10. **Repeat:** Continue capturing and accepting images until the list is complete.
11. **Start Over:** Click the "Start Over" button at any time to clear the current list and load a new one.

## Requirements

*   A modern web browser (e.g., Chrome, Firefox, Edge, Safari) with JavaScript enabled.
*   A connected and working webcam.
*   An XLS/XLSX shot list file formatted as described above.
*   **Recommended:** Browser support for the File System Access API for the best saving experience (automatic saving to a chosen directory).

## Limitations

*   **Saving:** Relies on the File System Access API for seamless saving. Without it, each image must be saved via individual downloads.
*   **Error Handling:** Basic error handling is included, but complex spreadsheet issues or rare browser errors might not be caught gracefully.
*   **No Editing:** This tool only captures images; no cropping or editing features are included.
*   **Single Session:** The chosen save directory (if using FS Access API) is remembered only for the current browser session/tab.
*   **Performance:** Large shot lists might impact browser performance, although this hasn't been extensively tested.

## Development

*   Built with React and Vite.
*   Uses SheetJS (`xlsx`) for spreadsheet parsing.
*   Uses `vite-plugin-singlefile` to bundle into one HTML file.
*   See `plan.txt` (if included) for the original development plan.

To run in development mode:
```bash
cd photo-capture
npm install
npm run dev
```

To build the single `dist/index.html` file:
```bash
cd photo-capture
npm run build
```
