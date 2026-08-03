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

/**
 * The application database, owned by the main process.
 *
 * One named method per operation, with no channel parameter. A generic
 * `invoke(channel, ...args)` passthrough would be far less code, and would also hand any
 * script running in the renderer the entire main-process surface — including
 * `setEncryptionKey` and `isEncryptionKeyCorrect`, which together are an offline oracle
 * against the account database. Naming each operation keeps that surface reviewable and
 * lets the payloads stay typed.
 */
export type DbBridge = {
  getKey(ns: string, keyPath: string, defaultValue?: unknown): Promise<unknown>;
  /**
   * `value` must be JSON-safe. Account graphs contain BigNumber instances, which the
   * bridge would silently flatten, so callers encode before reaching this point.
   */
  setKey(ns: string, keyPath: string, value: Serializable): Promise<void>;
  hasEncryptionKey(ns: string, keyPath: string): Promise<boolean>;
  setEncryptionKey(encryptionKey: string): Promise<void>;
  removeEncryptionKey(): Promise<void>;
  isEncryptionKeyCorrect(encryptionKey: string): Promise<boolean>;
  hasBeenDecrypted(): Promise<boolean>;
  resetAll(): Promise<void>;
  reload(): Promise<void>;
  cleanCache(): Promise<void>;
};

type TransportError = { message: string; id: string };

/**
 * Transport handlers resolve with a tagged union instead of rejecting, so failures arrive
 * as data. That is why these are typed as unions rather than as promises that throw.
 */
export type TransportOpenResult =
  | { type: "open-response"; requestId: string; data: { descriptor: string } }
  | { type: "open-error"; requestId: string; error: TransportError };

export type TransportExchangeResult =
  | { type: "exchange-response"; requestId: string; data: string }
  | { type: "exchange-error"; requestId: string; error: TransportError };

export type TransportListenResult =
  | {
      type: "listen-response";
      requestId: string;
      data: { type: string; descriptor: string; device: unknown };
    }
  | { type: "listen-error"; requestId: string; error: TransportError };

/**
 * Device transport, used only for Speculos and the HTTP proxy. Real devices talk WebHID
 * straight from the renderer and do not come through here.
 *
 * APDUs cross as hex strings: a Buffer would be flattened by the bridge's conversion.
 */
export type TransportBridge = {
  open(requestId: string, descriptor: string, timeout?: number): Promise<TransportOpenResult>;
  exchange(requestId: string, apduHex: string, timeout?: number): Promise<TransportExchangeResult>;
  close(requestId: string): Promise<{ type: "close-response"; requestId: string }>;
  listen(requestId: string): Promise<TransportListenResult>;
  listenUnsubscribe(
    requestId: string,
  ): Promise<{ type: "unsubscribe-response"; requestId: string }>;
};

/**
 * Removes a subscription created by one of the `on*` methods below.
 *
 * Subscriptions are cancelled through a returned closure rather than by passing the
 * listener back, because `removeListener(channel, fn)` cannot work across the bridge: the
 * renderer's function arrives in the preload as a proxy with a different identity, so the
 * lookup would silently fail and the listener would leak.
 */
export type Unsubscribe = () => void;

/**
 * Payload pushed by the auto-updater.
 *
 * `status` is kept as a plain string here rather than importing the renderer's
 * `UpdateStatus` union: this file is compiled into the preload bundle and must not pull in
 * renderer code. The consumer narrows it.
 */
export type UpdaterStatusEvent = {
  status: string;
  payload?: { percent?: number; version?: string };
};

export type UpdaterBridge = {
  init(): void;
  quitAndInstall(): void;
  onStatus(callback: (event: UpdaterStatusEvent) => void): Unsubscribe;
};

export type DeeplinkBridge = {
  open(url: string): void;
  onOpen(callback: (url: string) => void): Unsubscribe;
};

export type LedgerBridge = {
  version: 1;
  bootstrap: Bootstrap;
  db: DbBridge;
  transport: TransportBridge;
  updater: UpdaterBridge;
  deeplink: DeeplinkBridge;
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
  getKey: "getKey",
  setKey: "setKey",
  hasEncryptionKey: "hasEncryptionKey",
  setEncryptionKey: "setEncryptionKey",
  removeEncryptionKey: "removeEncryptionKey",
  isEncryptionKeyCorrect: "isEncryptionKeyCorrect",
  hasBeenDecrypted: "hasBeenDecrypted",
  resetAll: "resetAll",
  reload: "reload",
  cleanCache: "cleanCache",
  transportOpen: "transport:open",
  transportExchange: "transport:exchange",
  transportClose: "transport:close",
  transportListen: "transport:listen",
  transportListenUnsubscribe: "transport:listen:unsubscribe",
  /** Bidirectional: the renderer both sends and listens on this name. */
  updater: "updater",
  /** Bidirectional: main pushes incoming links, the renderer sends outgoing ones. */
  deepLinking: "deep-linking",
} as const;
