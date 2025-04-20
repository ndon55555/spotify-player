// @ts-nocheck

import { describe, expect, it } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import CurrentTrackInfo from '../../app/components/CurrentTrackInfo';
import { mockTrack } from '../mocks/spotifyMocks';
import '@testing-library/jest-dom';

describe('CurrentTrackInfo', () => {
  const defaultProps = {
    track: mockTrack,
  };

  it('renders track information correctly', () => {
    const { container } = render(<CurrentTrackInfo {...defaultProps} />);

    // Check for text content in the component
    expect(container.textContent).toContain(mockTrack.name);
    expect(container.textContent).toContain(mockTrack.artists[0].name);
    expect(container.textContent).toContain(mockTrack.album.name);

    // Check for the image
    const img = container.querySelector('img');
    expect(img).toHaveAttribute('alt', mockTrack.name);
  });

  it('handles missing album image gracefully', () => {
    const mockTrackWithoutImage = {
      ...mockTrack,
      album: {
        ...mockTrack.album,
        images: [],
      },
    };

    const { container } = render(<CurrentTrackInfo track={mockTrackWithoutImage} />);
    const img = container.querySelector('img');

    expect(img).toBeNull();
  });

  it('renders multiple artists properly', () => {
    const mockTrackWithMultipleArtists = {
      ...mockTrack,
      artists: [{ name: 'Artist 1' }, { name: 'Artist 2' }],
    };

    const { container } = render(<CurrentTrackInfo track={mockTrackWithMultipleArtists} />);

    expect(container.textContent).toContain('Artist 1, Artist 2');
  });

  it('applies the correct CSS classes', () => {
    const { container } = render(<CurrentTrackInfo {...defaultProps} />);

    expect(container.querySelector('.current-track-info')).toBeInTheDocument();
    expect(container.querySelector('.current-track-image')).toBeInTheDocument();
    expect(container.querySelector('.current-track-title')).toBeInTheDocument();
    expect(container.querySelector('.current-track-artist')).toBeInTheDocument();
    expect(container.querySelector('.current-track-album')).toBeInTheDocument();
  });
});
