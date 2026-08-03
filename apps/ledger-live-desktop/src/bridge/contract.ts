// Bundled into the preload: keep it to types and constants.

/** Bump on every shape change of `LedgerBridge` or `Bootstrap` respectively. */
export const BRIDGE_VERSION = 3;
export const BOOTSTRAP_VERSION = 1;

export type Serializable =
  | null
  | boolean
  | number
  | string
  | Serializable[]
  | { [key: string]: Serializable };

export type Bootstrap = {
  version: typeof BOOTSTRAP_VERSION;
  /** Unfiltered (E2E and debug flags read arbitrary keys), minus `CARD_SESSION_BOOTSTRAP`. */
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

export type DbBridge = {
  getKey(ns: string, keyPath: string, defaultValue?: unknown): Promise<unknown>;
  setKey(ns: string, keyPath: string, value: Serializable): Promise<void>;
  hasEncryptionKey(ns: string, keyPath: string): Promise<boolean>;
  /** `currentEncryptionKey` is required while a key is held: main rejects a rekey without it. */
  setEncryptionKey(encryptionKey: string, currentEncryptionKey?: string): Promise<void>;
  removeEncryptionKey(currentEncryptionKey?: string): Promise<void>;
  isEncryptionKeyCorrect(encryptionKey: string): Promise<boolean>;
  hasBeenDecrypted(): Promise<boolean>;
  resetAll(): Promise<void>;
  reload(): Promise<void>;
  cleanCache(): Promise<void>;
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

/** Hands over `CARD_SESSION_BOOTSTRAP` once per page load, in dev and E2E only. */
export type CardSessionBridge = {
  takeBootstrap(): Promise<string | null>;
};

export type LedgerBridge = {
  version: typeof BRIDGE_VERSION;
  bootstrap: Bootstrap;
  db: DbBridge;
  updater: UpdaterBridge;
  deeplink: DeeplinkBridge;
  cardSession: CardSessionBridge;
};

// Every channel is listed here: a generic invoke passthrough would expose all of main,
// including setEncryptionKey + isEncryptionKeyCorrect, an offline oracle on the account db.
export const CHANNELS = {
  bootstrap: "bootstrap",
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
  updater: "updater",
  deepLinking: "deep-linking",
  cardSessionBootstrap: "card-session:bootstrap",
} as const;
