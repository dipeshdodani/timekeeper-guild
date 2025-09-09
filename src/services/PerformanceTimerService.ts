// Minimal evented store for task timers powered by performance.now()
// Supports: start, pause, resume, breakStart, breakEnd, reset.
// One global ticker updates subscribers at 1 Hz for stable UI.

type TimerStatus = 'running' | 'paused' | 'break';

export type TaskTimerState = {
  taskId: string;
  status: TimerStatus;
  elapsedActiveMs: number;   // accumulated work time, closed spans only
  elapsedBreakMs: number;    // accumulated break time, closed spans only
  spanStartMs: number | null; // performance.now() when current span began
};

type Listener = () => void;

const timers = new Map<string, TaskTimerState>();
const listeners = new Set<Listener>();

let intervalId: number | null = null;
let nowMs = performance.now(); // monotonic "now" for rendering

function startTicker() {
  if (intervalId != null) return;
  // Update once per second for UI; compute with performance.now() to avoid drift.
  intervalId = window.setInterval(() => {
    nowMs = performance.now();
    listeners.forEach((l) => l());
  }, 1000);
}

function stopTickerIfNoListeners() {
  if (listeners.size === 0 && intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
  }
}

export function subscribe(listener: Listener) {
  listeners.add(listener);
  startTicker();
  return () => {
    listeners.delete(listener);
    stopTickerIfNoListeners();
  };
}

// Ensure state exists
function ensure(taskId: string): TaskTimerState {
  let s = timers.get(taskId);
  if (!s) {
    s = {
      taskId,
      status: 'paused',
      elapsedActiveMs: 0,
      elapsedBreakMs: 0,
      spanStartMs: null,
    };
    timers.set(taskId, s);
  }
  return s;
}

// Helpers to fold open span into totals
function closeOpenSpan(s: TaskTimerState, at: number) {
  if (s.spanStartMs == null) return;
  const delta = at - s.spanStartMs;
  if (s.status === 'running') s.elapsedActiveMs += delta;
  if (s.status === 'break') s.elapsedBreakMs += delta;
  s.spanStartMs = null;
}

export function start(taskId: string) {
  const s = ensure(taskId);
  if (s.status !== 'running') {
    closeOpenSpan(s, performance.now());
    s.status = 'running';
    s.spanStartMs = performance.now();
    listeners.forEach((l) => l());
  }
}

export function pause(taskId: string) {
  const s = ensure(taskId);
  if (s.status === 'running') {
    closeOpenSpan(s, performance.now());
    s.status = 'paused';
    listeners.forEach((l) => l());
  }
}

export function resume(taskId: string) {
  const s = ensure(taskId);
  if (s.status === 'paused') {
    s.status = 'running';
    s.spanStartMs = performance.now();
    listeners.forEach((l) => l());
  }
}

export function breakStart(taskId: string) {
  const s = ensure(taskId);
  const t = performance.now();
  if (s.status === 'running') closeOpenSpan(s, t);
  if (s.status !== 'break') {
    s.status = 'break';
    s.spanStartMs = performance.now();
    listeners.forEach((l) => l());
  }
}

export function breakEnd(taskId: string, goTo: 'paused' | 'running' = 'paused') {
  const s = ensure(taskId);
  if (s.status === 'break') {
    closeOpenSpan(s, performance.now());
    s.status = goTo;
    s.spanStartMs = goTo === 'running' ? performance.now() : null;
    listeners.forEach((l) => l());
  }
}

export function reset(taskId: string) {
  const s = ensure(taskId);
  s.status = 'paused';
  s.elapsedActiveMs = 0;
  s.elapsedBreakMs = 0;
  s.spanStartMs = null;
  listeners.forEach((l) => l());
}

// Get current elapsed time (including open span)
export function getCurrentTime(taskId: string): number {
  const s = ensure(taskId);
  let total = s.elapsedActiveMs;
  
  if (s.spanStartMs != null && s.status === 'running') {
    total += nowMs - s.spanStartMs;
  }
  
  return Math.floor(total / 1000); // return in seconds
}

export function getBreakTime(taskId: string): number {
  const s = ensure(taskId);
  let total = s.elapsedBreakMs;
  
  if (s.spanStartMs != null && s.status === 'break') {
    total += nowMs - s.spanStartMs;
  }
  
  return Math.floor(total / 1000); // return in seconds
}

export function getStatus(taskId: string): TimerStatus {
  const s = ensure(taskId);
  return s.status;
}

export function isRunning(taskId: string): boolean {
  return getStatus(taskId) === 'running';
}

export function isPaused(taskId: string): boolean {
  return getStatus(taskId) === 'paused';
}

export function isOnBreak(taskId: string): boolean {
  return getStatus(taskId) === 'break';
}

// Get all active timers
export function getAllTimers(): TaskTimerState[] {
  return Array.from(timers.values());
}

// Cleanup
export function destroy() {
  if (intervalId != null) {
    clearInterval(intervalId);
    intervalId = null;
  }
  listeners.clear();
  timers.clear();
}