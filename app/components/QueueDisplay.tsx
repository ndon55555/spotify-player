import React, { useState, useEffect, useCallback } from 'react';
import './QueueDisplay.css';
import { SpotifyTrack } from './types';
import TrackItem from './TrackItem';

const SPOTIFY_API = 'https://api.spotify.com/v1';

interface QueueDisplayProps {
  token?: string;
  deviceIdRef?: React.RefObject<string | null>;
  playlistUri?: string;
  queueTracks?: Array<SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull>;
  isLoading?: boolean;
  onPlay?: (trackUri: string, playlistUri?: string) => void;
}

/**
 * QueueDisplay component shows the upcoming tracks in the queue
 * Uses the queue array from the /me/player/queue API endpoint
 * Contains both UI rendering and queue management logic
 */
const QueueDisplay: React.FC<QueueDisplayProps> = ({
  token,
  deviceIdRef,
  playlistUri,
  queueTracks: externalQueueTracks,
  isLoading: externalIsLoading,
  onPlay: externalOnPlay,
}) => {
  // Internal state - used when not provided by props
  const [internalQueueTracks, setInternalQueueTracks] = useState<
    Array<SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull>
  >([]);
  const [internalIsLoading, setInternalIsLoading] = useState<boolean>(false);
  const queueTracks = externalQueueTracks || internalQueueTracks;
  const isLoading = externalIsLoading !== undefined ? externalIsLoading : internalIsLoading;

  // Fetch queue from Spotify API
  const fetchQueue = useCallback(async () => {
    if (!token) return;

    try {
      setInternalIsLoading(true);
      const response = await fetch(`${SPOTIFY_API}/me/player/queue`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 204) {
          // No content - empty queue
          setInternalQueueTracks([]);
          return;
        }
        throw new Error(`Failed to fetch queue: ${response.status}`);
      }

      const data = await response.json();
      if (data && data.queue) {
        setInternalQueueTracks(data.queue);
      } else {
        setInternalQueueTracks([]);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setInternalIsLoading(false);
    }
  }, [token]);

  // Play a specific track
  const playTrack = async (trackUri: string, playlistUri?: string) => {
    // Use callback if provided, otherwise use player API
    if (externalOnPlay) {
      externalOnPlay(trackUri, playlistUri);
      return;
    }
    if (!token || !deviceIdRef?.current) return;

    try {
      // If playlistUri is provided, play the track in the context of that playlist
      // Prepare the common fetch options
      const body = playlistUri
        ? {
            context_uri: playlistUri,
            offset: {
              uri: trackUri,
            },
          }
        : {
            uris: [trackUri],
          };
      const fetchOptions = {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      };

      // Make a single fetch call with the appropriate body
      await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, fetchOptions);

      // Fetch the updated queue after playing a track
      fetchQueue();
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Fetch queue when component mounts or token changes - only if using internal state
  useEffect(() => {
    if (token && externalQueueTracks === undefined) {
      fetchQueue();
      // Set up interval to periodically refresh the queue
      const intervalId = setInterval(fetchQueue, 10000);
      return () => clearInterval(intervalId);
    }
  }, [token, externalQueueTracks, fetchQueue]);

  if (isLoading) {
    return (
      <div className="queue-display">
        <h3 className="queue-title">Next in Queue</h3>
        <p className="queue-empty-message">Loading queue...</p>
      </div>
    );
  }

  if (!queueTracks || queueTracks.length === 0) {
    return (
      <div className="queue-display">
        <h3 className="queue-title">Next in Queue</h3>
        <p className="queue-empty-message">No upcoming tracks in queue</p>
      </div>
    );
  }

  return (
    <div className="queue-display">
      <h3 className="queue-title">Next in Queue</h3>
      <div className="queue-tracks-container">
        {queueTracks.map((track, index) => (
          <TrackItem
            key={`queue-${track.id}-${index}`}
            track={track as SpotifyTrack}
            isActive={false}
            onPlay={playTrack}
            index={index + 1}
            playlistUri={playlistUri}
          />
        ))}
      </div>
    </div>
  );
};

export default QueueDisplay;
