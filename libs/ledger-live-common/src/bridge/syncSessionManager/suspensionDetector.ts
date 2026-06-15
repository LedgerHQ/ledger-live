import { createDriftWatchdog } from "@ledgerhq/live-promise";

const TICK_INTERVAL_MS = 5_000;
const GAP_THRESHOLD_MS = 30_000;

export type SuspensionDetector = {
  start: () => void;
  stop: () => void;
  markSuspended: () => void;
  wasSuspended: () => boolean;
  reset: () => void;
};

export function createSuspensionDetector(): SuspensionDetector {
  let suspended = false;

  const watchdog = createDriftWatchdog({
    tickIntervalMs: TICK_INTERVAL_MS,
    onTick: elapsedMs => {
      if (elapsedMs > TICK_INTERVAL_MS + GAP_THRESHOLD_MS) {
        suspended = true;
      }
    },
  });

  const reset = () => {
    suspended = false;
  };

  const markSuspended = () => {
    suspended = true;
  };

  const start = () => {
    reset();
    watchdog.start();
  };

  const stop = () => {
    watchdog.stop();
  };

  const wasSuspended = () => suspended;

  return { start, stop, markSuspended, wasSuspended, reset };
}
