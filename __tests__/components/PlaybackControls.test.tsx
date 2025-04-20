// @ts-nocheck

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, screen, fireEvent } from '@testing-library/react';
import PlaybackControls from '../../app/components/PlaybackControls';
import '@testing-library/jest-dom';

describe('PlaybackControls', () => {
  const defaultProps = {
    isPaused: true,
    onTogglePlay: jest.fn(),
    onPreviousTrack: jest.fn(),
    onNextTrack: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the play button when paused', () => {
    const { container } = render(<PlaybackControls {...defaultProps} />);

    // The play button should be visible when isPaused is true
    const playPauseButton = container.querySelector('.play-pause-button');
    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(playPauseButton).toBeInTheDocument();
    // Check that it contains the play icon path
    const svgPath = playPauseButton?.querySelector('path');
    expect(svgPath?.getAttribute('d')).toContain('M14.752 11.168');
  });

  it('renders the pause button when not paused', () => {
    const { container } = render(<PlaybackControls {...defaultProps} isPaused={false} />);

    // The pause button should be visible when isPaused is false
    const playPauseButton = container.querySelector('.play-pause-button');
    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(playPauseButton).toBeInTheDocument();
    // Check that it contains the pause icon path
    const svgPath = playPauseButton?.querySelector('path');
    expect(svgPath?.getAttribute('d')).toContain('M10 9v6m4-6v6');
  });

  it('calls onTogglePlay when play/pause button is clicked', () => {
    const { container } = render(<PlaybackControls {...defaultProps} />);

    const playPauseButton = container.querySelector('.play-pause-button');
    if (playPauseButton) {
      fireEvent.click(playPauseButton);
    }

    expect(defaultProps.onTogglePlay).toHaveBeenCalledTimes(1);
  });

  it('calls onPreviousTrack when previous track button is clicked', () => {
    const { container } = render(<PlaybackControls {...defaultProps} />);

    const prevButton = container.querySelector('.prev-button');
    if (prevButton) {
      fireEvent.click(prevButton);
    }

    expect(defaultProps.onPreviousTrack).toHaveBeenCalledTimes(1);
  });

  it('calls onNextTrack when next track button is clicked', () => {
    const { container } = render(<PlaybackControls {...defaultProps} />);

    const nextButton = container.querySelector('.next-button');
    if (nextButton) {
      fireEvent.click(nextButton);
    }

    expect(defaultProps.onNextTrack).toHaveBeenCalledTimes(1);
  });

  it('renders all three control buttons', () => {
    const { container } = render(<PlaybackControls {...defaultProps} />);

    const buttons = container.querySelectorAll('button');
    expect(buttons.length).toBe(3);
  });
});
