import { NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';

const spotify_client_id = process.env.SPOTIFY_CLIENT_ID;
const redirect_uri = "http://localhost:3000/api/auth/callback";

export async function GET() {
    const scopes = [
        "streaming", 
        "user-read-email", 
        "user-read-private",
    ];
    const scope = scopes.join(" ");
    const state = uuidv4();

    const auth_query_parameters = new URLSearchParams({
        response_type: "code",
        client_id: spotify_client_id!,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
    });

    return NextResponse.redirect('https://accounts.spotify.com/authorize/?' + auth_query_parameters.toString());
}