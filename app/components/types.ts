/**
 * Common type definitions for the Spotify player components
 */

export interface SpotifyTrack {
    id: string | null;
    name: string;
    album: {
        id: string | null;
        name: string;
        images: { url: string }[];
    };
    artists: { name: string }[];
    uri: string;
}

export interface SpotifyPlaylist {
    id: string;
    name: string;
    images: { url: string }[];
    uri: string;
}

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
