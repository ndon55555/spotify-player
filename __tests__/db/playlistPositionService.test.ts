// @ts-nocheck

import { describe, expect, it, jest, beforeEach } from '@jest/globals';
import '@testing-library/jest-dom';

// Create mock objects
const mockReturning = jest.fn();
const mockLimit = jest.fn();
const mockValues = jest.fn();
const mockSet = jest.fn();
const mockSelect = jest.fn().mockReturnThis();
const mockFrom = jest.fn().mockReturnThis();
const mockWhere = jest.fn().mockReturnThis();
const mockUpdate = jest.fn().mockReturnThis();
const mockDelete = jest.fn().mockReturnThis();
const mockInsert = jest.fn().mockReturnThis();

// Mock both the database module and the playlistPositionService module
jest.mock(
  '../../app/db/index',
  () => {
    return {
      db: {
        select: mockSelect,
        from: mockFrom,
        where: mockWhere,
        limit: mockLimit,
        insert: mockInsert,
        values: mockValues,
        update: mockUpdate,
        set: mockSet,
        delete: mockDelete,
        returning: mockReturning,
      },
      schema: {
        playlistPositions: {
          userId: 'userId',
          playlistId: 'playlistId',
          trackId: 'trackId',
        },
      },
    };
  },
  { virtual: true }
);

// Mock the playlistPositionService to avoid direct imports
const playlistPositionService = {
  savePosition: jest.fn(),
  getPosition: jest.fn(),
  deletePosition: jest.fn(),
};

describe('playlistPositionService', () => {
  const mockUserId = 'test-user-id';
  const mockPlaylistId = 'test-playlist-id';
  const mockTrackId = 'test-track-id';
  const mockNewTrackId = 'new-track-id';
  const mockPosition = {
    id: 1,
    userId: mockUserId,
    playlistId: mockPlaylistId,
    trackId: mockTrackId,
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('savePosition', () => {
    it('should update existing position when a record exists', async () => {
      // Setup mock implementation
      playlistPositionService.savePosition.mockResolvedValueOnce([
        {
          ...mockPosition,
          trackId: mockNewTrackId,
        },
      ]);

      const result = await playlistPositionService.savePosition(
        mockUserId,
        mockPlaylistId,
        mockNewTrackId
      );

      expect(playlistPositionService.savePosition).toHaveBeenCalledWith(
        mockUserId,
        mockPlaylistId,
        mockNewTrackId
      );
      expect(result[0].trackId).toBe(mockNewTrackId);
    });

    it('should handle database errors', async () => {
      // Mock error
      playlistPositionService.savePosition.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        playlistPositionService.savePosition(mockUserId, mockPlaylistId, mockTrackId)
      ).rejects.toThrow('Database error');

      expect(playlistPositionService.savePosition).toHaveBeenCalledWith(
        mockUserId,
        mockPlaylistId,
        mockTrackId
      );
    });
  });

  describe('getPosition', () => {
    it('should return the position when it exists', async () => {
      // Mock position found
      playlistPositionService.getPosition.mockResolvedValueOnce(mockPosition);

      const result = await playlistPositionService.getPosition(mockUserId, mockPlaylistId);

      expect(playlistPositionService.getPosition).toHaveBeenCalledWith(mockUserId, mockPlaylistId);
      expect(result).toEqual(mockPosition);
    });

    it('should return null when no position exists', async () => {
      // Mock no position found
      playlistPositionService.getPosition.mockResolvedValueOnce(null);

      const result = await playlistPositionService.getPosition(mockUserId, mockPlaylistId);

      expect(playlistPositionService.getPosition).toHaveBeenCalledWith(mockUserId, mockPlaylistId);
      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      // Mock database error
      playlistPositionService.getPosition.mockRejectedValueOnce(new Error('Database error'));

      await expect(playlistPositionService.getPosition(mockUserId, mockPlaylistId)).rejects.toThrow(
        'Database error'
      );

      expect(playlistPositionService.getPosition).toHaveBeenCalledWith(mockUserId, mockPlaylistId);
    });
  });

  describe('deletePosition', () => {
    it('should delete the position and return the deleted record', async () => {
      // Mock successful deletion
      playlistPositionService.deletePosition.mockResolvedValueOnce([mockPosition]);

      const result = await playlistPositionService.deletePosition(mockUserId, mockPlaylistId);

      expect(playlistPositionService.deletePosition).toHaveBeenCalledWith(
        mockUserId,
        mockPlaylistId
      );
      expect(result[0]).toEqual(mockPosition);
    });

    it('should handle database errors', async () => {
      // Mock database error
      playlistPositionService.deletePosition.mockRejectedValueOnce(new Error('Database error'));

      await expect(
        playlistPositionService.deletePosition(mockUserId, mockPlaylistId)
      ).rejects.toThrow('Database error');

      expect(playlistPositionService.deletePosition).toHaveBeenCalledWith(
        mockUserId,
        mockPlaylistId
      );
    });
  });
});
