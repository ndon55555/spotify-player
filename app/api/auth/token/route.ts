import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const access_token = request.cookies.get('access_token')?.value;
  // TODO check that access_token is defined

  return NextResponse.json({ access_token: access_token });
}
