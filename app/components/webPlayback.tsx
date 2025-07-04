// Extend Window interface to allow our custom property
declare global {
  interface Window {
    lastManualToggleTime?: number;
  }
}

import React, { useCallback, useEffect, useRef, useState } from 'react';
import './MainWebPlayback.css';
import { fetchWithSpotifyAuth } from '../utils/spotifyAuth';
import { SpotifyTrack, SpotifyPlaylist } from './types';
import PlaylistItem from './PlaylistItem';
import TrackItem from './TrackItem';
import LoadingSpinner from './LoadingSpinner';
import EmptyState from './EmptyState';
import PlaybackControls from './PlaybackControls';
import VolumeControl from './VolumeControl';
import CurrentTrackInfo from './CurrentTrackInfo';
import ActivePlaylistHeader from './ActivePlaylistHeader';
import TrackProgress from './TrackProgress';
import QueueDisplay from './QueueDisplay';

// Define interface for playlist track
interface PlaylistPosition {
  id: number;
  userId: string;
  playlistId: string;
  trackId: string;
  updatedAt: string;
}

interface WebPlaybackProps {
  token: string;
  refreshToken: () => Promise<string | undefined>;
}

// Script ID constant
const SPOTIFY_PLAYER_SCRIPT_ID = 'spotify-player-sdk';

const SPOTIFY_API = 'https://api.spotify.com/v1';

