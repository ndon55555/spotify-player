// Utility for handling Spotify authentication
import { useState, useEffect, useCallback } from 'react';

interface UseSpotifyAuthResult {
  token: string | undefined;
  isLoading: boolean;
  error: string | undefined;
  refreshToken: () => Promise<string | undefined>;
}

/**
 * Custom hook for handling Spotify authentication tokens
 * Provides token state, loading state, error state, and refresh functionality
 */
export function useSpotifyAuth(): UseSpotifyAuthResult {
  const [token, setToken] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | undefined>(undefined);

  // Function to fetch token from the API
  const fetchToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/token');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to get authentication token');
        setToken(undefined);
        return undefined;
      }

      setError(undefined);
      setToken(data.access_token);
      return data.access_token;
    } catch {
      setError('Network error when fetching token');
      setToken(undefined);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Function to explicitly refresh the token
  const refreshToken = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/auth/refresh');
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to refresh token');
        setToken(undefined);
        return undefined;
      }

      setError(undefined);
      setToken(data.access_token);
      return data.access_token;
    } catch {
      setError('Network error when refreshing token');
      setToken(undefined);
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Get token on component mount
  useEffect(() => {
    fetchToken();
  }, [fetchToken]);

  return { token, isLoading, error, refreshToken };
}

/**
 * Utility function to make authenticated API requests to Spotify
 * Handles token refreshing automatically if the token is expired
 */
export async function fetchWithSpotifyAuth(
  url: string,
  token: string,
  refreshToken: () => Promise<string | undefined>,
  options: RequestInit = {}
): Promise<Response> {
  // Initial request with current token
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      Authorization: `Bearer ${token}`,
    },
  });

  // If we get a 401, try to refresh the token and retry the request
  if (response.status === 401) {
    const newToken = await refreshToken();
    if (newToken) {
      // Retry the request with the new token
      return fetch(url, {
        ...options,
        headers: {
          ...options.headers,
          Authorization: `Bearer ${newToken}`,
        },
      });
    }
  }

  return response;
}
