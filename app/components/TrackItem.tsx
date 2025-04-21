import React from 'react';
import './TrackItem.css';
import { SpotifyTrack } from './types';

const SPOTIFY_API = 'https://api.spotify.com/v1';

interface TrackItemProps {
  track: SpotifyTrack;
  isActive: boolean;
  onPlay?: (trackUri: string, playlistUri?: string) => void;
  index: number; // Track index in the playlist (1-based)
  playlistUri?: string; // Add playlist URI for context
  token?: string;
  deviceIdRef?: React.RefObject<string | null>;
}

/**
 * TrackItem component displays a single track with its album image, name, and artists
 * It handles the click event to play the track
 * Now includes its own business logic for playing tracks
 */
const TrackItem: React.FC<TrackItemProps> = ({
  track,
  isActive,
  onPlay,
  index,
  playlistUri,
  token,
  deviceIdRef,
}) => {
  // Play this track directly if token and deviceId are provided
  const handlePlay = async () => {
    // If parent component provided an onPlay function, use that
    if (onPlay) {
      onPlay(track.uri, playlistUri);
      return;
    }

    // Otherwise use our own implementation if we have the required props
    if (!token || !deviceIdRef || !deviceIdRef.current) return;

    try {
      // If playlistUri is provided, play the track in the context of that playlist
      // Prepare the common fetch options
      const body = playlistUri
        ? {
            context_uri: playlistUri,
            offset: {
              uri: track.uri,
            },
          }
        : {
            uris: [track.uri],
          };

      const fetchOptions = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };

      // Make the API call to play the track
      await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, fetchOptions);
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  return (
    <div className={`track-item ${isActive ? 'active' : ''}`} onClick={handlePlay}>
      <div className="track-number">{index}</div>
      {track.album.images && track.album.images.length > 0 ? (
        <img src={track.album.images[0].url} alt={track.name} className="track-image" />
      ) : (
        <div className="track-image-placeholder">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="track-placeholder-icon"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
            />
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
