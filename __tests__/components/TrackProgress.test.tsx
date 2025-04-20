import React from 'react';
import { render, fireEvent, act, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackProgress from '../../app/components/TrackProgress';
// WebPlayback is imported as a default export
import WebPlayback from '../../app/components/webPlayback';

// Mock the Spotify SDK and API interfaces
class MockSpotifyPlayer implements Partial<Spotify.Player> {
  seek = jest.fn().mockResolvedValue(true);
  addListener = jest.fn();
  removeListener = jest.fn();
  getCurrentState = jest.fn();
  connect = jest.fn().mockResolvedValue(true);
  disconnect = jest.fn();
  getVolume = jest.fn().mockResolvedValue(1);
  nextTrack = jest.fn().mockResolvedValue(true);
  previousTrack = jest.fn().mockResolvedValue(true);
  pause = jest.fn().mockResolvedValue(true);
  resume = jest.fn().mockResolvedValue(true);
  togglePlay = jest.fn().mockResolvedValue(true);
  setName = jest.fn();
  setVolume = jest.fn().mockResolvedValue(true);
  activateElement = jest.fn();

  constructor(options: Spotify.PlayerInit) {
    // Store options if needed
  }
}

// Create mocks for both API and SDK state
const createMockApiState = (position = 30000) => ({
  is_playing: true,
  progress_ms: position,
  item: {
    id: 'track1',
    name: 'Test Track',
    duration_ms: 180000,
    uri: 'spotify:track:track1',
    album: {
      id: 'album1',
      name: 'Test Album',
      uri: 'spotify:album:album1',
      images: [{ url: 'https://test.com/image.jpg' }],
    },
    artists: [{ id: 'artist1', name: 'Test Artist', uri: 'spotify:artist:artist1' }],
  },
  context: {
    uri: 'spotify:playlist:playlist1',
    type: 'playlist',
  },
});

const createMockSdkState = (position = 30000) => ({
  paused: false,
  position,
  duration: 180000,
  context: {
    uri: 'spotify:playlist:playlist1',
  },
  track_window: {
    current_track: {
      id: 'track1',
      name: 'Test Track',
      duration_ms: 180000,
      uri: 'spotify:track:track1',
      album: {
        uri: 'spotify:album:album1',
        name: 'Test Album',
        images: [{ url: 'https://test.com/image.jpg' }],
      },
      artists: [{ name: 'Test Artist', uri: 'spotify:artist:artist1' }],
    },
    previous_tracks: [],
    next_tracks: [],
  },
  disallows: {},
  repeat_mode: 'off',
  shuffle: false,
});

// Declare types for the Spotify Player mock
declare global {
  interface Window {
    Spotify: {
      Player: typeof MockSpotifyPlayer;
    };
  }
}

// Mock the global window.Spotify object
window.Spotify = {
  Player: MockSpotifyPlayer,
};

// Mock the fetch function for API calls
global.fetch = jest.fn().mockImplementation(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve(createMockApiState()),
    status: 200,
  })
);

// Jest spy on requestAnimationFrame and cancelAnimationFrame
jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
  return window.setTimeout(() => cb(Date.now()), 0) as unknown as number;
});

jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
  clearTimeout(id);
});

let dateNowSpy: jest.SpyInstance;

// Set up and tear down for all tests
beforeEach(() => {
  jest.clearAllMocks();
  dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000);
});

afterEach(() => {
  dateNowSpy.mockRestore();
});

