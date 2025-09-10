import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as TimerStore from '../PerformanceTimerService';

describe('PerformanceTimerService - Single Timer Logic', () => {
  beforeEach(() => {
    // Clean up between tests
    TimerStore.destroy();
  });

  it('should allow starting a timer when no other timer is running', () => {
    TimerStore.start('task-1');
    
    expect(TimerStore.isRunning('task-1')).toBe(true);
    expect(TimerStore.getRunningTimerId()).toBe('task-1');
    expect(TimerStore.hasRunningTimer()).toBe(true);
  });

  it('should automatically stop previous timer when starting a new one', () => {
    // Start first timer
    TimerStore.start('task-1');
    expect(TimerStore.isRunning('task-1')).toBe(true);
    expect(TimerStore.getRunningTimerId()).toBe('task-1');
    
    // Start second timer - should stop first timer
    TimerStore.start('task-2');
    expect(TimerStore.isRunning('task-1')).toBe(false);
    expect(TimerStore.isPaused('task-1')).toBe(true);
    expect(TimerStore.isRunning('task-2')).toBe(true);
    expect(TimerStore.getRunningTimerId()).toBe('task-2');
  });

  it('should preserve accumulated time when timer is paused due to another starting', () => {
    // Start timer and simulate some time passing
    TimerStore.start('task-1');
    
    // Mock performance.now to simulate time passage
    const originalNow = performance.now;
    let mockTime = originalNow();
    vi.spyOn(performance, 'now').mockImplementation(() => mockTime);
    
    // Simulate 5 seconds of work
    mockTime += 5000;
    
    // Start second timer, which should pause first
    TimerStore.start('task-2');
    
    // First timer should have accumulated the 5 seconds
    expect(TimerStore.getCurrentTime('task-1')).toBe(5);
    expect(TimerStore.isRunning('task-2')).toBe(true);
    
    // Restore original performance.now
    vi.restoreAllMocks();
  });

  it('should not change state when starting already running timer', () => {
    TimerStore.start('task-1');
    const initialTime = TimerStore.getCurrentTime('task-1');
    
    // Starting same timer again should not change anything
    TimerStore.start('task-1');
    
    expect(TimerStore.isRunning('task-1')).toBe(true);
    expect(TimerStore.getCurrentTime('task-1')).toBe(initialTime);
  });

  it('should return null when no timer is running', () => {
    expect(TimerStore.getRunningTimerId()).toBe(null);
    expect(TimerStore.hasRunningTimer()).toBe(false);
  });

  it('should handle pausing and resuming without affecting single-timer constraint', () => {
    TimerStore.start('task-1');
    TimerStore.pause('task-1');
    
    expect(TimerStore.getRunningTimerId()).toBe(null);
    expect(TimerStore.hasRunningTimer()).toBe(false);
    
    // Should be able to start another timer when first is paused
    TimerStore.start('task-2');
    expect(TimerStore.getRunningTimerId()).toBe('task-2');
    
    // Resuming first timer should pause second
    TimerStore.resume('task-1');
    expect(TimerStore.getRunningTimerId()).toBe('task-1');
    expect(TimerStore.isPaused('task-2')).toBe(true);
  });

  it('should handle break mode correctly with single timer logic', () => {
    TimerStore.start('task-1');
    TimerStore.breakStart('task-1');
    
    expect(TimerStore.isOnBreak('task-1')).toBe(true);
    expect(TimerStore.getRunningTimerId()).toBe(null); // break doesn't count as "running"
    
    // Should be able to start another timer during break
    TimerStore.start('task-2');
    expect(TimerStore.isRunning('task-2')).toBe(true);
    expect(TimerStore.isOnBreak('task-1')).toBe(true); // break should continue
  });
});