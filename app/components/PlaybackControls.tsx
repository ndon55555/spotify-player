import React from 'react';
import './PlaybackControls.css';

interface PlaybackControlsProps {
    isPaused: boolean;
    onTogglePlay: () => void;
}

/**
 * PlaybackControls component displays play/pause button
 * It toggles between play and pause icons based on the current playback state
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({ isPaused, onTogglePlay }) => {
    return (
        <div className="playback-controls">
            <button 
                onClick={onTogglePlay}
                className="play-pause-button"
            >
                {isPaused ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="play-pause-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    </svg>
                ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="play-pause-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                )}
            </button>
        </div>
    );
};

export default PlaybackControls;
