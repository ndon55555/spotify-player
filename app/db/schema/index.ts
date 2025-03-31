import { pgTable, serial, varchar, timestamp, integer } from 'drizzle-orm/pg-core';

/**
 * Table to store user's playlist positions
 * This allows the app to remember which track was last played in each playlist
 */
export const playlistPositions = pgTable('playlist_positions', {
  id: serial('id').primaryKey(),
  userId: varchar('user_id', { length: 255 }).notNull(),
  playlistId: varchar('playlist_id', { length: 255 }).notNull(),
  trackId: varchar('track_id', { length: 255 }).notNull(),
  position: integer('position').notNull().default(0), // Position in milliseconds
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
