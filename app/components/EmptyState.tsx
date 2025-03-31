import React from 'react';
import './EmptyState.css';

interface EmptyStateProps {
  message: string;
  subMessage?: string;
}

/**
 * EmptyState component displays a message when no content is available
 * Used for empty playlists, tracks, or other content areas
 */
const EmptyState: React.FC<EmptyStateProps> = ({ message, subMessage }) => {
  return (
    <div className="empty-state">
      <p>{message}</p>
      {subMessage && <p className="empty-state-subtitle">{subMessage}</p>}
    </div>
  );
};

export default EmptyState;
