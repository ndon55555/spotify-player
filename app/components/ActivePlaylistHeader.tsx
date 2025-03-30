import React from 'react';
import './ActivePlaylistHeader.css';
import { SpotifyPlaylist } from './types';

interface ActivePlaylistHeaderProps {
    playlist: SpotifyPlaylist;
}

/**
 * ActivePlaylistHeader component displays information about the currently selected playlist
 * Shows playlist artwork and name
 */
const ActivePlaylistHeader: React.FC<ActivePlaylistHeaderProps> = ({ playlist }) => {
    return (
        <div className="active-playlist-header">
            {playlist.images.length > 0 && (
                <img 
                    src={playlist.images[0].url} 
                    alt={playlist.name} 
                    className="active-playlist-image"
                />
            )}
            <div>
                <h2 className="active-playlist-title">{playlist.name}</h2>
                <p className="active-playlist-subtitle">Playlist</p>
            </div>
        </div>
    );
};

export default ActivePlaylistHeader;
