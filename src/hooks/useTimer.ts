import { useEffect, useState } from 'react';
import * as TimerStore from '@/services/PerformanceTimerService';

export function useTimer(taskId: string) {
  const [state, setState] = useState(() => ({
    currentTime: TimerStore.getCurrentTime(taskId),
    breakTime: TimerStore.getBreakTime(taskId),
    status: TimerStore.getStatus(taskId),
    isRunning: TimerStore.isRunning(taskId),
    isPaused: TimerStore.isPaused(taskId),
    isOnBreak: TimerStore.isOnBreak(taskId)
  }));

  useEffect(() => {
    const unsubscribe = TimerStore.subscribe(() => {
      setState({
        currentTime: TimerStore.getCurrentTime(taskId),
        breakTime: TimerStore.getBreakTime(taskId),
        status: TimerStore.getStatus(taskId),
        isRunning: TimerStore.isRunning(taskId),
        isPaused: TimerStore.isPaused(taskId),
        isOnBreak: TimerStore.isOnBreak(taskId)
      });
    });

    return unsubscribe;
  }, [taskId]);

  return state;
}

export function useTimerSummary() {
  const [summary, setSummary] = useState(() => {
    const allTimers = TimerStore.getAllTimers();
    const totalLoggedTime = allTimers.reduce((total, timer) => {
      return total + TimerStore.getCurrentTime(timer.taskId);
    }, 0);
    const totalBreakTime = allTimers.reduce((total, timer) => {
      return total + TimerStore.getBreakTime(timer.taskId);
    }, 0);
    const hasActiveTask = allTimers.some(timer => TimerStore.isRunning(timer.taskId));
    const runningTaskId = TimerStore.getRunningTimerId();

    return {
      totalLoggedTime,
      totalBreakTime,
      hasActiveTask,
      runningTaskId
    };
  });

  useEffect(() => {
    const unsubscribe = TimerStore.subscribe(() => {
      const allTimers = TimerStore.getAllTimers();
      const totalLoggedTime = allTimers.reduce((total, timer) => {
        return total + TimerStore.getCurrentTime(timer.taskId);
      }, 0);
      const totalBreakTime = allTimers.reduce((total, timer) => {
        return total + TimerStore.getBreakTime(timer.taskId);
      }, 0);
      const hasActiveTask = allTimers.some(timer => TimerStore.isRunning(timer.taskId));
      const runningTaskId = TimerStore.getRunningTimerId();

      setSummary({
        totalLoggedTime,
        totalBreakTime,
        hasActiveTask,
        runningTaskId
      });
    });

    return unsubscribe;
  }, []);

  return summary;
}