import React from 'react';
import './PlaylistItem.css';
import { SpotifyPlaylist } from './types';

interface PlaylistItemProps {
  playlist: SpotifyPlaylist;
  isActive: boolean;
  onSelect: (playlist: SpotifyPlaylist) => void;
}

/**
 * PlaylistItem component displays a single playlist with its image and name
 * It handles the click event to select the playlist
 */
const PlaylistItem: React.FC<PlaylistItemProps> = ({ playlist, isActive, onSelect }) => {
  // Ensure images array exists and has items before accessing
  const hasImages = playlist.images && playlist.images.length > 0;

  return (
    <div className={`playlist-item ${isActive ? 'active' : ''}`} onClick={() => onSelect(playlist)}>
      {hasImages && (
        <img src={playlist.images[0].url} alt={playlist.name} className="playlist-image" />
      )}
      <span className="playlist-name">{playlist.name}</span>
    </div>
  );
};

export default PlaylistItem;
