import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const TICK_INTERVAL_MS = 100;
const WINDOW_SIZE = 100; // 100 ticks * 100ms = 10s rolling window
const STALL_THRESHOLD_MS = 50; // drift above this counts as a stall
const MIN_SAMPLES = 3; // minimum ticks before reporting metrics

interface JsThreadMetrics {
  stallPercentage: number | null; // Percentage of the rolling window spent in stalls (null until enough samples)
  maxStall: number | null; // Duration of the worst single stall in the window (ms)
}

/**
 * Measures JS thread responsiveness by detecting setTimeout drift.
 *
 * A recursive setTimeout(100ms) tick that arrives late indicates the JS thread was blocked.
 * "Drift" = actualElapsed - expectedInterval. If drift > STALL_THRESHOLD_MS (50ms),
 * that tick is counted as a "stall" of that duration.
 *
 * Uses recursive setTimeout instead of setInterval to avoid catch-up ticks
 * that would flood the sample buffer with zero-drift entries after a long stall.
 *
 * Returns rolling-window metrics: stall percentage and worst single stall.
 */
export function useJsThreadMonitor(): JsThreadMetrics {
  const [metrics, setMetrics] = useState<JsThreadMetrics>({
    stallPercentage: null,
    maxStall: null,
  });

  const samplesRef = useRef<number[]>([]); // Array of the drifts. I.e how late the ticks arrived (in ms)
  const lastTickRef = useRef(0);
  const justResumedRef = useRef(false);

  useEffect(() => {
    lastTickRef.current = performance.now();
    samplesRef.current = [];

    let timeoutId = setTimeout(tick, TICK_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener("change", handleAppStateChange);

    return () => {
      clearTimeout(timeoutId);
      appStateSubscription.remove();
    };

    function tick() {
      const now = performance.now();

      // After returning from background, discard this tick:
      // its drift reflects background pause duration, not JS thread blocking.
      if (justResumedRef.current) {
        justResumedRef.current = false;
        lastTickRef.current = now;
      } else {
        const elapsed = now - lastTickRef.current;
        const drift = elapsed - TICK_INTERVAL_MS;
        lastTickRef.current = now;

        const samples = samplesRef.current;
        samples.push(drift);

        // Keep only the last WINDOW_SIZE samples
        if (samples.length > WINDOW_SIZE) {
          samples.splice(0, samples.length - WINDOW_SIZE);
        }

        setMetrics(computeMetrics(samples));
      }

      timeoutId = setTimeout(tick, TICK_INTERVAL_MS);
    }

    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === "active") justResumedRef.current = true;
    }
  }, []);

  return metrics;
}

function computeMetrics(samples: number[]): JsThreadMetrics {
  let totalStallTime = 0;
  let maxStall = 0;

  for (const sample of samples) {
    if (sample < STALL_THRESHOLD_MS) continue; // Not a stall
    totalStallTime += sample;
    if (sample < maxStall) continue;
    maxStall = sample;
  }

  // Total expected window duration = number of samples * tick interval
  const windowDuration = samples.length * TICK_INTERVAL_MS;
  const stallPercentage = (totalStallTime / windowDuration) * 100;

  return {
    stallPercentage: samples.length < MIN_SAMPLES ? null : Math.round(stallPercentage * 10) / 10,
    maxStall: Math.round(maxStall),
  };
}
