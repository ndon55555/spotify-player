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

// Type for queue display
export type QueueTrack = Spotify.Track;

/**
 * Adapter function to convert Spotify.Track to SpotifyTrack (SpotifyApi.TrackObjectFull)
 * This is needed because the Spotify Web Playback SDK uses a different track structure
 * than the Spotify Web API
 */
export function adaptTrackToSpotifyTrack(track: Spotify.Track): SpotifyTrack {
  return {
    album: {
      album_type: 'album',
      artists: track.artists.map(artist => ({
        external_urls: { spotify: artist.url || '' },
        href: artist.url || '',
        id: artist.uri.split(':').pop() || '',
        name: artist.name,
        type: 'artist',
        uri: artist.uri,
      })),
      available_markets: [],
      external_urls: { spotify: track.album.uri || '' },
      href: track.album.uri || '',
      id: track.album.uri.split(':').pop() || '',
      images: track.album.images.map(image => ({
        height: image.height || undefined,
        url: image.url,
        width: image.width || undefined,
      })),
      name: track.album.name,
      release_date: '',
      release_date_precision: 'day',
      total_tracks: 0,
      type: 'album',
      uri: track.album.uri,
    },
    artists: track.artists.map(artist => ({
      external_urls: { spotify: artist.url || '' },
      href: artist.url || '',
      id: artist.uri.split(':').pop() || '',
      name: artist.name,
      type: 'artist',
      uri: artist.uri,
    })),
    available_markets: [],
    disc_number: 1,
    duration_ms: track.duration_ms,
    explicit: false,
    external_ids: {},
    external_urls: { spotify: track.uri || '' },
    href: track.uri || '',
    id: track.id || '',
    is_local: false,
    name: track.name,
    popularity: 0,
    preview_url: null,
    track_number: 1,
    type: 'track',
    uri: track.uri,
  };
}
