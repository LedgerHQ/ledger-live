// Lightweight step timing for the swap/e2e session. Logs `⏱  <label>: <duration>` so a run's
// console output shows where wall-clock time goes (setup vs CLI vs Speculos vs each flow).

export function formatDuration(ms: number): string {
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${Math.round(seconds % 60)}s`;
}

/** Awaits `fn`, then logs how long it took under `label` (always, even on throw). */
export async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = Date.now();
  try {
    return await fn();
  } finally {
    console.info(`⏱  ${label}: ${formatDuration(Date.now() - start)}`);
  }
}
