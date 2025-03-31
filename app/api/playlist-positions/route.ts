import { NextRequest, NextResponse } from 'next/server';
import { db, schema } from '../../db/index';
import { eq, and } from 'drizzle-orm';

const { playlistPositions } = schema;

// GET /api/playlist-positions?userId=xxx&playlistId=yyy
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const playlistId = searchParams.get('playlistId');

  if (!userId || !playlistId) {
    return NextResponse.json({ error: 'Missing userId or playlistId' }, { status: 400 });
  }

  try {
    const position = await db
      .select()
      .from(playlistPositions)
      .where(
        and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
      )
      .limit(1);

    if (position.length === 0) {
      return NextResponse.json(null);
    }

    return NextResponse.json(position[0]);
  } catch (error) {
    console.error('Error getting playlist position:', error);
    return NextResponse.json({ error: 'Failed to get playlist position' }, { status: 500 });
  }
}

// POST /api/playlist-positions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, playlistId, trackId, position } = body;

    if (!userId || !playlistId || !trackId || position === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if a record already exists
    const existingPosition = await db
      .select()
      .from(playlistPositions)
      .where(
        and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
      )
      .limit(1);

    let result;
    if (existingPosition.length > 0) {
      // Update existing record
      result = await db
        .update(playlistPositions)
        .set({
          trackId,
          position,
          updatedAt: new Date(),
        })
        .where(
          and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
        )
        .returning();
    } else {
      // Insert new record
      result = await db
        .insert(playlistPositions)
        .values({
          userId,
          playlistId,
          trackId,
          position,
        })
        .returning();
    }

    return NextResponse.json(result[0]);
  } catch (error) {
    console.error('Error saving playlist position:', error);
    return NextResponse.json({ error: 'Failed to save playlist position' }, { status: 500 });
  }
}

// DELETE /api/playlist-positions?userId=xxx&playlistId=yyy
export async function DELETE(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const userId = searchParams.get('userId');
  const playlistId = searchParams.get('playlistId');

  if (!userId || !playlistId) {
    return NextResponse.json({ error: 'Missing userId or playlistId' }, { status: 400 });
  }

  try {
    const result = await db
      .delete(playlistPositions)
      .where(
        and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
      )
      .returning();

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error deleting playlist position:', error);
    return NextResponse.json({ error: 'Failed to delete playlist position' }, { status: 500 });
  }
}
