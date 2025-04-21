import React from 'react';
import './VolumeControl.css';

interface VolumeControlProps {
  volume: number;
  setVolume?: React.Dispatch<React.SetStateAction<number>>;
  playerRef?: React.RefObject<Spotify.Player | null>;
  volumeRef?: React.RefObject<number>;
  onVolumeChange?: (volume: number) => void;
}

/**
 * VolumeControl component displays a volume slider with an icon
 * It allows users to adjust the playback volume
 * Contains both UI rendering and volume control logic
 */
const VolumeControl: React.FC<VolumeControlProps> = ({
  volume,
  setVolume,
  playerRef,
  volumeRef,
  onVolumeChange,
}) => {
  // Handle volume change
  async function handleVolumeChange(newVolume: number) {
    // Use callback if provided, otherwise use player API
    if (onVolumeChange) {
      onVolumeChange(newVolume);
      return;
    }
    if (!playerRef?.current || !setVolume) return;

    // Update both state and ref
    setVolume(newVolume);
    if (volumeRef) {
      volumeRef.current = newVolume;
    }

    // Set volume on the player
    await playerRef.current.setVolume(newVolume / 100);
  }

  return (
    <div className="volume-control">
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="volume-icon"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"
        />
      </svg>
      <input
        type="range"
        min="0"
        max="100"
        value={volume}
        onChange={e => handleVolumeChange(Number(e.target.value))}
        className="volume-slider"
      />
    </div>
  );
};

export default VolumeControl;
