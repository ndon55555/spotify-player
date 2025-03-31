import React from 'react';
import './QueueDisplay.css';
import { QueueTrack, adaptTrackToSpotifyTrack } from './types';
import TrackItem from './TrackItem';

interface QueueDisplayProps {
  nextTracks: QueueTrack[];
  onPlay: (trackUri: string) => void;
}

/**
 * QueueDisplay component shows the upcoming tracks in the queue
 * Uses the next_tracks array from PlaybackState.track_window
 */
const QueueDisplay: React.FC<QueueDisplayProps> = ({ nextTracks, onPlay }) => {
  if (!nextTracks || nextTracks.length === 0) {
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
        {nextTracks.map((track, index) => (
          <TrackItem
            key={`queue-${track.id || track.uri}-${index}`}
            track={adaptTrackToSpotifyTrack(track)}
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
