import React from 'react';

const Login: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold mb-4">Spotify Player</h1>
                    <p className="text-gray-400 mb-8">Connect to your Spotify account to start listening</p>
                </div>
                <a className="btn-spotify" href="/api/auth/login">
                    Login with Spotify
                </a>
            </header>
        </div>
    );
}

export default Login;
