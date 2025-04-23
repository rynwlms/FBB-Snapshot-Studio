import React, { useReducer, useEffect, useCallback } from 'react';
import ShotListUploader from './components/ShotListUploader';
import ShotDetailDisplay from './components/ShotDetailDisplay';
import WebcamCapture from './components/WebcamCapture';
import ImageReviewPanel from './components/ImageReviewPanel';
import ProgressTracker from './components/ProgressTracker';
import { saveBlob, resetDirectoryHandle } from './utils/saveBlob';

import './App.css'; // We'll create this later for styling

// --- State Management (Reducer) --- 

const initialState = {
  shotList: [],
  currentShotIndex: -1, // -1 indicates no list loaded yet
  capturedImageBlob: null,
  imagePreviewUrl: null,
  status: 'idle', // idle | loading_list | ready_to_capture | image_captured | saving | finished | error
  error: null,
  saveMethodUsed: null, // Track if FS API was used initially
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_SHOT_LIST':
      // Clean up any previous preview URL
      if (state.imagePreviewUrl) {
        URL.revokeObjectURL(state.imagePreviewUrl);
      }
      return {
        ...initialState, // Reset most state
        shotList: action.payload,
        currentShotIndex: action.payload.length > 0 ? 0 : -1,
        status: action.payload.length > 0 ? 'ready_to_capture' : 'idle',
      };
    case 'IMAGE_CAPTURED':
      // Clean up previous URL before creating a new one
      if (state.imagePreviewUrl) {
        URL.revokeObjectURL(state.imagePreviewUrl);
      }
      const previewUrl = URL.createObjectURL(action.payload);
      return {
        ...state,
        capturedImageBlob: action.payload,
        imagePreviewUrl: previewUrl,
        status: 'image_captured',
        error: null,
      };
    case 'ACCEPT_IMAGE':
      return { ...state, status: 'saving' }; // Move to saving status
    case 'SAVE_COMPLETE':
       // Store the save method used (for potential future checks/info)
       const saveMethod = action.payload.method || state.saveMethodUsed;
       // Clean up blob and URL after successful save
       if (state.imagePreviewUrl) {
         URL.revokeObjectURL(state.imagePreviewUrl);
       }
       const nextIndex = state.currentShotIndex + 1;
       const isFinished = nextIndex >= state.shotList.length;
       return {
         ...state,
         capturedImageBlob: null,
         imagePreviewUrl: null,
         currentShotIndex: isFinished ? state.currentShotIndex : nextIndex,
         status: isFinished ? 'finished' : 'ready_to_capture',
         saveMethodUsed: saveMethod,
       };
    case 'RETAKE_IMAGE':
      // Clean up blob and URL
      if (state.imagePreviewUrl) {
        URL.revokeObjectURL(state.imagePreviewUrl);
      }
      return {
        ...state,
        capturedImageBlob: null,
        imagePreviewUrl: null,
        status: 'ready_to_capture',
      };
    case 'SET_ERROR':
       // Optionally clean up preview URL on error
       if (state.imagePreviewUrl && action.payload.clearPreview) {
         URL.revokeObjectURL(state.imagePreviewUrl);
       }
      return {
        ...state,
        error: action.payload.message,
        status: 'error',
        imagePreviewUrl: action.payload.clearPreview ? null : state.imagePreviewUrl,
        capturedImageBlob: action.payload.clearPreview ? null : state.capturedImageBlob,
      };
     case 'RESET_APP':
       // Clean up preview URL
       if (state.imagePreviewUrl) {
         URL.revokeObjectURL(state.imagePreviewUrl);
       }
       resetDirectoryHandle(); // Also reset the saved directory handle
       return initialState;
    default:
      return state;
  }
}

// --- App Component --- 

