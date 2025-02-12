import React from 'react';

const Login: React.FC = () => {
    return (
        <div className="App">
            <header className="App-header">
                <a className="btn-spotify" href="/api/auth/login">
                    Login with Spotify
                </a>
            </header>
        </div>
    );
}

export default Login;