// @ts-nocheck

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react';
import { useSpotifyAuth, fetchWithSpotifyAuth } from '../../app/utils/spotifyAuth';
import '@testing-library/jest-dom';

// Create a typed mock for fetch
const mockFetchFn = jest.fn();

// Mock the global fetch function
global.fetch = mockFetchFn;

describe('useSpotifyAuth', () => {
  beforeEach(() => {
    mockFetchFn.mockClear();
  });

  it('should load token on initial render', async () => {
    // Mock successful token response
    mockFetchFn.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ access_token: 'test-token' }),
    });

    const { result } = renderHook(() => useSpotifyAuth());

    // Initially, isLoading should be true and token undefined
    expect(result.current.isLoading).toBe(true);
    expect(result.current.token).toBeUndefined();

    // Wait for the useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // After loading, token should be set and isLoading false
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBe('test-token');
    expect(result.current.error).toBeUndefined();
    expect(mockFetchFn).toHaveBeenCalledWith('/api/auth/token');
  });

  it('should handle token fetch errors', async () => {
    // Mock error response
    mockFetchFn.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ error: 'Invalid credentials' }),
    });

    const { result } = renderHook(() => useSpotifyAuth());

    // Wait for the useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have error set
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBeUndefined();
    expect(result.current.error).toBe('Invalid credentials');
  });

  it('should handle network errors during token fetch', async () => {
    // Mock network error
    mockFetchFn.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useSpotifyAuth());

    // Wait for the useEffect to complete
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Should have error set
    expect(result.current.isLoading).toBe(false);
    expect(result.current.token).toBeUndefined();
    expect(result.current.error).toBe('Network error when fetching token');
  });

  it('should refresh token when refreshToken is called', async () => {
    // Mock initial token fetch
    mockFetchFn.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ access_token: 'test-token' }),
    });

    // Mock token refresh response
    mockFetchFn.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ access_token: 'new-test-token' }),
    });

    const { result } = renderHook(() => useSpotifyAuth());

    // Wait for initial token fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Refresh the token
    let refreshedToken;
    await act(async () => {
      refreshedToken = await result.current.refreshToken();
    });

    // Check if token was refreshed
    expect(refreshedToken).toBe('new-test-token');
    expect(result.current.token).toBe('new-test-token');
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeUndefined();
    expect(mockFetchFn).toHaveBeenCalledWith('/api/auth/refresh');
  });

  it('should handle errors during token refresh', async () => {
    // Mock initial token fetch
    mockFetchFn.mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ access_token: 'test-token' }),
    });

    // Mock error response for refresh
    mockFetchFn.mockResolvedValueOnce({
      ok: false,
      json: jest.fn().mockResolvedValueOnce({ error: 'Refresh failed' }),
    });

    const { result } = renderHook(() => useSpotifyAuth());

    // Wait for initial token fetch
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });

    // Refresh the token
    let refreshedToken;
    await act(async () => {
      refreshedToken = await result.current.refreshToken();
    });

    // Check if error was handled
    expect(refreshedToken).toBeUndefined();
    expect(result.current.token).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Refresh failed');
  });
});

describe('fetchWithSpotifyAuth', () => {
  beforeEach(() => {
    mockFetchFn.mockClear();
  });

  it('should make request with provided token', async () => {
    // Mock successful API response
    mockFetchFn.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ data: 'test-data' }),
    });

    const mockToken = 'test-token';
    const mockRefreshToken = jest.fn();
    const url = 'https://api.spotify.com/v1/me';
    const options = { method: 'GET' };

    const response = await fetchWithSpotifyAuth(url, mockToken, mockRefreshToken, options);

    expect(response.status).toBe(200);
    expect(mockFetchFn).toHaveBeenCalledWith(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${mockToken}`,
      },
    });
    expect(mockRefreshToken).not.toHaveBeenCalled();
  });

  it('should refresh token and retry request when 401 is received', async () => {
    // Mock 401 response for first call
    mockFetchFn.mockResolvedValueOnce({
      status: 401,
      json: jest.fn().mockResolvedValueOnce({ error: 'The access token expired' }),
    });

    // Mock successful response for second call
    mockFetchFn.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ data: 'test-data' }),
    });

    const mockToken = 'expired-token';
    const mockNewToken = 'new-token';
    const mockRefreshToken = jest.fn().mockResolvedValueOnce(mockNewToken);
    const url = 'https://api.spotify.com/v1/me';
    const options = { method: 'GET' };

    const response = await fetchWithSpotifyAuth(url, mockToken, mockRefreshToken, options);

    // Check if token was refreshed and request was retried
    expect(mockRefreshToken).toHaveBeenCalled();
    expect(mockFetchFn).toHaveBeenCalledTimes(2);
    expect(mockFetchFn).toHaveBeenLastCalledWith(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${mockNewToken}`,
      },
    });
    expect(response.status).toBe(200);
  });

  it('should not retry if token refresh fails', async () => {
    // Mock 401 response
    mockFetchFn.mockResolvedValueOnce({
      status: 401,
      json: jest.fn().mockResolvedValueOnce({ error: 'The access token expired' }),
    });

    const mockToken = 'expired-token';
    const mockRefreshToken = jest.fn().mockResolvedValueOnce(undefined);
    const url = 'https://api.spotify.com/v1/me';
    const options = { method: 'GET' };

    const response = await fetchWithSpotifyAuth(url, mockToken, mockRefreshToken, options);

    // Check if token refresh was attempted but no retry happened
    expect(mockRefreshToken).toHaveBeenCalled();
    expect(mockFetchFn).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(401);
  });

  it('should preserve custom headers when making requests', async () => {
    // Mock successful response
    mockFetchFn.mockResolvedValueOnce({
      status: 200,
      json: jest.fn().mockResolvedValueOnce({ data: 'test-data' }),
    });

    const mockToken = 'test-token';
    const mockRefreshToken = jest.fn();
    const url = 'https://api.spotify.com/v1/me';
    const options = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    };

    await fetchWithSpotifyAuth(url, mockToken, mockRefreshToken, options);

    // Check if custom headers were preserved
    expect(mockFetchFn).toHaveBeenCalledWith(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${mockToken}`,
      },
    });
  });
});
