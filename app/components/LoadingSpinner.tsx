import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner component displays a spinning animation
 * Used to indicate loading states throughout the application
 */
const LoadingSpinner: React.FC = () => {
  return (
    <div className="loading-spinner-container">
      <div className="loading-spinner"></div>
    </div>
  );
};

export default LoadingSpinner;
