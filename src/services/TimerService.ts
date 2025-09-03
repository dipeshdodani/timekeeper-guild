import { supabase } from "@/integrations/supabase/client";

export interface TimesheetSession {
  id: string;
  task_id: string;
  start_at: string;
  end_at: string | null;
  duration_seconds: number;
  work_date: string;
}

export interface TimerState {
  taskId: string | null;
  startTime: number | null;
  isRunning: boolean;
}

class TimerServiceClass {
  private timerState: TimerState = {
    taskId: null,
    startTime: null,
    isRunning: false
  };
  
  private interval: NodeJS.Timeout | null = null;
  private subscribers: Array<() => void> = [];
  private sessionsCache: TimesheetSession[] = [];

  constructor() {
    this.loadPersistedState();
    this.startInterval();
  }

  // Load persisted state from localStorage
  private loadPersistedState() {
    try {
      const saved = localStorage.getItem('timerService_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        this.timerState = parsed;
        
        // If there was a running timer, resume it
        if (this.timerState.isRunning && this.timerState.taskId) {
          this.resumeSession(this.timerState.taskId);
        }
      }
    } catch (error) {
      console.error('Error loading timer state:', error);
    }
  }

  // Persist state to localStorage
  private persistState() {
    try {
      localStorage.setItem('timerService_state', JSON.stringify(this.timerState));
    } catch (error) {
      console.error('Error persisting timer state:', error);
    }
  }

  // Start the main interval for updating subscribers
  private startInterval() {
    this.interval = setInterval(() => {
      this.notifySubscribers();
    }, 1000);
  }

