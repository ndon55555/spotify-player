import React from 'react';
import './TrackItem.css';
import { SpotifyTrack } from './types';

interface TrackItemProps {
    track: SpotifyTrack;
    isActive: boolean;
    onPlay: (trackUri: string) => void;
    index: number; // Track index in the playlist (1-based)
}

/**
 * TrackItem component displays a single track with its album image, name, and artists
 * It handles the click event to play the track
 */
const TrackItem: React.FC<TrackItemProps> = ({ track, isActive, onPlay, index }) => {
    return (
        <div 
            className={`track-item ${isActive ? 'active' : ''}`}
            onClick={() => onPlay(track.uri)}
        >
            <div className="track-number">{index}</div>
            {track.album.images && track.album.images.length > 0 ? (
                <img 
                    src={track.album.images[0].url} 
                    alt={track.name} 
                    className="track-image"
                />
            ) : (
                <div className="track-image-placeholder">
                    <svg xmlns="http://www.w3.org/2000/svg" className="track-placeholder-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                    </svg>
                </div>
            )}
            <div className="track-info">
                <div className="track-name">{track.name}</div>
                <div className="track-artist">{track.artists.map(artist => artist.name).join(', ')}</div>
            </div>
        </div>
    );
};

export default TrackItem;
