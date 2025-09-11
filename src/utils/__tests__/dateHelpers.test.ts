import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  startOfToday,
  endOfToday,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  getDateBoundaries,
  formatFilterMode,
  getFilterCacheKey,
  toUTCBoundary
} from '../dateHelpers';

describe('dateHelpers', () => {
  beforeEach(() => {
    // Mock Date to a specific time for consistent testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-15T14:30:00.000Z')); // Wednesday
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('startOfToday', () => {
    it('should return start of today at 00:00:00', () => {
      const result = startOfToday();
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });
  });

  describe('endOfToday', () => {
    it('should return end of today at 23:59:59.999', () => {
      const result = endOfToday();
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('startOfWeek', () => {
    it('should return Monday 00:00:00 when localeMonday is true', () => {
      const result = startOfWeek(true);
      expect(result.getDay()).toBe(1); // Monday
      expect(result.getHours()).toBe(0);
      expect(result.getMinutes()).toBe(0);
      expect(result.getSeconds()).toBe(0);
      expect(result.getMilliseconds()).toBe(0);
    });

    it('should return Sunday 00:00:00 when localeMonday is false', () => {
      const result = startOfWeek(false);
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getHours()).toBe(0);
    });
  });

  describe('endOfWeek', () => {
    it('should return Sunday 23:59:59.999 when localeMonday is true', () => {
      const result = endOfWeek(true);
      expect(result.getDay()).toBe(0); // Sunday
      expect(result.getHours()).toBe(23);
      expect(result.getMinutes()).toBe(59);
      expect(result.getSeconds()).toBe(59);
      expect(result.getMilliseconds()).toBe(999);
    });
  });

  describe('edge cases around midnight and week boundaries', () => {
    it('should include 23:59:59 local in Today only', () => {
      vi.setSystemTime(new Date('2025-01-15T23:59:59.000')); // Late night
      
      const todayStart = startOfToday();
      const todayEnd = endOfToday();
      const weekStart = startOfWeek(true);
      
      const testTime = new Date('2025-01-15T23:59:59.000');
      
      expect(testTime >= todayStart && testTime <= todayEnd).toBe(true);
      expect(testTime >= weekStart).toBe(true); // Also in this week
    });

    it('should include Monday 00:00 local in This Week', () => {
      vi.setSystemTime(new Date('2025-01-13T00:00:00.000')); // Monday midnight
      
      const weekStart = startOfWeek(true);
      const testTime = new Date('2025-01-13T00:00:00.000');
      
      expect(testTime >= weekStart).toBe(true);
      expect(weekStart.getDay()).toBe(1); // Monday
    });

    it('should include Sunday 23:59:59 local until week end', () => {
      vi.setSystemTime(new Date('2025-01-19T23:59:59.000')); // Sunday late
      
      const weekEnd = endOfWeek(true);
      const testTime = new Date('2025-01-19T23:59:59.000');
      
      expect(testTime <= weekEnd).toBe(true);
      expect(weekEnd.getDay()).toBe(0); // Sunday
    });
  });

  describe('getDateBoundaries', () => {
    it('should return correct boundaries for today mode', () => {
      const filter = { mode: 'today' as const };
      const boundaries = getDateBoundaries(filter);
      
      expect(boundaries.startDate.getHours()).toBe(0);
      expect(boundaries.endDate.getHours()).toBe(23);
      expect(boundaries.utcStart).toBeInstanceOf(Date);
      expect(boundaries.utcEnd).toBeInstanceOf(Date);
    });

    it('should return correct boundaries for this-week mode', () => {
      const filter = { mode: 'this-week' as const };
      const boundaries = getDateBoundaries(filter);
      
      expect(boundaries.startDate.getDay()).toBe(1); // Monday
      expect(boundaries.endDate.getDay()).toBe(0); // Sunday
    });

    it('should return correct boundaries for custom-range mode', () => {
      const startDate = new Date('2025-01-01');
      const endDate = new Date('2025-01-31');
      const filter = { 
        mode: 'custom-range' as const, 
        startDate, 
        endDate 
      };
      
      const boundaries = getDateBoundaries(filter);
      
      expect(boundaries.startDate.getDate()).toBe(1);
      expect(boundaries.endDate.getDate()).toBe(31);
      expect(boundaries.startDate.getHours()).toBe(0);
      expect(boundaries.endDate.getHours()).toBe(23);
    });

    it('should throw error for custom-range without dates', () => {
      const filter = { mode: 'custom-range' as const };
      
      expect(() => getDateBoundaries(filter)).toThrow('Custom range requires both start and end dates');
    });
  });

  describe('formatFilterMode', () => {
    it('should format filter modes correctly', () => {
      expect(formatFilterMode({ mode: 'today' })).toBe('Today');
      expect(formatFilterMode({ mode: 'this-week' })).toBe('This Week');
      expect(formatFilterMode({ mode: 'this-month' })).toBe('This Month');
      
      const customFilter = {
        mode: 'custom-range' as const,
        startDate: new Date('2025-01-01'),
        endDate: new Date('2025-01-31')
      };
      expect(formatFilterMode(customFilter)).toContain('1/1/2025');
    });
  });

  describe('getFilterCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const filter1 = { mode: 'today' as const };
      const filter2 = { mode: 'today' as const };
      
      expect(getFilterCacheKey(filter1)).toBe(getFilterCacheKey(filter2));
    });

    it('should generate different cache keys for different filters', () => {
      const filter1 = { mode: 'today' as const };
      const filter2 = { mode: 'this-week' as const };
      
      expect(getFilterCacheKey(filter1)).not.toBe(getFilterCacheKey(filter2));
    });
  });

  describe('toUTCBoundary', () => {
    it('should convert local date to UTC boundary for database queries', () => {
      const localDate = new Date('2025-01-15T00:00:00.000');
      const utcBoundary = toUTCBoundary(localDate);
      
      expect(utcBoundary).toBeInstanceOf(Date);
      // The UTC boundary should account for timezone offset
      expect(utcBoundary.getTime()).not.toBe(localDate.getTime());
    });
  });
});