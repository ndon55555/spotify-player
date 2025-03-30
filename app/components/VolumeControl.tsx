import React from 'react';
import './VolumeControl.css';

interface VolumeControlProps {
    volume: number;
    onVolumeChange: (volume: number) => void;
}

/**
 * VolumeControl component displays a volume slider with an icon
 * It allows users to adjust the playback volume
 */
const VolumeControl: React.FC<VolumeControlProps> = ({ volume, onVolumeChange }) => {
    return (
        <div className="volume-control">
            <svg xmlns="http://www.w3.org/2000/svg" className="volume-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            </svg>
            <input 
                type="range" 
                min="0" 
                max="100" 
                value={volume} 
                onChange={(e) => onVolumeChange(Number(e.target.value))}
                className="volume-slider"
            />
        </div>
    );
};

export default VolumeControl;
