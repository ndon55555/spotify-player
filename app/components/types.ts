/**
 * Type definitions for the Spotify player components using @types/spotify-api
 */

/// <reference types="spotify-api" />

// Use the Spotify API types directly
export type SpotifyTrack = SpotifyApi.TrackObjectFull;
export type SpotifyPlaylist = SpotifyApi.PlaylistObjectFull;

// PlaybackState doesn't have a direct equivalent in the Spotify API types
// This interface represents the state returned by the Spotify Web Playback SDK
export interface PlaybackState {
  paused: boolean;
  position: number;
  duration: number;
  track_window: {
    current_track: SpotifyTrack;
    previous_tracks: SpotifyTrack[];
    next_tracks: SpotifyTrack[];
  };
}
