import type { ReconnectionConfig } from "./types";

export type TimerState = {
  /** Stop Timer */
  stop: () => void;
  /** Start Timer */
  start: () => void;
  /** Reset Timer */
  reset: () => void;
  /** Get current timer value */
  getTime: () => number;
  /** Check if timer is running */
  isRunning: () => boolean;
};

export function createTimer(config: Required<ReconnectionConfig>, func: () => void): TimerState {
  const { delay, maxDelay, factor, maxAttempts, enabled } = config;
  let attempts = 1;
  let cappedAttempts = Math.min(attempts, maxAttempts);
  let currentDelay = Math.min(delay * factor ** cappedAttempts, maxDelay);
  let timer: ReturnType<typeof setTimeout>;
  let running = false;

  if (!enabled) {
    return {
      start: () => {},
      stop: () => {},
      reset: () => {},
      getTime: () => 0,
      isRunning: () => false,
    };
  }

  function start() {
    running = true;
    if (timer) {
      clearTimeout(timer);
    }
    timer = setTimeout(() => {
      if (attempts > maxAttempts) {
        return;
      }
      func();
      attempts++;
      cappedAttempts = Math.min(attempts, maxAttempts);
      currentDelay = Math.min(delay * factor ** cappedAttempts, maxDelay);
      start();
    }, currentDelay);
  }

  function stop() {
    if (timer) {
      clearTimeout(timer);
    }
    running = false;
  }

  function reset() {
    attempts = 1;
    cappedAttempts = Math.min(attempts, maxAttempts);
    currentDelay = Math.min(delay * factor ** cappedAttempts, maxDelay);
  }

  function getTime() {
    return currentDelay;
  }

  function isRunning() {
    return running;
  }

  return { start, stop, reset, getTime, isRunning };
}
