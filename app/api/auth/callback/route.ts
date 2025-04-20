import { NextRequest, NextResponse } from 'next/server';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const spotify_client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = 'http://localhost:3000/api/auth/callback';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');

  if (code === null || code === undefined || code === '') {
    return NextResponse.json({ error: 'Code not provided' }, { status: 400 });
  }

  const authOptions = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization:
        'Basic ' + Buffer.from(spotify_client_id + ':' + spotify_client_secret).toString('base64'),
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri,
    }),
  };

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', authOptions);
    const data = await response.json();

    if (response.ok) {
      const response = NextResponse.redirect('http://localhost:3000');
      // Store access token with expiration
      const expiresInSeconds = data.expires_in || 3600;
      response.cookies.set('access_token', data.access_token, {
        httpOnly: true,
        maxAge: expiresInSeconds,
      });

      // Store refresh token with longer expiration (30 days)
      // Note: The 30-day expiration is just for the cookie storage mechanism, not the actual
      // refresh token validity. Spotify refresh tokens can last much longer or be revoked by
      // Spotify at any time. This is a reasonable cookie expiration time for security purposes.
      if (data.refresh_token) {
        response.cookies.set('refresh_token', data.refresh_token, {
          httpOnly: true,
          maxAge: 30 * 24 * 60 * 60, // 30 days
        });
      }
      return response;
    } else {
      return NextResponse.json(data, { status: response.status });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
  }
}
