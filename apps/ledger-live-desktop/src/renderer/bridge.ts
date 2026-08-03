import type { LedgerBridge } from "~/bridge/contract";

const bridge = (globalThis as unknown as { lld?: LedgerBridge }).lld;

if (!bridge) {
  throw new Error(
    "window.lld is missing — the preload script did not run. Check webPreferences.preload.",
  );
}

if (bridge.version !== 1) {
  throw new Error(
    `Preload/renderer version mismatch: bridge is v${bridge.version}, renderer expects v1. Rebuild the app.`,
  );
}

if (bridge.bootstrap?.version !== 1) {
  throw new Error(
    `Main/renderer version mismatch: bootstrap is v${bridge.bootstrap?.version}, renderer expects v1. Rebuild the app.`,
  );
}

export const bootstrap = bridge.bootstrap;
export const db = bridge.db;
export const cardSession = bridge.cardSession;
