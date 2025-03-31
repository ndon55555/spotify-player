'use client';

import { useEffect, useState } from 'react';
import Login from './components/login';
import WebPlayback from './components/webPlayback';

const Home: React.FC = () => {
  const [token, setToken] = useState<string | undefined>(undefined);

  useEffect(() => {
    async function getToken() {
      const response = await fetch('/api/auth/token');
      const json = await response.json();
      setToken(json.access_token);
    }

    getToken();
  }, []);

  return <>{token === undefined ? <Login /> : <WebPlayback token={token} />}</>;
};

export default Home;
