import { pgTable, serial, varchar, timestamp } from 'drizzle-orm/pg-core';

/**
 * Table to store user's last played track in each playlist
 * This allows the app to remember which track was last played in each playlist
 */
export const playlistPositions = pgTable('playlist_positions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  playlistId: varchar('playlist_id', { length: 255 }).notNull(),
  trackId: varchar('track_id', { length: 255 }).notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Create a unique constraint to ensure only one position per user per playlist
export const playlistPositionsIndex = {
  userPlaylistIdx: {
    name: 'user_playlist_idx',
    columns: ['user_id', 'playlist_id'],
    unique: true,
  },
};
