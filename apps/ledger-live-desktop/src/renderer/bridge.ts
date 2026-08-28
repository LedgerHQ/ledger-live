import type { LedgerBridge } from "~/bridge/contract";

/**
 * Renderer-side entry point to everything the preload exposes.
 *
 * Every consumer goes through this module rather than touching `window.lld` directly, so the
 * version check happens once and tests can substitute the whole bridge by aliasing one path.
 */
const bridge = (globalThis as unknown as { lld?: LedgerBridge }).lld;

if (!bridge) {
  throw new Error(
    "window.lld is missing — the preload script did not run. Check webPreferences.preload.",
  );
}

if (bridge.version !== 1) {
  // The two bundles are emitted into the same directory, which is not cleaned between
  // builds, so a stale preload against a fresh renderer is reachable locally.
  throw new Error(
    `Preload/renderer version mismatch: bridge is v${bridge.version}, renderer expects v1. Rebuild the app.`,
  );
}

export const bootstrap = bridge.bootstrap;
export const db = bridge.db;
export const transport = bridge.transport;
export const updater = bridge.updater;
export const deeplink = bridge.deeplink;
export const app = bridge.app;
export const files = bridge.files;
export const power = bridge.power;
export const store = bridge.store;
export const shell = bridge.shell;
export const system = bridge.system;
export const zcash = bridge.zcash;
