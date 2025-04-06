import React, { useState, useEffect, useRef } from 'react';
import './TrackProgress.css';

interface TrackProgressProps {
  position: number; // Current position in milliseconds
  duration: number; // Total duration in milliseconds
  isPaused: boolean;
  onSeek: (position: number) => void; // Callback for when user seeks to a new position
}

/**
 * TrackProgress component displays a progress bar for the current track
 * Shows current position, total duration, and allows seeking
 */
const TrackProgress: React.FC<TrackProgressProps> = ({ position, duration, isPaused, onSeek }) => {
  const [displayPosition, setDisplayPosition] = useState(position);
  const [isDragging, setIsDragging] = useState(false);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Format milliseconds to MM:SS format
  const formatTime = (ms: number): string => {
    if (!ms || isNaN(ms)) return '0:00';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (displayPosition / duration) * 100 : 0;

  // Update display position when actual position changes (if not dragging)
  useEffect(() => {
    if (!isDragging) {
      setDisplayPosition(position);
      lastUpdateTimeRef.current = Date.now();
    }
  }, [position, isDragging]);

  // Update position in real-time when playing
  useEffect(() => {
    if (isPaused || isDragging) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastUpdateTimeRef.current;
      lastUpdateTimeRef.current = now;

      setDisplayPosition(prev => Math.min(prev + elapsed, duration));
    }, 50); // Update every 50ms for smooth animation

    return () => clearInterval(interval);
  }, [isPaused, isDragging, duration]);

  // Handle click on progress bar
  const handleProgressBarClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const clickPosition = e.clientX - rect.left;
    const percentage = clickPosition / rect.width;
    const newPosition = Math.floor(percentage * duration);

    setDisplayPosition(newPosition);
    onSeek(newPosition);
  };

  // Handle drag start
  const handleDragStart = () => {
    setIsDragging(true);
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (isDragging) {
      onSeek(displayPosition);
      setIsDragging(false);
    }
  };

  // Handle drag movement
  const handleDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const mousePosition = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, mousePosition / rect.width));
    const newPosition = Math.floor(percentage * duration);

    setDisplayPosition(newPosition);
  };

  // Set up event listeners for drag outside the component
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!progressBarRef.current) return;

      const rect = progressBarRef.current.getBoundingClientRect();
      const mousePosition = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, mousePosition / rect.width));
      const newPosition = Math.floor(percentage * duration);

      setDisplayPosition(newPosition);
    };

    const handleMouseUp = () => {
      onSeek(displayPosition);
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, displayPosition, onSeek]);

  return (
    <div className="track-progress">
      <div className="track-time current-time">{formatTime(displayPosition)}</div>

      <div
        className="progress-bar-container"
        ref={progressBarRef}
        onClick={handleProgressBarClick}
        onMouseMove={handleDrag}
      >
        <div className="progress-bar-background">
          <div className="progress-bar-fill" style={{ width: `${progressPercentage}%` }} />
          <div
            className="progress-bar-handle"
            style={{ left: `${progressPercentage}%` }}
            onMouseDown={handleDragStart}
            onMouseUp={handleDragEnd}
          />
        </div>
      </div>

      <div className="track-time total-time">{formatTime(duration)}</div>
    </div>
  );
};

export default TrackProgress;
