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

interface WebPlaybackProps {
    token: string;
}

// Script ID constant
const SPOTIFY_PLAYER_SCRIPT_ID = 'spotify-player-sdk';

const WebPlayback: React.FC<WebPlaybackProps> = (props) => {
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
    
    // Fetch user's playlists
    const fetchPlaylists = async () => {
        setIsLoadingPlaylists(true);
        setError(null);
        try {
            const response = await fetch('https://api.spotify.com/v1/me/playlists', {
                headers: {
                    'Authorization': `Bearer ${props.token}`
                }
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
                    setActivePlaylist(data.items[0]);
                    fetchPlaylistTracks(data.items[0].id);
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

    // Fetch tracks for a playlist
    const fetchPlaylistTracks = async (playlistId: string) => {
        setIsLoadingTracks(true);
        setError(null);
        try {
            const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
                headers: {
                    'Authorization': `Bearer ${props.token}`
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            if (data.items) {
                const tracks = data.items.map((item: any) => item.track).filter(Boolean);
                setPlaylistTracks(tracks);
                console.log('Tracks loaded:', tracks.length);
            } else {
                console.log('No tracks found in response:', data);
                setPlaylistTracks([]);
            }
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
                    'Authorization': `Bearer ${props.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    uris: [trackUri]
                })
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
                    'Authorization': `Bearer ${props.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    context_uri: playlistUri
                })
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
    const handlePlaylistSelect = (playlist: SpotifyPlaylist) => {
        setActivePlaylist(playlist);
        fetchPlaylistTracks(playlist.id);
        playPlaylist(playlist.uri);
    };

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
                getOAuthToken: cb => { cb(props.token); },
                volume: volume / 100
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
            player.addListener('player_state_changed', (state) => {
                if (state) {
                    setPlaybackState(state as unknown as PlaybackState);
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
                <button 
                    onClick={handleLogout}
                    className="logout-button"
                >
                    Logout
                </button>
            </div>
            
            {/* Info message about permissions */}
            {error && error.includes('permissions') && (
                <div className="info-message">
                    <h3 className="info-message-title">New Permissions Required</h3>
                    <p>This app now requires additional permissions to access your playlists and control playback.</p>
                    <p className="mt-2">Please <a href="/api/auth/login" className="info-message-link">log out and log back in</a> to grant these permissions.</p>
                </div>
            )}
            <div className="player-grid">
                {/* Playlist Selection Section */}
                <div className="playlist-section">
                    <h2 className="section-title">Your Playlists</h2>
                    
                    {error && (
                        <div className="error-message">
                            {error}
                        </div>
                    )}
                    
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
                    {activePlaylist && (
                        <ActivePlaylistHeader playlist={activePlaylist} />
                    )}

                    {/* Current Track Info */}
                    {playbackState?.track_window.current_track && (
                        <CurrentTrackInfo track={playbackState.track_window.current_track} />
                    )}

                    {/* Playback Controls */}
                    {playbackState && (
                        <PlaybackControls 
                            isPaused={playbackState.paused} 
                            onTogglePlay={togglePlay} 
                        />
                    )}

                    {/* Volume Control */}
                    <VolumeControl 
                        volume={volume} 
                        onVolumeChange={handleVolumeChange} 
                    />

                    {/* Track List */}
                    <div className="track-list-section">
                        <h3 className="track-list-title">Tracks</h3>
                        
                        {isLoadingTracks ? (
                            <LoadingSpinner />
                        ) : playlistTracks.length === 0 ? (
                            <EmptyState message="No tracks found in this playlist." />
                        ) : (
                            <div className="track-list-container">
                                {playlistTracks.map(track => (
                                    <TrackItem 
                                        key={track.id}
                                        track={track}
                                        isActive={playbackState?.track_window.current_track.id === track.id}
                                        onPlay={playTrack}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default WebPlayback;
