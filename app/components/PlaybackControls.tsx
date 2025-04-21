import React from 'react';
import './PlaybackControls.css';

interface PlaybackControlsProps {
  playerRef?: React.RefObject<Spotify.Player | null>;
  isPaused: boolean;
  setIsLocalPaused?: (isPaused: boolean) => void;
  onStateChange?: () => void;
  onTogglePlay?: () => void;
  onPreviousTrack?: () => void;
  onNextTrack?: () => void;
}

/**
 * PlaybackControls component displays playback control buttons
 * Including previous track, play/pause, and next track
 * Contains both UI rendering and playback control logic
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  playerRef,
  isPaused,
  setIsLocalPaused,
  onStateChange,
  onTogglePlay,
  onPreviousTrack,
  onNextTrack,
}) => {
  // Toggle play/pause
  async function togglePlay() {
    // Use callback if provided, otherwise use player API
    if (onTogglePlay) {
      onTogglePlay();
      return;
    }
    if (!playerRef?.current || !setIsLocalPaused) return;

    try {
      // Immediately update local pause state
      const newPausedState = !isPaused;
      setIsLocalPaused(newPausedState);

      // Set a flag to indicate we're manually toggling
      // This will prevent the useEffect from overriding our state
      const manualToggleTime = Date.now();
      window.lastManualToggleTime = manualToggleTime;

      console.log(`Toggling playback to ${newPausedState ? 'paused' : 'playing'}`);

      // Use the Web SDK player's togglePlay method
      await playerRef.current.togglePlay();

      // Fetch updated playback state after API call
      setTimeout(async () => {
        if (onStateChange) {
          onStateChange();
        }
      }, 200); // Small delay to ensure the player has processed the request
    } catch (error) {
      console.error('Error toggling playback:', error);
      // Revert local state if API call fails
      setIsLocalPaused(isPaused);
    }
  }

  // Skip to previous track
  async function skipToPrevious() {
    // Use callback if provided, otherwise use player API
    if (onPreviousTrack) {
      onPreviousTrack();
      return;
    }
    if (!playerRef?.current) return;

    try {
      // Use the Web SDK player's previousTrack method
      await playerRef.current.previousTrack();

      // Call state change handler if provided
      if (onStateChange) {
        onStateChange();
      }
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  }

  // Skip to next track
  async function skipToNext() {
    // Use callback if provided, otherwise use player API
    if (onNextTrack) {
      onNextTrack();
      return;
    }
    if (!playerRef?.current) return;

    try {
      // Use the Web SDK player's nextTrack method
      await playerRef.current.nextTrack();

      // Call state change handler if provided
      if (onStateChange) {
        onStateChange();
      }
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }

  return (
    <div className="playback-controls">
      <button onClick={skipToPrevious} className="navigation-button prev-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="navigation-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button onClick={togglePlay} className="play-pause-button">
        {isPaused ? (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="play-pause-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
            />
          </svg>
        ) : (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="play-pause-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )}
      </button>

      <button onClick={skipToNext} className="navigation-button next-button">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="navigation-icon"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
};

export default PlaybackControls;
