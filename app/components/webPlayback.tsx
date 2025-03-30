import React, { useEffect, useRef } from 'react';

interface WebPlaybackProps {
    token: string;
}

// Script ID constant
const SPOTIFY_PLAYER_SCRIPT_ID = 'spotify-player-sdk';

const WebPlayback: React.FC<WebPlaybackProps> = (props) => {
    const playerRef = useRef<Spotify.Player | null>(null);
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
                volume: 0.5
            });

            // Store player reference
            playerRef.current = player;

            // Ready
            player.addListener('ready', ({ device_id }) => {
                console.log('Ready with Device ID', device_id);
            });

            // Not Ready
            player.addListener('not_ready', ({ device_id }) => {
                console.log('Not ready with Device ID', device_id);
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
    }, [props.token]);

    return (
        <>
            <div className="container">
                <div className="main-wrapper">
                    {/* Add your playback UI components here */}
                </div>
            </div>
        </>
    );
}

export default WebPlayback;
