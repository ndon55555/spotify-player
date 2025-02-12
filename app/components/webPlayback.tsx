import React, { useEffect } from 'react';

interface WebPlaybackProps {
    token: string;
}

const WebPlayback: React.FC<WebPlaybackProps> = (props) => {
    useEffect(() => {
        const script = document.createElement('script');
        script.src = 'https://sdk.scdn.co/spotify-player.js';
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const player = new Spotify.Player({
                name: 'My Web Playback SDK Player',
                getOAuthToken: cb => { cb(props.token); },
                volume: 0.5
            });

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