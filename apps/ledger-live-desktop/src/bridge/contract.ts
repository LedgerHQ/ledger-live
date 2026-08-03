// Bundled into the preload: keep it type-only plus the channel constants.

export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

export type Bootstrap = {
  /** Bump on every shape change. */
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
  store: Record<string, unknown>;
};

export type LedgerBridge = {
  version: 1;
  bootstrap: Bootstrap;
};

// Every channel is listed here: never add a generic invoke passthrough.
export const CHANNELS = {
  bootstrap: "bootstrap",
  storeSet: "lld-store:set",
  storeClear: "lld-store:clear",
} as const;
