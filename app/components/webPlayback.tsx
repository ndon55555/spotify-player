import React, { useEffect, useRef, useState } from 'react';
import './MainWebPlayback.css';
import { SpotifyTrack, SpotifyPlaylist, PlaybackState } from './types';
import PlaylistItem from './PlaylistItem';
import TrackItem from './TrackItem';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import PlaybackControls from './PlaybackControls';
import VolumeControl from './VolumeControl';
import CurrentTrackInfo from './CurrentTrackInfo';
import ActivePlaylistHeader from './ActivePlaylistHeader';

// Define interface for playlist position
interface PlaylistPosition {
  id: number;
  userId: string;
  playlistId: string;
  trackId: string;
  position: number;
  updatedAt: string;
}

interface WebPlaybackProps {
  token: string;
}

// Script ID constant
const SPOTIFY_PLAYER_SCRIPT_ID = 'spotify-player-sdk';

const WebPlayback: React.FC<WebPlaybackProps> = props => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const [deviceId, setDeviceId] = useState<string>('');
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<SpotifyPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [volume, setVolume] = useState<number>(50);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const trackListContainerRef = useRef<HTMLDivElement>(null);

  // Fetch the current user's profile to get the user ID
  const fetchUserProfile = async () => {
    try {
      const response = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      setUserId(data.id);
      console.log('User ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again.');
      return null;
    }
  };

  // Save the current playlist position
  const savePlaylistPosition = async (
    playlistId: string,
    trackId: string,
    position: number
  ): Promise<PlaylistPosition | null> => {
    if (!userId) return null;

    try {
      const response = await fetch('/api/playlist-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          playlistId,
          trackId,
          position,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const savedPosition: PlaylistPosition = await response.json();
      console.log(
        `Saved position for playlist ${playlistId}: track ${trackId} at position ${position}`
      );
      return savedPosition;
    } catch (error) {
      console.error('Error saving playlist position:', error);
      return null;
    }
  };

  // Load the saved position for a playlist
  const loadPlaylistPosition = async (playlistId: string): Promise<PlaylistPosition | null> => {
    if (!userId || !deviceId) return null;

    try {
      const response = await fetch(
        `/api/playlist-positions?userId=${userId}&playlistId=${playlistId}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const savedPosition: PlaylistPosition | null = await response.json();

      if (savedPosition) {
        console.log(
          `Loaded position for playlist ${playlistId}: track ${savedPosition.trackId} at position ${savedPosition.position}`
        );

        // Play the track at the saved position
        await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${props.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context_uri: `spotify:playlist:${playlistId}`,
            offset: {
              uri: `spotify:track:${savedPosition.trackId}`,
            },
            position_ms: savedPosition.position,
          }),
        });

        return savedPosition;
      }
    } catch (error) {
      console.error('Error loading playlist position:', error);
    }

    return null;
  };

  // Fetch user's playlists
  const fetchPlaylists = async () => {
    setIsLoadingPlaylists(true);
    setError(null);
    try {
      const response = await fetch('https://api.spotify.com/v1/me/playlists', {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      if (data.items) {
        setPlaylists(data.items);
        console.log('Playlists loaded:', data.items.length);

        // Set first playlist as active if none is selected
        if (data.items.length > 0 && !activePlaylist) {
          const firstPlaylist = data.items[0];
          setActivePlaylist(firstPlaylist);
          fetchPlaylistTracks(firstPlaylist.id);

          // Try to load saved position for the first playlist
          if (userId) {
            loadPlaylistPosition(firstPlaylist.id).then(savedPosition => {
              if (!savedPosition) {
                // If no saved position, just play from the beginning
                playPlaylist(firstPlaylist.uri);
              }
            });
          } else {
            // If no user ID yet, just play from the beginning
            playPlaylist(firstPlaylist.uri);
          }
        }
      } else {
        console.log('No playlists found in response:', data);
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists. Please check your permissions and try again.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  };

  // Fetch all tracks for a playlist recursively
  const fetchAllPlaylistTracks = async (
    playlistId: string,
    url: string | null = null
  ): Promise<SpotifyTrack[]> => {
    try {
      const fetchUrl = url || `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=50`;

      const response = await fetch(fetchUrl, {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let tracks: SpotifyTrack[] = [];

      if (data.items) {
        tracks = data.items.map((item: { track: SpotifyTrack }) => item.track).filter(Boolean);

        // If there are more tracks, fetch them recursively
        if (data.next) {
          const nextTracks = await fetchAllPlaylistTracks(playlistId, data.next);
          tracks = [...tracks, ...nextTracks];
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error fetching all playlist tracks:', error);
      throw error;
    }
  };

  // Fetch tracks for a playlist
  const fetchPlaylistTracks = async (playlistId: string) => {
    setIsLoadingTracks(true);
    setPlaylistTracks([]);
    setError(null);

    try {
      // Fetch all tracks at once
      const allTracks = await fetchAllPlaylistTracks(playlistId);

      setPlaylistTracks(allTracks);
      console.log('All tracks loaded:', allTracks.length);

      // No need to track next URL or hasMoreTracks since we load everything
      setHasMoreTracks(false);
      setTracksNextUrl(null);
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      setError('Failed to load tracks. Please try again.');
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Play a specific track
  const playTrack = async (trackUri: string) => {
    if (!deviceId) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${props.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      });
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Play a specific playlist
  const playPlaylist = async (playlistUri: string) => {
    if (!deviceId) return;

    try {
      await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${props.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context_uri: playlistUri,
        }),
      });
    } catch (error) {
      console.error('Error playing playlist:', error);
    }
  };

  // Toggle play/pause
  const togglePlay = async () => {
    if (!playerRef.current) return;

    await playerRef.current.togglePlay();
  };

  // Set volume
  const handleVolumeChange = async (newVolume: number) => {
    if (!playerRef.current) return;

    setVolume(newVolume);
    await playerRef.current.setVolume(newVolume / 100);
  };

  // Handle playlist selection
  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
    // If we have an active playlist, save its position before switching
    if (activePlaylist && playbackState && userId) {
      const currentTrack = playbackState.track_window.current_track;
      if (currentTrack && currentTrack.id) {
        await savePlaylistPosition(activePlaylist.id, currentTrack.id, playbackState.position);
      }
    }

    setActivePlaylist(playlist);
    fetchPlaylistTracks(playlist.id);

    // Try to load saved position for the selected playlist
    const savedPosition = await loadPlaylistPosition(playlist.id);

    // If no saved position, just play the playlist from the beginning
    if (!savedPosition) {
      playPlaylist(playlist.uri);
    }
  };

  // Effect to fetch user profile when component mounts
  useEffect(() => {
    if (props.token) {
      fetchUserProfile();
    }
  }, [props.token]);

  // Effect to scroll to the active track when playlist changes or tracks are loaded
  useEffect(() => {
    if (playlistTracks.length > 0 && playbackState && trackListContainerRef.current) {
      // Find the active track element
      const activeTrackId = playbackState.track_window.current_track.id;
      if (activeTrackId) {
        const activeTrackElement =
          trackListContainerRef.current.querySelector(`.track-item.active`);
        if (activeTrackElement) {
          // Scroll to the active track with a small offset to show some context
          activeTrackElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  }, [activePlaylist, playlistTracks.length]);

  useEffect(() => {
    // Check if script already exists
    if (!document.getElementById(SPOTIFY_PLAYER_SCRIPT_ID)) {
      const script = document.createElement('script');
      script.id = SPOTIFY_PLAYER_SCRIPT_ID;
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      document.body.appendChild(script);
    }

    const initializePlayer = () => {
      // If SDK is not ready yet, this will be called later when it is
      if (!window.Spotify) return;

      const player = new Spotify.Player({
        name: 'My Web Playback SDK Player',
        getOAuthToken: cb => {
          cb(props.token);
        },
        volume: volume / 100,
      });

      // Store player reference
      playerRef.current = player;

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        setDeviceId(device_id);

        // Fetch playlists once we have a device ID
        fetchPlaylists();
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Not ready with Device ID', device_id);
      });

      // Player state changed
      player.addListener('player_state_changed', state => {
        if (state) {
          const newState = state as unknown as PlaybackState;
          setPlaybackState(newState);

          // Save position periodically when playing a track
          if (activePlaylist && userId && newState.track_window.current_track.id) {
            // Save position every 10 seconds or when paused
            const shouldSave =
              newState.paused ||
              !playbackState ||
              Math.abs(newState.position - playbackState.position) > 10000;

            if (shouldSave) {
              savePlaylistPosition(
                activePlaylist.id,
                newState.track_window.current_track.id,
                newState.position
              );
            }
          }
        }
      });

      player.addListener('initialization_error', ({ message }) => {
        console.error(message);
      });

      player.addListener('authentication_error', ({ message }) => {
        console.error(message);
      });

      player.addListener('account_error', ({ message }) => {
        console.error(message);
      });

      // Connect to the player!
      player.connect().then(success => {
        if (success) {
          console.log('The Web Playback SDK successfully connected to Spotify!');
        } else {
          console.error('The Web Playback SDK could not connect to Spotify.');
        }
      });
    };

    // Try to initialize player immediately if SDK is already loaded
    if (window.Spotify) {
      initializePlayer();
    } else {
      // Otherwise set up callback for when SDK loads
      window.onSpotifyWebPlaybackSDKReady = initializePlayer;
    }

    // Cleanup function to disconnect player when component unmounts or token changes
    return () => {
      if (playerRef.current) {
        playerRef.current.disconnect();
        playerRef.current = null;
      }
    };
  }, [props.token, volume]);

  // Handle logout
  const handleLogout = () => {
    // Clear token from localStorage if it's stored there
    localStorage.removeItem('spotify_token');

    // Redirect to login page
    window.location.href = '/api/auth/login';
  };

  return (
    <div className="web-playback-container">
      {/* Logout button */}
      <div className="header-section">
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </div>

      {/* Info message about permissions */}
      {error && error.includes('permissions') && (
        <div className="info-message">
          <h3 className="info-message-title">New Permissions Required</h3>
          <p>
            This app now requires additional permissions to access your playlists and control
            playback.
          </p>
          <p className="mt-2">
            Please{' '}
            <a href="/api/auth/login" className="info-message-link">
              log out and log back in
            </a>{' '}
            to grant these permissions.
          </p>
        </div>
      )}
      <div className="player-grid">
        {/* Playlist Selection Section */}
        <div className="playlist-section">
          <h2 className="section-title">Your Playlists</h2>

          {error && <div className="error-message">{error}</div>}

          {isLoadingPlaylists ? (
            <LoadingSpinner />
          ) : playlists.length === 0 ? (
            <EmptyState
              message="No playlists found."
              subMessage="Make sure you have the correct permissions."
            />
          ) : (
            <div className="playlist-scroll-container">
              {playlists.map(playlist => (
                <PlaylistItem
                  key={playlist.id}
                  playlist={playlist}
                  isActive={activePlaylist?.id === playlist.id}
                  onSelect={handlePlaylistSelect}
                />
              ))}
            </div>
          )}
        </div>

        {/* Main Player Section */}
        <div className="player-section">
          {/* Active Playlist Info */}
          {activePlaylist && <ActivePlaylistHeader playlist={activePlaylist} />}

          {/* Current Track Info */}
          {playbackState?.track_window.current_track && (
            <CurrentTrackInfo track={playbackState.track_window.current_track} />
          )}

          {/* Playback Controls */}
          {playbackState && (
            <PlaybackControls isPaused={playbackState.paused} onTogglePlay={togglePlay} />
          )}

          {/* Volume Control */}
          <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />

          {/* Track List */}
          <div className="track-list-section">
            <h3 className="track-list-title">Tracks</h3>

            {isLoadingTracks ? (
              <LoadingSpinner />
            ) : playlistTracks.length === 0 ? (
              <EmptyState message="No tracks found in this playlist." />
            ) : (
              <>
                <div className="track-list-container" ref={trackListContainerRef}>
                  {playlistTracks.map((track, index) => (
                    <TrackItem
                      key={track.id}
                      track={track}
                      isActive={playbackState?.track_window.current_track.id === track.id}
                      onPlay={playTrack}
                      index={index + 1}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebPlayback;
