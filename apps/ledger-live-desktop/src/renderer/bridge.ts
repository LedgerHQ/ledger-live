import { BOOTSTRAP_VERSION, BRIDGE_VERSION, type LedgerBridge } from "~/bridge/contract";

const bridge = (globalThis as unknown as { lld?: LedgerBridge }).lld;

if (!bridge) {
  throw new Error(
    "window.lld is missing — the preload script did not run. Check webPreferences.preload.",
  );
}

if (bridge.version !== BRIDGE_VERSION) {
  throw new Error(
    `Preload/renderer version mismatch: bridge is v${bridge.version}, renderer expects v${BRIDGE_VERSION}. Rebuild the app.`,
  );
}

if (bridge.bootstrap?.version !== BOOTSTRAP_VERSION) {
  throw new Error(
    `Main/renderer version mismatch: bootstrap is v${bridge.bootstrap?.version}, renderer expects v${BOOTSTRAP_VERSION}. Rebuild the app.`,
  );
}

export const bootstrap = bridge.bootstrap;
export const db = bridge.db;
export const cardSession = bridge.cardSession;
