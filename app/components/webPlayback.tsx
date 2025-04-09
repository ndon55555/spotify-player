import React, { useEffect, useRef, useState } from 'react';
import './MainWebPlayback.css';
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
}

// Script ID constant
const SPOTIFY_PLAYER_SCRIPT_ID = 'spotify-player-sdk';

const SPOTIFY_API = 'https://api.spotify.com/v1';

const WebPlayback: React.FC<WebPlaybackProps> = props => {
  const playerRef = useRef<Spotify.Player | null>(null);
  const deviceIdRef = useRef<string | null>(null);
  const [playbackState, setPlaybackState] = useState<SpotifyApi.CurrentPlaybackResponse | null>(
    null
  );
  // Local state to track play/pause state immediately
  const [isLocalPaused, setIsLocalPaused] = useState<boolean>(true);
  const currentPlaybackStateRef = useRef<SpotifyApi.CurrentPlaybackResponse | null>(null);
  const [playlists, setPlaylists] = useState<SpotifyPlaylist[]>([]);
  const [playlistTracks, setPlaylistTracks] = useState<SpotifyTrack[]>([]);
  const [queueTracks, setQueueTracks] = useState<
    Array<SpotifyApi.TrackObjectFull | SpotifyApi.EpisodeObjectFull>
  >([]);
  const [isLoadingQueue, setIsLoadingQueue] = useState<boolean>(false);
  const [volume, setVolume] = useState<number>(50);
  const volumeRef = useRef<number>(50); // Add ref to track volume without triggering effects
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState<boolean>(false);
  const [isLoadingTracks, setIsLoadingTracks] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const trackListContainerRef = useRef<HTMLDivElement>(null);

  // Compute activePlaylist from playbackState
  const activePlaylist = playbackState?.context?.uri?.startsWith('spotify:playlist:')
    ? playlists.find(p => p.id === playbackState?.context?.uri?.split(':')[2]) || null
    : null;

  // Helper function to get the playback state from the API
  async function getPlaybackStateFromAPI(): Promise<SpotifyApi.CurrentPlaybackResponse | null> {
    try {
      const response = await fetch(`${SPOTIFY_API}/me/player`, {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching playback state from API:', error);
      return null;
    }
  }

  // Helper function to get the queue from the API
  async function getQueueFromAPI(): Promise<SpotifyApi.UsersQueueResponse | null> {
    try {
      const response = await fetch(`${SPOTIFY_API}/me/player/queue`, {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching queue from API:', error);
      return null;
    }
  }

  // Fetch the current user's profile to get the user ID
  async function fetchUserProfile() {
    try {
      const response = await fetch(`${SPOTIFY_API}/me`, {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

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
  }

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
  const loadPlaylistPosition = async (playlistId: string): Promise<PlaylistPosition | null> => {
    if (!userIdRef.current || !deviceIdRef.current) return null;

    try {
      const response = await fetch(
        `/api/playlist-positions?userId=${userIdRef.current}&playlistId=${playlistId}`
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const savedPosition: PlaylistPosition | null = await response.json();

      if (savedPosition) {
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
  };

  // Fetch playlists data from Spotify API
  async function getPlaylistsData() {
    try {
      const response = await fetch(`${SPOTIFY_API}/me/playlists`, {
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

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

        // Try to load saved position for the first playlist
        if (userIdRef.current) {
          loadPlaylistPosition(firstPlaylist.id).then(async savedPosition => {
            if (!savedPosition) {
              // If no saved position, just play from the beginning
              await playPlaylist(firstPlaylist.uri);
            }

            // Set isLocalPaused to false since we're starting playback
            setIsLocalPaused(false);

            // Fetch the playback state to ensure UI is in sync
            setTimeout(async () => {
              const state = await getPlaybackStateFromAPI();
              if (state) {
                console.log(`Initial playback state: is_playing=${state.is_playing}`);
                setPlaybackState(state);
              }
            }, 500);
          });
        } else {
          // If no user ID yet, just play from the beginning
          await playPlaylist(firstPlaylist.uri);

          // Set isLocalPaused to false since we're starting playback
          setIsLocalPaused(false);

          // Fetch the playback state to ensure UI is in sync
          setTimeout(async () => {
            const state = await getPlaybackStateFromAPI();
            if (state) {
              console.log(`Initial playback state: is_playing=${state.is_playing}`);
              setPlaybackState(state);
            }
          }, 500);
        }
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

  // Fetch the queue
  const fetchQueue = async () => {
    setIsLoadingQueue(true);
    try {
      const queueData = await getQueueFromAPI();
      if (queueData) {
        setQueueTracks(queueData.queue);
      }
    } catch (error) {
      console.error('Error fetching queue:', error);
    } finally {
      setIsLoadingQueue(false);
    }
  };

  // Play a specific track
  const playTrack = async (trackUri: string) => {
    if (!deviceIdRef.current) return;

    try {
      await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${props.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uris: [trackUri],
        }),
      });

      // Fetch the updated queue after playing a track
      fetchQueue();
    } catch (error) {
      console.error('Error playing track:', error);
    }
  };

  // Play a specific playlist
  const playPlaylist = async (playlistUri: string) => {
    if (!deviceIdRef.current) return;

    try {
      await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, {
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
  async function togglePlay() {
    if (!deviceIdRef.current) return;

    try {
      // Immediately update local pause state
      const newPausedState = !isLocalPaused;
      setIsLocalPaused(newPausedState);

      console.log(`Toggling playback to ${newPausedState ? 'paused' : 'playing'}`);

      // Call Spotify API directly instead of using SDK
      if (newPausedState) {
        // Pause playback
        await fetch(`${SPOTIFY_API}/me/player/pause?device_id=${deviceIdRef.current}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${props.token}`,
          },
        });
      } else {
        // Resume playback
        await fetch(`${SPOTIFY_API}/me/player/play?device_id=${deviceIdRef.current}`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${props.token}`,
          },
        });
      }

      // Fetch updated playback state after API call
      setTimeout(async () => {
        const updatedState = await getPlaybackStateFromAPI();
        if (updatedState) {
          console.log(`Updated playback state: is_playing=${updatedState.is_playing}`);
          setPlaybackState(updatedState);
        }
      }, 200); // Small delay to ensure API has processed the request
    } catch (error) {
      console.error('Error toggling playback:', error);
      // Revert local state if API call fails
      setIsLocalPaused(isLocalPaused);
    }
  }

  // Seek to position
  async function seekToPosition(position: number) {
    if (!deviceIdRef.current) return;

    try {
      await fetch(
        `${SPOTIFY_API}/me/player/seek?position_ms=${position}&device_id=${deviceIdRef.current}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${props.token}`,
          },
        }
      );
    } catch (error) {
      console.error('Error seeking to position:', error);
    }
  }

  // Set volume
  const handleVolumeChange = async (newVolume: number) => {
    if (!playerRef.current) return;

    // Update both state and ref
    setVolume(newVolume);
    volumeRef.current = newVolume;

    // Set volume on the player
    await playerRef.current.setVolume(newVolume / 100);
  };

  // Skip to previous track
  async function skipToPrevious() {
    if (!deviceIdRef.current) return;

    try {
      await fetch(`${SPOTIFY_API}/me/player/previous?device_id=${deviceIdRef.current}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      // Fetch updated playback state after API call
      setTimeout(async () => {
        const updatedState = await getPlaybackStateFromAPI();
        if (updatedState) {
          setPlaybackState(updatedState);
          fetchQueue();
        }
      }, 200);
    } catch (error) {
      console.error('Error skipping to previous track:', error);
    }
  }

  // Skip to next track
  async function skipToNext() {
    if (!deviceIdRef.current) return;

    try {
      await fetch(`${SPOTIFY_API}/me/player/next?device_id=${deviceIdRef.current}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${props.token}`,
        },
      });

      // Fetch updated playback state after API call
      setTimeout(async () => {
        const updatedState = await getPlaybackStateFromAPI();
        if (updatedState) {
          setPlaybackState(updatedState);
          fetchQueue();
        }
      }, 200);
    } catch (error) {
      console.error('Error skipping to next track:', error);
    }
  }

  // Handle playlist selection
  const handlePlaylistSelect = async (playlist: SpotifyPlaylist) => {
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

  // Effect to update the ref whenever playbackState changes
  useEffect(() => {
    currentPlaybackStateRef.current = playbackState;

    // Sync local pause state with playback state when it updates from API
    if (playbackState) {
      setIsLocalPaused(!playbackState.is_playing);

      // Only fetch queue when track changes or other relevant operations
      // Not when just toggling play/pause
      const currentTrackId = currentPlaybackStateRef.current?.item?.id;
      const newTrackId = playbackState.item?.id;
      const trackChanged = currentTrackId !== newTrackId;

      if (trackChanged || !currentPlaybackStateRef.current) {
        fetchQueue();
      }
    }
  }, [playbackState]);

  // Effect to scroll to the active track when playlist changes or tracks are loaded
  useEffect(() => {
    if (playlistTracks.length > 0 && playbackState?.item && trackListContainerRef.current) {
      // Find the active track element
      const activeTrackId = playbackState.item.id;
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

    function initializePlayer() {
      // If SDK is not ready yet, this will be called later when it is
      if (!window.Spotify) return;

      const player = new Spotify.Player({
        name: 'My Web Playback SDK Player',
        getOAuthToken: cb => {
          cb(props.token);
        },
        volume: volumeRef.current / 100,
      });

      // Store player reference
      playerRef.current = player;

      // Ready
      player.addListener('ready', ({ device_id }) => {
        console.log('Ready with Device ID', device_id);
        deviceIdRef.current = device_id;

        // Fetch playlists once we have a device ID
        initializePlaylistsAndState();
      });

      // Not Ready
      player.addListener('not_ready', ({ device_id }) => {
        console.log('Not ready with Device ID', device_id);
      });

      // Player state changed
      player.addListener('player_state_changed', async _state => {
        // Get the track ID from the API (in the context of the playlist)
        const newPlaybackStateFromAPI = await getPlaybackStateFromAPI();
        if (!newPlaybackStateFromAPI) return;

        // Get the current track ID
        const newTrackId = newPlaybackStateFromAPI.item?.id;
        const currentTrackId = currentPlaybackStateRef.current?.item?.id;

        // Get playlist IDs
        const newPlaylistId = newPlaybackStateFromAPI.context?.uri?.startsWith('spotify:playlist:')
          ? newPlaybackStateFromAPI.context.uri.split(':')[2]
          : null;
        const currentPlaylistId = currentPlaybackStateRef.current?.context?.uri?.startsWith(
          'spotify:playlist:'
        )
          ? currentPlaybackStateRef.current.context.uri.split(':')[2]
          : null;

        // Check if playlist has changed
        const playlistChanged = newPlaylistId !== currentPlaylistId;

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
          if (currentTrackId !== newTrackId && currentPlaylistId && newPlaylistId && newTrackId) {
            console.log(`Track changed from ${currentTrackId || 'none'} to ${newTrackId}`);

            // Save the new track ID for the current playlist
            savePlaylistPosition(newPlaylistId, newTrackId);
          }
        }

        // Update playback state
        setPlaybackState(newPlaybackStateFromAPI);
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
    }

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
  }, [props.token]);

  // Handle logout
  function handleLogout() {
    // Clear token from localStorage if it's stored there
    localStorage.removeItem('spotify_token');

    // Redirect to login page
    window.location.href = '/api/auth/login';
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
          {playbackState?.item && <CurrentTrackInfo track={playbackState.item as SpotifyTrack} />}

          {/* Track Progress */}
          {playbackState && playbackState.item && (
            <TrackProgress
              position={playbackState.progress_ms || 0}
              duration={playbackState.item.duration_ms}
              isPaused={isLocalPaused}
              onSeek={seekToPosition}
            />
          )}

          {/* Playback Controls */}
          {playbackState && (
            <PlaybackControls
              isPaused={isLocalPaused}
              onTogglePlay={togglePlay}
              onPreviousTrack={skipToPrevious}
              onNextTrack={skipToNext}
            />
          )}

          {/* Volume Control */}
          <VolumeControl volume={volume} onVolumeChange={handleVolumeChange} />

          {/* Queue Display */}
          <QueueDisplay queueTracks={queueTracks} isLoading={isLoadingQueue} onPlay={playTrack} />

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
                      isActive={playbackState?.item?.id === track.id}
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
