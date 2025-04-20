// Learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock Spotify Web Playback SDK
window.Spotify = {
  Player: jest.fn().mockImplementation(() => ({
    connect: jest.fn().mockResolvedValue({}),
    disconnect: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
    getCurrentState: jest.fn(),
    setVolume: jest.fn(),
    pause: jest.fn(),
    resume: jest.fn(),
    previousTrack: jest.fn(),
    nextTrack: jest.fn(),
    seek: jest.fn(),
  })),
};

// Mock ResizeObserver which is not available in jest-dom
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Mock TextEncoder and TextDecoder for pg module
global.TextEncoder = class {
  encode(text) {
    return new Uint8Array(Buffer.from(text));
  }
};

global.TextDecoder = class {
  decode(buffer) {
    return Buffer.from(buffer).toString();
  }
};
