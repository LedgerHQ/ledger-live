/**
 * Timestamped logs prefixed with Jest worker id — use to pinpoint which worker stalls (Detox bridge, launchApp, failure hooks).
 *
 * - Always-on logs: failure-handling steps in jest.environment.ts; fetchData timeouts in bridge/server.ts
 * - Verbose logs (launchApp steps, every fetchData success): set `E2E_WORKER_DEBUG=1`
 */

export function isE2EWorkerDebugVerbose(): boolean {
  return process.env.E2E_WORKER_DEBUG === "1";
}

function workerId(): string {
  return process.env.JEST_WORKER_ID ?? "?";
}

/** Always emits — use for rare paths (failures, timeouts). */
export function workerLog(phase: string, detail?: string): void {
  const ts = new Date().toISOString();
  const suffix = detail ? ` ${detail}` : "";
  console.info(`[e2e-worker ${workerId()}] ${ts} ${phase}${suffix}`);
}

/** Only when E2E_WORKER_DEBUG=1 — avoids flooding CI on hot paths (getFlags, launchApp). */
export function workerLogVerbose(phase: string, detail?: string): void {
  if (isE2EWorkerDebugVerbose()) workerLog(phase, detail);
}
