import React, { useState, useEffect, useRef, useCallback } from 'react';
import './TrackProgress.css';

// Format milliseconds to MM:SS format
function formatTime(ms: number): string {
  if (!ms || isNaN(ms)) return '0:00';

  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate position from mouse event
function calculatePositionFromMouse(
  e: MouseEvent | React.MouseEvent,
  element: HTMLDivElement,
  duration: number
): number {
  const rect = element.getBoundingClientRect();
  const mousePosition = e.clientX - rect.left;
  const percentage = Math.max(0, Math.min(1, mousePosition / rect.width));
  return Math.floor(percentage * duration);
}

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
function TrackProgress({ position, duration, isPaused, onSeek }: TrackProgressProps) {
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
  // Ref to track if we just performed a seek operation
  const justSeekedRef = useRef<boolean>(false);

  // Calculate progress percentage for the progress bar width
  const progressPercentage = duration > 0 ? (displayPosition / duration) * 100 : 0;

  // Handle animation frame updates for smooth progress bar movement
  const updateProgressBar = useCallback(() => {
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
  }, [isPaused, isDragging, duration]);

  // Update display position when the actual position changes (if not dragging)
  useEffect(() => {
    if (!isDragging) {
      // Reset the animation and update display position
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }

      // Update the display position to match the actual position
      setDisplayPosition(position);
      lastUpdateTimeRef.current = Date.now();
      justSeekedRef.current = true;

      // Start a new animation if not paused
      if (!isPaused) {
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      }
    }
  }, [position, isPaused, isDragging, updateProgressBar]);

  // Set up and clean up the animation frame
  useEffect(() => {
    // If paused or dragging, don't start the animation
    if (isPaused || isDragging) {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    // If we just performed a seek, don't start a new animation (handled by position effect)
    if (justSeekedRef.current) {
      justSeekedRef.current = false;
      return;
    }

    // Start the animation
    lastUpdateTimeRef.current = Date.now();
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(updateProgressBar);
    }

    // Clean up on unmount or when dependencies change
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isPaused, isDragging, updateProgressBar]);

  // Handle click on progress bar
  function handleProgressBarClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!progressBarRef.current) return;

    const newPosition = calculatePositionFromMouse(e, progressBarRef.current, duration);
    setDisplayPosition(newPosition);
    onSeek(newPosition);
    justSeekedRef.current = true;
  }

  // Handle drag start
  function handleDragStart() {
    setIsDragging(true);

    // Cancel any ongoing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }

  // Handle drag end
  function handleDragEnd() {
    if (isDragging) {
      onSeek(displayPosition);
      setIsDragging(false);
      justSeekedRef.current = true;

      // Restart animation if not paused
      if (!isPaused) {
        lastUpdateTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      }
    }
  }

  // Handle drag movement
  function handleDrag(e: React.MouseEvent<HTMLDivElement>) {
    if (!isDragging || !progressBarRef.current) return;

    const newPosition = calculatePositionFromMouse(e, progressBarRef.current, duration);
    setDisplayPosition(newPosition);
  }

  // Set up event listeners for drag outside the component
  useEffect(() => {
    if (!isDragging) return;

    function handleMouseMove(e: MouseEvent) {
      if (!progressBarRef.current) return;
      const newPosition = calculatePositionFromMouse(e, progressBarRef.current, duration);
      setDisplayPosition(newPosition);
    }

    function handleMouseUp() {
      onSeek(displayPosition);
      setIsDragging(false);
      justSeekedRef.current = true;

      // Restart animation if not paused
      if (!isPaused) {
        lastUpdateTimeRef.current = Date.now();
        animationFrameRef.current = requestAnimationFrame(updateProgressBar);
      }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, duration, displayPosition, onSeek, isPaused, updateProgressBar]);

  // Clean up animation frame on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current !== null) {
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
}

export default TrackProgress;