function WebPlayback(props: WebPlaybackProps) {
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);

  // API playback state - from Spotify API endpoints
  const [apiState, setApiState] = useState<SpotifyApi.CurrentPlaybackResponse | null>(null);

  // SDK playback state - from Web Playback SDK
  const [sdkState, setSdkState] = useState<Spotify.PlaybackState | null>(null);

  // Local state to track play/pause state immediately for responsive UI
  const [isLocalPaused, setIsLocalPaused] = useState<boolean>(true);

  // For performance, we'll also keep a ref to the current SDK state
  const currentPlayerStateRef = useRef<Spotify.PlaybackState | null>(null);
  // Track just what we need for change detection - much more efficient
  const previousTrackRef = useRef<string | null>(null);
  const previousPlaylistRef = useRef<string | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [volume, setVolume] = useState<number>(50);
  const volumeRef = useRef<number>(50); // Add ref to track volume without triggering effects
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const trackListContainerRef = useRef<HTMLDivElement>(null);

  // Compute activePlaylist from API state
  const activePlaylist = apiState?.context?.uri?.startsWith('spotify:playlist:')
    ? playlists.find(p => p.id === apiState.context?.uri.split(':')[2]) || null
    : null;

  // Helper function for components to refresh state after player changes
  const handleStateChange = () => {
    getPlaybackStateFromAPI();
    getQueueFromAPI();
  };

  // Helper function to get the playback state from the API
  async function getPlaybackStateFromAPI(): Promise<SpotifyApi.CurrentPlaybackResponse | null> {
    try {
      const response = await fetchWithSpotifyAuth(
        `${SPOTIFY_API}/me/player`,
        props.token,
        props.refreshToken
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const state = await response.json();

      // Update API state directly
      if (state !== null && state !== undefined) {
        setApiState(state);
      }

      return state;
    } catch (error) {
      console.error('Error fetching playback state from API:', error);
      return null;
    }
  }

  // Helper function to get the queue from the API
  const getQueueFromAPI = useCallback(async (): Promise<SpotifyApi.UsersQueueResponse | null> => {
    try {
      const response = await fetchWithSpotifyAuth(
        `${SPOTIFY_API}/me/player/queue`,
        props.token,
        props.refreshToken
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching queue from API:', error);
      return null;
    }
  }, [props.token, props.refreshToken]);

  // Fetch the current user's profile to get the user ID
  const fetchUserProfile = useCallback(async () => {
    try {
      const response = await fetchWithSpotifyAuth(
        `${SPOTIFY_API}/me`,
        props.token,
        props.refreshToken
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      userIdRef.current = data.id;
      console.log('User ID:', data.id);
      return data.id;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      setError('Failed to load user profile. Please try again.');
      return null;
    }
  }, [props.token, props.refreshToken]);

  // Save the current track in a playlist
  async function savePlaylistPosition(
    playlistId: string,
    trackId: string
  ): Promise<PlaylistPosition | null> {
    if (!userIdRef.current) return null;

    try {
      const response = await fetch('/api/playlist-positions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userIdRef.current,
          playlistId,
          trackId,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const savedPosition: PlaylistPosition = await response.json();
      console.log(`Saved track for playlist ${playlistId}: track ${trackId}`);
      return savedPosition;
    } catch (error) {
      console.error('Error saving playlist position:', error);
      return null;
    }
  }

  // Load the saved position for a playlist
  async function loadPlaylistPosition(playlistId: string): Promise<PlaylistPosition | null> {
    if (!userIdRef.current || !deviceIdRef.current) return null;

    try {
      const response = await fetch(
        `/api/playlist-positions?userId=${userIdRef.current}&playlistId=${playlistId}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const savedPosition: PlaylistPosition | null = await response.json();

      if (savedPosition !== null) {
        console.log(`Loaded position for playlist ${playlistId}: track ${savedPosition.trackId}`);

        // Play the track from the beginning (not using the saved position)
        await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, {
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
            // No position_ms parameter, so it starts from the beginning
          }),
        });

        return savedPosition;
      }
    } catch (error) {
      console.error('Error loading playlist position:', error);
    }

    return null;
  }

  // Fetch playlists data from Spotify API
  async function getPlaylistsData() {
    try {
      const response = await fetchWithSpotifyAuth(
        `${SPOTIFY_API}/me/playlists`,
        props.token,
        props.refreshToken
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('Error fetching playlists:', error);
      throw error;
    }
  }

  // Functions moved above

  // Initialize playlists and related state
  async function initializePlaylistsAndState() {
    setIsLoadingPlaylists(true);
    setError(null);
    try {
      const playlistItems = await getPlaylistsData();
      setPlaylists(playlistItems);
      console.log('Playlists loaded:', playlistItems.length);

      // Set first playlist as active if none is selected
      if (playlistItems.length > 0 && !activePlaylist) {
        const firstPlaylist = playlistItems[0];
        fetchPlaylistTracks(firstPlaylist.id);

        // Playlist playing is now handled by the PlaylistItem component
        // The user can now click on a playlist to start playing it
      }
    } catch (error) {
      console.error('Error fetching playlists:', error);
      setError('Failed to load playlists. Please check your permissions and try again.');
    } finally {
      setIsLoadingPlaylists(false);
    }
  }

  // Fetch all tracks for a playlist recursively
  async function fetchAllPlaylistTracks(
    playlistId: string,
    url: string | null = null
  ): Promise<SpotifyTrack[]> {
    try {
      const fetchUrl = url || `${SPOTIFY_API}/playlists/${playlistId}/tracks?limit=50`;

      const response = await fetchWithSpotifyAuth(fetchUrl, props.token, props.refreshToken);

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      let tracks: SpotifyTrack[] = [];

      if (data.items !== undefined && data.items !== null) {
        tracks = data.items.map((item: { track: SpotifyTrack }) => item.track).filter(Boolean);

        // If there are more tracks, fetch them recursively
        if (data.next !== undefined && data.next !== null) {
          const nextTracks = await fetchAllPlaylistTracks(playlistId, data.next);
          tracks = [...tracks, ...nextTracks];
        }
      }

      return tracks;
    } catch (error) {
      console.error('Error fetching all playlist tracks:', error);
      throw error;
    }
  }

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
    } catch (error) {
      console.error('Error fetching playlist tracks:', error);
      setError('Failed to load tracks. Please try again.');
    } finally {
      setIsLoadingTracks(false);
    }
  };

  // Fetch the queue - now handled by QueueDisplay component
  const fetchQueue = useCallback(async () => {
    try {
      await getQueueFromAPI();
    } catch (error) {
      console.error('Error fetching queue:', error);
    }
  }, [getQueueFromAPI]);

  // playTrack function moved to TrackItem component

  // playPlaylist function moved to PlaylistItem component

  // togglePlay function moved to PlaybackControls component

  // seekToPosition function moved to TrackProgress component

  // handleVolumeChange function moved to VolumeControl component

  // skipToPrevious function moved to PlaybackControls component

  // skipToNext function moved to PlaybackControls component

  // Handle playlist selection
  async function handlePlaylistSelect(playlist: SpotifyPlaylist) {
    // Set the selected playlist tracks
    fetchPlaylistTracks(playlist.id);

    // Try to load saved position for the selected playlist
    const savedPosition = await loadPlaylistPosition(playlist.id);

    // If no saved position, create a default playback request for the beginning
    if (!savedPosition && deviceIdRef.current) {
      try {
        await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${props.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            context_uri: playlist.uri,
          }),
        });

        // Set isLocalPaused to false since we're starting playback
        setIsLocalPaused(false);
      } catch (error) {
        console.error('Error playing playlist:', error);
      }
    }
  }

  // Effect to fetch user profile when component mounts
  useEffect(
    function initializeUserProfile() {
      if (props.token !== undefined && props.token !== null && props.token !== '') {
        fetchUserProfile();
      }
    },
    [props.token, fetchUserProfile]
  );

  // Effect to update the ref whenever API state changes
  useEffect(
    function syncApiState() {
      // Track previous track and playlist IDs for change detection
      if (apiState?.item?.id) {
        previousTrackRef.current = apiState.item.id;
      }

      if (apiState?.context?.uri?.startsWith('spotify:playlist:')) {
        previousPlaylistRef.current = apiState.context.uri.split(':')[2];
      }

      // Sync local pause state with playback state when it updates from API
      if (apiState !== null && apiState !== undefined) {
        // Check if we've manually toggled the play state recently
        // If the toggle was within the last 500ms, don't override the local pause state
        const lastToggleTime = window.lastManualToggleTime || 0;
        const timeSinceToggle = Date.now() - lastToggleTime;

        if (timeSinceToggle > 500) {
          // Only update if it's been more than 500ms since manual toggle
          setIsLocalPaused(!apiState.is_playing);
        }

        // Only fetch queue when track changes or other relevant operations
        // Not when just toggling play/pause
        const currentTrackId = previousTrackRef.current;
        const newTrackId = apiState.item?.id;
        const trackChanged = currentTrackId !== newTrackId;

        if (trackChanged || !previousTrackRef.current) {
          fetchQueue();
        }
      }
    },
    [apiState, fetchQueue]
  );

  // Effect to scroll to the active track when playlist changes or tracks are loaded
  useEffect(
    function scrollToActiveTrack() {
      // We'll use API state for track ID as it's more reliable for playlist operations
      const currentTrackId = apiState?.item?.id;

      if (playlistTracks.length > 0 && currentTrackId && trackListContainerRef.current) {
        // Find the active track element
        const activeTrackElement =
          trackListContainerRef.current.querySelector(`.track-item.active`);
        if (activeTrackElement !== null && activeTrackElement !== undefined) {
          // Instead of scrollIntoView which affects the whole page,
          // we'll scroll just the container element
          const container = trackListContainerRef.current;
          const containerRect = container.getBoundingClientRect();
          const activeRect = activeTrackElement.getBoundingClientRect();

          // Calculate the scroll position that would center the active track
          const offsetTop =
            activeRect.top - containerRect.top - containerRect.height / 2 + activeRect.height / 2;

          // Smoothly scroll just the container
          container.scrollBy({
            top: offsetTop,
            behavior: 'smooth',
          });
        }
      }
    },
    [activePlaylist, playlistTracks.length, apiState?.item?.id]
  );

  useEffect(
    function initializeSpotifySDK() {
      // Check if script already exists
      if (!document.getElementById(SPOTIFY_PLAYER_SCRIPT_ID)) {
        const script = document.createElement('script');
        script.id = SPOTIFY_PLAYER_SCRIPT_ID;
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);
      }

      function initializePlayer() {
        // If SDK is not ready yet, this will be called later when it is
        if (!window.Spotify) return;

        function getOAuthToken(cb: (token: string) => void) {
          cb(props.token);
        }

        const player = new Spotify.Player({
          name: 'My Web Playback SDK Player',
          getOAuthToken,
          volume: volumeRef.current / 100,
        });

        // Store player reference
        playerRef.current = player;

        // Ready handler function
        function handlePlayerReady({ device_id }: Spotify.WebPlaybackInstance) {
          console.log('Ready with Device ID', device_id);
          deviceIdRef.current = device_id;

          // Fetch playlists once we have a device ID
          initializePlaylistsAndState();
        }

        // Not Ready handler function
        function handlePlayerNotReady({ device_id }: Spotify.WebPlaybackInstance) {
          console.log('Not ready with Device ID', device_id);
        }

        // Add event listeners
        player.addListener('ready', handlePlayerReady);
        player.addListener('not_ready', handlePlayerNotReady);

        // Player state changed handler function
        async function handlePlayerStateChanged(state: Spotify.PlaybackState) {
          // Store the SDK state in both the ref (for performance) and state variables
          currentPlayerStateRef.current = state;
          setSdkState(state);

          // Update local pause state for immediate UI feedback
          setIsLocalPaused(state.paused);

          // Check if the track or context has changed, which would warrant
          // a refresh of the API state to keep things in sync

          // For playlist position saving, we need the API track ID
          // Always get a fresh API state when the SDK state changes significantly
          if (state.context?.uri?.startsWith('spotify:playlist:')) {
            try {
              // This will update apiState via the function implementation
              await getPlaybackStateFromAPI();
            } catch (error) {
              console.error('Error getting API state:', error);
            }
          }

          // For playlist operations we need the API track ID
          const newTrackId = apiState?.item?.id || null;
          const currentTrackId = previousTrackRef.current;

          // Get playlist IDs directly from SDK state
          const newPlaylistId = state.context?.uri?.startsWith('spotify:playlist:')
            ? state.context.uri.split(':')[2]
            : null;
          const currentPlaylistId = previousPlaylistRef.current;

          // Check if playlist has changed
          const playlistChanged = newPlaylistId !== currentPlaylistId;
          // Check if track has changed
          const trackChanged = currentTrackId !== newTrackId;

          // Track changes that should trigger a queue update
          const shouldUpdateQueue = playlistChanged || trackChanged;

          if (playlistChanged) {
            // PLAYLIST CHANGED LOGIC
            console.log(
              `Playlist changed from ${currentPlaylistId || 'none'} to ${newPlaylistId || 'none'}`
            );

            // If we have a new playlist, fetch its tracks
            if (newPlaylistId) {
              console.log(`Fetching tracks for new playlist: ${newPlaylistId}`);
              fetchPlaylistTracks(newPlaylistId);
            }

            // Save the current track ID for the previous playlist
            if (currentTrackId && currentPlaylistId && userIdRef.current) {
              // Save the track ID (position is always 0)
              savePlaylistPosition(currentPlaylistId, currentTrackId);
            }
          } else {
            // SAME PLAYLIST LOGIC (or no playlist context)

            // Track has changed within the same playlist
            if (trackChanged && currentPlaylistId && newPlaylistId && newTrackId) {
              console.log(`Track changed from ${currentTrackId || 'none'} to ${newTrackId}`);

              // Save the new track ID for the current playlist (only if we have a valid API track ID)
              if (newTrackId) {
                savePlaylistPosition(newPlaylistId, newTrackId);
              } else {
                console.warn('Cannot save playlist position: No valid API track ID available');
              }
            }
          }

          // The SDK state is already updated directly in this handler

          // Update our track and playlist references
          // For tracking previous track ID, we'll use the API track ID
          previousTrackRef.current = newTrackId;

          if (state.context?.uri?.startsWith('spotify:playlist:')) {
            previousPlaylistRef.current = state.context.uri.split(':')[2];
          }

          // Update queue when track or playlist changes
          // Note: Unfortunately, the queue cannot be derived from the playback state
          // and requires a separate API call
          if (shouldUpdateQueue) {
            fetchQueue();
          }
        }

        // Error handler functions
        function handleInitializationError({ message }: { message: string }) {
          console.error(message);
        }

        function handleAuthenticationError({ message }: { message: string }) {
          console.error(message);
        }

        function handleAccountError({ message }: { message: string }) {
          console.error(message);
        }

        // Connection result handler
        function handleConnectionResult(success: boolean) {
          if (success) {
            console.log('The Web Playback SDK successfully connected to Spotify!');
          } else {
            console.error('The Web Playback SDK could not connect to Spotify.');
          }
        }

        // Add all event listeners
        player.addListener('player_state_changed', handlePlayerStateChanged);
        player.addListener('initialization_error', handleInitializationError);
        player.addListener('authentication_error', handleAuthenticationError);
        player.addListener('account_error', handleAccountError);

        // Connect to the player!
        player.connect().then(handleConnectionResult);
      }

      // Try to initialize player immediately if SDK is already loaded
      if (window.Spotify) {
        initializePlayer();
      } else {
        // Otherwise set up callback for when SDK loads
        window.onSpotifyWebPlaybackSDKReady = initializePlayer;
      }

      // Cleanup function to disconnect player when component unmounts or token changes
      return function cleanupPlayer() {
        if (playerRef.current) {
          playerRef.current.disconnect();
          playerRef.current = null;
        }
      };
    },
    // Only include props.token to avoid re-initialization on every state change
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [props.token]
  );

  // Handle logout
  function handleLogout() {
    // Clear token from localStorage if it's stored there
    localStorage.removeItem('spotify_token');

    // Redirect to the server-side logout endpoint that will clear cookies
    window.location.href = '/api/auth/logout';
  }

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
          {/* Prefer API data, fallback to SDK data if API is not available */}
          {apiState?.item && <CurrentTrackInfo track={apiState.item as SpotifyTrack} />}

          {/* Track Progress */}
          {apiState?.item && (
            <TrackProgress
              position={sdkState?.position || apiState.progress_ms || 0}
              duration={apiState.item.duration_ms}
              isPaused={isLocalPaused}
              playerRef={playerRef}
              apiState={apiState}
              setApiState={setApiState}
              sdkState={sdkState}
              setSdkState={setSdkState}
            />
          )}

          {/* Playback Controls */}
          {/* We always show playback controls if the player is initialized */}
          {playerRef.current && (
            <PlaybackControls
              playerRef={playerRef}
              isPaused={isLocalPaused}
              setIsLocalPaused={setIsLocalPaused}
              onStateChange={handleStateChange}
            />
          )}

          {/* Volume Control */}
          <VolumeControl
            volume={volume}
            setVolume={setVolume}
            playerRef={playerRef}
            volumeRef={volumeRef}
          />

          {/* Queue Display */}
          <QueueDisplay
            token={props.token}
            deviceIdRef={deviceIdRef}
            playlistUri={activePlaylist?.uri}
          />

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
                      isActive={apiState?.item?.id === track.id}
                      index={index + 1}
                      playlistUri={activePlaylist?.uri}
                      token={props.token}
                      deviceIdRef={deviceIdRef}
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
}

export default WebPlayback;
