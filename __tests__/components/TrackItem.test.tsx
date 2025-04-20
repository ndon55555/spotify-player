// @ts-nocheck

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { render, fireEvent } from '@testing-library/react';
import TrackItem from '../../app/components/TrackItem';
import { mockTrack } from '../mocks/spotifyMocks';
import '@testing-library/jest-dom';

describe('TrackItem', () => {
  const defaultProps = {
    track: {
      ...mockTrack,
      uri: 'spotify:track:mock-track-id',
    },
    isActive: false,
    onPlay: jest.fn(),
    index: 1,
    playlistUri: 'spotify:playlist:mock-playlist-id',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders track information correctly', () => {
    const { container } = render(<TrackItem {...defaultProps} />);

    expect(container.textContent).toContain(defaultProps.track.name);
    expect(container.textContent).toContain(defaultProps.track.artists[0].name);
    expect(container.textContent).toContain(defaultProps.index.toString());

    const img = container.querySelector('img');
    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(img).toHaveAttribute('alt', defaultProps.track.name);
  });

  it('applies active class when track is active', () => {
    const { container } = render(<TrackItem {...defaultProps} isActive={true} />);
    const trackItem = container.querySelector('.track-item');

    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(trackItem).toHaveClass('active');
  });

  it('does not apply active class when track is not active', () => {
    const { container } = render(<TrackItem {...defaultProps} />);
    const trackItem = container.querySelector('.track-item');

    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(trackItem).not.toHaveClass('active');
  });

  it('calls onPlay with track URI and playlist URI when clicked', () => {
    const { container } = render(<TrackItem {...defaultProps} />);

    const trackItem = container.querySelector('.track-item');
    if (trackItem) {
      fireEvent.click(trackItem);
    }

    expect(defaultProps.onPlay).toHaveBeenCalledWith(
      defaultProps.track.uri,
      defaultProps.playlistUri
    );
  });

  it('shows placeholder when track has no album images', () => {
    const trackWithoutImage = {
      ...defaultProps.track,
      album: {
        ...defaultProps.track.album,
        images: [],
      },
    };

    const { container } = render(<TrackItem {...defaultProps} track={trackWithoutImage} />);

    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(container.querySelector('.track-image-placeholder')).toBeInTheDocument();
    // @ts-ignore - Jest DOM matchers are not being recognized by TypeScript
    expect(container.querySelector('.track-placeholder-icon')).toBeInTheDocument();
  });

  it('does not include playlist URI when it is not provided', () => {
    const { container } = render(<TrackItem {...defaultProps} playlistUri={undefined} />);

    const trackItem = container.querySelector('.track-item');
    if (trackItem) {
      fireEvent.click(trackItem);
    }

    expect(defaultProps.onPlay).toHaveBeenCalledWith(defaultProps.track.uri, undefined);
  });
});
