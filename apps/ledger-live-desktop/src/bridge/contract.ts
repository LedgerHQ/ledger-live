/**
 * The contract between the preload script and the renderer.
 *
 * This is the single shared declaration of what crosses the context bridge. The preload
 * implements `LedgerBridge`; the renderer consumes it through `~/renderer/bridge`. Because
 * both sides import *this* file, the compiler enforces that they agree — which an ambient
 * `interface Window` cannot do, since ambient globals cannot be imported.
 *
 * Keep this file type-only plus the channel constants. It is pulled into the preload
 * bundle, which must stay tiny and free of Node and renderer code.
 */

/** Values that survive the context bridge's structured-clone-like conversion. */
export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

/**
 * Data captured once in the main process and handed to the renderer before any of its
 * code runs.
 *
 * This exists because a large amount of renderer code reads `process.env` and `os` at
 * module scope, synchronously. A sandboxed preload has neither, and asynchronous IPC
 * cannot satisfy a module-scope read, so the values are collected up front instead.
 */
export type Bootstrap = {
  /** Bumped whenever this shape changes, so a stale preload is detected rather than silently misread. */
  version: 1;
  /**
   * The main process's full `process.env`.
   *
   * Deliberately unfiltered: several consumers read keys that are not `@ledgerhq/live-env`
   * names (HIDE_DEBUG_MOCK, LEDGER_MIN_HEIGHT, the NO_DEBUG_* family, DEFAULT_*_MANIFEST_ID),
   * and the E2E suites pass arbitrary variables through `electron.launch({ env })`.
   * Allow-listing here would silently disable them.
   */
  env: Record<string, string | undefined>;
  os: {
    type: string;
    release: string;
    platform: string;
    hostname: string;
  };
  paths: {
    userData: string;
    home: string;
  };
  appDirname: string;
  distributionChannel: "mac-app-store" | "windows-store" | "direct";
  locale: {
    app: string;
    system: string;
  };
  /** Contents of the `lld.json` store, hydrated so renderer reads can stay synchronous. */
  store: Record<string, unknown>;
};

export type LedgerBridge = {
  version: 1;
  bootstrap: Bootstrap;
};

/**
 * Every IPC channel name lives here, and nowhere else.
 *
 * Channel strings appearing at call sites are what make a generic `invoke(channel, ...)`
 * passthrough tempting; a passthrough would re-expose the whole main-process surface to
 * any script running in the renderer, which is the thing this migration removes.
 */
export const CHANNELS = {
  bootstrap: "bootstrap",
  /** Write-through updates to the `lld.json` store hydrated in {@link Bootstrap.store}. */
  storeSet: "lld-store:set",
  storeClear: "lld-store:clear",
} as const;
