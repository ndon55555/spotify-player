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
  // State to track the displayed position (which may differ from actual position during dragging)
  const [displayPosition, setDisplayPosition] = useState(position);
  // State to track if user is dragging the progress handle
  const [isDragging, setIsDragging] = useState(false);
  // Ref to the progress bar element for calculating click/drag positions
  const progressBarRef = useRef<HTMLDivElement>(null);
  // Ref to store the last time we updated the position
  const lastUpdateTimeRef = useRef<number>(Date.now());
  // Ref to store the animation frame ID
  const animationFrameRef = useRef<number | null>(null);

  // Format milliseconds to MM:SS format
  const formatTime = (ms: number): string => {
    if (!ms || isNaN(ms)) return '0:00';

    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Calculate progress percentage for the progress bar width
  const progressPercentage = duration > 0 ? (displayPosition / duration) * 100 : 0;

  // Update display position when the actual position changes (if not dragging)
  useEffect(() => {
    if (!isDragging) {
      setDisplayPosition(position);
      lastUpdateTimeRef.current = Date.now();
    }
  }, [position, isDragging]);

  // Handle animation frame updates for smooth progress bar movement
  const updateProgressBar = () => {
    if (isPaused || isDragging) {
      // If paused or dragging, don't update the position
      animationFrameRef.current = null;
      return;
    }

    const now = Date.now();
    const elapsed = now - lastUpdateTimeRef.current;
    lastUpdateTimeRef.current = now;

    // Update the display position based on elapsed time
    setDisplayPosition(prev => Math.min(prev + elapsed, duration));

    // Request the next animation frame
    animationFrameRef.current = requestAnimationFrame(updateProgressBar);
  };

  // Set up and clean up the animation frame
  useEffect(() => {
    // If paused or dragging, don't start the animation
    if (isPaused || isDragging) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // Start the animation
    lastUpdateTimeRef.current = Date.now();
    animationFrameRef.current = requestAnimationFrame(updateProgressBar);

    // Clean up on unmount or when dependencies change
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
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

    // Cancel any ongoing animation
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    if (isDragging) {
      onSeek(displayPosition);
      setIsDragging(false);

      // Restart animation if not paused
      if (!isPaused) {
        lastUpdateTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      }
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

      // Restart animation if not paused
      if (!isPaused) {
        lastUpdateTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, displayPosition, onSeek, isPaused]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

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
