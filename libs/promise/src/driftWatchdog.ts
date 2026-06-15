export type DriftWatchdog = {
  start: () => void;
  stop: () => void;
  /** Reset baseline to now — the next onTick measures elapsed from this point. */
  syncBaseline: () => void;
};

type DriftWatchdogOptions = {
  tickIntervalMs: number;
  onTick: (elapsedMs: number) => void;
};

/**
 * Recursive setTimeout loop reporting wall-clock elapsed between ticks.
 * Uses performance.now() and avoids setInterval catch-up bursts after long freezes.
 */
export function createDriftWatchdog({
  tickIntervalMs,
  onTick,
}: DriftWatchdogOptions): DriftWatchdog {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastTick = 0;
  let running = false;

  const syncBaseline = () => {
    lastTick = performance.now();
  };

  const tick = () => {
    if (!running) return;

    const now = performance.now();
    const elapsedMs = now - lastTick;
    lastTick = now;
    onTick(elapsedMs);
    timeoutId = setTimeout(tick, tickIntervalMs);
  };

  const start = () => {
    if (running) return;
    running = true;
    syncBaseline();
    timeoutId = setTimeout(tick, tickIntervalMs);
  };

  const stop = () => {
    running = false;
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { start, stop, syncBaseline };
}
