// Mock data for Spotify API responses

export const mockTrack = {
  id: 'mock-track-id',
  name: 'Mock Track',
  artists: [{ name: 'Mock Artist' }],
  album: {
    name: 'Mock Album',
    images: [{ url: 'https://example.com/album-art.jpg' }],
  },
  duration_ms: 180000,
  uri: 'spotify:track:mock-track-id',
};

export const mockPlaylist = {
  id: 'mock-playlist-id',
  name: 'Mock Playlist',
  description: 'A mock playlist for testing',
  images: [{ url: 'https://example.com/playlist-image.jpg' }],
  tracks: {
    items: [
      { track: mockTrack },
      { track: { ...mockTrack, id: 'mock-track-id-2', name: 'Mock Track 2' } },
    ],
  },
};

export const mockUserProfile = {
  id: 'mock-user-id',
  display_name: 'Mock User',
  email: 'mock@example.com',
  images: [{ url: 'https://example.com/profile-image.jpg' }],
};

export const mockPlaylists = {
  items: [
    mockPlaylist,
    {
      ...mockPlaylist,
      id: 'mock-playlist-id-2',
      name: 'Mock Playlist 2',
    },
  ],
};

export const mockPlayerState = {
  track_window: {
    current_track: {
      id: mockTrack.id,
      name: mockTrack.name,
      artists: mockTrack.artists,
      album: mockTrack.album,
      duration_ms: mockTrack.duration_ms,
    },
    previous_tracks: [],
    next_tracks: [],
  },
  paused: false,
  position: 30000,
  duration: mockTrack.duration_ms,
  context: {
    uri: `spotify:playlist:${mockPlaylist.id}`,
  },
};

export const mockQueue = {
  queue: [
    mockTrack,
    { ...mockTrack, id: 'mock-track-id-2', name: 'Mock Track 2' },
    { ...mockTrack, id: 'mock-track-id-3', name: 'Mock Track 3' },
  ],
};