function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const { 
    shotList,
    currentShotIndex,
    capturedImageBlob,
    imagePreviewUrl,
    status,
    error,
  } = state;

  // Get current shot details (if available)
  const currentShot = shotList[currentShotIndex];

  // --- Callback Handlers --- 

  const handleShotListParsed = useCallback((parsedShots) => {
    dispatch({ type: 'LOAD_SHOT_LIST', payload: parsedShots });
  }, []);

  const handleCapture = useCallback((blob) => {
    dispatch({ type: 'IMAGE_CAPTURED', payload: blob });
  }, []);

  const handleAccept = useCallback(async () => {
    if (!capturedImageBlob || !currentShot?.filename || status !== 'image_captured') {
      return; 
    }
    dispatch({ type: 'ACCEPT_IMAGE' }); // Set status to saving
    
    try {
      const result = await saveBlob(capturedImageBlob, currentShot.filename);
      if (result.success) {
        dispatch({ type: 'SAVE_COMPLETE', payload: { method: result.method } });
      } else {
          // Error message handled by saveBlob via alert, update state
          dispatch({ 
              type: 'SET_ERROR', 
              payload: { message: result.error || 'Failed to save image.', clearPreview: false }
          });
          // Revert status back from 'saving' to allow retry or retake
          dispatch({ type: 'RETAKE_IMAGE' }); // Effectively go back to review state on save fail
      }
    } catch (saveError) {
      console.error("Unexpected error during saveBlob call:", saveError);
      dispatch({ 
          type: 'SET_ERROR', 
          payload: { message: saveError.message || 'An unexpected error occurred during save.', clearPreview: false } 
      });
      dispatch({ type: 'RETAKE_IMAGE' }); // Go back to review state
    }
  }, [capturedImageBlob, currentShot, status]);

  const handleRetake = useCallback(() => {
    dispatch({ type: 'RETAKE_IMAGE' });
  }, []);

  const handleReset = useCallback(() => {
      dispatch({ type: 'RESET_APP' });
  }, []);

  // Effect to clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      if (state.imagePreviewUrl) {
        URL.revokeObjectURL(state.imagePreviewUrl);
      }
    };
  }, [state.imagePreviewUrl]);

  // --- Render Logic --- 

  const showUploader = status === 'idle' || shotList.length === 0;
  const showCaptureArea = status === 'ready_to_capture' || status === 'saving' || status === 'error';
  const showReviewPanel = status === 'image_captured';

  return (
    <div className="app-container">
      <h1>FBB Snapshot Tool</h1>

      {/* Reset Button always available */} 
      <button onClick={handleReset} style={{ float: 'right', margin: '10px' }}>Start Over</button>

      {error && (
        <div className="error-message">Error: {error}</div>
      )}
      
      {status === 'saving' && (
          <div className="loading-message">Saving image...</div>
      )}

      {showUploader && (
        <ShotListUploader onShotListParsed={handleShotListParsed} />
      )}

      {shotList.length > 0 && status !== 'finished' && (
        <>
          <ProgressTracker 
            currentShotIndex={currentShotIndex}
            totalShots={shotList.length} 
          />
          {currentShot && (
            <ShotDetailDisplay 
              itemID={currentShot.itemID}
              itemColor={currentShot.itemColor}
              viewType={currentShot.viewType}
            />
          )}

          {showCaptureArea && (
            <WebcamCapture 
              key={currentShotIndex} // Re-mount WebcamCapture for each shot if needed?
              onCapture={handleCapture} 
            />
          )}
          
          {showReviewPanel && (
            <ImageReviewPanel 
              imageBlobUrl={imagePreviewUrl}
              onAccept={handleAccept}
              onRetake={handleRetake}
            />
          )}
        </>
      )}

      {status === 'finished' && (
        <div className="finished-message">
          <h2>All shots completed!</h2>
          <p>You have captured all {shotList.length} images.</p>
          <p>(Save method used: {state.saveMethodUsed || 'N/A'})</p>
          {/* Button handled by the general Reset button above */}
        </div>
      )}
    </div>
  );
}

export default App;
