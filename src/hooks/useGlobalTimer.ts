import { useState, useEffect, useCallback } from 'react';

interface TimerState {
  id: string;
  isActive: boolean;
  totalTime: number;
  startTime: number | null;
}

interface GlobalTimerState {
  timers: TimerState[];
  lastSavedAt: string;
}

const GLOBAL_TIMER_KEY = 'globalTimerState';

export const useGlobalTimer = () => {
  const [timerState, setTimerState] = useState<GlobalTimerState>({
    timers: [],
    lastSavedAt: new Date().toISOString()
  });

  // Load timer state from localStorage on mount
  useEffect(() => {
    const savedState = localStorage.getItem(GLOBAL_TIMER_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setTimerState(parsed);
      } catch (error) {
        console.error('Error loading timer state:', error);
      }
    }
  }, []);

  // Save timer state to localStorage
  const saveTimerState = useCallback((state: GlobalTimerState) => {
    try {
      localStorage.setItem(GLOBAL_TIMER_KEY, JSON.stringify(state));
      setTimerState(state);
    } catch (error) {
      console.error('Error saving timer state:', error);
    }
  }, []);

  // Start a timer (stops all others)
  const startTimer = useCallback((id: string) => {
    const now = Date.now();
    setTimerState(prev => {
      const updatedTimers = prev.timers.map(timer => {
        if (timer.id === id) {
          return { ...timer, isActive: true, startTime: now };
        } else if (timer.isActive && timer.startTime) {
          // Stop other active timers and add elapsed time
          const elapsed = Math.floor((now - timer.startTime) / 1000);
          return { 
            ...timer, 
            isActive: false, 
            startTime: null, 
            totalTime: timer.totalTime + elapsed 
          };
        }
        return { ...timer, isActive: false, startTime: null };
      });

      // Add timer if it doesn't exist
      if (!updatedTimers.find(t => t.id === id)) {
        updatedTimers.push({ id, isActive: true, totalTime: 0, startTime: now });
      }

      const newState = { ...prev, timers: updatedTimers, lastSavedAt: new Date().toISOString() };
      saveTimerState(newState);
      return newState;
    });
  }, [saveTimerState]);

  // Pause/stop a timer
  const pauseTimer = useCallback((id: string) => {
    const now = Date.now();
    setTimerState(prev => {
      const updatedTimers = prev.timers.map(timer => {
        if (timer.id === id && timer.isActive && timer.startTime) {
          const elapsed = Math.floor((now - timer.startTime) / 1000);
          return { 
            ...timer, 
            isActive: false, 
            startTime: null, 
            totalTime: timer.totalTime + elapsed 
          };
        }
        return timer;
      });

      const newState = { ...prev, timers: updatedTimers, lastSavedAt: new Date().toISOString() };
      saveTimerState(newState);
      return newState;
    });
  }, [saveTimerState]);

  // Stop timer (same as pause - we're removing reset functionality)
  const stopTimer = useCallback((id: string) => {
    pauseTimer(id);
  }, [pauseTimer]);

  // Get timer data for a specific ID
  const getTimer = useCallback((id: string): TimerState | null => {
    return timerState.timers.find(timer => timer.id === id) || null;
  }, [timerState.timers]);

  // Get current elapsed time for an active timer
  const getCurrentTime = useCallback((id: string): number => {
    const timer = getTimer(id);
    if (!timer) return 0;
    
    if (timer.isActive && timer.startTime) {
      const elapsed = Math.floor((Date.now() - timer.startTime) / 1000);
      return timer.totalTime + elapsed;
    }
    return timer.totalTime;
  }, [getTimer]);

  // Check if any timer is currently running
  const hasActiveTimer = useCallback((): boolean => {
    return timerState.timers.some(timer => timer.isActive);
  }, [timerState.timers]);

  // Get the currently active timer ID
  const getActiveTimerId = useCallback((): string | null => {
    const activeTimer = timerState.timers.find(timer => timer.isActive);
    return activeTimer ? activeTimer.id : null;
  }, [timerState.timers]);

  // Update timer data (for when timesheet rows change)
  const updateTimer = useCallback((id: string, updates: Partial<TimerState>) => {
    setTimerState(prev => {
      const updatedTimers = prev.timers.map(timer => 
        timer.id === id ? { ...timer, ...updates } : timer
      );

      const newState = { ...prev, timers: updatedTimers, lastSavedAt: new Date().toISOString() };
      saveTimerState(newState);
      return newState;
    });
  }, [saveTimerState]);

  // Clean up timer for deleted rows
  const removeTimer = useCallback((id: string) => {
    setTimerState(prev => {
      const updatedTimers = prev.timers.filter(timer => timer.id !== id);
      const newState = { ...prev, timers: updatedTimers, lastSavedAt: new Date().toISOString() };
      saveTimerState(newState);
      return newState;
    });
  }, [saveTimerState]);

  return {
    startTimer,
    pauseTimer,
    stopTimer,
    getTimer,
    getCurrentTime,
    hasActiveTimer,
    getActiveTimerId,
    updateTimer,
    removeTimer,
    timerState
  };
};

// Cleanup function for when the app is closed
export const setupTimerCleanup = () => {
  const cleanup = () => {
    const savedState = localStorage.getItem(GLOBAL_TIMER_KEY);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        const now = Date.now();
        
        // Stop all active timers when app closes
        const updatedTimers = parsed.timers.map((timer: TimerState) => {
          if (timer.isActive && timer.startTime) {
            const elapsed = Math.floor((now - timer.startTime) / 1000);
            return { 
              ...timer, 
              isActive: false, 
              startTime: null, 
              totalTime: timer.totalTime + elapsed 
            };
          }
          return timer;
        });

        localStorage.setItem(GLOBAL_TIMER_KEY, JSON.stringify({
          ...parsed,
          timers: updatedTimers,
          lastSavedAt: new Date().toISOString()
        }));
      } catch (error) {
        console.error('Error during timer cleanup:', error);
      }
    }
  };

  // Listen for page unload
  window.addEventListener('beforeunload', cleanup);
  
  // Return cleanup function
  return () => {
    window.removeEventListener('beforeunload', cleanup);
  };
};