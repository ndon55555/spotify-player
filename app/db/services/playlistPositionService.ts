import { db, schema } from '../index';
import { eq, and } from 'drizzle-orm';

const { playlistPositions } = schema;

/**
 * Service for managing last played tracks in playlists
 */
export const playlistPositionService = {
  /**
   * Save the last played track in a playlist for a user
   */
  async savePosition(userId: string, playlistId: string, trackId: string) {
    try {
      // Check if a record already exists for this user and playlist
      const existingPosition = await db
        .select()
        .from(playlistPositions)
        .where(
          and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
        )
        .limit(1);

      if (existingPosition.length > 0) {
        // Update existing record
        return await db
          .update(playlistPositions)
          .set({
            trackId,
            updatedAt: new Date(),
          })
          .where(
            and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
          )
          .returning();
      } else {
        // Insert new record
        return await db
          .insert(playlistPositions)
          .values({
            userId,
            playlistId,
            trackId,
          })
          .returning();
      }
    } catch (error) {
      console.error('Error saving playlist position:', error);
      throw error;
    }
  },

  /**
   * Get the last played track for a playlist
   */
  async getPosition(userId: string, playlistId: string) {
    try {
      const position = await db
        .select()
        .from(playlistPositions)
        .where(
          and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
        )
        .limit(1);

      return position[0] || null;
    } catch (error) {
      console.error('Error getting playlist position:', error);
      throw error;
    }
  },

  /**
   * Delete a saved track position
   */
  async deletePosition(userId: string, playlistId: string) {
    try {
      return await db
        .delete(playlistPositions)
        .where(
          and(eq(playlistPositions.userId, userId), eq(playlistPositions.playlistId, playlistId))
        )
        .returning();
    } catch (error) {
      console.error('Error deleting playlist position:', error);
      throw error;
    }
  },
};
