const funnelScreens = new Set([
  "awaitingStart",
  "awaitingSession",
  "awaitingSessionAfterFirmwareUpdate",
  "deviceLocked",
]);

export function shouldRevealFunnel(state: string | null, error: string | null): boolean {
  if (error) return true;
  if (state === null || state === "readingState" || state === "routing") return false;
  if (state.startsWith("checks.") || state.startsWith("deviceSetup.")) return true;
  return funnelScreens.has(state);
}
