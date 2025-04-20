'use client';

import Login from './components/login';
import WebPlayback from './components/webPlayback';
import TokenTestButton from './components/TokenTestButton';
import { useSpotifyAuth } from './utils/spotifyAuth';

const Home: React.FC = () => {
  const { token, isLoading, error, refreshToken } = useSpotifyAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center text-white">Loading...</div>;
  }

  if (error) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 text-white">
        <p>Authentication error: {error}</p>
        <Login />
      </div>
    );
  }

  return (
    <>
      {!token ? (
        <Login />
      ) : (
        <div className="flex flex-col">
          <WebPlayback token={token} refreshToken={refreshToken} />
          <div className="container mx-auto">
            <TokenTestButton refreshToken={refreshToken} />
          </div>
        </div>
      )}
    </>
  );
};

export default Home;
