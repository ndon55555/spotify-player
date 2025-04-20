import { NextResponse } from 'next/server';

export async function GET() {
  // Create a response that will redirect to the home page
  const response = NextResponse.redirect(new URL('/', 'http://localhost:3000'));

  // Clear the HTTP-only cookie that contains the access token
  response.cookies.delete('access_token');

  return response;
}
