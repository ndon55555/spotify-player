import React from 'react';
import { render, fireEvent, act, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrackProgress from '../../app/components/TrackProgress';

// Mock the requestAnimationFrame and cancelAnimationFrame for predictable timing
jest.spyOn(window, 'requestAnimationFrame').mockImplementation(cb => {
  return setTimeout(() => cb(Date.now()), 0) as unknown as number;
});

jest.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
  clearTimeout(id as unknown as NodeJS.Timeout);
});

let dateNowSpy: jest.SpyInstance;

// Set up and tear down for all tests
beforeEach(() => {
  jest.useFakeTimers();
  dateNowSpy = jest.spyOn(Date, 'now').mockImplementation(() => 1000);
});

afterEach(() => {
  dateNowSpy.mockRestore();
  jest.useRealTimers();
});

describe('TrackProgress Position Synchronization', () => {
  test('Should update visual position immediately after seeking', async () => {
    // Mock the seek function - in the real app, this updates both SDK and API states
    const mockSeek = jest.fn();

    // Utility function to mock the getBoundingClientRect for our tests
    const mockProgressBarRect = () => {
      const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
      Element.prototype.getBoundingClientRect = jest.fn(() => ({
        width: 300,
        left: 0,
        right: 300,
        top: 0,
        bottom: 10,
        height: 10,
        x: 0,
        y: 0,
        toJSON: () => ({}),
      }));
      return () => {
        Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;
      };
    };

    // Render TrackProgress with initial position
    const { rerender } = render(
      <TrackProgress
        position={30000} // 30 seconds
        duration={180000} // 3 minutes
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Verify initial time display shows 0:30
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Get the progress bar element
    const progressBar = document.querySelector('.progress-bar-container');
    expect(progressBar).not.toBeNull();

    // Set up the mock rect before clicking
    const restoreRect = mockProgressBarRect();

    // Simulate a click at 50% of the bar (should seek to 50% of duration = 90000ms)
    fireEvent.click(progressBar!, { clientX: 150 });

    // Restore the original getBoundingClientRect
    restoreRect();

    // Verify seek was called with ~90000ms (slight variance allowed due to calculation)
    expect(mockSeek).toHaveBeenCalled();
    const seekPosition = mockSeek.mock.calls[0][0];
    expect(seekPosition).toBeGreaterThan(85000);
    expect(seekPosition).toBeLessThan(95000);

    // In our fix, the component should immediately update its displayPosition
    // and visual indicators upon receiving a new position prop

    // Simulate what happens in the app: seekToPosition updates both SDK and API states
    rerender(
      <TrackProgress
        position={seekPosition} // The new position after seeking
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // The time display should now show ~1:30 (90 seconds)
    await waitFor(() => {
      const timeText = screen.getByText('1:30');
      expect(timeText).toBeInTheDocument();
    });

    // Advance time to verify the animation continues from the new position
    act(() => {
      dateNowSpy.mockImplementation(() => 2000); // 1 second later
      jest.advanceTimersByTime(1000);
    });

    // Time should now show 1:31 (position should advance by 1 second)
    await waitFor(() => {
      const timeElement = screen.getByText('1:31');
      expect(timeElement).toBeInTheDocument();
    });
  });

  test('Should maintain smooth animation after seek operations', async () => {
    const mockSeek = jest.fn();

    const { rerender } = render(
      <TrackProgress
        position={30000} // 30 seconds
        duration={180000} // 3 minutes
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Time starts at 0:30
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Advance time by 2 seconds - animation should advance position
    act(() => {
      dateNowSpy.mockImplementation(() => 3000); // 2 seconds later
      jest.advanceTimersByTime(2000);
    });

    // Time should now be 0:32
    await waitFor(() => {
      const timeElement = screen.getByText('0:32');
      expect(timeElement).toBeInTheDocument();
    });

    // Now simulate a seek to 60000ms (1:00)
    rerender(
      <TrackProgress
        position={60000} // 1 minute
        duration={180000}
        isPaused={false}
        onSeek={mockSeek}
      />
    );

    // Time should immediately update to 1:00
    await waitFor(() => {
      const timeElement = screen.getByText('1:00');
      expect(timeElement).toBeInTheDocument();
    });

    // Advance time again to verify animation continues smoothly from new position
    act(() => {
      dateNowSpy.mockImplementation(() => 4000); // 1 second later
      jest.advanceTimersByTime(1000);
    });

    // Time should now be 1:01
    await waitFor(() => {
      const timeElement = screen.getByText('1:01');
      expect(timeElement).toBeInTheDocument();
    });
  });

  test('Seeking should work correctly when paused', async () => {
    const mockSeek = jest.fn();

    const { rerender } = render(
      <TrackProgress
        position={30000} // 30 seconds
        duration={180000} // 3 minutes
        isPaused={true} // Paused state
        onSeek={mockSeek}
      />
    );

    // Time starts at 0:30
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Advance time - position should NOT change when paused
    act(() => {
      dateNowSpy.mockImplementation(() => 3000); // 2 seconds later
      jest.advanceTimersByTime(2000);
    });

    // Time should still be 0:30 (no animation when paused)
    expect(screen.getByText('0:30')).toBeInTheDocument();

    // Get the progress bar element
    const progressBar = document.querySelector('.progress-bar-container');
    expect(progressBar).not.toBeNull();

    // Set up mock rect
    const originalGetBoundingClientRect = Element.prototype.getBoundingClientRect;
    Element.prototype.getBoundingClientRect = jest.fn(() => ({
      width: 300,
      left: 0,
      right: 300,
      top: 0,
      bottom: 10,
      height: 10,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    }));

    // Simulate a click at 50% of the bar
    fireEvent.click(progressBar!, { clientX: 150 });

    // Restore the original method
    Element.prototype.getBoundingClientRect = originalGetBoundingClientRect;

    // Verify seek was called
    expect(mockSeek).toHaveBeenCalled();
    const seekPosition = mockSeek.mock.calls[0][0];

    // Update position prop to simulate the seek effect
    rerender(
      <TrackProgress
        position={seekPosition} // ~90000ms
        duration={180000}
        isPaused={true} // Still paused
        onSeek={mockSeek}
      />
    );

    // Time should update to ~1:30 even though we're paused
    await waitFor(() => {
      const timeElement = screen.getByText('1:30');
      expect(timeElement).toBeInTheDocument();
    });

    // Advance time again - should still not change when paused
    act(() => {
      dateNowSpy.mockImplementation(() => 5000); // 2 seconds later
      jest.advanceTimersByTime(2000);
    });

    // Time should still be 1:30 (no animation when paused)
    expect(screen.getByText('1:30')).toBeInTheDocument();

    // Now unpause and check that animation resumes
    rerender(
      <TrackProgress
        position={seekPosition} // Same position
        duration={180000}
        isPaused={false} // No longer paused
        onSeek={mockSeek}
      />
    );

    // Advance time to see if animation resumes
    act(() => {
      dateNowSpy.mockImplementation(() => 6000); // 1 second later
      jest.advanceTimersByTime(1000);
    });

    // Time should now be 1:31 (animation resumes)
    await waitFor(() => {
      const timeElement = screen.getByText('1:31');
      expect(timeElement).toBeInTheDocument();
    });
  });
});
