import type { LedgerBridge } from "~/bridge/contract";

/**
 * Renderer-side entry point to everything the preload exposes.
 *
 * Every consumer goes through this module rather than touching `window.ledger` directly,
 * so the version check happens once instead of being an unchecked assumption at each call
 * site, and so tests and Storybook can substitute the whole bridge by aliasing one path.
 */
const bridge = (globalThis as unknown as { lld?: LedgerBridge }).lld;

if (!bridge) {
  throw new Error(
    "window.lld is missing — the preload script did not run. Check webPreferences.preload.",
  );
}

if (bridge.version !== 1) {
  // The preload and renderer are separate bundles emitted into the same directory, which
  // is not cleaned between builds, so a stale preload against a fresh renderer is a state
  // you can genuinely end up in locally. Fail loudly instead of misreading the snapshot.
  throw new Error(
    `Preload/renderer version mismatch: bridge is v${bridge.version}, renderer expects v1. Rebuild the app.`,
  );
}

export const bootstrap = bridge.bootstrap;