  // Subscribe to timer updates
  subscribe(callback: () => void) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }

  // Notify all subscribers of state changes
  private notifySubscribers() {
    this.subscribers.forEach(callback => callback());
  }

  // Start a task timer
  async startTask(taskId: string): Promise<void> {
    try {
      // Stop any currently running task
      if (this.timerState.isRunning && this.timerState.taskId) {
        await this.stopCurrentTask();
      }

      // Check if there's an existing running session for this task
      const existingSession = await this.getActiveSession(taskId);
      
      if (existingSession) {
        // Resume existing session
        this.timerState = {
          taskId,
          startTime: new Date(existingSession.start_at).getTime(),
          isRunning: true
        };
      } else {
        // Create new session
        const now = new Date().toISOString();
        const { data, error } = await supabase
          .from('timesheet_sessions')
          .insert({
            task_id: taskId,
            start_at: now,
            work_date: new Date().toISOString().split('T')[0]
          })
          .select()
          .single();

        if (error) throw error;

        this.timerState = {
          taskId,
          startTime: Date.now(),
          isRunning: true
        };
      }

      this.persistState();
      this.notifySubscribers();
    } catch (error) {
      console.error('Error starting task:', error);
    }
  }

  // Pause current task
  async pauseTask(taskId: string): Promise<void> {
    if (!this.timerState.isRunning || this.timerState.taskId !== taskId) return;

    try {
      await this.stopCurrentTask();
    } catch (error) {
      console.error('Error pausing task:', error);
    }
  }

  // Stop current task
  async stopTask(taskId: string): Promise<void> {
    if (!this.timerState.isRunning || this.timerState.taskId !== taskId) return;

    try {
      await this.stopCurrentTask();
    } catch (error) {
      console.error('Error stopping task:', error);
    }
  }

  // Internal method to stop the currently running task
  private async stopCurrentTask(): Promise<void> {
    if (!this.timerState.isRunning || !this.timerState.taskId || !this.timerState.startTime) return;

    try {
      const now = new Date().toISOString();
      const durationSeconds = Math.floor((Date.now() - this.timerState.startTime) / 1000);

      // Find and update the active session
      const { error } = await supabase
        .from('timesheet_sessions')
        .update({
          end_at: now,
          duration_seconds: durationSeconds
        })
        .eq('task_id', this.timerState.taskId)
        .is('end_at', null);

      if (error) throw error;

      // Clear timer state
      this.timerState = {
        taskId: null,
        startTime: null,
        isRunning: false
      };

      this.persistState();
      this.notifySubscribers();
      
      // Refresh sessions cache
      await this.loadTodaysSessions();
    } catch (error) {
      console.error('Error stopping current task:', error);
    }
  }

  // Resume an existing session
  private async resumeSession(taskId: string): Promise<void> {
    try {
      const session = await this.getActiveSession(taskId);
      if (session) {
        this.timerState = {
          taskId,
          startTime: new Date(session.start_at).getTime(),
          isRunning: true
        };
      } else {
        // No active session found, clear state
        this.timerState = {
          taskId: null,
          startTime: null,
          isRunning: false
        };
      }
      this.persistState();
    } catch (error) {
      console.error('Error resuming session:', error);
    }
  }

  // Get active session for a task
  private async getActiveSession(taskId: string): Promise<TimesheetSession | null> {
    try {
      const { data, error } = await supabase
        .from('timesheet_sessions')
        .select('*')
        .eq('task_id', taskId)
        .is('end_at', null)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
      return data || null;
    } catch (error) {
      console.error('Error getting active session:', error);
      return null;
    }
  }

  // Get running task ID
  getRunningTask(): string | null {
    return this.timerState.isRunning ? this.timerState.taskId : null;
  }

  // Check if a specific task is running
  isTaskRunning(taskId: string): boolean {
    return this.timerState.isRunning && this.timerState.taskId === taskId;
  }

  // Get current elapsed time for a task
  getCurrentTime(taskId: string): number {
    if (this.isTaskRunning(taskId) && this.timerState.startTime) {
      return Math.floor((Date.now() - this.timerState.startTime) / 1000);
    }
    return 0;
  }

  // Get total logged time for a task today
  async getTaskTotalTime(taskId: string): Promise<number> {
    try {
      const sessions = await this.getTaskSessions(taskId);
      let total = 0;
      
      for (const session of sessions) {
        if (session.end_at) {
          total += session.duration_seconds;
        } else if (this.isTaskRunning(taskId) && this.timerState.startTime) {
          // Add current running time
          total += Math.floor((Date.now() - this.timerState.startTime) / 1000);
        }
      }
      
      return total;
    } catch (error) {
      console.error('Error getting task total time:', error);
      return 0;
    }
  }

  // Get all sessions for a specific task today
  private async getTaskSessions(taskId: string): Promise<TimesheetSession[]> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('timesheet_sessions')
        .select('*')
        .eq('task_id', taskId)
        .eq('work_date', today)
        .order('start_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting task sessions:', error);
      return [];
    }
  }

  // Get total logged time for all tasks today
  async getTotalLoggedTime(): Promise<number> {
    try {
      await this.loadTodaysSessions();
      let total = 0;
      
      for (const session of this.sessionsCache) {
        if (session.end_at) {
          total += session.duration_seconds;
        } else if (this.isTaskRunning(session.task_id) && this.timerState.startTime) {
          // Add current running time
          total += Math.floor((Date.now() - this.timerState.startTime) / 1000);
        }
      }
      
      return total;
    } catch (error) {
      console.error('Error getting total logged time:', error);
      return 0;
    }
  }

  // Load today's sessions into cache
  private async loadTodaysSessions(): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('timesheet_sessions')
        .select('*')
        .eq('work_date', today)
        .order('start_at', { ascending: true });

      if (error) throw error;
      this.sessionsCache = data || [];
    } catch (error) {
      console.error('Error loading today\'s sessions:', error);
      this.sessionsCache = [];
    }
  }

  // Stop all timers (for submission or break)
  async stopAllTimers(): Promise<void> {
    if (this.timerState.isRunning && this.timerState.taskId) {
      await this.stopCurrentTask();
    }
  }

  // Clean up when component unmounts
  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    this.subscribers = [];
  }
}

// Create singleton instance
export const TimerService = new TimerServiceClass();

// Setup cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    if (TimerService.getRunningTask()) {
      TimerService.stopAllTimers();
    }
  });
}