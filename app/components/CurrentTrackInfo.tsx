import React from 'react';
import './CurrentTrackInfo.css';
import { SpotifyTrack } from './types';

interface CurrentTrackInfoProps {
  track: SpotifyTrack;
}

/**
 * CurrentTrackInfo component displays information about the currently playing track
 * Shows album artwork, track name, artist names, and album name
 */
const CurrentTrackInfo: React.FC<CurrentTrackInfoProps> = ({ track }) => {
  // Ensure we have album images before trying to access them
  const albumImageUrl =
    track.album.images && track.album.images.length > 0 ? track.album.images[0].url : '';

  return (
    <div className="current-track-info">
      {albumImageUrl && (
        <img src={albumImageUrl} alt={track.name} className="current-track-image" />
      )}
      <div>
        <h3 className="current-track-title">{track.name}</h3>
        <p className="current-track-artist">
          {track.artists.map(artist => artist.name).join(', ')}
        </p>
        <p className="current-track-album">{track.album.name}</p>
      </div>
    </div>
  );
};

export default CurrentTrackInfo;
