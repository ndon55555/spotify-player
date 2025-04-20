import { NextRequest, NextResponse } from 'next/server';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;

export async function GET(req: NextRequest) {
  // Get refresh token from cookie
  const refreshToken = req.cookies.get('refresh_token')?.value;

  if (!refreshToken) {
    return NextResponse.json(
      { error: 'No refresh token found. Please login again.' },
      { status: 401 }
    );
  }

  try {
    // Make request to refresh the token
    const authOptions = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization:
          'Basic ' +
          Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
      },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    };

    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    // Return new tokens in a new response
    const newResponse = NextResponse.json({
      access_token: data.access_token,
      expires_in: data.expires_in || 3600,
    });

    // Update the cookies
    const expiresInSeconds = data.expires_in || 3600;
    newResponse.cookies.set('access_token', data.access_token, {
      httpOnly: true,
      maxAge: expiresInSeconds,
    });

    // Spotify may or may not provide a new refresh token when refreshing an access token.
    // According to Spotify's documentation: "When a refresh token is not returned, continue using the existing token."
    // So we only update the refresh token cookie if a new one is provided.
    if (data.refresh_token) {
      newResponse.cookies.set('refresh_token', data.refresh_token, {
        httpOnly: true,
        maxAge: 30 * 24 * 60 * 60, // 30 days (cookie expiration, not token validity)
      });
    }

    return newResponse;
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}
