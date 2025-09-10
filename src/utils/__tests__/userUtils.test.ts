import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getDisplayName, getDisplayNames } from '../userUtils';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    admin: {
      getUserById: vi.fn()
    }
  }
};

vi.mock('@/integrations/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('userUtils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getDisplayName', () => {
    it('should return full_name from profiles table when available', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { full_name: 'John Smith', email: 'john@example.com' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getDisplayName('user-123');
      expect(result).toBe('John Smith');
      expect(mockSupabase.from).toHaveBeenCalledWith('profiles');
    });

    it('should fall back to auth metadata when profiles full_name is null', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { full_name: null, email: 'john@example.com' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            email: 'john@example.com',
            user_metadata: {
              display_name: 'John from Auth'
            }
          }
        },
        error: null
      });

      const result = await getDisplayName('user-123');
      expect(result).toBe('John from Auth');
    });

    it('should fall back to email prefix when no name available', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: { full_name: null, email: 'john.doe@example.com' },
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: {
          user: {
            email: 'john.doe@example.com',
            user_metadata: {}
          }
        },
        error: null
      });

      const result = await getDisplayName('user-123');
      expect(result).toBe('john.doe');
    });

    it('should return "Unknown User" when all fallbacks fail', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({
            data: null,
            error: null
          })
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      mockSupabase.auth.admin.getUserById.mockResolvedValue({
        data: { user: null },
        error: null
      });

      const result = await getDisplayName('user-123');
      expect(result).toBe('Unknown User');
    });
  });

  describe('getDisplayNames', () => {
    it('should return display names for multiple users', async () => {
      const mockSelect = vi.fn().mockReturnValue({
        in: vi.fn().mockResolvedValue({
          data: [
            { id: 'user-1', full_name: 'John Smith', email: 'john@example.com' },
            { id: 'user-2', full_name: null, email: 'jane.doe@example.com' }
          ],
          error: null
        })
      });

      mockSupabase.from.mockReturnValue({
        select: mockSelect
      });

      const result = await getDisplayNames(['user-1', 'user-2']);
      expect(result).toEqual({
        'user-1': 'John Smith',
        'user-2': 'jane.doe'
      });
    });

    it('should handle errors gracefully', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          in: vi.fn().mockRejectedValue(new Error('Database error'))
        })
      });

      const result = await getDisplayNames(['user-1', 'user-2']);
      expect(result).toEqual({
        'user-1': 'Unknown User',
        'user-2': 'Unknown User'
      });
    });
  });
});