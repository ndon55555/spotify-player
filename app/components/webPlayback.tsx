import React, { useEffect, useRef, useState } from 'react';

interface WebPlaybackProps {
    token: string;
}

// Script ID constant
const SPOTIFY_PLAYER_SCRIPT_ID = 'spotify-player-sdk';

// Define interfaces for Spotify data
interface SpotifyTrack {
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

interface SpotifyPlaylist {
    id: string;
    name: string;
    images: { url: string }[];
    uri: string;
}

interface PlaybackState {
    paused: boolean;
    position: number;
    duration: number;
    track_window: {
        current_track: SpotifyTrack;
        previous_tracks: SpotifyTrack[];
        next_tracks: SpotifyTrack[];
    };
}

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
        <div className="container mx-auto p-4 max-w-6xl">
            {/* Logout button */}
            <div className="flex justify-end mb-4">
                <button 
                    onClick={handleLogout}
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-full text-sm"
                >
                    Logout
                </button>
            </div>
            
            {/* Info message about permissions */}
            {error && error.includes('permissions') && (
                <div className="bg-blue-900/50 text-white p-4 rounded mb-6">
                    <h3 className="font-bold text-lg mb-2">New Permissions Required</h3>
                    <p>This app now requires additional permissions to access your playlists and control playback.</p>
                    <p className="mt-2">Please <a href="/api/auth/login" className="underline font-bold">log out and log back in</a> to grant these permissions.</p>
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Playlist Selection Section */}
                <div className="bg-gray-800 rounded-lg p-4 md:col-span-1">
                    <h2 className="text-xl font-bold mb-4">Your Playlists</h2>
                    
                    {error && (
                        <div className="bg-red-900/50 text-white p-3 rounded mb-4">
                            {error}
                        </div>
                    )}
                    
                    {isLoadingPlaylists ? (
                        <div className="flex justify-center items-center h-40">
                            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                        </div>
                    ) : playlists.length === 0 ? (
                        <div className="text-center py-8 text-gray-400">
                            <p>No playlists found.</p>
                            <p className="mt-2 text-sm">Make sure you have the correct permissions.</p>
                        </div>
                    ) : (
                        <div className="max-h-[500px] overflow-y-auto">
                            {playlists.map(playlist => (
                                <div 
                                    key={playlist.id} 
                                    className={`flex items-center p-2 mb-2 rounded cursor-pointer hover:bg-gray-700 ${activePlaylist?.id === playlist.id ? 'bg-gray-700' : ''}`}
                                    onClick={() => handlePlaylistSelect(playlist)}
                                >
                                    {playlist.images.length > 0 && (
                                        <img 
                                            src={playlist.images[0].url} 
                                            alt={playlist.name} 
                                            className="w-12 h-12 rounded mr-3"
                                        />
                                    )}
                                    <span className="truncate">{playlist.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Main Player Section */}
                <div className="bg-gray-800 rounded-lg p-4 md:col-span-2">
                    {/* Active Playlist Info */}
                    {activePlaylist && (
                        <div className="flex items-center mb-6">
                            {activePlaylist.images.length > 0 && (
                                <img 
                                    src={activePlaylist.images[0].url} 
                                    alt={activePlaylist.name} 
                                    className="w-24 h-24 rounded-lg mr-4"
                                />
                            )}
                            <div>
                                <h2 className="text-2xl font-bold">{activePlaylist.name}</h2>
                                <p className="text-gray-400">Playlist</p>
                            </div>
                        </div>
                    )}

                    {/* Current Track Info */}
                    {playbackState?.track_window.current_track && (
                        <div className="flex items-center mb-6">
                            <img 
                                src={playbackState.track_window.current_track.album.images[0].url} 
                                alt={playbackState.track_window.current_track.name} 
                                className="w-32 h-32 rounded-lg mr-4"
                            />
                            <div>
                                <h3 className="text-xl font-bold">{playbackState.track_window.current_track.name}</h3>
                                <p className="text-gray-400">
                                    {playbackState.track_window.current_track.artists.map(artist => artist.name).join(', ')}
                                </p>
                                <p className="text-gray-500">{playbackState.track_window.current_track.album.name}</p>
                            </div>
                        </div>
                    )}

                    {/* Playback Controls */}
                    <div className="flex justify-center items-center mb-6">
                        <button 
                            onClick={togglePlay}
                            className="bg-green-500 hover:bg-green-600 text-white rounded-full p-4 mx-2"
                        >
                            {playbackState?.paused ? (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                </svg>
                            ) : (
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            )}
                        </button>
                    </div>

                    {/* Volume Control */}
                    <div className="flex items-center justify-center mb-6">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                        </svg>
                        <input 
                            type="range" 
                            min="0" 
                            max="100" 
                            value={volume} 
                            onChange={(e) => handleVolumeChange(Number(e.target.value))}
                            className="w-48 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>

                    {/* Track List */}
                    <div className="mt-6">
                        <h3 className="text-lg font-bold mb-3">Tracks</h3>
                        
                        {isLoadingTracks ? (
                            <div className="flex justify-center items-center h-40">
                                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
                            </div>
                        ) : playlistTracks.length === 0 ? (
                            <div className="text-center py-8 text-gray-400">
                                <p>No tracks found in this playlist.</p>
                            </div>
                        ) : (
                            <div className="max-h-[300px] overflow-y-auto">
                                {playlistTracks.map(track => (
                                    <div 
                                        key={track.id} 
                                        className={`flex items-center p-2 hover:bg-gray-700 rounded cursor-pointer ${
                                            playbackState?.track_window.current_track.id === track.id ? 'bg-gray-700' : ''
                                        }`}
                                        onClick={() => playTrack(track.uri)}
                                    >
                                        {track.album.images && track.album.images.length > 0 ? (
                                            <img 
                                                src={track.album.images[0].url} 
                                                alt={track.name} 
                                                className="w-10 h-10 rounded mr-3"
                                            />
                                        ) : (
                                            <div className="w-10 h-10 bg-gray-700 rounded mr-3 flex items-center justify-center">
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                                                </svg>
                                            </div>
                                        )}
                                        <div className="flex-grow">
                                            <div className="font-medium">{track.name}</div>
                                            <div className="text-sm text-gray-400">{track.artists.map(artist => artist.name).join(', ')}</div>
                                        </div>
                                    </div>
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