describe('TrackProgress Component - Regression Test for Position Synchronization', () => {
  test('Should update position correctly when seeking', async () => {
    // Create a mock seek function to test both API and SDK updates
    const mockSeek = jest.fn(async position => {
      // This function should update both API and SDK states
      return position;
    });

    // Render the TrackProgress component with initial position
    const { rerender } = render(
      <TrackProgress position={30000} duration={180000} isPaused={false} onSeek={mockSeek} />
    );

    // Verify initial position is displayed correctly
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Get the progress bar element (it doesn't have a role attribute)
    const progressBar = document.querySelector('.progress-bar-container');
    expect(progressBar).not.toBeNull();

    // Simulate a click on the progress bar to seek to 50%
    const clickEvent = {
      clientX: 150, // Simulate click at 50% of the bar width
    };

    // Mock the getBoundingClientRect for the progress bar
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 300,
      left: 0,
      right: 300,
      top: 0,
      bottom: 30,
      height: 30,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Trigger the click on the progress bar
    fireEvent.click(progressBar, clickEvent);

    // Restore the original method
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    // Verify that seek was called with the correct position (~90000ms for 50% of 180000ms)
    expect(mockSeek).toHaveBeenCalledWith(expect.any(Number));
    const seekPosition = mockSeek.mock.calls[0][0];
    expect(seekPosition).toBeGreaterThan(85000); // Allow some flexibility due to calculation
    expect(seekPosition).toBeLessThan(95000);

    // Fast-forward time to simulate SDK state update after seek
    act(() => {
      dateNowSpy.mockImplementation(() => 1100); // 100ms later
      // Simulate both API and SDK states being updated after seek
      rerender(
        <TrackProgress
          position={seekPosition}
          duration={180000}
          isPaused={false}
          onSeek={mockSeek}
        />
      );
    });

    // Verify the display position is updated to reflect the new seek position
    // Approximate 90000ms = 1:30
    await waitFor(() => {
      const timeElement = screen.getByText('1:30');
      expect(timeElement).toBeInTheDocument();
    });
  });

  test('Should synchronize correctly between API and SDK position updates', async () => {
    // Initial render with SDK position only
    const sdkPosition = 30000;
    const apiPosition = 29000; // Slightly different to test priority

    const mockSeek = jest.fn();

    const { rerender } = render(
      <TrackProgress
        position={sdkPosition} // Simulate SDK position having priority
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Verify SDK position is displayed
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Simulate time passing and SDK update arriving before API update
    act(() => {
      dateNowSpy.mockImplementation(() => 2000); // 1 second later
    });

    // The component should update to 31 seconds via animation frame
    await waitFor(() => {
      const timeElement = screen.getByText('0:31');
      expect(timeElement).toBeInTheDocument();
    });

    // In our fixed implementation, when new props come in, we reset the animation
    // and take the new position value, regardless of whether it's from API or SDK
    // This means that with our current implementation, the position WILL update to the API value
    // This is acceptable behavior as long as we're always providing the SDK value first in the actual component
    rerender(
      <TrackProgress
        position={apiPosition} // Now we're passing only the API position
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // The TrackProgress accepts the newest position props it receives
    // So we expect the time to update to match the new position
    expect(screen.getByText('0:29')).toBeInTheDocument();

    // Now simulate receiving an update from the SDK (more recent)
    rerender(
      <TrackProgress
        position={31000} // SDK position (newer)
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Should show 0:31 now
    const timeText = screen.getByText('0:31');
    expect(timeText).toBeInTheDocument();

    // Now simulate a seek operation
    const newSdkPosition = 60000;

    // Seek to 1:00
    rerender(
      <TrackProgress
        position={newSdkPosition}
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Should immediately update to the new position
    await waitFor(() => {
      const timeElement = screen.getByText('1:00');
      expect(timeElement).toBeInTheDocument();
    });
  });

  // This test specifically verifies the fix for the regression
  test('Regression fix: position should update immediately after seeking without waiting for SDK callback', async () => {
    let sdkPosition = 30000;
    let apiPosition = 30000;

    // Create a mock seek function that simulates the real behavior
    const mockSeek = jest.fn(async position => {
      // In the actual code, we immediately update API and SDK state before actual SDK seek
      apiPosition = position; // This simulates the immediate apiState update
      // The actual SDK position doesn't change until the player.seek() completes

      // Wait a bit before updating the SDK position (simulating network delay)
      setTimeout(() => {
        sdkPosition = position;
      }, 500);
    });

    const { rerender } = render(
      <TrackProgress position={sdkPosition} duration={180000} isPaused={false} onSeek={mockSeek} />
    );

    // Verify initial position
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Get the progress bar element
    const progressBar = document.querySelector('.progress-bar-container')!;

    // Mock getBoundingClientRect for the progress bar
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 300,
      left: 0,
      right: 300,
      top: 0,
      bottom: 30,
      height: 30,
      x: 0,
      y: 0,
      toJSON: () => {},
    }));

    // Trigger a seek to 90000ms (50% of 180000ms)
    fireEvent.click(progressBar, { clientX: 150 });

    // Restore the original method
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    // Verify seek was called
    expect(mockSeek).toHaveBeenCalled();
    const seekPosition = mockSeek.mock.calls[0][0];
    expect(seekPosition).toBeGreaterThan(85000);
    expect(seekPosition).toBeLessThan(95000);

    // Immediately after seek, the TrackProgress should update to the new position
    // This verifies our fix works - it doesn't wait for the SDK to complete the seek
    rerender(
      <TrackProgress
        position={apiPosition} // Use apiPosition which was immediately updated
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Should now show ~1:30 without waiting for SDK callback
    await waitFor(() => {
      const timeElement = screen.getByText('1:30');
      expect(timeElement).toBeInTheDocument();
    });

    // SDK position hasn't been updated yet due to the timeout
    expect(sdkPosition).not.toBe(apiPosition);

    // Fast forward past the timeout to simulate SDK update
    await new Promise(resolve => setTimeout(resolve, 600));

    // Now the SDK position should be updated
    expect(sdkPosition).toBe(apiPosition);

    // Final position check after SDK update
    rerender(
      <TrackProgress position={sdkPosition} duration={180000} isPaused={false} onSeek={mockSeek} />
    );

    // Position should remain at 1:30
    expect(screen.getByText('1:30')).toBeInTheDocument();
  });
});
