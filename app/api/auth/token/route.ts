import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const access_token = request.cookies.get('access_token')?.value;

  if (!access_token) {
    // Check if we have a refresh token to get a new access token
    const refresh_token = request.cookies.get('refresh_token')?.value;

    if (refresh_token) {
      // Redirect to refresh endpoint to get a new token
      const refreshResponse = await fetch(new URL('/api/auth/refresh', request.url).toString(), {
        headers: {
          Cookie: `refresh_token=${refresh_token}`,
        },
      });

      if (refreshResponse.ok) {
        const data = await refreshResponse.json();
        return NextResponse.json({ access_token: data.access_token });
      }
    }

    // If we get here, we couldn't refresh the token
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }

  return NextResponse.json({ access_token: access_token });
}
