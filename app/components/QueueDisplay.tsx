import React from 'react';
import './QueueDisplay.css';
import { SpotifyTrack } from './types';
import TrackItem from './TrackItem';

interface QueueDisplayProps {
  queueTracks: Array<SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull>;
  isLoading: boolean;
  onPlay: (trackUri: string) => void;
}

/**
 * QueueDisplay component shows the upcoming tracks in the queue
 * Uses the queue array from the /me/player/queue API endpoint
 */
const QueueDisplay: React.FC<QueueDisplayProps> = ({ queueTracks, isLoading, onPlay }) => {
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
            onPlay={onPlay}
            index={index + 1}
          />
        ))}
      </div>
    </div>
  );
};

export default QueueDisplay;
