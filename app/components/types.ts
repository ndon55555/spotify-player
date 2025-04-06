/**
 * Type definitions for the Spotify player components using @types/spotify-api
 */

/// <reference types="spotify-api" />
/// <reference types="spotify-web-playback-sdk" />

// Use the Spotify API types directly
export type SpotifyTrack = SpotifyApi.TrackObjectFull;
export type SpotifyPlaylist = SpotifyApi.PlaylistObjectFull;

// Use the Spotify Web Playback SDK types for PlaybackState
export type PlaybackState = Spotify.PlaybackState;
